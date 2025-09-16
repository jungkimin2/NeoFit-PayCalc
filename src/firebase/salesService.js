import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './config';

// 매출 데이터 추가/업데이트
export const saveSalesData = async (dateKey, data) => {
  try {
    const docRef = doc(db, 'sales', dateKey);
    await setDoc(docRef, {
      ...data,
      modifiedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('매출 데이터 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// 매출 데이터 가져오기
export const getSalesData = async (dateKey) => {
  try {
    const docRef = doc(db, 'sales', dateKey);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('매출 데이터 조회 오류:', error);
    return { success: false, error: error.message };
  }
};

// 기간별 매출 데이터 조회
export const getSalesDataByDateRange = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'sales'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const sales = [];
    
    querySnapshot.forEach((doc) => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: sales };
  } catch (error) {
    console.error('기간별 매출 데이터 조회 오류:', error);
    return { success: false, error: error.message };
  }
};

// 실시간 매출 데이터 리스너
export const subscribeToSalesData = (startDate, endDate, callback) => {
  const q = query(
    collection(db, 'sales'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const sales = {};
    snapshot.forEach((doc) => {
      sales[doc.id] = doc.data();
    });
    callback(sales);
  }, (error) => {
    console.error('실시간 매출 데이터 리스너 오류:', error);
  });
  
  return unsubscribe;
};

// localStorage 데이터를 Firebase로 마이그레이션
export const migrateFromLocalStorage = async () => {
  try {
    const migrationResults = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.includes('salesData_')) {
        const dateKey = key.replace('salesData_', '');
        const localData = JSON.parse(localStorage.getItem(key));
        
        const result = await saveSalesData(dateKey, {
          ...localData,
          date: dateKey,
          createdAt: serverTimestamp(),
          migrated: true
        });
        
        migrationResults.push({ key: dateKey, ...result });
      }
    }
    
    return { success: true, results: migrationResults };
  } catch (error) {
    console.error('마이그레이션 오류:', error);
    return { success: false, error: error.message };
  }
};