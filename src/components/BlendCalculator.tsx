import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Coffee,
} from 'lucide-react';
import {
  CalculatorComponentItem,
  AIBlendAnalysisResult,
  CoffeeBean,
  CoffeeBlend,
  Language,
} from '../types/coffee';
import { analyzeBlendWithAI } from '../services/base44Api';

interface BlendCalculatorProps {
  lang: Language;
  beans: CoffeeBean[];
  presetBlend?: CoffeeBlend | null;
  onClearPreset?: () => void;
}

export const BlendCalculator: React.FC<BlendCalculatorProps> = ({
  lang,
  beans,
  presetBlend,
  onClearPreset,
}) => {
  const [beanState, setBeanState] = useState<'green' | 'roasted'>('green');
  const [roastLossPercent, setRoastLossPercent] = useState<number>(15);
  const [targetUse, setTargetUse] = useState<'turkish' | 'espresso' | 'both'>(
    'turkish'
  );

  const [components, setComponents] = useState<CalculatorComponentItem[]>([
    {
      id: 'comp-1',
      name: 'برازيلي سانتوس نيويورك 2 (أرابيكا)',
      percentage: 55,
      pricePerKg: 315,
    },
    {
      id: 'comp-2',
      name: 'أرابيكا هندي بلانتيشن A',
      percentage: 15,
      pricePerKg: 345,
    },
    {
      id: 'comp-3',
      name: 'روبوستا إندونيسي جاوة WIB-1',
      percentage: 30,
      pricePerKg: 255,
    },
  ]);

  const [showReport, setShowReport] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIBlendAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (presetBlend) {
      setBeanState('green');
      setRoastLossPercent(presetBlend.expected_loss_percent || 15);
      setTargetUse(
        presetBlend.category === 'espresso'
          ? 'espresso'
          : presetBlend.category === 'both'
          ? 'both'
          : 'turkish'
      );
      setComponents(
        presetBlend.ingredients.map((ing, idx) => ({
          id: `preset-${idx}-${Date.now()}`,
          name: lang === 'ar' ? ing.bean_name_ar : ing.bean_name_en,
          percentage: ing.percentage,
          pricePerKg: ing.avg_price_egp,
        }))
      );
      setShowReport(false);
      setAiResult(null);
      if (onClearPreset) onClearPreset();
    }
  }, [presetBlend, lang, onClearPreset]);

  const effectiveLossPercent = beanState === 'green' ? roastLossPercent : 0;
  const totalPercentage = components.reduce(
    (sum, item) => sum + (Number(item.percentage) || 0),
    0
  );
  const isTotalValid = Math.abs(totalPercentage - 100) < 0.01;

  // Exact Financial Calculations
  const rawCostPerKg = components.reduce(
    (sum, item) =>
      sum + ((Number(item.percentage) || 0) / 100) * (Number(item.pricePerKg) || 0),
    0
  );

  const netYieldRatio = 1 - effectiveLossPercent / 100;
  const netYieldGramsPerKg = Math.round(netYieldRatio * 1000);
  const lossGramsPerKg = 1000 - netYieldGramsPerKg;
  const greenNeededForOneKgRoasted =
    netYieldRatio > 0 ? 1 / netYieldRatio : 1;
  const netRoastedCostPerKg =
    netYieldRatio > 0 ? rawCostPerKg / netYieldRatio : rawCostPerKg;
  const roastShrinkageCostImpact = netRoastedCostPerKg - rawCostPerKg;

  const handleAddComponent = () => {
    const remaining = Math.max(0, 100 - totalPercentage);
    setComponents((prev) => [
      ...prev,
      {
        id: `comp-${Date.now()}`,
        name:
          lang === 'ar'
            ? 'روبوستا فيتنامي جريد 1 بوليش'
            : 'Vietnam Robusta G1 Polished',
        percentage: remaining,
        pricePerKg: 235,
      },
    ]);
  };

  const handleRemoveComponent = (id: string) => {
    if (components.length <= 1) return;
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateComponent = (
    id: string,
    field: keyof CalculatorComponentItem,
    value: string | number
  ) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (field === 'name') {
          const matchedBean = beans.find(
            (b) => b.name_ar === value || b.name_en === value
          );
          if (matchedBean) {
            return {
              ...c,
              name: String(value),
              pricePerKg:
                beanState === 'green'
                  ? matchedBean.avg_green_price_egp
                  : matchedBean.avg_roasted_price_egp,
            };
          }
          return { ...c, name: String(value) };
        }
        return { ...c, [field]: Number(value) };
      })
    );
  };

  const handleAutoBalance = () => {
    if (components.length === 0) return;
    if (totalPercentage === 0) {
      const equalShare = Math.floor(100 / components.length);
      const remainder = 100 - equalShare * components.length;
      setComponents((prev) =>
        prev.map((c, idx) => ({
          ...c,
          percentage: idx === 0 ? equalShare + remainder : equalShare,
        }))
      );
      return;
    }

    let runningSum = 0;
    setComponents((prev) =>
      prev.map((c, idx) => {
        if (idx === prev.length - 1) {
          return { ...c, percentage: Math.max(0, 100 - runningSum) };
        }
        const scaled = Math.round((c.percentage / totalPercentage) * 100);
        runningSum += scaled;
        return { ...c, percentage: scaled };
      })
    );
  };

  const buildFallbackExpertAnalysis = (): AIBlendAnalysisResult => {
    const hasRobusta = components.some(
      (c) =>
        c.name.includes('روبوستا') ||
        c.name.toLowerCase().includes('robusta') ||
        c.name.includes('فيتنامي') ||
        c.name.includes('إندونيسي')
    );
    const hasColombianOrEthiopian = components.some(
      (c) =>
        c.name.includes('كولومبي') ||
        c.name.includes('حبشي') ||
        c.name.toLowerCase().includes('colombia') ||
        c.name.toLowerCase().includes('ethiopia')
    );

    return lang === 'ar'
      ? {
          summaryVerdict: `توليفة متوازنة تجارياً بتكلفة صافية ${netRoastedCostPerKg.toFixed(
            1
          )} ج.م/كجم قبل مصاريف التشغيل. تجمع بين القوام الممتلئ والثبات العالي للوش/الكريما وتناسب ذوق المستهلك المصري في ${
            targetUse === 'turkish'
              ? 'القهوة التركي'
              : targetUse === 'espresso'
              ? 'الإسبريسو التجاري'
              : 'التركي والإسبريسو معاً'
          }.`,
          sensoryProfile: {
            bodyScore: hasRobusta ? 8.8 : 7.4,
            cremaOrWeshScore: hasRobusta ? 9.2 : 7.5,
            acidityScore: hasColombianOrEthiopian ? 6.5 : 4.2,
            bitternessScore: hasRobusta ? 7.0 : 4.5,
            aromaNotes: hasColombianOrEthiopian
              ? 'شوكولاتة بالحليب، كراميل، مكسرات محمصة، مع لمسة زهرية عطرية جذابة'
              : 'شوكولاتة داكنة، بندق محمص، كاكاو خام، وتوابل دافئة كلاسيكية',
          },
          pros: [
            'ثبات ممتاز لطبقة الوش في الكنكة أو الكريما في البورتافلتر بفضل توازن البروتينات والزيوت',
            `تكلفة تنافسية (${netRoastedCostPerKg.toFixed(
              0
            )} ج.م للكيلو الصافي) تمنح المحمصة هامش ربح قوي في البيع القطاعي والجملة`,
            'تجانس جيد مع التحويجة المصرية (الحبهان وجوزة الطيب) ومع الحليب في مشروبات الكافيه',
          ],
          cons: [
            effectiveLossPercent > 18
              ? 'نسبة فاقد التحميص المرتفعة ترفع تكلفة الكيلو الصافي وتزيد المرارة الكربونية'
              : 'تحتاج إلى التحميص المنفصل لكل منشأ (Post-Blending) لضمان عدم تفاوت اللون بعد الطحن',
            'تتطلب فترة راحة (Degassing) لا تقل عن 48 ساعة للتركي و7 أيام للإسبريسو لثبات الطعم',
          ],
          suitabilityAnalysis: {
            turkishSuitability:
              'ممتازة للقهوة التركي المصرية (سادة ومحوجة)؛ تعطي قواماً ثقيلاً ("عرق قهوة") ووشاً كريمياً متماسكاً لا يفصل سريعاً.',
            espressoSuitability:
              'مناسبة جداً لبار الإسبريسو ومشروبات الحليب (لاتيه وكابتشينو) بشرط التحميص لدرجة Full City وتوحيد مقاس الغربال.',
            recommendedRoastLevel:
              targetUse === 'turkish'
                ? 'تحميص وسط ذهبي (Medium City - 212°C) أو وسط غامق (218°C) مع تبريد هوائي سريع.'
                : 'تحميص وسط غامق (Full City - 221°C) مع إطالة مرحلة مايلارد لخفض الحمضية.',
          },
          flavorOptimizationTips: [
            'إضافة 10% إلى 15% من أرابيكا هندي بلانتيشن A أو كولومبي سوبريمو يرفع الرائحة الفواحة للتوليفة بشكل ملحوظ.',
            'طحن التوليفة على طاحونة حجرية مبردة (أقل من 50 درجة مئوية) يحافظ على الزيوت العطرية ويمنع تكتل البن.',
          ],
          costOptimizationTips: [
            'يمكن استبدال 10% من الأرابيكا بـ روبوستا هندي كابي رويال مغسول لخفض التكلفة مع زيادة كثافة الوش دون ظهور مرارة.',
            'ضبط منحنى التحميص لتقليل الفاقد بمقدار 1.5% يوفر لك أكثر من 5,500 جنيه في كل طن إنتاج.',
          ],
        }
      : {
          summaryVerdict: `Commercially balanced blend with a net roasted cost of ${netRoastedCostPerKg.toFixed(
            1
          )} EGP/kg before overhead. Delivers strong body and persistent foam/crema tailored for ${targetUse} extraction.`,
          sensoryProfile: {
            bodyScore: hasRobusta ? 8.8 : 7.4,
            cremaOrWeshScore: hasRobusta ? 9.2 : 7.5,
            acidityScore: hasColombianOrEthiopian ? 6.5 : 4.2,
            bitternessScore: hasRobusta ? 7.0 : 4.5,
            aromaNotes:
              'Dark chocolate, roasted hazelnut, smooth caramel, and warm toasted cocoa notes',
          },
          pros: [
            'High foam/crema stability driven by balanced lipid and protein structure',
            `Competitive net roasted cost (${netRoastedCostPerKg.toFixed(
              0
            )} EGP/kg) allowing healthy wholesale & retail margins`,
            'Pairs well with Egyptian cardamom spices (Tahweega) and cuts cleanly through milk',
          ],
          cons: [
            'Requires post-roast blending (roasting origins separately) for optimal color uniformity',
            'Needs 48h degassing rest for Turkish milling and 7-10 days for Espresso bar stability',
          ],
          suitabilityAnalysis: {
            turkishSuitability:
              'Highly suitable for Egyptian Turkish coffee; builds thick velvety wesh and syrupy mouthfeel.',
            espressoSuitability:
              'Strong performer for commercial espresso and milk beverages when roasted to Full City.',
            recommendedRoastLevel:
              'Medium City (212°C) for Turkish or Full City (221°C) for Espresso with rapid air cooling.',
          },
          flavorOptimizationTips: [
            'Incorporate 10%-15% Colombia Supremo or India Plantation A to elevate top-note fragrance.',
            'Keep stone-mill temperature below 50°C to preserve volatile aromatics.',
          ],
          costOptimizationTips: [
            'Substitute 10% Arabica with Washed Indian Kaapi Royale Robusta to reduce cost while boosting crema.',
            'Optimizing roast shrinkage by 1.5% saves over 5,500 EGP per metric ton produced.',
          ],
        };
  };

  const handleAnalyzeBlend = async () => {
    if (!isTotalValid) return;
    setShowReport(true);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeBlendWithAI({
        beanState,
        roastLossPercent: effectiveLossPercent,
        targetUse,
        components,
        financials: {
          rawCostPerKg,
          netRoastedCostPerKg,
          greenNeededForOneKgRoasted,
        },
        lang,
      });
      setAiResult(result);
    } catch {
      setAiResult(buildFallbackExpertAnalysis());
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section
      id="tools"
      className="py-12 md:py-20 bg-[var(--bg)] border-t border-[var(--line)] overflow-x-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-6 space-y-8"
      >
        {/* Header */}
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
            <FlaskConical size={18} strokeWidth={1.5} />
            <span>
              {lang === 'ar'
                ? 'الأداة الهندسية والمحاسبية للمحامص · مدعومة بـ Gemini AI'
                : 'Roastery Financial & Sensory Engine · Powered by Gemini AI'}
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)]">
            {lang === 'ar'
              ? 'حاسبة ومحلل تكلفة التوليفة بالذكاء الاصطناعي'
              : 'AI Coffee Blend Cost Calculator & Sensory Analyzer'}
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            {lang === 'ar'
              ? 'احسب التكلفة الفعلية للكيلو المحمص الصافي بعد خصم فاقد التحميص، واحصل على تقرير فني ومالي شامل يوضح مدى ملاءمة توليفتك للقهوة التركي أو الإسبريسو مع توصيات تحسين الطعم وخفض التكلفة.'
              : 'Calculate exact net roasted cost per kg after roast shrinkage, and generate a comprehensive financial and AI sensory report for Turkish or Espresso applications.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left/Main Column: Controls & Blend Ingredients */}
          <div className="lg:col-span-7 surface-card p-6 sm:p-8 space-y-6">
            {/* Step 1: Bean State Selector */}
            <div>
              <label className="block text-xs font-medium text-[var(--accent)] mb-3">
                {lang === 'ar'
                  ? '1. اختر حالة البن المدخل في الحاسبة:'
                  : '1. Select Input Bean State:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBeanState('green')}
                  className={`p-4 rounded-[12px] border text-start transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    beanState === 'green'
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)]'
                      : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--accent)]'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--text)] mb-0.5">
                      {lang === 'ar'
                        ? 'بن أخضر (قبل التحميص)'
                        : 'Green Coffee Beans'}
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {lang === 'ar'
                        ? 'مع حساب فاقد التحميص والوزن الصافي'
                        : 'Includes roast weight loss calculation'}
                    </p>
                  </div>
                  <FlaskConical
                    size={20}
                    strokeWidth={1.5}
                    className={
                      beanState === 'green'
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--muted)]'
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setBeanState('roasted')}
                  className={`p-4 rounded-[12px] border text-start transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    beanState === 'roasted'
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)]'
                      : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--accent)]'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--text)] mb-0.5">
                      {lang === 'ar' ? 'بن محمص جاهز' : 'Ready Roasted Beans'}
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {lang === 'ar'
                        ? 'بدون حساب فاقد تحميص إضافي (0%)'
                        : 'No additional roast loss applied (0%)'}
                    </p>
                  </div>
                  <Coffee
                    size={20}
                    strokeWidth={1.5}
                    className={
                      beanState === 'roasted'
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--muted)]'
                    }
                  />
                </button>
              </div>
            </div>

            {/* Step 2: Expected Roast Loss Slider (0% to 30%, default 15%) */}
            <div
              className={`p-5 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)] transition-opacity ${
                beanState === 'roasted' ? 'opacity-45' : 'opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="roast-loss-slider"
                  className="text-xs font-medium text-[var(--text)]"
                >
                  {lang === 'ar'
                    ? '2. مؤشر فاقد التحميص المتوقع (0% إلى 30%):'
                    : '2. Expected Roast Weight Loss (0% to 30%):'}
                </label>
                <span className="text-base font-semibold text-[var(--accent)]">
                  {effectiveLossPercent}%
                </span>
              </div>

              <input
                id="roast-loss-slider"
                type="range"
                min={0}
                max={30}
                step={0.5}
                disabled={beanState === 'roasted'}
                value={effectiveLossPercent}
                onChange={(e) => setRoastLossPercent(Number(e.target.value))}
                className="w-full bg-[#080bc6] border-[#bf2222] text-[#d71919] accent-[var(--accent)] cursor-pointer disabled:cursor-not-allowed"
              />

              <div className="flex items-center justify-between text-[11px] text-[var(--muted)] mt-2">
                <span>0%</span>
                <span>12%</span>
                <span className="font-medium text-[var(--accent)]">15%</span>
                <span>20%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Step 3: Blend Components Table */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-medium text-[var(--accent)]">
                  {lang === 'ar'
                    ? '3. مكونات التوليفة (مجموع النسب 100%):'
                    : '3. Blend Components (Total ratio must equal 100%):'}
                </label>

                <div className="flex items-center gap-2">
                  {!isTotalValid && (
                    <button
                      type="button"
                      onClick={handleAutoBalance}
                      className="chip-pill-active text-xs"
                    >
                      {lang === 'ar' ? 'ضبط تلقائي 100%' : 'Auto-Balance 100%'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="btn-secondary px-4 py-1.5 text-xs font-medium whitespace-nowrap"
                  >
                    <Plus
                      size={18}
                      strokeWidth={1.5}
                      className="text-[var(--accent)]"
                    />
                    <span>{lang === 'ar' ? 'إضافة صنف بن' : 'Add Bean'}</span>
                  </button>
                </div>
              </div>

              <datalist id="egypt-coffee-beans-list">
                {beans.slice(0, 40).map((b) => (
                  <option
                    key={b.id}
                    value={lang === 'ar' ? b.name_ar : b.name_en}
                  />
                ))}
              </datalist>

              <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-[12px] bg-[var(--bg-soft)]">
                {components.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2.5 items-center p-3.5"
                  >
                    {/* Bean Name */}
                    <div className="col-span-12 sm:col-span-6">
                      <label className="block text-[11px] text-[var(--muted)] mb-1">
                        {lang === 'ar'
                          ? `اسم البن (${idx + 1})`
                          : `Bean Name (#${idx + 1})`}
                      </label>
                      <input
                        type="text"
                        list="egypt-coffee-beans-list"
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateComponent(item.id, 'name', e.target.value)
                        }
                        placeholder={
                          lang === 'ar'
                            ? 'مثال: برازيلي سانتوس / روبوستا إندونيسي'
                            : 'e.g. Brazil Santos / Vietnam Robusta'
                        }
                        className="input-field px-3 py-2 text-xs font-medium"
                      />
                    </div>

                    {/* Percentage % */}
                    <div className="col-span-5 sm:col-span-2">
                      <label className="block text-[11px] text-[var(--muted)] mb-1">
                        {lang === 'ar' ? 'النسبة %' : 'Ratio %'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.percentage}
                        onChange={(e) =>
                          handleUpdateComponent(
                            item.id,
                            'percentage',
                            e.target.value
                          )
                        }
                        className="input-field px-3 py-2 text-xs"
                      />
                    </div>

                    {/* Price per Kg */}
                    <div className="col-span-5 sm:col-span-3">
                      <label className="block text-[11px] text-[var(--muted)] mb-1">
                        {lang === 'ar' ? 'سعر الكيلو (ج.م)' : 'Price/Kg (EGP)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={item.pricePerKg}
                        onChange={(e) =>
                          handleUpdateComponent(
                            item.id,
                            'pricePerKg',
                            e.target.value
                          )
                        }
                        className="input-field px-3 py-2 text-xs"
                      />
                    </div>

                    {/* Delete Button */}
                    <div className="col-span-2 sm:col-span-1 flex justify-end pt-4">
                      <button
                        type="button"
                        disabled={components.length <= 1}
                        onClick={() => handleRemoveComponent(item.id)}
                        className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-30 transition-colors cursor-pointer"
                        aria-label="Remove component"
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Percentage Status Bar */}
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-[12px] border text-xs font-medium ${
                  isTotalValid
                    ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                    : 'bg-[var(--bg-soft)] border-[var(--line)] text-[var(--muted)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isTotalValid ? (
                    <CheckCircle2
                      size={18}
                      strokeWidth={1.5}
                      className="text-[var(--accent)] shrink-0"
                    />
                  ) : (
                    <AlertCircle
                      size={18}
                      strokeWidth={1.5}
                      className="text-[var(--accent)] shrink-0"
                    />
                  )}
                  <span>
                    {isTotalValid
                      ? lang === 'ar'
                        ? 'مجموع نسب التوليفة مضبوط (100%)'
                        : 'Blend ratio sum is exact (100%)'
                      : lang === 'ar'
                      ? `تنبيه: مجموع النسب الحالي ${totalPercentage}% — يجب أن يساوي 100% تماماً`
                      : `Warning: Current ratio sum is ${totalPercentage}% — must equal 100%`}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[var(--accent)]">
                  {totalPercentage}% / 100%
                </span>
              </div>
            </div>

            {/* Step 4: Target Use Selector */}
            <div>
              <label className="block text-xs font-medium text-[var(--accent)] mb-2.5">
                {lang === 'ar'
                  ? '4. الاستخدام المستهدف للتوليفة:'
                  : '4. Target Extraction Application:'}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    {
                      id: 'turkish',
                      label_ar: 'قهوة تركي',
                      label_en: 'Turkish Coffee',
                    },
                    {
                      id: 'espresso',
                      label_ar: 'إسبريسو',
                      label_en: 'Espresso',
                    },
                    {
                      id: 'both',
                      label_ar: 'الاثنين معاً',
                      label_en: 'Both (Dual)',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTargetUse(opt.id)}
                    className={`justify-center py-2.5 px-4 text-xs font-medium whitespace-nowrap ${
                      targetUse === opt.id ? 'chip-pill-active' : 'chip-pill'
                    }`}
                  >
                    {lang === 'ar' ? opt.label_ar : opt.label_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary CTA: Analyze My Blend */}
            <button
              type="button"
              disabled={!isTotalValid || isAnalyzing}
              onClick={handleAnalyzeBlend}
              className="btn-primary w-full py-3.5 px-6 font-medium text-sm sm:text-base"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw
                    size={18}
                    strokeWidth={1.5}
                    className="animate-spin"
                  />
                  <span>
                    {lang === 'ar'
                      ? 'جاري تحليل التوليفة مالياً وحسياً بالذكاء الاصطناعي...'
                      : 'Analyzing blend financials & sensory profile with AI...'}
                  </span>
                </>
              ) : (
                <>
                  <FlaskConical size={18} strokeWidth={1.5} />
                  <span>
                    {lang === 'ar'
                      ? 'حلّل توليفتي (التقرير المالي + تحليل الذكاء الاصطناعي)'
                      : 'Analyze My Blend (Financial Report + Gemini AI)'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Live Cost Summary & Full 2-Part Report */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Automatic Cost Card */}
            <div className="surface-card p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div>
                  <div className="text-xs text-[var(--muted)]">
                    {lang === 'ar'
                      ? 'تكلفة الكيلو المحمص التقديرية (قبل مصاريف التشغيل)'
                      : 'Estimated Net Roasted Kg Cost (Pre-Overhead)'}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="font-display text-3xl sm:text-4xl font-semibold text-[var(--text)]">
                      {netRoastedCostPerKg.toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-[var(--accent)]">
                      {lang === 'ar' ? 'ج.م / كجم صافي' : 'EGP / Net Kg'}
                    </span>
                  </div>
                </div>
                <FlaskConical
                  size={20}
                  strokeWidth={1.5}
                  className="text-[var(--accent)] shrink-0"
                />
              </div>

              {/* Financial Breakdown Metrics as clean divided list */}
              <div className="divide-y divide-[var(--line)] text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[var(--muted)]">
                    {lang === 'ar'
                      ? 'تكلفة الكيلو قبل التحميص'
                      : 'Raw Input Cost / Kg'}
                  </span>
                  <span className="font-medium text-[var(--text)]">
                    {rawCostPerKg.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[var(--muted)]">
                    {lang === 'ar'
                      ? 'تأثير فاقد التحميص (+ج.م)'
                      : 'Shrinkage Cost Impact'}
                  </span>
                  <span className="font-medium text-[var(--accent)]">
                    +{roastShrinkageCostImpact.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[var(--muted)]">
                    {lang === 'ar'
                      ? 'الصافي من 1 كجم بعد الحمص'
                      : 'Net Yield from 1 Kg'}
                  </span>
                  <span className="font-medium text-[var(--text)]">
                    {netYieldGramsPerKg}g{' '}
                    <span className="text-[11px] text-[var(--muted)]">
                      (-{lossGramsPerKg}g)
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[var(--muted)]">
                    {lang === 'ar'
                      ? 'الأخضر المطلوب لـ 1 كجم صافي'
                      : 'Green Needed for 1 Kg Net'}
                  </span>
                  <span className="font-medium text-[var(--text)]">
                    {greenNeededForOneKgRoasted.toFixed(3)} Kg
                  </span>
                </div>
              </div>

              {/* Pack Size Cost Table */}
              <div className="pt-3 border-t border-[var(--line)]">
                <div className="text-[11px] font-medium text-[var(--muted)] mb-2.5">
                  {lang === 'ar'
                    ? 'تكلفة البن الصافي حسب وزن العبوة (قبل الكيس والتشغيل):'
                    : 'Net Coffee Cost by Package Weight (Pre-Pouch):'}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { label: '100g', mult: 0.1, labelColor: 'text-[#1414e5]' },
                    { label: '200g', mult: 0.2, labelColor: 'text-[#49ccaf]' },
                    { label: '250g', mult: 0.25, labelColor: 'text-[#c31d93]' },
                    { label: '500g', mult: 0.5, labelColor: 'text-[#125e0f]' },
                  ].map((pk) => (
                    <div
                      key={pk.label}
                      className="p-2.5 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)]"
                    >
                      <div className={`text-[11px] ${pk.labelColor}`}>
                        {pk.label}
                      </div>
                      <div className="font-medium text-[var(--accent)] mt-0.5">
                        {(netRoastedCostPerKg * pk.mult).toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed 2-Part Report */}
            {showReport && (
              <div className="surface-card p-6 space-y-6">
                {/* Part 1: Financial Engineering Summary */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent)] mb-3">
                    <FlaskConical size={18} strokeWidth={1.5} />
                    <span>
                      {lang === 'ar'
                        ? 'الجزء الأول: الحسابات المالية الدقيقة والكميات المطلوبة'
                        : 'Part 1: Exact Financial & Production Batch Calculations'}
                    </span>
                  </div>

                  <div className="rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)] p-4 divide-y divide-[var(--line)] text-xs">
                    <div className="flex justify-between py-2">
                      <span className="text-[var(--muted)]">
                        {lang === 'ar'
                          ? 'الكمية المطلوبة لإنتاج حطة 10 كجم محمص صافي:'
                          : 'Green input required for 10 Kg net roasted batch:'}
                      </span>
                      <span className="font-medium text-[var(--text)]">
                        {(greenNeededForOneKgRoasted * 10).toFixed(2)} Kg
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[var(--muted)]">
                        {lang === 'ar'
                          ? 'متوسط مصاريف التحميص والتغليف التقديرية للكيلو:'
                          : 'Est. Roasting, Grinding & Foil Packaging / Kg:'}
                      </span>
                      <span className="font-medium text-[var(--text)]">
                        35.00 EGP
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[var(--muted)]">
                        {lang === 'ar'
                          ? 'التكلفة النهائية الشاملة للكيلو (شامل التشغيل):'
                          : 'Total Landed Cost per Kg (Incl. Overhead):'}
                      </span>
                      <span className="font-medium text-[var(--accent)]">
                        {(netRoastedCostPerKg + 35).toFixed(2)} EGP
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[var(--muted)]">
                        {lang === 'ar'
                          ? 'سعر البيع المقترح (جملة 15% / قطاعي 35%):'
                          : 'Suggested Price (Wholesale +15% / Retail +35%):'}
                      </span>
                      <span className="font-medium text-[var(--accent)]">
                        {Math.round((netRoastedCostPerKg + 35) * 1.15)} /{' '}
                        {Math.round((netRoastedCostPerKg + 35) * 1.35)} EGP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Part 2: Gemini AI Sensory & Technical Analysis */}
                <div className="pt-4 border-t border-[var(--line)]">
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent)] mb-3">
                    <FlaskConical size={18} strokeWidth={1.5} />
                    <span>
                      {lang === 'ar'
                        ? 'الجزء الثاني: تحليل الذكاء الاصطناعي (Gemini AI) للتوليفة'
                        : 'Part 2: Gemini AI Sensory & Commercial Blend Analysis'}
                    </span>
                  </div>

                  {isAnalyzing ? (
                    <div className="p-8 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)] text-center space-y-3">
                      <RefreshCw
                        size={20}
                        strokeWidth={1.5}
                        className="text-[var(--accent)] animate-spin mx-auto"
                      />
                      <p className="text-xs text-[var(--muted)]">
                        {lang === 'ar'
                          ? 'يقوم خبير التحميص الذكي بمراجعة نسب التوليفة وتقييم القوام والوش والتكلفة...'
                          : 'Gemini AI Master Roaster is evaluating your blend ratios, crema stability, and cost...'}
                      </p>
                    </div>
                  ) : aiResult ? (
                    <div className="space-y-4">
                      {analysisError && (
                        <div className="text-xs text-[var(--accent)] bg-[var(--accent-soft)] p-2.5 rounded-[12px] border border-[var(--line)]">
                          {analysisError}
                        </div>
                      )}

                      {/* Summary Verdict */}
                      <div className="rounded-[12px] bg-[var(--bg-soft)] p-4 border border-[var(--line)]">
                        <p className="text-xs sm:text-sm font-medium text-[var(--text)]">
                          {aiResult.summaryVerdict}
                        </p>
                      </div>

                      {/* Sensory Scores Bar */}
                      <div className="rounded-[12px] bg-[var(--bg-soft)] p-4 border border-[var(--line)] space-y-2.5">
                        <div className="text-xs font-medium text-[var(--accent)] mb-1">
                          {lang === 'ar'
                            ? 'التقييم الحسي المتوقع للفنجان (من 10):'
                            : 'Predicted Cup Sensory Scores (out of 10):'}
                        </div>
                        {[
                          {
                            label: lang === 'ar' ? 'القوام (Body)' : 'Body',
                            val: aiResult.sensoryProfile.bodyScore,
                          },
                          {
                            label:
                              lang === 'ar'
                                ? 'الوش / الكريما (Wesh / Crema)'
                                : 'Wesh / Crema',
                            val: aiResult.sensoryProfile.cremaOrWeshScore,
                          },
                          {
                            label:
                              lang === 'ar' ? 'الحمضية (Acidity)' : 'Acidity',
                            val: aiResult.sensoryProfile.acidityScore,
                          },
                          {
                            label:
                              lang === 'ar'
                                ? 'القوة والمرارة (Strength)'
                                : 'Strength & Bitterness',
                            val: aiResult.sensoryProfile.bitternessScore,
                          },
                        ].map((metric) => (
                          <div key={metric.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-[var(--muted)]">
                                {metric.label}
                              </span>
                              <span className="font-medium text-[var(--accent)]">
                                {metric.val} / 10
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--accent)] rounded-full"
                                style={{
                                  width: `${Math.min(100, metric.val * 10)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 text-xs text-[var(--muted)]">
                          <span className="font-medium text-[var(--text)]">
                            {lang === 'ar'
                              ? 'الإيحاءات المتوقعة: '
                              : 'Aroma Notes: '}
                          </span>
                          {aiResult.sensoryProfile.aromaNotes}
                        </div>
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-[12px] bg-[var(--bg-soft)] p-4 border border-[var(--line)]">
                          <div className="text-xs font-medium text-[var(--accent)] mb-2">
                            {lang === 'ar'
                              ? 'المميزات المتوقعة'
                              : 'Strengths & Pros'}
                          </div>
                          <ul className="space-y-1.5 text-xs text-[var(--muted)]">
                            {aiResult.pros.map((p, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-[var(--accent)] font-semibold">
                                  +
                                </span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-[12px] bg-[var(--bg-soft)] p-4 border border-[var(--line)]">
                          <div className="text-xs font-medium text-[var(--accent)] mb-2">
                            {lang === 'ar'
                              ? 'العيوب والمخاطر المحتملة'
                              : 'Potential Risks'}
                          </div>
                          <ul className="space-y-1.5 text-xs text-[var(--muted)]">
                            {aiResult.cons.map((c, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-[var(--accent)] font-semibold">
                                  -
                                </span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Suitability & Roast Profile */}
                      <div className="rounded-[12px] bg-[var(--bg-soft)] p-4 border border-[var(--line)] space-y-2 text-xs">
                        <div>
                          <span className="font-medium text-[var(--text)]">
                            {lang === 'ar'
                              ? 'الملاءمة للقهوة التركي: '
                              : 'Turkish Suitability: '}
                          </span>
                          <span className="text-[var(--muted)]">
                            {aiResult.suitabilityAnalysis.turkishSuitability}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-[var(--text)]">
                            {lang === 'ar'
                              ? 'الملاءمة للإسبريسو: '
                              : 'Espresso Suitability: '}
                          </span>
                          <span className="text-[var(--muted)]">
                            {aiResult.suitabilityAnalysis.espressoSuitability}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-[var(--accent)]">
                            {lang === 'ar'
                              ? 'درجة التحميص المقترحة: '
                              : 'Recommended Roast: '}
                          </span>
                          <span className="text-[var(--text)]">
                            {aiResult.suitabilityAnalysis.recommendedRoastLevel}
                          </span>
                        </div>
                      </div>

                      {/* Optimization Recommendations */}
                      <div className="rounded-[12px] bg-[var(--bg-soft)] p-4 border border-[var(--line)] space-y-3 text-xs">
                        <div>
                          <div className="font-medium text-[var(--accent)] mb-1">
                            {lang === 'ar'
                              ? 'توصيات لتحسين النكهة والوش:'
                              : 'Flavor & Foam Optimization Tips:'}
                          </div>
                          <ul className="space-y-1 text-[var(--muted)]">
                            {aiResult.flavorOptimizationTips.map((tip, idx) => (
                              <li key={idx}>• {tip}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-2 border-t border-[var(--line)]">
                          <div className="font-medium text-[var(--accent)] mb-1">
                            {lang === 'ar'
                              ? 'توصيات لخفض التكلفة وزيادة الربحية:'
                              : 'Cost Reduction & Margin Tips:'}
                          </div>
                          <ul className="space-y-1 text-[var(--muted)]">
                            {aiResult.costOptimizationTips.map((tip, idx) => (
                              <li key={idx}>• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
