# NeoFit PayCalc Firebase 연동 가이드

## 1. Firebase 프로젝트 설정

### 1.1 Firebase Console에서 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: neofit-paycalc)
4. Google Analytics 설정 (선택사항)

### 1.2 웹 앱 추가
1. 프로젝트 개요에서 웹 아이콘(</>)클릭
2. 앱 닉네임 입력
3. Firebase SDK 추가 - 설정 객체 복사

```javascript
const firebaseConfig = {
    apiKey: "실제값으로교체",
    authDomain: "실제값으로교체",
    projectId: "실제값으로교체",
    storageBucket: "실제값으로교체",
    messagingSenderId: "실제값으로교체",
    appId: "실제값으로교체"
};
```

## 2. Firebase 서비스 활성화

### 2.1 Authentication 설정
1. Firebase Console > Authentication
2. "시작하기" 클릭
3. Sign-in method > 이메일/비밀번호 활성화
4. Users 탭에서 관리자 계정 생성

### 2.2 Firestore Database 설정
1. Firebase Console > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 프로덕션 모드로 시작
4. 위치 선택 (asia-northeast3 - 서울)

### 2.3 보안 규칙 설정
Firestore > 규칙 탭에서 다음 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 인증된 사용자만 읽기/쓰기 가능
    match /sales/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // 사용자 정보는 본인것만 읽기 가능
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // 관리자만 수정 가능
    }
  }
}
```

## 3. 데이터 구조

### Sales Collection
```javascript
{
  date: "2024-01-15",          // 날짜
  customerName: "홍길동",       // 고객명
  products: [                   // 상품 목록
    {
      category: "헬스",
      name: "헬스 3개월",
      price: 270000
    },
    {
      category: "락커",
      name: "락커 1개월",
      price: 10000
    }
  ],
  discount: 0,                  // 할인금액
  totalAmount: 280000,          // 총금액
  approved: false,              // 승인여부
  createdAt: timestamp,         // 생성일시
  createdBy: "user@email.com",  // 생성자
  modifiedAt: timestamp         // 수정일시
}
```

## 4. 마이그레이션 방법

### 4.1 기존 localStorage 데이터 내보내기
브라우저 콘솔에서 실행:
```javascript
// 기존 데이터 추출
const exportData = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('salesData')) {
      data[key] = JSON.parse(localStorage.getItem(key));
    }
  }
  console.log(JSON.stringify(data, null, 2));
};
exportData();
```

### 4.2 Firebase로 데이터 가져오기
```javascript
// Firebase에 데이터 업로드
const importData = async (data) => {
  for (const [key, value] of Object.entries(data)) {
    try {
      await setDoc(doc(db, 'sales', key), {
        ...value,
        createdAt: serverTimestamp(),
        modifiedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Import error:', error);
    }
  }
};
```

## 5. 주요 기능 구현

### 5.1 실시간 동기화
```javascript
// 실시간 데이터 리스너
useEffect(() => {
  const q = query(
    collection(db, 'sales'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const sales = [];
    snapshot.forEach((doc) => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    setSalesData(sales);
  });

  return () => unsubscribe();
}, [startDate, endDate]);
```

### 5.2 오프라인 지원
```javascript
// Firestore 오프라인 지속성 활성화
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // 여러 탭이 열려있을 때
    console.log('오프라인 지속성 실패: 여러 탭');
  } else if (err.code == 'unimplemented') {
    // 브라우저가 지원하지 않을 때
    console.log('오프라인 지속성 미지원');
  }
});
```

## 6. 보안 고려사항

1. **환경변수 사용**: Firebase 설정을 환경변수로 관리
2. **사용자 권한**: 역할 기반 접근 제어 구현
3. **데이터 검증**: 클라이언트와 서버 모두에서 검증
4. **백업**: 정기적인 Firestore 백업 설정

## 7. 배포

### GitHub Pages 배포 (무료)
1. GitHub 리포지토리 생성
2. 코드 푸시
3. Settings > Pages > Source 설정
4. 커스텀 도메인 설정 (선택사항)

### Firebase Hosting 배포
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 프로젝트 초기화
firebase init hosting

# 배포
firebase deploy
```

## 8. 모니터링

Firebase Console에서 다음 항목 모니터링:
- Authentication: 사용자 로그인 현황
- Firestore: 읽기/쓰기 사용량
- Hosting: 대역폭 사용량
- 비용: 무료 한도 내 사용 확인

## 주의사항
- Firebase 무료 플랜 한도:
  - Firestore: 읽기 50K/일, 쓰기 20K/일
  - Authentication: 무제한
  - Hosting: 10GB 저장공간, 360MB/일 대역폭
- 실제 운영 시 유료 플랜 고려 필요