import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, DollarSign, Check, TrendingUp, Edit, Plus, Trash2, User, Package, CreditCard, LogOut, Upload, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { saveSalesData, subscribeToSalesData, migrateFromLocalStorage } from '../firebase/salesService';
import { loginWithEmail, logout, subscribeToAuthChanges } from '../firebase/authService';

// 환경 변수 또는 설정 파일에서 가져올 수 있도록 수정
const CONFIG = {
  // 실제 배포 시 환경 변수로 관리하세요
  ADMIN_PASSWORD: process.env.REACT_APP_ADMIN_PASSWORD || 'admin123',
  
  // 인센티브 비율 설정
  INCENTIVE_RATES: {
    full: {
      60000000: 10,
      50000000: 8,
      45000000: 7.5,
      40000000: 7,
      35000000: 6.5,
      30000000: 6,
      25000000: 5.5,
      0: 5
    },
    part: {
      60000000: 5,
      50000000: 4,
      45000000: 3.75,
      40000000: 3.5,
      35000000: 3.25,
      30000000: 3,
      25000000: 2.75,
      0: 2.5
    }
  }
};

const NeoFitPayCalcFirebase = () => {
  const [salesData, setSalesData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [approvalPasswords, setApprovalPasswords] = useState({});
  const [editPasswords, setEditPasswords] = useState({});
  const [employeeType, setEmployeeType] = useState('full');
  const [customerName, setCustomerName] = useState({});
  const [selectedProducts, setSelectedProducts] = useState({});
  const [customPrices, setCustomPrices] = useState({});
  const [expandedDays, setExpandedDays] = useState({});
  const [currentDayView, setCurrentDayView] = useState(new Date().getDate());
  const [selectedModalDay, setSelectedModalDay] = useState(null);
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Firebase 인증 관련 상태
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 상품 목록
  const products = ['네오핏', '헬스권', '필라테스 이용권', '운동복', '락커', '일일권'];

  // 날짜 키 생성
  const getDateKey = (day) => {
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Firebase 인증 상태 모니터링
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
      if (user) {
        setEmail('');
        setPassword('');
        setError('');
      }
    });

    return () => unsubscribe();
  }, []);

  // employeeType 변경 시 강제 리렌더링 (모바일 환경 대응)
  useEffect(() => {
    // 모바일 환경에서 인센티브 재계산 강제 트리거
    console.log('Employee Type Changed:', employeeType);
  }, [employeeType]);

  // Firebase 실시간 데이터 구독
  useEffect(() => {
    if (!user) return;

    const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const endDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-31`;
    
    const unsubscribe = subscribeToSalesData(startDate, endDate, (data) => {
      setSalesData(data);
    });

    return () => unsubscribe();
  }, [selectedMonth, selectedYear, user]);

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await loginWithEmail(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    await logout();
  };

  // localStorage 데이터 마이그레이션
  const handleMigration = async () => {
    if (!window.confirm('localStorage의 데이터를 Firebase로 마이그레이션하시겠습니까?')) {
      return;
    }

    setIsLoading(true);
    const result = await migrateFromLocalStorage();
    
    if (result.success) {
      alert(`${result.results.length}개의 데이터가 성공적으로 마이그레이션되었습니다.`);
    } else {
      alert('마이그레이션 중 오류가 발생했습니다.');
    }
    
    setIsLoading(false);
  };

  // 날짜별 입력 폼 토글
  const toggleDayExpansion = (day) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  // 매출 상세 내역 추가
  const addSaleDetail = async (day) => {
    const dayCustomerName = customerName[day] || '';
    const daySelectedProduct = selectedProducts[day] || '';
    const dayCustomPrice = customPrices[day] || 0;

    if (!dayCustomerName.trim() || !daySelectedProduct || !dayCustomPrice) {
      alert('회원명, 상품, 가격을 모두 입력해주세요.');
      return;
    }

    const dateKey = getDateKey(day);
    const newDetail = {
      id: Date.now() + Math.random(),
      customerName: dayCustomerName.trim(),
      product: daySelectedProduct,
      price: parseInt(dayCustomPrice),
      timestamp: new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
    };

    const currentData = salesData[dateKey] || { amount: 0, approved: false, details: [] };
    const newDetails = [...(currentData.details || []), newDetail];
    const newTotalAmount = newDetails.reduce((sum, detail) => sum + (detail.price || 0), 0);

    const result = await saveSalesData(dateKey, {
      ...currentData,
      date: dateKey,
      details: newDetails,
      amount: newTotalAmount,
      createdBy: user.email
    });

    if (result.success) {
      // 해당 날짜 입력 필드 초기화
      setCustomerName(prev => ({ ...prev, [day]: '' }));
      setSelectedProducts(prev => ({ ...prev, [day]: '' }));
      setCustomPrices(prev => ({ ...prev, [day]: '' }));
      
      alert('매출이 성공적으로 등록되었습니다!');
    } else {
      alert('매출 등록 중 오류가 발생했습니다.');
    }
  };

  // 매출 상세 삭제
  const removeSaleDetail = async (day, detailId) => {
    const dateKey = getDateKey(day);
    const currentData = salesData[dateKey] || { amount: 0, approved: false, details: [] };
    const newDetails = currentData.details.filter(detail => detail.id !== detailId);
    const newTotalAmount = newDetails.reduce((sum, detail) => sum + (detail.price || 0), 0);

    const result = await saveSalesData(dateKey, {
      ...currentData,
      date: dateKey,
      details: newDetails,
      amount: newTotalAmount
    });

    if (!result.success) {
      alert('매출 삭제 중 오류가 발생했습니다.');
    }
  };

  // 관리자 승인 처리
  const handleAdminApproval = async (day) => {
    const dateKey = getDateKey(day);
    const password = approvalPasswords[dateKey] || '';
    
    if (password === CONFIG.ADMIN_PASSWORD) {
      const currentData = salesData[dateKey] || {};
      
      const result = await saveSalesData(dateKey, {
        ...currentData,
        date: dateKey,
        approved: true,
        approvedBy: user.email,
        approvedAt: new Date().toISOString()
      });

      if (result.success) {
        setApprovalPasswords(prev => ({
          ...prev,
          [dateKey]: ''
        }));
      } else {
        alert('승인 처리 중 오류가 발생했습니다.');
      }
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  // 수정 모드 처리
  const handleEditMode = async (day) => {
    const dateKey = getDateKey(day);
    const password = editPasswords[dateKey] || '';
    
    if (password === CONFIG.ADMIN_PASSWORD) {
      const currentData = salesData[dateKey] || {};
      
      const result = await saveSalesData(dateKey, {
        ...currentData,
        date: dateKey,
        approved: false,
        modifiedBy: user.email
      });

      if (result.success) {
        setEditPasswords(prev => ({
          ...prev,
          [dateKey]: ''
        }));
      } else {
        alert('수정 모드 전환 중 오류가 발생했습니다.');
      }
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  // 월의 일수 계산
  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  // 주간 매출 계산 (승인된 매출만 계산)
  const calculateWeeklySales = () => {
    const weeks = [];
    const daysInMonth = getDaysInMonth();
    let currentWeek = [];
    let weekTotal = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getDateKey(day);
      const dayData = salesData[dateKey] || { amount: 0, approved: false };
      // 승인된 매출만 계산
      if (dayData.approved) {
        weekTotal += dayData.amount;
      }
      currentWeek.push(day);

      if (currentWeek.length === 7 || day === daysInMonth) {
        weeks.push({
          days: [...currentWeek],
          total: weekTotal
        });
        currentWeek = [];
        weekTotal = 0;
      }
    }

    return weeks;
  };

  // 월간 총매출 계산 (승인된 매출만 계산)
  const calculateMonthlySales = () => {
    let total = 0;
    const daysInMonth = getDaysInMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getDateKey(day);
      const dayData = salesData[dateKey] || { amount: 0, approved: false };
      // 승인된 매출만 계산
      if (dayData.approved) {
        total += dayData.amount;
      }
    }

    return total;
  };

  // 필라테스 매출만 계산 (승인된 매출만)
  const calculatePilatesSales = () => {
    let pilatesTotal = 0;
    const daysInMonth = getDaysInMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getDateKey(day);
      const dayData = salesData[dateKey] || { amount: 0, approved: false, details: [] };

      if (dayData.approved && dayData.details) {
        dayData.details.forEach(detail => {
          // 기존 "필라테스"와 새로운 "필라테스 이용권" 둘 다 포함
          if (detail.product === '필라테스 이용권' || detail.product === '필라테스') {
            pilatesTotal += detail.price || 0;
          }
        });
      }
    }

    return pilatesTotal;
  };

  // 네오핏 매출만 계산 (필라테스 제외, 승인된 매출만)
  const calculateNeoFitSales = () => {
    const totalSales = calculateMonthlySales();
    const pilatesSales = calculatePilatesSales();
    return totalSales - pilatesSales;
  };

  // 일일 매출 계산 (승인된 매출만)
  const calculateDailySales = () => {
    let total = 0;
    const today = new Date();
    if (today.getFullYear() === selectedYear && today.getMonth() === selectedMonth) {
      const dateKey = getDateKey(today.getDate());
      const dayData = salesData[dateKey] || { amount: 0, approved: false };
      if (dayData.approved) {
        total = dayData.amount;
      }
    }
    return total;
  };

  // 이번주 매출 계산
  const calculateThisWeekSales = () => {
    let total = 0;
    const today = new Date();
    const currentDay = today.getDate();
    const currentWeekDay = today.getDay();
    const startOfWeek = currentDay - currentWeekDay;
    
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek + i;
      if (day > 0 && day <= getDaysInMonth()) {
        const dateKey = getDateKey(day);
        const dayData = salesData[dateKey] || { amount: 0, approved: false };
        if (dayData.approved) {
          total += dayData.amount;
        }
      }
    }
    
    return total;
  };

  // 인센티브 비율 계산 (직원 타입별)
  const getIncentiveRate = (totalSales, type = null) => {
    const employeeTypeToUse = type || employeeType;
    const rates = CONFIG.INCENTIVE_RATES;

    const thresholds = Object.keys(rates[employeeTypeToUse])
      .map(Number)
      .sort((a, b) => b - a);

    for (const threshold of thresholds) {
      if (totalSales >= threshold) {
        return rates[employeeTypeToUse][threshold];
      }
    }
    
    return rates[employeeTypeToUse][0];
  };

  const monthlyTotal = useMemo(() => calculateMonthlySales(), [salesData, selectedMonth, selectedYear]);
  const pilatesTotal = useMemo(() => calculatePilatesSales(), [salesData, selectedMonth, selectedYear]);
  const neoFitTotal = useMemo(() => calculateNeoFitSales(), [salesData, selectedMonth, selectedYear]);
  const weeklyTotal = useMemo(() => calculateThisWeekSales(), [salesData, selectedMonth, selectedYear]);
  const dailyTotal = useMemo(() => calculateDailySales(), [salesData, selectedMonth, selectedYear]);
  
  // employeeType 변경 시 인센티브 재계산을 보장하기 위해 useMemo 사용
  const incentiveRate = useMemo(() => {
    const rate = getIncentiveRate(monthlyTotal, employeeType);
    console.log('Incentive Rate Calculated:', rate, 'for', employeeType);
    return rate;
  }, [monthlyTotal, employeeType]);
  
  const incentiveAmount = useMemo(() => {
    const amount = monthlyTotal * (incentiveRate / 100);
    console.log('Incentive Amount Calculated:', amount);
    return amount;
  }, [monthlyTotal, incentiveRate]);
  
  const weeklySales = useMemo(() => calculateWeeklySales(), [salesData, selectedMonth, selectedYear]);

  // 로그인 화면
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
        <style jsx>{`
          @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
          
          * {
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }

          .float-animation {
            animation: float 6s ease-in-out infinite;
          }

          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .animated-gradient {
            background-size: 200% 200%;
            animation: gradient 15s ease infinite;
          }
        `}</style>

        {/* 배경 효과 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-500/20 rounded-full filter blur-3xl float-animation"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full filter blur-3xl float-animation" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl float-animation" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-6xl font-black mb-3 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animated-gradient">
              NeoFit PayCalc
            </h1>
            <p className="text-gray-300 text-lg font-light tracking-wide">네오핏 급여 계산기</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
              <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">로그인</h2>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="admin@neofit.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">비밀번호</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 현재 보고 있는 날짜들 계산
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const day1 = yesterday.getDate();
  const day2 = today.getDate();

  // 메인 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      <style jsx>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        
        * {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .float-animation {
          animation: float 8s ease-in-out infinite;
        }

        .pulse-animation {
          animation: pulse 4s ease-in-out infinite;
        }

        .animated-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }

        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }

        .scale-in {
          animation: scaleIn 0.5s ease-out;
        }

        [data-aos] {
          opacity: 0;
          transition: all 0.6s ease-out;
        }

        [data-aos="fade-up"] {
          transform: translateY(30px);
        }

        [data-aos].aos-animate {
          opacity: 1;
          transform: translateY(0);
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* 드롭다운 optgroup 그린 네온 효과 */
        select optgroup {
          color: #00FF88 !important;
          font-weight: 700 !important;
          background: linear-gradient(90deg, rgba(0, 255, 136, 0.15), rgba(0, 255, 136, 0.05)) !important;
          text-shadow: 0 0 5px #00FF88, 
                       0 0 10px #00FF88, 
                       0 0 15px #00FF88, 
                       0 0 20px #00FF88,
                       0 0 30px #00FF88 !important;
          letter-spacing: 0.1em !important;
          font-size: 0.95em !important;
          padding: 8px 4px !important;
          margin: 4px 0 !important;
        }
        
        /* 드롭다운 전체 스타일 개선 */
        select {
          background: rgba(10, 14, 26, 0.95) !important;
          color: #fff !important;
        }
        
        select:focus {
          border-color: #00FF88 !important;
          box-shadow: 0 0 15px rgba(0, 255, 136, 0.4) !important;
          outline: none !important;
        }
        
        select option {
          background: rgba(10, 14, 26, 0.98) !important;
          color: #fff !important;
          padding: 8px !important;
        }
        
        select option:hover {
          background: rgba(0, 255, 136, 0.2) !important;
        }
      `}</style>

      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full filter blur-3xl pulse-animation"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pulse-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full filter blur-3xl pulse-animation" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 헤더 */}
        <div className="relative mb-12 fade-in">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-96 h-96 bg-gradient-to-br from-green-500 to-blue-500 rounded-full filter blur-3xl float-animation"></div>
          </div>
          <div className="relative text-center">
            <h1 className="text-6xl font-black mb-3 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animated-gradient">
              NeoFit PayCalc
            </h1>
            <p className="text-gray-300 text-xl font-light tracking-wide">네오핏 급여 계산기</p>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="mb-10 slide-in-left" style={{ animationDelay: '0.1s' }}>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-gray-900 rounded-2xl p-1">
              <div className="bg-gray-800/90 backdrop-blur-xl rounded-xl px-6 py-4 flex items-center gap-4">
                <Search size={24} className="text-gray-400 transition-transform group-hover:scale-110" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="회원명을 검색하세요..."
                  className="flex-1 bg-transparent outline-none text-lg text-white placeholder-gray-400 font-medium"
                />
                <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95">
                  검색
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 컨트롤 패널 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-1.5 inline-flex w-full sm:w-auto">
            <button
              onClick={() => setEmployeeType('full')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                employeeType === 'full' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              정직원
            </button>
            <button
              onClick={() => setEmployeeType('part')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                employeeType === 'part' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              파트타임
            </button>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="appearance-none bg-gray-800/60 backdrop-blur-sm text-white px-6 py-3 pr-10 rounded-xl font-medium cursor-pointer hover:bg-gray-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2024, i).toLocaleDateString('ko-KR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={20} />
            </div>
            
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="appearance-none bg-gray-800/60 backdrop-blur-sm text-white px-6 py-3 pr-10 rounded-xl font-medium cursor-pointer hover:bg-gray-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">로그아웃</span>
          </button>
        </div>

        {/* 요약 카드들 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <script>
            {`
              setTimeout(() => {
                document.querySelectorAll('.summary-card-anim').forEach((el, i) => {
                  setTimeout(() => {
                    el.classList.add('scale-in');
                  }, i * 100);
                });
              }, 300);
            `}
          </script>
          <div className="summary-card-anim group relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-105" style={{ opacity: 0 }}>
            <div className="absolute -top-4 -right-4 w-20 sm:w-24 h-20 sm:h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-300"></div>
            <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2 sm:mb-3">오늘 매출</p>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {dailyTotal.toLocaleString()}원
            </p>
          </div>
          
          <div className="summary-card-anim group relative overflow-hidden bg-gradient-to-br from-blue-900/30 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-700/30 hover:border-blue-600/50 transition-all duration-300 hover:transform hover:scale-105" style={{ opacity: 0 }}>
            <div className="absolute -top-4 -right-4 w-20 sm:w-24 h-20 sm:h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-300"></div>
            <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2 sm:mb-3">이번주 매출</p>
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {weeklyTotal.toLocaleString()}원
            </p>
          </div>
          
          <div className="summary-card-anim group relative overflow-hidden bg-gradient-to-br from-yellow-900/30 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-yellow-700/30 hover:border-yellow-600/50 transition-all duration-300 hover:transform hover:scale-105" style={{ opacity: 0 }}>
            <div className="absolute -top-4 -right-4 w-20 sm:w-24 h-20 sm:h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all duration-300"></div>
            <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2 sm:mb-3">월 매출</p>
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {monthlyTotal.toLocaleString()}원
            </p>
          </div>
          
          <div className="summary-card-anim group relative overflow-hidden bg-gradient-to-br from-green-900/30 to-gray-900/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-green-700/30 hover:border-green-600/50 transition-all duration-300 hover:transform hover:scale-105" style={{ opacity: 0 }}>
            <div className="absolute -top-4 -right-4 w-20 sm:w-24 h-20 sm:h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all duration-300"></div>
            <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2 sm:mb-3">예상 인센티브</p>
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {Math.floor(incentiveAmount).toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 일별 매출 현황 */}
        <div className="relative mb-12 fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-3xl blur-xl pulse-animation"></div>
          <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg sm:rounded-xl">
                  <Calendar className="text-green-400" size={20} />
                </div>
                <span className="text-lg sm:text-2xl">일별 매출 현황</span>
              </h2>
              <button 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-green-500/25 text-sm sm:text-base"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">매출 추가</span>
                <span className="sm:hidden">추가</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[day1, day2].map((day) => {
                const dateKey = getDateKey(day);
                const dayData = salesData[dateKey] || { amount: 0, approved: false, details: [] };
                const date = new Date(selectedYear, selectedMonth, day);
                const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isToday = day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
                
                return (
                  <div key={day} className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:transform hover:translateY(-4px)">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl sm:text-2xl font-bold text-white">
                            {selectedMonth + 1}월 {day}일
                          </h3>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                            isToday ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30' : 
                            isWeekend ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/30' : 
                            'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                          }`}>
                            {isToday ? '오늘' : dayName}
                          </span>
                        </div>
                        {dayData.approved && (
                          <div className="p-2 bg-green-500/20 rounded-full">
                            <Check className="text-green-400" size={20} />
                          </div>
                        )}
                      </div>
                    
                      <div className="mb-6">
                        <div className={`text-3xl sm:text-4xl font-black mb-3 transition-all duration-300 ${
                          dayData.amount > 0 ? 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent' : 'text-gray-500'
                        }`}>
                          {(dayData.amount || 0).toLocaleString()}원
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <div className="p-1.5 bg-gray-700/50 rounded-lg">
                            <Package size={14} />
                          </div>
                          <span className="font-medium">{dayData.details?.length || 0}건의 매출</span>
                        </div>
                      </div>

                      {!dayData.approved && dayData.details?.length === 0 && (
                        <button
                          onClick={() => {
                            setSelectedModalDay(day);
                            setShowAddSaleModal(true);
                          }}
                          className="w-full py-4 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 text-gray-400 hover:text-white border-2 border-dashed border-gray-700 hover:border-gray-600 transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Plus size={20} className="inline mr-2 group-hover:scale-110 transition-transform group-hover:rotate-90" />
                          등록된 매출이 없습니다
                        </button>
                      )}

                      {dayData.details && dayData.details.length > 0 && (
                        <div className="space-y-3 mb-6">
                          {dayData.details.slice(0, 3).map((detail, idx) => (
                            <div 
                              key={detail.id} 
                              className="bg-gray-700/30 hover:bg-gray-700/50 rounded-xl p-4 flex justify-between items-center transition-all duration-200 group hover:transform hover:scale-[1.02] cursor-pointer"
                              style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                              <div>
                                <div className="font-semibold text-white group-hover:text-green-400 transition-colors">{detail.customerName}</div>
                                <div className="text-xs text-gray-400 mt-1">{detail.product}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                  {(detail.price || 0).toLocaleString()}원
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{detail.timestamp}</div>
                              </div>
                            </div>
                          ))}
                          {dayData.details.length > 3 && (
                            <div className="text-center text-sm text-gray-500">
                              +{dayData.details.length - 3}건 더보기
                            </div>
                          )}
                        </div>
                      )}

                      {!dayData.approved && dayData.details?.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedModalDay(day);
                            setShowAddSaleModal(true);
                          }}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25 group"
                        >
                          <Plus size={18} className="inline mr-2 transition-transform group-hover:rotate-90" />
                          매출 추가
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 주간 매출 합계 */}
        <div className="relative mb-12 fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl pulse-animation" style={{ animationDelay: '1s' }}></div>
          <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
            <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl">
                <TrendingUp className="text-blue-400" size={24} />
              </div>
              주간 매출 합계
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {weeklySales.map((week, index) => {
                const weekProgress = (week.total / 10000000) * 100; // 1천만원 기준 진도
                return (
                  <div key={index} className="group relative bg-gradient-to-br from-gray-800/60 to-gray-800/40 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 hover:border-blue-600/50 transition-all duration-300 overflow-hidden hover:transform hover:scale-105 cursor-pointer">
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500/20 to-transparent transition-all duration-500" style={{ height: `${Math.min(weekProgress, 100)}%` }}></div>
                    <div className="relative">
                      <div className="text-sm text-gray-400 mb-3 font-medium">
                        {week.days[0]}일 - {week.days[week.days.length - 1]}일
                      </div>
                      <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {(week.total || 0).toLocaleString()}원
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 월간 급여 계산 */}
        <div className="relative fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-green-500/20 rounded-3xl blur-xl pulse-animation" style={{ animationDelay: '1.5s' }}></div>
          <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
            <h2 className="text-3xl font-black mb-10 text-center bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              월간 급여 계산
            </h2>
            
            <div className="text-center mb-10">
              <div className="text-gray-400 text-sm mb-3 font-medium">월간 총매출</div>
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/30 to-yellow-500/30 rounded-full blur-2xl"></div>
                <div className="relative text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  {(monthlyTotal || 0).toLocaleString()}원
                </div>
              </div>

              {/* 네오핏 매출과 필라테스 매출 분리 표시 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
                  <div className="text-gray-400 text-xs mb-2 font-medium">네오핏 매출</div>
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {(neoFitTotal || 0).toLocaleString()}원
                  </div>
                </div>
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
                  <div className="text-gray-400 text-xs mb-2 font-medium">필라테스 매출</div>
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {(pilatesTotal || 0).toLocaleString()}원
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="group relative bg-gradient-to-br from-green-900/30 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-green-700/30 hover:border-green-600/50 transition-all duration-300 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-300"></div>
                <div className="relative text-center">
                  <p className="text-gray-400 text-sm mb-4 font-medium">인센티브율</p>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {incentiveRate || 0}%
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-gradient-to-br from-green-900/30 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-green-700/30 hover:border-green-600/50 transition-all duration-300 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-300"></div>
                <div className="relative text-center">
                  <p className="text-gray-400 text-sm mb-4 font-medium">인센티브 금액</p>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {Math.floor(incentiveAmount || 0).toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 매출 입력 모달 */}
      {showAddSaleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in" onClick={() => setShowAddSaleModal(false)}>
          <div className="relative bg-gray-900 rounded-3xl border border-gray-700/50 p-8 w-full max-w-lg transform transition-all duration-300 scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative">
              <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                {selectedMonth + 1}월 {selectedModalDay}일 매출 입력
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">회원명</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName[selectedModalDay] || ''}
                      onChange={(e) => setCustomerName(prev => ({ ...prev, [selectedModalDay]: e.target.value }))}
                      className="w-full appearance-none bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3.5 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                      placeholder="회원명을 입력하세요"
                      autoFocus
                    />
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={20} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">상품</label>
                  <div className="relative">
                    <select
                      value={selectedProducts[selectedModalDay] || ''}
                      onChange={(e) => setSelectedProducts(prev => ({ ...prev, [selectedModalDay]: e.target.value }))}
                      className="w-full appearance-none bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3.5 pr-12 text-white focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer"
                    >
                      <option value="" className="bg-gray-900">상품을 선택하세요</option>
                      {products.map(product => (
                        <option key={product} value={product} className="bg-gray-900">{product}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={20} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">가격</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customPrices[selectedModalDay] || ''}
                      onChange={(e) => setCustomPrices(prev => ({ ...prev, [selectedModalDay]: e.target.value }))}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3.5 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                      placeholder="가격을 입력하세요"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">원</span>
                  </div>
                </div>
                
                {/* 기타 매출 입력 섹션 */}
                <div className="pt-4 border-t border-gray-700/50">
                  <label className="block text-sm font-semibold mb-3 text-gray-300">기타 매출</label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customerName[selectedModalDay + '_other'] || ''}
                      onChange={(e) => setCustomerName(prev => ({ ...prev, [selectedModalDay + '_other']: e.target.value }))}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                      placeholder="항목명을 입력하세요 (예: PT수업, 개인레슨)"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={customPrices[selectedModalDay + '_other'] || ''}
                        onChange={(e) => setCustomPrices(prev => ({ ...prev, [selectedModalDay + '_other']: e.target.value }))}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3.5 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                        placeholder="금액을 입력하세요"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">원</span>
                    </div>
                    <button
                      onClick={() => {
                        const otherItemName = customerName[selectedModalDay + '_other'];
                        const otherItemPrice = customPrices[selectedModalDay + '_other'];
                        if (otherItemName && otherItemPrice) {
                          // 기타 매출 추가 로직
                          const dateKey = getDateKey(selectedModalDay);
                          const newDetail = {
                            id: Date.now() + Math.random(),
                            customerName: '기타',
                            product: otherItemName.trim(),
                            price: parseInt(otherItemPrice),
                            timestamp: new Date().toLocaleTimeString('ko-KR', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              second: '2-digit'
                            })
                          };
                          
                          const currentData = salesData[dateKey] || { amount: 0, approved: false, details: [] };
                          const newDetails = [...(currentData.details || []), newDetail];
                          const newTotalAmount = newDetails.reduce((sum, detail) => sum + (detail.price || 0), 0);
                          
                          saveSalesData(dateKey, {
                            ...currentData,
                            date: dateKey,
                            details: newDetails,
                            amount: newTotalAmount,
                            createdBy: user.email
                          }).then(result => {
                            if (result.success) {
                              setCustomerName(prev => ({ ...prev, [selectedModalDay + '_other']: '' }));
                              setCustomPrices(prev => ({ ...prev, [selectedModalDay + '_other']: '' }));
                              alert('기타 매출이 성공적으로 등록되었습니다!');
                              setShowAddSaleModal(false);
                            } else {
                              alert('기타 매출 등록 중 오류가 발생했습니다.');
                            }
                          });
                        } else {
                          alert('기타 매출의 항목명과 금액을 모두 입력해주세요.');
                        }
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-500/25"
                    >
                      기타 매출 추가
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => setShowAddSaleModal(false)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 border border-gray-700/50 active:scale-95"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      addSaleDetail(selectedModalDay);
                      setShowAddSaleModal(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-500/25"
                  >
                    매출 등록
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeoFitPayCalcFirebase;