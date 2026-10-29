import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Pause,
  Play,
} from 'lucide-react';
import { CoffeePrice, CoffeeBean, Language } from '../types/coffee';

interface MarketTickerProps {
  prices: CoffeePrice[];
  beans?: CoffeeBean[];
  lang: Language;
}

const DEFAULT_BENCHMARK_PRICES: CoffeePrice[] = [
  {
    id: 'bench-1',
    name_ar: 'برازيلي سانتوس NY2/3 (أخضر)',
    name_en: 'Brazilian Santos NY2/3 (Green)',
    coffee_type: 'green',
    type: 'green',
    current_price: 265,
    previous_price: 260,
    price: 265,
    currency: 'EGP',
    unit: 'كجم',
    unit_ar: 'كجم',
    unit_en: 'Kg',
    change_percent: 1.9,
    trend: 'up',
    updated_at: '2026',
  },
  {
    id: 'bench-2',
    name_ar: 'فيتنامي روبوستا G1 مغسول (أخضر)',
    name_en: 'Vietnamese Robusta G1 Polished (Green)',
    coffee_type: 'green',
    type: 'green',
    current_price: 235,
    previous_price: 238,
    price: 235,
    currency: 'EGP',
    unit: 'كجم',
    unit_ar: 'كجم',
    unit_en: 'Kg',
    change_percent: -1.3,
    trend: 'down',
    updated_at: '2026',
  },
  {
    id: 'bench-3',
    name_ar: 'كولومبي سوبريمو EP (أخضر)',
    name_en: 'Colombian Supremo EP (Green)',
    coffee_type: 'green',
    type: 'green',
    current_price: 330,
    previous_price: 322,
    price: 330,
    currency: 'EGP',
    unit: 'كجم',
    unit_ar: 'كجم',
    unit_en: 'Kg',
    change_percent: 2.5,
    trend: 'up',
    updated_at: '2026',
  },
  {
    id: 'bench-4',
    name_ar: 'هندي تشيري روبوستا AA (أخضر)',
    name_en: 'Indian Cherry Robusta AA (Green)',
    coffee_type: 'green',
    type: 'green',
    current_price: 255,
    previous_price: 255,
    price: 255,
    currency: 'EGP',
    unit: 'كجم',
    unit_ar: 'كجم',
    unit_en: 'Kg',
    change_percent: 0.0,
    trend: 'stable',
    updated_at: '2026',
  },
  {
    id: 'bench-5',
    name_ar: 'إثيوبي يرغاشيف G2 (أخضر)',
    name_en: 'Ethiopian Yirgacheffe G2 (Green)',
    coffee_type: 'green',
    type: 'green',
    current_price: 350,
    previous_price: 344,
    price: 350,
    currency: 'EGP',
    unit: 'كجم',
    unit_ar: 'كجم',
    unit_en: 'Kg',
    change_percent: 1.7,
    trend: 'up',
    updated_at: '2026',
  },
  {
    id: 'bench-6',
    name_ar: 'إندونيسي جافا روبوستا WIB (أخضر)',
    name_en: 'Indonesian Java Robusta WIB (Green)',
    coffee_type: 'green',
    type: 'green',
    current_price: 245,
    previous_price: 248,
    price: 245,
    currency: 'EGP',
    unit: 'كجم',
    unit_ar: 'كجم',
    unit_en: 'Kg',
    change_percent: -1.2,
    trend: 'down',
    updated_at: '2026',
  },
  {
    id: 'bench-7',
    name_ar: 'توليفة تركي كلاسيك فاخرة (محمص)',
    name_en: 'Premium Classic Turkish Blend (Roasted)',
    coffee_type: 'roasted',
    type: 'roasted',
    current_price: 385,
    previous_price: 380,
    price: 385,
    currency: 'EGP',
    unit: 'كجم',
    unit_ar: 'كجم',
    unit_en: 'Kg',
    change_percent: 1.3,
    trend: 'up',
    updated_at: '2026',
  },
  {
    id: 'bench-8',
    name_ar: 'توليفة إسبريسو إيطالي 70/30 (محمص)',
    name_en: 'Italian Espresso Blend 70/30 (Roasted)',
    coffee_type: 'roasted',
    type: 'roasted',
    current_price: 410,
    previous_price: 410,
    price: 410,
    currency: 'EGP',
    unit: 'كجم',
    unit_ar: 'كجم',
    unit_en: 'Kg',
    change_percent: 0.0,
    trend: 'stable',
    updated_at: '2026',
  },
];

export const MarketTicker: React.FC<MarketTickerProps> = ({
  prices,
  beans = [],
  lang,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'green' | 'roasted'>('all');

  const tickerItems = useMemo<CoffeePrice[]>(() => {
    if (prices && prices.length > 0) {
      return prices;
    }

    const fromBeans: CoffeePrice[] = beans
      .filter((b) => b.avg_green_price_egp > 0 || b.avg_roasted_price_egp > 0)
      .slice(0, 12)
      .map((b, idx) => {
        const isGreen = b.avg_green_price_egp > 0;
        const priceVal = isGreen ? b.avg_green_price_egp : b.avg_roasted_price_egp;
        const deltas = [1.4, -0.8, 2.1, 0.0, 1.2, -1.1];
        const delta = deltas[idx % deltas.length];
        return {
          id: `bean-ticker-${b.id}`,
          name_ar: b.name_ar,
          name_en: b.name_en || b.name_ar,
          coffee_type: isGreen ? 'green' : 'roasted',
          type: isGreen ? 'green' : 'roasted',
          current_price: priceVal,
          previous_price: priceVal,
          price: priceVal,
          currency: 'EGP',
          unit: 'كجم',
          unit_ar: 'كجم',
          unit_en: 'Kg',
          change_percent: delta,
          trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
          updated_at: '2026',
        };
      });

    return fromBeans.length > 0 ? fromBeans : DEFAULT_BENCHMARK_PRICES;
  }, [prices, beans]);

  const filteredItems = useMemo(() => {
    if (filterType === 'all') return tickerItems;
    return tickerItems.filter(
      (item) => (item.coffee_type || item.type) === filterType
    );
  }, [tickerItems, filterType]);

  const displayItems =
    filteredItems.length > 0 ? filteredItems : tickerItems;

  return (
    <div
      role="region"
      aria-label={
        lang === 'ar'
          ? 'شريط بورصة القهوة وأسعار البن المباشرة'
          : 'Live Coffee Market Exchange Ticker'
      }
      className="w-full border-t border-b border-[var(--line)] bg-white bg-coffee-sketch py-3.5 overflow-hidden select-none"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="surface-card px-3.5 py-2.5 sm:px-5 sm:py-3 flex flex-col gap-3">
          {/* Top Bar: Title + Filter Pills + Pause/Play Control */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
              <Activity size={16} strokeWidth={1.75} className="text-[var(--text)]" />
              <span className="font-display text-xs sm:text-sm font-semibold text-[var(--text)]">
                {lang === 'ar'
                  ? 'شريط بورصة القهوة والأسعار الاسترشادية اليومية'
                  : 'Live Coffee Market & Daily Benchmark Ticker'}
              </span>
              <span className="hidden md:inline-block text-[11px] text-[var(--muted)] border-s border-[var(--line)] ps-2.5">
                {lang === 'ar'
                  ? 'تحديث لحظي لأسعار البن الأخضر والمحمص في السوق المصري'
                  : 'Real-time green & roasted coffee prices in EGP/Kg'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`${
                  filterType === 'all' ? 'chip-pill-active' : 'chip-pill'
                } !bg-[#ffd69c] !py-1 !px-2.5 text-[11px]`}
              >
                {lang === 'ar' ? 'الكل' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('green')}
                className={`${
                  filterType === 'green' ? 'chip-pill-active' : 'chip-pill'
                } !bg-[#a3ffde] !py-1 !px-2.5 text-[11px]`}
              >
                {lang === 'ar' ? 'بن أخضر' : 'Green'}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('roasted')}
                className={`${
                  filterType === 'roasted' ? 'chip-pill-active' : 'chip-pill'
                } !bg-[#e0c297] !py-1 !px-2.5 text-[11px]`}
              >
                {lang === 'ar' ? 'بن محمص' : 'Roasted'}
              </button>

              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                title={
                  isPaused
                    ? lang === 'ar'
                      ? 'تشغيل الشريط'
                      : 'Resume ticker'
                    : lang === 'ar'
                    ? 'إيقاف مؤقت'
                    : 'Pause ticker'
                }
                className="btn-secondary !bg-[#edb1b1] !p-1.5 rounded-lg text-[var(--text)]"
                aria-label={isPaused ? 'Play ticker' : 'Pause ticker'}
              >
                {isPaused ? <Play size={13} /> : <Pause size={13} />}
              </button>
            </div>
          </div>

          {/* Scrolling Ticker Strip */}
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative w-full overflow-x-auto no-scrollbar"
          >
            <div
              style={{
                animationDuration: `${Math.max(38, displayItems.length * 19)}s`,
              }}
              className={`flex items-center gap-3 w-max py-0.5 ${
                isPaused ? '' : 'ticker-marquee-track'
              }`}
            >
              {[...displayItems, ...displayItems].map((item, idx) => {
                const isUp = item.trend === 'up' || item.change_percent > 0;
                const isDown = item.trend === 'down' || item.change_percent < 0;
                const isGreen = (item.coffee_type || item.type) === 'green';

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-black/30 transition-colors shrink-0"
                  >
                    {/* Coffee Type Tag */}
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                        isGreen
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {isGreen
                        ? lang === 'ar'
                          ? 'أخضر'
                          : 'Green'
                        : lang === 'ar'
                        ? 'محمص'
                        : 'Roasted'}
                    </span>

                    {/* Commodity Name */}
                    <span className="text-xs font-semibold text-[var(--text)] whitespace-nowrap">
                      {lang === 'ar'
                        ? item.name_ar
                        : item.name_en || item.name_ar}
                    </span>

                    {/* Price */}
                    <span
                      dir="ltr"
                      className="ltr-num text-xs font-bold text-[var(--text)] bg-zinc-100 px-2 py-0.5 rounded"
                    >
                      {item.current_price || item.price}{' '}
                      <span className="text-[10px] font-normal text-[var(--muted)]">
                        {lang === 'ar'
                          ? `${item.currency === 'EGP' ? 'ج.م' : item.currency}/${item.unit_ar || 'كجم'}`
                          : `${item.currency}/${item.unit_en || 'Kg'}`}
                      </span>
                    </span>

                    {/* Trend Badge */}
                    <span
                      dir="ltr"
                      className={`ltr-num inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                        isUp
                          ? 'text-emerald-700 bg-emerald-50'
                          : isDown
                          ? 'text-rose-700 bg-rose-50'
                          : 'text-zinc-600 bg-zinc-100'
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp size={12} strokeWidth={2} />
                      ) : isDown ? (
                        <TrendingDown size={12} strokeWidth={2} />
                      ) : (
                        <Minus size={12} strokeWidth={2} />
                      )}
                      <span>
                        {item.change_percent > 0
                          ? `+${item.change_percent}%`
                          : `${item.change_percent}%`}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
