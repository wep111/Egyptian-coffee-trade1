import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { CatalogItem, Language } from '../types/coffee';

interface CoursesSectionProps {
  courses: CatalogItem[];
  lang: Language;
  onBuyCourse: (course: CatalogItem) => void;
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({
  courses,
  lang,
  onBuyCourse,
}) => {
  const ArrowIcon = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  return (
    <section className="py-12 md:py-20 bg-[var(--bg)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-6 space-y-8"
      >
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
            <BookOpen size={18} strokeWidth={1.5} />
            <span>
              {lang === 'ar'
                ? 'أكاديمية تجـــارة القهـــوة المصـــرية · التدريب المهني'
                : 'Egyptian Coffee Trade Academy · Professional Training'}
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)]">
            {lang === 'ar'
              ? 'الدورات التدريبية والدبلومات المهنية للمحامص ورواد الأعمال'
              : 'Professional Roasting, Blending & Brand Launching Courses'}
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)]">
            {lang === 'ar'
              ? 'برامج تدريبية عملية مصورة من داخل المحامص وخطوط الإنتاج في مصر لتأهيلك لاحتراف التحميص وهندسة التوليفات وتأسيس علامتك التجارية.'
              : 'Hands-on training programs filmed inside Egyptian production roasteries to master roasting, blending, and private-label brand scaling.'}
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-3">
            <BookOpen
              size={20}
              strokeWidth={1.5}
              className="text-[var(--accent)] mx-auto"
            />
            <div className="font-display text-lg font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'سيتم فتح باب التسجيل في الدفعة القادمة من الدورات التدريبية قريباً'
                : 'Enrollment for the next cohort of training courses opens soon'}
            </div>
            <p className="text-xs text-[var(--muted)]">
              {lang === 'ar'
                ? 'تواصل معنا عبر واتساب لحجز مقعدك المسبق في دبلومة التحميص وهندسة التوليفات.'
                : 'Contact us via WhatsApp to pre-book your seat in the Roasting & Blending Diploma.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="surface-card p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  {course.cover_image && (
                    <img
                      src={course.cover_image}
                      alt={course.title_ar}
                      referrerPolicy="no-referrer"
                      className="w-full h-44 object-cover rounded-[12px] border border-[var(--line)]"
                    />
                  )}
                  <h3 className="font-display text-xl font-semibold text-[var(--text)]">
                    {lang === 'ar' ? course.title_ar : course.title_en}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--muted)]">
                    {lang === 'ar'
                      ? course.description_ar
                      : course.description_en}
                  </p>

                  {course.course_schedule && (
                    <div className="flex items-center gap-2.5 text-xs text-[var(--text)] bg-[var(--bg-soft)] p-3 rounded-[12px] border border-[var(--line)]">
                      <Calendar
                        size={18}
                        strokeWidth={1.5}
                        className="text-[var(--accent)] shrink-0"
                      />
                      <span>{course.course_schedule}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[var(--line)] space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-[var(--muted)]">
                      {lang === 'ar'
                        ? 'رسوم الاشتراك الكامل'
                        : 'Full Enrollment Fee'}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-2xl font-semibold text-[var(--text)]">
                        {(course.price ?? course.price_egp).toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-[var(--accent)]">
                        {lang === 'ar' ? 'ج.م' : course.currency || 'EGP'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onBuyCourse(course)}
                    className="uiverse-btn w-full py-3 px-6 text-xs sm:text-sm"
                  >
                    <span>
                      {lang === 'ar'
                        ? 'الاشتراك وحجز الدورة الآن'
                        : 'Enroll in Course Now'}
                    </span>
                    <ArrowIcon size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
};
