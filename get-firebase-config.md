# Firebase 설정 가져오기 가이드

## 1단계: Firebase Console 접속
- https://console.firebase.google.com
- 로그인 후 "neofit-paycalc" 프로젝트 선택

## 2단계: 프로젝트 설정
- 왼쪽 상단 ⚙️ (설정) 아이콘 클릭
- "프로젝트 설정" 클릭

## 3단계: 웹 앱 찾기
- 스크롤 내려서 "내 앱" 섹션
- 웹 앱 (</> 아이콘) 찾기

## 4단계: 설정 복사
"SDK 설정 및 구성" 섹션에서 다음과 같은 코드 복사:

```javascript
const firebaseConfig = {
  apiKey: "여기에-실제-API-키",
  authDomain: "여기에-authDomain",
  projectId: "여기에-projectId",
  storageBucket: "여기에-storageBucket",
  messagingSenderId: "여기에-messagingSenderId",
  appId: "여기에-appId"
};
```

이 정보를 복사해서 보내주세요!