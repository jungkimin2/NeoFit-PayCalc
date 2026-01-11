import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

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

async function main(start = '2024-09-01', end = '2024-09-30') {
  const q = query(
    collection(db, 'sales'),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  console.log(`Fetched ${snapshot.size} docs between ${start}~${end}`);
  snapshot.forEach(doc => {
    console.log('\n===', doc.id, '===');
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

const [,, startArg, endArg] = process.argv;
main(startArg, endArg).catch(err => {
  console.error(err);
  process.exit(1);
});
