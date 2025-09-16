import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './config';

// 이메일로 로그인
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('로그인 오류:', error);
    return { success: false, error: error.message };
  }
};

// 새 사용자 생성
export const createUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return { success: false, error: error.message };
  }
};

// 로그아웃
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { success: false, error: error.message };
  }
};

// 비밀번호 재설정
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error);
    return { success: false, error: error.message };
  }
};

// 인증 상태 변화 리스너
export const subscribeToAuthChanges = (callback) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    callback(user);
  });
  
  return unsubscribe;
};

// 현재 사용자 가져오기
export const getCurrentUser = () => {
  return auth.currentUser;
};