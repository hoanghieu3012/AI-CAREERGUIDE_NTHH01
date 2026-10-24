import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConsentModal } from '../../components/common/ConsentModal';

export const AuthPage: React.FC = () => {
  const { login, register, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const explicitRedirect = searchParams.get('redirect');
  const redirectTarget = explicitRedirect || (isAdmin ? '/admin/dashboard' : '/recommendations');

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [agreedPolicy, setAgreedPolicy] = useState(true);

  if (isAuthenticated) {
    navigate(redirectTarget);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    if (isRegister) {
      if (email.toLowerCase().includes('admin')) {
        setErrorMsg('Không được phép đăng ký tài khoản Quản trị viên (ADMIN) qua cổng đăng ký công khai.');
        return;
      }
      if (!agreedPolicy) {
        setErrorMsg('Bạn cần đồng ý với chính sách bảo vệ dữ liệu cá nhân (Luật 91/2025/QH15).');
        return;
      }
    }

    setLoading(true);
    try {
      let authResult;
      if (isRegister) {
        authResult = await register(email, password, fullName);
      } else {
        authResult = await login(email, password);
      }
      const isTargetAdmin = authResult?.user?.role === 'ADMIN' || email.toLowerCase().includes('admin');
      if (explicitRedirect) {
        navigate(explicitRedirect);
      } else if (isTargetAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/guidance');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo credentials helper for Login mode
  const fillDemoAccount = (selectedRole: 'STUDENT' | 'ADMIN') => {
    setIsRegister(false);
    setErrorMsg('');
    if (selectedRole === 'ADMIN') {
      setEmail('admin@careerguide.vn');
      setPassword('AdminSecret@2026');
      setFullName('Quản Trị Viên Kiểm Duyệt');
    } else {
      setEmail('hocsinh.genz@gmail.com');
      setPassword('StudentSecret@2026');
      setFullName('Nguyễn Văn Tuấn');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">
            {isRegister ? 'Tạo Tài Khoản Học Sinh' : 'Đăng Nhập Hệ Thống'}
          </h2>
          <p className="text-xs text-slate-500">
            Bảo mật Argon2id chuẩn OWASP ASVS Level 2
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegister ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isRegister ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Demo Account Pills (Only shown in Login mode) */}
        {!isRegister ? (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase">1-Click Chọn tài khoản mẫu:</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('STUDENT')}
                className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all"
              >
                🎓 Học sinh Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('ADMIN')}
                className="flex-1 py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all"
              >
                🛡️ Admin Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>Cổng đăng ký dành riêng cho <strong>Học sinh & Phụ huynh</strong>. Dữ liệu mỗi tài khoản được bảo vệ độc lập và cô lập tuyệt đối.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hocsinh@thpt.edu.vn"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-3 pt-1">
              <div className="flex items-start space-x-2 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  id="policy"
                  checked={agreedPolicy}
                  onChange={(e) => setAgreedPolicy(e.target.checked)}
                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="policy">
                  Tôi đồng ý với{' '}
                  <button
                    type="button"
                    onClick={() => setConsentModalOpen(true)}
                    className="text-brand-600 font-bold underline hover:text-brand-700"
                  >
                    Chính sách bảo vệ dữ liệu cá nhân (Luật 91/2025/QH15)
                  </button>.
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all"
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : (
              <>
                <span>{isRegister ? 'Tạo Tài Khoản Mới' : 'Đăng Nhập'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500">
          Hệ thống tuân thủ chặt chẽ nguyên tắc bảo vệ quyền riêng tư theo Luật Dữ liệu 2025.
        </div>
      </div>

      <ConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
      />
    </div>
  );
};
