import React, { useState } from 'react';
import {
  X,
  UserCheck,
  UserPlus,
  LogIn,
  ShieldCheck,
  Lock,
  Phone,
  User,
  LogOut,
} from 'lucide-react';
import { CustomerAccount, Language } from '../types/coffee';
import {
  loginCustomerAccount,
  registerCustomerAccount,
  logoutCustomerAccount,
} from '../services/base44Api';

interface CustomerAuthModalProps {
  isOpen: boolean;
  lang: Language;
  currentCustomer: CustomerAccount | null;
  onClose: () => void;
  onAuthChange: (customer: CustomerAccount | null) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  lang,
  currentCustomer,
  onClose,
  onAuthChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await registerCustomerAccount({
          name: name.trim(),
          contact: contact.trim(),
          password: password.trim(),
        });
        onAuthChange(res.customer);
        onClose();
      } else {
        const res = await loginCustomerAccount({
          contact: contact.trim(),
          password: password.trim(),
        });
        onAuthChange(res.customer);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (lang === 'ar'
            ? 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.'
            : 'Authentication failed. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutCustomerAccount();
    onAuthChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white bg-coffee-sketch border border-[var(--line)] rounded-[14px] shadow-[0_24px_60px_rgba(0,0,0,0.2)] max-w-md w-full p-6 sm:p-7 space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <ShieldCheck size={17} strokeWidth={1.6} className="text-emerald-600" />
              <span>
                {lang === 'ar'
                  ? 'حساب العميل الشخصي (اختياري لحفظ المشتريات)'
                  : 'Personal Customer Account (Optional to Save Purchases)'}
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-semibold text-[var(--text)]">
              {currentCustomer
                ? lang === 'ar'
                  ? 'بيانات حسابك الشخصي'
                  : 'Your Account Profile'
                : mode === 'register'
                ? lang === 'ar'
                  ? 'إنشاء حساب لحفظ مشترياتك'
                  : 'Create Account to Save Purchases'
                : lang === 'ar'
                ? 'تسجيل الدخول لحسابك'
                : 'Sign In to Your Account'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X size={17} strokeWidth={2.5} />
            <span>{lang === 'ar' ? 'إغلاق' : 'Close'}</span>
          </button>
        </div>

        {currentCustomer ? (
          <div className="space-y-4">
            <div className="p-4 rounded-[12px] bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <UserCheck size={18} strokeWidth={1.6} className="text-emerald-600" />
                <span>{currentCustomer.name}</span>
              </div>
              <div className="text-[var(--muted)]">
                {lang === 'ar' ? 'رقم التواصل / البريد المسجل:' : 'Registered Contact:'}{' '}
                <span dir="ltr" className="font-semibold text-[var(--text)]">
                  {currentCustomer.contact}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 pt-1">
                {lang === 'ar'
                  ? 'جميع مشترياتك وروابط تحميل الكتب الخاصة بك محفوظة في حسابك ومعزولة بالكامل لخصوصيتك.'
                  : 'All your purchases and book download links are saved to your account and strictly isolated for your privacy.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary text-xs px-4 py-2.5 text-red-700 border-red-200 hover:bg-red-50"
              >
                <LogOut size={16} strokeWidth={1.5} className="text-red-600" />
                <span>
                  {lang === 'ar' ? 'تسجيل الخروج من الحساب' : 'Sign Out'}
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary text-xs px-5 py-2.5"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-[10px] bg-[var(--bg-soft)] border border-[var(--line)]">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <UserPlus size={15} strokeWidth={1.6} />
                <span>{lang === 'ar' ? 'حساب جديد (اختياري)' : 'New Account'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <LogIn size={15} strokeWidth={1.6} />
                <span>{lang === 'ar' ? 'تسجيل دخول' : 'Sign In'}</span>
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {lang === 'ar'
                ? 'تسجيل الدخول اختياري تماماً وليس إجبارياً للشراء. يتيح لك حفظ جميع طلباتك وروابط تحميل الكتب في حسابك الشخصي للرجوع إليها في أي وقت.'
                : 'Signing in is completely optional. It allows you to save all your orders and digital book download links to your personal account anytime.'}
            </p>

            {errorMsg && (
              <div className="p-3 rounded-[10px] bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {mode === 'register' && (
                <div>
                  <label className="block font-medium text-[var(--text)] mb-1.5">
                    {lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <div className="relative flex items-center">
                    <User
                      size={16}
                      strokeWidth={1.5}
                      className="text-[var(--accent)] absolute start-3 pointer-events-none"
                    />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        lang === 'ar' ? 'اكتب اسمك الكامل' : 'Enter your full name'
                      }
                      className="input-field ps-9 pe-3.5 py-2.5 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-[var(--text)] mb-1.5">
                  {lang === 'ar'
                    ? 'رقم الهاتف (واتساب) أو البريد الإلكتروني *'
                    : 'Phone Number (WhatsApp) or Email *'}
                </label>
                <div className="relative flex items-center">
                  <Phone
                    size={16}
                    strokeWidth={1.5}
                    className="text-[var(--accent)] absolute start-3 pointer-events-none"
                  />
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="input-field ps-9 pe-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text)] mb-1.5">
                  {lang === 'ar'
                    ? 'كلمة المرور أو رمز سري (4 أرقام/أحرف على الأقل) *'
                    : 'Password or PIN (min 4 characters) *'}
                </label>
                <div className="relative flex items-center">
                  <Lock
                    size={16}
                    strokeWidth={1.5}
                    className="text-[var(--accent)] absolute start-3 pointer-events-none"
                  />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="input-field ps-9 pe-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1 py-2.5 text-xs font-semibold"
                >
                  {mode === 'register' ? (
                    <UserPlus size={16} strokeWidth={1.6} />
                  ) : (
                    <LogIn size={16} strokeWidth={1.6} />
                  )}
                  <span>
                    {isLoading
                      ? lang === 'ar'
                        ? 'جاري الحفظ...'
                        : 'Processing...'
                      : mode === 'register'
                      ? lang === 'ar'
                        ? 'إنشاء الحساب وحفظ المشتريات'
                        : 'Create Account & Save Purchases'
                      : lang === 'ar'
                      ? 'تسجيل الدخول واسترجاع طلباتي'
                      : 'Sign In & Load My Orders'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary px-4 py-2.5 text-xs"
                >
                  {lang === 'ar' ? 'تخطي (شراء كزائر)' : 'Skip (Guest)'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
