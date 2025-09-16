import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyC9Nqji4jQe8po0BFfMo8czGSkXLuI2H3U",
  authDomain: "neofit-paycalc.firebaseapp.com",
  projectId: "neofit-paycalc",
  storageBucket: "neofit-paycalc.firebasestorage.app",
  messagingSenderId: "1072136228278",
  appId: "1:1072136228278:web:5d3be856d357b273900517",
  measurementId: "G-YWWC4R2EP4"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Analytics 초기화
export const analytics = getAnalytics(app);

// Authentication 인스턴스
export const auth = getAuth(app);

// Firestore 인스턴스
export const db = getFirestore(app);

// 오프라인 지속성 활성화
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('오프라인 지속성 실패: 여러 탭이 열려있습니다.');
  } else if (err.code === 'unimplemented') {
    console.log('오프라인 지속성 미지원: 브라우저가 지원하지 않습니다.');
  }
});

export default app;