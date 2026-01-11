import React, { useState } from 'react';
import { Calendar, DollarSign, Check, TrendingUp, Edit, Plus, Trash2, User, Package, CreditCard } from 'lucide-react';

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

const NeoFitPayCalc = () => {
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
  const [editingDetails, setEditingDetails] = useState({});

  // 상품 목록
  const products = ['네오핏', '헬스권', '필라테스', '운동복', '락커', '일일권'];

  // 날짜 키 생성
  const getDateKey = (day) => {
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // 날짜별 입력 폼 토글
  const toggleDayExpansion = (day) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  // 매출 상세 내역 추가
  const addSaleDetail = (day) => {
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

    setSalesData(prev => {
      const currentData = prev[dateKey] || { amount: 0, approved: false, details: [] };
      const newDetails = [...(currentData.details || []), newDetail];
      const newTotalAmount = newDetails.reduce((sum, detail) => sum + (detail.price || 0), 0);

      return {
        ...prev,
        [dateKey]: {
          ...currentData,
          details: newDetails,
          amount: newTotalAmount
        }
      };
    });

    // 해당 날짜 입력 필드 초기화
    setCustomerName(prev => ({ ...prev, [day]: '' }));
    setSelectedProducts(prev => ({ ...prev, [day]: '' }));
    setCustomPrices(prev => ({ ...prev, [day]: '' }));
    
    alert('매출이 성공적으로 등록되었습니다!');
  };

  // 매출 상세 삭제
  const removeSaleDetail = (day, detailId) => {
    const dateKey = getDateKey(day);
    setSalesData(prev => {
      const currentData = prev[dateKey] || { amount: 0, approved: false, details: [] };
      const newDetails = currentData.details.filter(detail => detail.id !== detailId);
      const newTotalAmount = newDetails.reduce((sum, detail) => sum + (detail.price || 0), 0);

      return {
        ...prev,
        [dateKey]: {
          ...currentData,
          details: newDetails,
          amount: newTotalAmount
        }
      };
    });
  };

  const updateSaleDetail = (day, detailId, updatedFields) => {
    const dateKey = getDateKey(day);
    setSalesData(prev => {
      const currentData = prev[dateKey] || { amount: 0, approved: false, details: [] };
      const newDetails = (currentData.details || []).map(detail => {
        if (detail.id !== detailId) {
          return detail;
        }
        return {
          ...detail,
          ...updatedFields
        };
      });
      const newTotalAmount = newDetails.reduce((sum, detail) => sum + (detail.price || 0), 0);

      return {
        ...prev,
        [dateKey]: {
          ...currentData,
          details: newDetails,
          amount: newTotalAmount
        }
      };
    });
  };

  const handleStartEditingDetail = (day, detail) => {
    setEditingDetails(prev => ({
      ...prev,
      [detail.id]: {
        customerName: detail.customerName || '',
        product: detail.product || '',
        price: detail.price ? detail.price.toString() : ''
      }
    }));
  };

  const handleCancelEditingDetail = (detailId) => {
    setEditingDetails(prev => {
      const { [detailId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleEditingDetailChange = (detailId, field, value) => {
    setEditingDetails(prev => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        [field]: value
      }
    }));
  };

  const handleSaveEditingDetail = (day, detailId) => {
    const editingData = editingDetails[detailId];
    if (!editingData) {
      return;
    }

    const { customerName, product, price } = editingData;
    const trimmedName = (customerName || '').trim();
    const parsedPrice = parseInt(price, 10);

    if (!trimmedName || !product || !price || Number.isNaN(parsedPrice)) {
      alert('회원명, 상품, 가격을 모두 입력해주세요.');
      return;
    }

    updateSaleDetail(day, detailId, {
      customerName: trimmedName,
      product,
      price: parsedPrice
    });

    setEditingDetails(prev => {
      const { [detailId]: _, ...rest } = prev;
      return rest;
    });
  };

  // 관리자 승인 처리
  const handleAdminApproval = (day) => {
    const dateKey = getDateKey(day);
    const password = approvalPasswords[dateKey] || '';
    
    if (password === CONFIG.ADMIN_PASSWORD) {
      setSalesData(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          approved: true
        }
      }));
      setApprovalPasswords(prev => ({
        ...prev,
        [dateKey]: ''
      }));
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  // 수정 모드 처리
  const handleEditMode = (day) => {
    const dateKey = getDateKey(day);
    const password = editPasswords[dateKey] || '';
    
    if (password === CONFIG.ADMIN_PASSWORD) {
      setSalesData(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          approved: false
        }
      }));
      setEditPasswords(prev => ({
        ...prev,
        [dateKey]: ''
      }));
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

  const monthlyTotal = calculateMonthlySales();
  const incentiveRate = getIncentiveRate(monthlyTotal);
  const incentiveAmount = monthlyTotal * (incentiveRate / 100);
  const weeklySales = calculateWeeklySales();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-4">
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

        .glow-green {
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.4), 0 0 60px rgba(0, 255, 136, 0.2);
        }

        .hover-glow:hover {
          box-shadow: 0 0 25px rgba(0, 255, 136, 0.5);
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .neon-text {
          text-shadow: 0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.6), 0 0 30px rgba(0, 255, 136, 0.4);
        }

        .gradient-border {
          position: relative;
          background: linear-gradient(45deg, #00FF88, #00C66E);
          padding: 1px;
          border-radius: 1rem;
        }

        .gradient-border > div {
          background: #1f2937;
          border-radius: 1rem;
          padding: 1.5rem;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #00FF88, #00C66E);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #00FF88, #00FF88);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-5xl font-black mb-2 sm:mb-3 neon-text" style={{ color: '#00FF88' }}>
            NeoFit PayCalc
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">네오핏 급여 계산기</p>
        </div>

        {/* 직원 유형 선택 및 월 선택 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10 flex-wrap">
          <div className="glass-effect rounded-2xl p-1">
            <div className="flex gap-1">
              <button
                onClick={() => setEmployeeType('full')}
                className={`px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                  employeeType === 'full' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                정직원
              </button>
              <button
                onClick={() => setEmployeeType('part')}
                className={`px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                  employeeType === 'part' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                파트타임
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="glass-effect rounded-xl px-4 sm:px-6 py-3 focus:border-green-400 focus:outline-none font-medium transition-all hover:scale-105 text-sm sm:text-base flex-1 sm:flex-initial"
              style={{ borderColor: '#00C66E' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i).toLocaleDateString('ko-KR', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="glass-effect rounded-xl px-4 sm:px-6 py-3 focus:border-green-400 focus:outline-none font-medium transition-all hover:scale-105 text-sm sm:text-base flex-1 sm:flex-initial"
              style={{ borderColor: '#00C66E' }}
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
          </div>
        </div>

        {/* 매출 현황 */}
        <div className="gradient-border mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Calendar size={28} style={{ color: '#00FF88' }} />
              </div>
              매출 현황
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[650px] overflow-y-auto p-2">
              {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map(day => {
                const dateKey = getDateKey(day);
                const dayData = salesData[dateKey] || { amount: 0, approved: false, details: [] };
                const date = new Date(selectedYear, selectedMonth, day);
                const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <div key={day} className={`glass-effect rounded-2xl p-4 sm:p-5 hover:scale-[1.02] transition-all duration-300 slide-in ${isWeekend ? 'border-pink-500/30' : ''}`}>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`text-base sm:text-lg font-bold ${isWeekend ? 'text-pink-400' : 'text-white'}`}>
                          {selectedMonth + 1}월 {day}일
                        </span>
                        <span className={`text-xs sm:text-sm px-2 py-1 rounded-full ${isWeekend ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-700 text-gray-400'}`}>
                          {dayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {dayData.approved && (
                          <div className="pulse-animation">
                            <span className="text-green-400 text-xl sm:text-2xl">✨</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className={`rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 ${dayData.amount > 0 ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10' : 'bg-gray-800/50'}`}>
                      <div className="text-2xl sm:text-3xl font-black mb-1" style={{ color: dayData.amount > 0 ? '#00FF88' : '#6b7280' }}>
                        {(dayData.amount || 0).toLocaleString()}원
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 flex items-center gap-2">
                        <Package size={14} />
                        {dayData.details?.length || 0}건의 매출
                      </div>
                    </div>

                    {/* 매출 상세 내역 */}
                    {dayData.details && dayData.details.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <div className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                          <DollarSign size={16} />
                          매출 내역
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {dayData.details.map(detail => {
                            const editingData = editingDetails[detail.id];
                            const isEditing = Boolean(editingData);

                            return (
                              <div key={detail.id} className="glass-effect rounded-xl p-3 text-sm transition-all hover:scale-[1.02]">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {isEditing ? (
                                      <div className="space-y-3">
                                        <div className="flex flex-col gap-2">
                                          <span className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                                            <User size={14} />
                                            회원명
                                          </span>
                                          <input
                                            type="text"
                                            value={editingData.customerName}
                                            onChange={(e) => handleEditingDetailChange(detail.id, 'customerName', e.target.value)}
                                            className="glass-effect w-full rounded-lg px-3 py-2 text-sm text-white transition-all focus:outline-none focus:border-green-400"
                                          />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          <span className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                                            <Package size={14} />
                                            상품
                                          </span>
                                          <select
                                            value={editingData.product}
                                            onChange={(e) => handleEditingDetailChange(detail.id, 'product', e.target.value)}
                                            className="glass-effect w-full rounded-lg px-3 py-2 text-sm text-white transition-all focus:outline-none focus:border-green-400"
                                          >
                                            <option value="">상품을 선택하세요</option>
                                            {products.map(product => (
                                              <option key={product} value={product}>{product}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          <span className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                                            <CreditCard size={14} />
                                            가격
                                          </span>
                                          <input
                                            type="number"
                                            value={editingData.price}
                                            onChange={(e) => handleEditingDetailChange(detail.id, 'price', e.target.value)}
                                            className="glass-effect w-full rounded-lg px-3 py-2 text-sm text-white transition-all focus:outline-none focus:border-green-400"
                                          />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                          <button
                                            onClick={() => handleCancelEditingDetail(detail.id)}
                                            className="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-gray-300 transition-all hover:text-white"
                                          >
                                            취소
                                          </button>
                                          <button
                                            onClick={() => handleSaveEditingDetail(day, detail.id)}
                                            className="flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg transition-all hover:from-green-400 hover:to-green-500 hover:shadow-xl"
                                          >
                                            저장
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-2 font-semibold text-white">
                                          <User size={14} />
                                          {detail.customerName}
                                        </div>
                                        <div className="ml-5 mt-1 text-xs text-gray-400">
                                          {detail.product}
                                        </div>
                                        <div className="mt-2 text-lg font-bold text-green-400">
                                          {(detail.price || 0).toLocaleString()}원
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                          {detail.timestamp}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {!dayData.approved && (
                                    <div className="ml-3 flex flex-col items-end gap-2">
                                      <button
                                        onClick={() => removeSaleDetail(day, detail.id)}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/40 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg transition-all hover:from-rose-400 hover:to-red-500 hover:shadow-xl"
                                        aria-label="매출 내역 삭제"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                      <button
                                        onClick={() => (isEditing ? handleCancelEditingDetail(detail.id) : handleStartEditingDetail(day, detail))}
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg border text-white shadow-lg transition-all hover:shadow-xl ${
                                          isEditing
                                            ? 'border-blue-500/40 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500'
                                            : 'border-emerald-400/50 bg-gradient-to-br from-emerald-400 to-green-500 text-gray-900 hover:from-emerald-300 hover:to-green-400'
                                        }`}
                                        aria-label="매출 내역 수정"
                                      >
                                        <Edit size={16} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 매출이 없을 때 안내 */}
                    {(!dayData.details || dayData.details.length === 0) && dayData.amount === 0 && (
                      <div className="text-center py-6 text-gray-500 text-sm glass-effect rounded-xl mb-4">
                        <DollarSign size={24} className="mx-auto mb-2 opacity-30" />
                        등록된 매출이 없습니다
                      </div>
                    )}

                    {/* 매출 입력 폼 토글 버튼 */}
                    {!dayData.approved && (
                      <button
                        onClick={() => toggleDayExpansion(day)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl py-3 text-sm font-semibold transition-all mb-4 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        <Plus size={18} />
                        {expandedDays[day] ? '매출 입력 접기' : '매출 입력하기'}
                        <span className={`transform transition-transform ${expandedDays[day] ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                    )}

                    {/* 매출 입력 폼 */}
                    {expandedDays[day] && !dayData.approved && (
                      <div className="glass-effect rounded-xl p-5 mb-4 space-y-4 slide-in">
                        <div className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2">
                          <Edit size={16} />
                          {selectedMonth + 1}월 {day}일 매출 입력
                        </div>

                        {/* 회원명 입력 */}
                        <div>
                          <label className="block text-xs font-semibold mb-2 text-gray-300 flex items-center gap-2">
                            <User size={14} />
                            회원명
                          </label>
                          <input
                            type="text"
                            value={customerName[day] || ''}
                            onChange={(e) => setCustomerName(prev => ({
                              ...prev,
                              [day]: e.target.value
                            }))}
                            placeholder="회원명을 입력하세요"
                            className="glass-effect rounded-lg px-4 py-3 w-full focus:border-green-400 focus:outline-none text-sm transition-all"
                          />
                        </div>

                        {/* 상품 선택 */}
                        <div>
                          <label className="block text-xs font-semibold mb-2 text-gray-300 flex items-center gap-2">
                            <Package size={14} />
                            상품
                          </label>
                          <select
                            value={selectedProducts[day] || ''}
                            onChange={(e) => setSelectedProducts(prev => ({
                              ...prev,
                              [day]: e.target.value
                            }))}
                            className="glass-effect rounded-lg px-4 py-3 w-full focus:border-green-400 focus:outline-none text-sm transition-all"
                          >
                            <option value="">상품을 선택하세요</option>
                            {products.map(product => (
                              <option key={product} value={product}>{product}</option>
                            ))}
                          </select>
                        </div>

                        {/* 가격 입력 */}
                        <div>
                          <label className="block text-xs font-semibold mb-2 text-gray-300 flex items-center gap-2">
                            <CreditCard size={14} />
                            가격
                          </label>
                          <input
                            type="number"
                            value={customPrices[day] || ''}
                            onChange={(e) => setCustomPrices(prev => ({
                              ...prev,
                              [day]: e.target.value
                            }))}
                            placeholder="가격을 입력하세요"
                            className="glass-effect rounded-lg px-4 py-3 w-full focus:border-green-400 focus:outline-none text-sm transition-all"
                          />
                        </div>

                        {/* 등록 버튼 */}
                        <button
                          onClick={() => addSaleDetail(day)}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-lg py-3 font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
                        >
                          매출 등록
                        </button>
                      </div>
                    )}
                    
                    {!dayData.approved ? (
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={approvalPasswords[dateKey] || ''}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setApprovalPasswords(prev => ({
                              ...prev,
                              [dateKey]: newValue
                            }));
                          }}
                          placeholder="비밀번호"
                          className="glass-effect rounded-xl px-4 py-3 flex-1 focus:border-green-400 focus:outline-none text-base transition-all"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAdminApproval(day);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAdminApproval(day)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl px-6 py-3 text-base font-semibold transition-all whitespace-nowrap shadow-lg hover:shadow-xl"
                        >
                          승인
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl px-4 py-3 text-base font-semibold cursor-default flex items-center gap-2 w-full justify-center shadow-lg"
                          disabled
                        >
                          <Check size={18} />
                          정산완료
                        </button>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={editPasswords[dateKey] || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setEditPasswords(prev => ({
                                ...prev,
                                [dateKey]: newValue
                              }));
                            }}
                            placeholder="수정 비밀번호"
                            className="glass-effect rounded-xl px-4 py-3 flex-1 focus:border-orange-400 focus:outline-none text-base transition-all"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleEditMode(day);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleEditMode(day)}
                            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 rounded-xl px-6 py-3 text-base font-semibold transition-all whitespace-nowrap flex items-center gap-2 shadow-lg hover:shadow-xl"
                          >
                            <Edit size={18} />
                            수정
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 주간 매출 합계 */}
        <div className="gradient-border mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp size={28} style={{ color: '#00C6FF' }} />
              </div>
              주간 매출 합계
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weeklySales.map((week, index) => (
                <div key={index} className="glass-effect rounded-2xl p-5 hover:scale-105 transition-all duration-300">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-400 mb-2">
                      {week.days[0]}일 - {week.days[week.days.length - 1]}일
                    </span>
                    <span className="text-2xl font-black" style={{ color: '#00C6FF' }}>
                      {(week.total || 0).toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 월간 총계 및 인센티브 */}
        <div className="gradient-border glow-green">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50">
            <h2 className="text-3xl font-black mb-8 text-center neon-text" style={{ color: '#00FF88' }}>
              월간 급여 계산
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-center mb-6 sm:mb-8">
              <div className="glass-effect rounded-2xl p-4 sm:p-6 hover:scale-105 transition-all duration-300">
                <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 font-semibold">월간 총매출</p>
                <p className="text-2xl sm:text-3xl font-black">{(monthlyTotal || 0).toLocaleString()}원</p>
              </div>
              
              <div className="glass-effect rounded-2xl p-4 sm:p-6 hover:scale-105 transition-all duration-300">
                <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 font-semibold">인센티브율 ({employeeType === 'full' ? '정직원' : '파트타임'})</p>
                <p className="text-2xl sm:text-3xl font-black neon-text" style={{ color: '#00FF88' }}>{incentiveRate || 0}%</p>
              </div>
              
              <div className="glass-effect rounded-2xl p-4 sm:p-6 hover:scale-105 transition-all duration-300">
                <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 font-semibold">인센티브 금액</p>
                <p className="text-2xl sm:text-3xl font-black neon-text" style={{ color: '#00FF88' }}>
                  {Math.floor(incentiveAmount || 0).toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 인센티브 기준표 */}
            <div className="glass-effect rounded-2xl p-6">
              <p className="text-lg font-bold text-center mb-4 text-gray-300">
                인센티브 기준표 ({employeeType === 'full' ? '정직원' : '파트타임'})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs text-center">
                <div className="glass-effect rounded-xl p-2 sm:p-3 hover:scale-105 transition-all">
                  <p className="text-gray-400 mb-1 text-xs">2,500만원 미만</p>
                  <p className="font-bold text-base sm:text-lg">{employeeType === 'full' ? '5%' : '2.5%'}</p>
                </div>
                <div className="glass-effect rounded-xl p-2 sm:p-3 hover:scale-105 transition-all">
                  <p className="text-gray-400 mb-1 text-xs">2,500만원 이상</p>
                  <p className="font-bold text-base sm:text-lg">{employeeType === 'full' ? '5.5%' : '2.75%'}</p>
                </div>
                <div className="glass-effect rounded-xl p-2 sm:p-3 hover:scale-105 transition-all">
                  <p className="text-gray-400 mb-1 text-xs">3,000만원 이상</p>
                  <p className="font-bold text-base sm:text-lg">{employeeType === 'full' ? '6%' : '3%'}</p>
                </div>
                <div className="glass-effect rounded-xl p-2 sm:p-3 hover:scale-105 transition-all">
                  <p className="text-gray-400 mb-1 text-xs">3,500만원 이상</p>
                  <p className="font-bold text-base sm:text-lg">{employeeType === 'full' ? '6.5%' : '3.25%'}</p>
                </div>
                <div className="glass-effect rounded-xl p-2 sm:p-3 hover:scale-105 transition-all">
                  <p className="text-gray-400 mb-1 text-xs">4,000만원 이상</p>
                  <p className="font-bold text-base sm:text-lg">{employeeType === 'full' ? '7%' : '3.5%'}</p>
                </div>
                <div className="glass-effect rounded-xl p-2 sm:p-3 hover:scale-105 transition-all">
                  <p className="text-gray-400 mb-1 text-xs">4,500만원 이상</p>
                  <p className="font-bold text-base sm:text-lg">{employeeType === 'full' ? '7.5%' : '3.75%'}</p>
                </div>
                <div className="glass-effect rounded-xl p-2 sm:p-3 hover:scale-105 transition-all">
                  <p className="text-gray-400 mb-1 text-xs">5,000만원 이상</p>
                  <p className="font-bold text-base sm:text-lg">{employeeType === 'full' ? '8%' : '4%'}</p>
                </div>
                <div className="glass-effect rounded-xl p-2 sm:p-3 hover:scale-105 transition-all">
                  <p className="text-gray-400 mb-1 text-xs">6,000만원 이상</p>
                  <p className="font-bold text-base sm:text-lg">{employeeType === 'full' ? '10%' : '5%'}</p>
                </div>
              </div>
              
              {/* 정직원/파트타임 비교표 */}
              <div className="mt-6 glass-effect rounded-2xl p-6">
                <p className="text-lg font-bold mb-4 text-center">현재 매출 기준 인센티브 비교</p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div 
                    className={`rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                      employeeType === 'full' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 scale-105 shadow-xl' 
                        : 'glass-effect hover:scale-105'
                    }`}
                    onClick={() => setEmployeeType('full')}
                  >
                    <p className="text-sm font-semibold mb-2">정직원</p>
                    <p className="font-black text-2xl mb-2">{getIncentiveRate(monthlyTotal, 'full')}%</p>
                    <p className="text-sm opacity-80">
                      {Math.floor((monthlyTotal || 0) * (getIncentiveRate(monthlyTotal, 'full') / 100)).toLocaleString()}원
                    </p>
                  </div>
                  <div 
                    className={`rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                      employeeType === 'part' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 scale-105 shadow-xl' 
                        : 'glass-effect hover:scale-105'
                    }`}
                    onClick={() => setEmployeeType('part')}
                  >
                    <p className="text-sm font-semibold mb-2">파트타임</p>
                    <p className="font-black text-2xl mb-2">{getIncentiveRate(monthlyTotal, 'part')}%</p>
                    <p className="text-sm opacity-80">
                      {Math.floor((monthlyTotal || 0) * (getIncentiveRate(monthlyTotal, 'part') / 100)).toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeoFitPayCalc;
