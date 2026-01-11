import React, { useMemo, useState } from 'react';
import 'chart.js/auto';
import { Line, Bar } from 'react-chartjs-2';
import { normalizeAmount } from '../utils/numberUtils';

const FALLBACK_CATEGORY_KEY = 'misc';
const GEAR_CATEGORY_KEY = '운동복/락커';

const CATEGORY_META = [
  {
    key: '헬스',
    label: '헬스 이용권',
    icon: '🏃',
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    pointBackgroundColor: '#34d399',
    matcher: (name) => name.includes('헬스'),
  },
  {
    key: '네오핏',
    label: '네오핏',
    icon: '🔥',
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(96, 165, 250, 0.18)',
    pointBackgroundColor: '#60a5fa',
    matcher: (name) => name.includes('네오핏'),
  },
  {
    key: 'PT',
    label: '1:1 PT',
    icon: '🏋️',
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    pointBackgroundColor: '#fbbf24',
    matcher: (name) =>
      name.includes('pt') ||
      name.includes('personal') ||
      name.includes('트레이닝') ||
      name.includes('개인'),
  },
  {
    key: '필라테스',
    label: '필라테스',
    icon: '🧘',
    borderColor: '#fb7185',
    backgroundColor: 'rgba(251, 113, 133, 0.18)',
    pointBackgroundColor: '#fb7185',
    matcher: (name) => name.includes('필라테스'),
  },
  {
    key: GEAR_CATEGORY_KEY,
    label: '운동복/락커',
    icon: '👕',
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    pointBackgroundColor: '#a855f7',
    matcher: (name) =>
      name.includes('운동복') ||
      name.includes('락커') ||
      name.includes('locker') ||
      name.includes('apparel'),
  },
  {
    key: FALLBACK_CATEGORY_KEY,
    label: '기타',
    icon: '🧾',
    borderColor: '#94a3b8',
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    pointBackgroundColor: '#94a3b8',
    matcher: () => false,
  },
];

const MONTH_OFFSETS = [-5, -4, -3, -2, -1, 0];

const CATEGORY_KEY_LOOKUP = {
  health: '헬스',
  '헬스': '헬스',
  '헬스 이용권': '헬스',
  gym: '헬스',
  fitness: '헬스',
  membership: '헬스',
  neofit: '네오핏',
  '네오핏': '네오핏',
  pt: 'PT',
  '피티': 'PT',
  '1:1 pt': 'PT',
  personal: 'PT',
  training: 'PT',
  trainer: 'PT',
  pilates: '필라테스',
  '필라테스': '필라테스',
  '필라테스 이용권': '필라테스',
  clothing: GEAR_CATEGORY_KEY,
  locker: GEAR_CATEGORY_KEY,
  storage: GEAR_CATEGORY_KEY,
  gear: GEAR_CATEGORY_KEY,
  apparel: GEAR_CATEGORY_KEY,
  '운동복': GEAR_CATEGORY_KEY,
  '락커': GEAR_CATEGORY_KEY,
  [GEAR_CATEGORY_KEY]: GEAR_CATEGORY_KEY,
  etc: FALLBACK_CATEGORY_KEY,
  misc: FALLBACK_CATEGORY_KEY,
  기타: FALLBACK_CATEGORY_KEY,
};

const deriveCategoryKey = (detail) => {
  if (!detail) {
    return FALLBACK_CATEGORY_KEY;
  }

  const explicit = (detail.category || detail.type || '').toString().toLowerCase();
  if (explicit) {
    const mapped = CATEGORY_KEY_LOOKUP[explicit];
    if (mapped) {
      return mapped;
    }
    if (explicit.includes('pilates')) return '필라테스';
    if (explicit.includes('neo')) return '네오핏';
    if (explicit.includes('pt') || explicit.includes('trainer')) return 'PT';
    if (explicit.includes('health') || explicit.includes('fitness')) return '헬스';
  }

  const product = (detail.product || '').toString().toLowerCase();
  if (!product) {
    return FALLBACK_CATEGORY_KEY;
  }

  if (product.includes('필라테스')) {
    return '필라테스';
  }

  if (product.includes('네오핏')) {
    return '네오핏';
  }

  if (
    product.includes('pt') ||
    product.includes('피티') ||
    product.includes('personal') ||
    product.includes('트레이닝') ||
    product.includes('개인')
  ) {
    return 'PT';
  }

  const looksLikeHealth =
    product.includes('헬스') ||
    (product.includes('개월') &&
      !product.includes('필라테스') &&
      !product.includes('운동복') &&
      !product.includes('락커'));

  if (looksLikeHealth) {
    return '헬스';
  }

  if (
    product.includes('운동복') ||
    product.includes('락커') ||
    product.includes('locker') ||
    product.includes('보관함') ||
    product.includes('보관') ||
    product.includes('apparel') ||
    product.includes('gear')
  ) {
    return GEAR_CATEGORY_KEY;
  }

  return FALLBACK_CATEGORY_KEY;
};

const hexToRgb = (hex) => {
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(char => char + char).join('');
  }
  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const withAlpha = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildAreaGradient = (context, hex, baseAlpha = 0.25) => {
  const { chart } = context;
  const { ctx, chartArea } = chart;
  if (!chartArea) {
    return withAlpha(hex, baseAlpha);
  }
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, withAlpha(hex, baseAlpha));
  gradient.addColorStop(1, withAlpha(hex, 0));
  return gradient;
};

const MonthlyReportChart = ({ salesData = {}, selectedYear, selectedMonth }) => {
  const activeMonth = typeof selectedMonth === 'number' ? selectedMonth : new Date().getMonth();

  const resolvedYear = typeof selectedYear === 'number' ? selectedYear : new Date().getFullYear();

  const [activeCategories, setActiveCategories] = useState(() => CATEGORY_META.map(category => category.key));
  const [chartType, setChartType] = useState('area'); // 'area' | 'line' | 'stacked'

  const monthConfigs = useMemo(() => (
    MONTH_OFFSETS.map(offset => {
      const baseDate = new Date(resolvedYear, activeMonth + offset, 1);
      const label = `${baseDate.getMonth() + 1}월`;
      const key = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
      return {
        key,
        label,
        year: baseDate.getFullYear(),
        month: baseDate.getMonth() + 1,
        offset,
      };
    })
  ), [activeMonth, resolvedYear]);

  const monthlyStats = useMemo(() => {
    const initialBuckets = monthConfigs.reduce((acc, { key }) => {
      acc[key] = {
        categories: CATEGORY_META.reduce(
          (categoryAcc, category) => ({ ...categoryAcc, [category.key]: 0 }),
          {}
        ),
        total: 0,
      };
      return acc;
    }, {});

    Object.entries(salesData || {}).forEach(([dateKey, dayData]) => {
      if (!dayData || !dayData.approved) {
        return;
      }

      const [yearStr, monthStr] = dateKey.split('-');
      if (!yearStr || !monthStr) {
        return;
      }

      const monthKey = `${yearStr}-${monthStr}`;
      const bucket = initialBuckets[monthKey];
      if (!bucket) {
        return;
      }

      const amountValue = normalizeAmount(dayData.amount);
      const details = Array.isArray(dayData.details) ? dayData.details : [];

      const dailyCategoryTotals = {};
      details.forEach(detail => {
        const price = normalizeAmount(detail?.price);
        if (!price) {
          return;
        }

        const derivedKey = deriveCategoryKey(detail);
        dailyCategoryTotals[derivedKey] = (dailyCategoryTotals[derivedKey] || 0) + price;
      });

      const categorizedAmount = Object.values(dailyCategoryTotals).reduce((sum, value) => sum + value, 0);

      if (amountValue > 0) {
        if (categorizedAmount > 0) {
          // Scale category totals down when detail 합계가 일일 정산 금액보다 큰 경우를 보정해 총액과 일치시킴
          const scalingFactor = amountValue < categorizedAmount && categorizedAmount > 0
            ? amountValue / categorizedAmount
            : 1;

          let scaledSum = 0;
          Object.entries(dailyCategoryTotals).forEach(([key, value]) => {
            const adjustedValue = value * scalingFactor;
            bucket.categories[key] = (bucket.categories[key] || 0) + adjustedValue;
            scaledSum += adjustedValue;
          });

          const remainder = amountValue - scaledSum;
          if (remainder > 0.5) {
            bucket.categories[FALLBACK_CATEGORY_KEY] += remainder;
          }
        } else {
          bucket.categories[FALLBACK_CATEGORY_KEY] += amountValue;
        }

        bucket.total += amountValue;
      } else if (categorizedAmount > 0) {
        Object.entries(dailyCategoryTotals).forEach(([key, value]) => {
          bucket.categories[key] = (bucket.categories[key] || 0) + value;
        });
        bucket.total += categorizedAmount;
      }
    });

    return monthConfigs.map(config => {
      const bucket = initialBuckets[config.key] || {
        categories: CATEGORY_META.reduce(
          (categoryAcc, category) => ({ ...categoryAcc, [category.key]: 0 }),
          {}
        ),
        total: 0,
      };

      return {
        ...config,
        categories: bucket.categories,
        total: bucket.total,
      };
    });
  }, [salesData, monthConfigs]);

  const datasets = useMemo(() => CATEGORY_META.map(category => {
    const isActive = activeCategories.includes(category.key);
    const baseDataset = {
      label: `${category.icon} ${category.label}`,
      data: monthlyStats.map(stat => stat.categories[category.key] || 0),
      borderColor: isActive ? category.borderColor : withAlpha(category.borderColor, 0.35),
      pointBackgroundColor: category.pointBackgroundColor,
      pointBorderColor: '#111827',
      hidden: !isActive,
      spanGaps: true,
    };

    if (chartType === 'stacked') {
      return {
        ...baseDataset,
        type: 'bar',
        stack: 'total',
        backgroundColor: withAlpha(category.borderColor, isActive ? 0.75 : 0.25),
        borderWidth: 0,
        barPercentage: 0.65,
        categoryPercentage: 0.8,
      };
    }

    if (chartType === 'line') {
      return {
        ...baseDataset,
        type: 'line',
        backgroundColor: withAlpha(category.borderColor, 0),
        borderWidth: isActive ? 2.5 : 1.2,
        tension: 0.35,
        pointRadius: isActive ? 4 : 2.5,
        pointHoverRadius: 6,
        fill: false,
      };
    }

    return {
      ...baseDataset,
      type: 'line',
      backgroundColor: (context) => buildAreaGradient(context, category.borderColor, isActive ? 0.28 : 0.12),
      borderWidth: isActive ? 3 : 1.5,
      tension: 0.35,
      pointRadius: isActive ? 4.5 : 2.5,
      pointHoverRadius: 6,
      fill: true,
    };
  }), [monthlyStats, activeCategories, chartType]);

  const totalSales = monthlyStats.map(stat => stat.total || 0);
  const maxValue = totalSales.length ? Math.max(...totalSales) : 0;
  const paddedMax = maxValue
    ? Math.max(Math.ceil((maxValue * 1.15) / 500000) * 500000, 500000)
    : 500000;

  const chartData = {
    labels: monthConfigs.map(config => config.label),
    datasets,
  };

  const optionsBaseScales = useMemo(() => ({
    x: {
      grid: {
        color: 'rgba(100, 116, 139, 0.14)',
        drawBorder: false,
      },
      ticks: {
        color: '#cbd5f5',
        font: {
          family: 'Pretendard, sans-serif',
          size: 12,
          weight: '500',
        },
      },
    },
    y: {
      beginAtZero: true,
      suggestedMax: paddedMax,
      grid: {
        color: 'rgba(100, 116, 139, 0.14)',
        drawBorder: false,
      },
      ticks: {
        color: '#cbd5f5',
        font: {
          family: 'Pretendard, sans-serif',
          size: 12,
          weight: '500',
        },
        callback: value => {
          if (value >= 10000000) {
            return `${Math.round(value / 1000000)}백만`;
          }
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}백만`;
          }
          if (value >= 10000) {
            return `${Math.round(value / 10000)}만`;
          }
          return value;
        },
      },
    },
  }), [paddedMax]);

  const stacked = chartType === 'stacked';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#E5E7EB',
        borderColor: '#374151',
        borderWidth: 1,
        titleFont: {
          family: 'Pretendard, sans-serif',
          size: 14,
          weight: '600',
        },
        bodyFont: {
          family: 'Pretendard, sans-serif',
          size: 13,
          weight: '500',
        },
        callbacks: {
          title: items => (items.length ? `${items[0].label}` : ''),
          label: context => {
            const value = context.parsed.y || 0;
            const total = totalSales[context.dataIndex] || 0;
            const share = total ? ` · ${(value / total * 100).toFixed(1)}%` : '';
            return `${context.dataset.label}: ${value.toLocaleString()}원${share}`;
          },
          labelColor: context => ({
            borderColor: context.dataset.borderColor,
            backgroundColor: context.dataset.borderColor,
          }),
          labelTextColor: () => '#F9FAFB',
        },
        displayColors: false,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      point: {
        hitRadius: 14,
        hoverRadius: 6,
      },
    },
    scales: {
      x: {
        ...optionsBaseScales.x,
        stacked,
      },
      y: {
        ...optionsBaseScales.y,
        stacked,
      },
    },
  };

  const focusStat = monthlyStats.find(stat => stat.offset === 0) || monthlyStats[0] || {
    key: monthConfigs[0]?.key || '',
    label: `${activeMonth + 1}월`,
    categories: CATEGORY_META.reduce(
      (acc, category) => ({ ...acc, [category.key]: 0 }),
      {}
    ),
    total: 0,
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 backdrop-blur-xl rounded-2xl border border-slate-800/70 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex flex-wrap items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl">
            📊
          </div>
          월별 매출 리포트
        </h2>

        <div className="bg-slate-900/60 rounded-xl border border-slate-800/60 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">{focusStat.label} 매출 현황</h3>
              <div className="mt-3 inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-teal-500/10 border border-emerald-400/30 px-4 py-2 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/40"></span>
                  <span className="text-xs uppercase tracking-wide text-emerald-200 font-semibold">합계</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {(focusStat.total || 0).toLocaleString()}원
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-200">
              {CATEGORY_META.map(category => (
                <div
                  key={category.key}
                  className="flex items-center gap-3 rounded-xl border border-gray-700/60 bg-gray-900/60 px-3 py-2 shadow-inner"
                >
                  <span
                    className="inline-flex h-2.5 w-6 rounded-full"
                    style={{ backgroundColor: category.borderColor }}
                  ></span>
                  <div className="flex flex-col leading-tight">
                    <span>{category.icon} {category.label}</span>
                    <span className="text-[10px] text-gray-500">그래프 색상</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {CATEGORY_META.map(category => {
              const isActive = activeCategories.includes(category.key);
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    setActiveCategories(prev => {
                      if (prev.includes(category.key)) {
                        const next = prev.filter(key => key !== category.key);
                        return next.length === 0 ? prev : next;
                      }
                      return [...prev, category.key];
                    });
                  }}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${isActive ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
                >
                  <span className="inline-flex h-2.5 w-6 rounded-full" style={{ backgroundColor: category.borderColor }}></span>
                  <span>{category.icon} {category.label}</span>
                </button>
              );
            })}
            <div className="flex items-center gap-2 ml-auto text-xs text-slate-400">
              <span>차트 유형:</span>
              {[
                { value: 'area', label: '에어리어' },
                { value: 'line', label: '라인' },
                { value: 'stacked', label: '스택' },
              ].map(mode => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setChartType(mode.value)}
                  className={`rounded-full border px-2.5 py-1 transition-colors ${chartType === mode.value ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
                >
                  {mode.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActiveCategories(CATEGORY_META.map(category => category.key))}
                className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:border-emerald-400/60 hover:text-emerald-200"
              >
                전체 보기
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {CATEGORY_META.map(category => (
              <div
                key={category.key}
                className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-5"
              >
                <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                  <span>{category.icon} {category.label}</span>
                  <span className="inline-flex h-1.5 w-10 rounded-full opacity-80"
                    style={{ backgroundColor: category.borderColor }}
                  ></span>
                </div>
                <div className="text-2xl font-semibold" style={{ color: category.borderColor }}>
                  {(focusStat.categories[category.key] || 0).toLocaleString()}원
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-300">
                  <span className="inline-flex h-2.5 w-6 rounded-full" style={{ backgroundColor: category.borderColor }}></span>
                  <span>그래프 색상</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-96 rounded-2xl border border-slate-800/60 bg-slate-950/50 p-4">
        {chartType === 'stacked' ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default MonthlyReportChart;
