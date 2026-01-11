import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC9Nqji4jQe8po0BFfMo8czGSkXLuI2H3U',
  authDomain: 'neofit-paycalc.firebaseapp.com',
  projectId: 'neofit-paycalc',
  storageBucket: 'neofit-paycalc.firebasestorage.app',
  messagingSenderId: '1072136228278',
  appId: '1:1072136228278:web:5d3be856d357b273900517',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const normalizeAmount = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (!cleaned) {
      return 0;
    }
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  if (value && typeof value.toString === 'function') {
    const cleaned = value.toString().replace(/[^0-9.-]/g, '');
    if (!cleaned) {
      return 0;
    }
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
};

const normalizeDetailList = (details) => {
  if (!Array.isArray(details)) {
    return [];
  }
  return details.map((detail) => ({
    ...detail,
    price: normalizeAmount(detail?.price),
  }));
};

async function fixRange(startDate, endDate) {
  const q = query(
    collection(db, 'sales'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);
  console.log(`확인된 문서 ${snapshot.size}건`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const details = normalizeDetailList(data.details);
    const sum = details.reduce((acc, detail) => acc + (detail.price || 0), 0);
    const amount = sum || normalizeAmount(data.amount);

    const needsUpdate = (data.amount || 0) !== amount || data.details !== details;

    if (needsUpdate) {
      console.log(`수정: ${docSnap.id} → ${amount.toLocaleString()}원`);
      await updateDoc(doc(db, 'sales', docSnap.id), {
        amount,
        details,
      });
    }
  }

  console.log('완료');
}

const [,, startArg, endArg] = process.argv;
const start = startArg || '2024-01-01';
const end = endArg || '2030-12-31';

fixRange(start, end).catch((err) => {
  console.error(err);
  process.exit(1);
});
