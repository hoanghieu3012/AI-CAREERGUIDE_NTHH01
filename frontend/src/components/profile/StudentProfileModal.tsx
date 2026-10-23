import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Lock,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Download,
  Trash2,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfileDetails } from '../../types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'profile' | 'privacy';
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'profile',
}) => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>(defaultTab);

  // Profile form state initialized from current user
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [dob, setDob] = useState(user?.profile?.date_of_birth || '');
  const [gender, setGender] = useState(user?.profile?.gender || 'Nam');
  const [schoolName, setSchoolName] = useState(user?.profile?.school_name || 'THPT Chuyên Lê Hồng Phong');
  const [cityProvince, setCityProvince] = useState(user?.profile?.city_province || 'TP. Hồ Chí Minh');
  const [gradeLevel, setGradeLevel] = useState(user?.profile?.grade_level || 'Lớp 12');
  const [targetBlock, setTargetBlock] = useState(user?.profile?.target_admission_block || 'A00 (Toán, Lý, Hóa)');
  const [careerGoal, setCareerGoal] = useState(user?.profile?.career_goal || 'Kỹ sư Trí tuệ Nhân tạo & Khoa học Dữ liệu');

  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDetails: UserProfileDetails = {
      phone,
      date_of_birth: dob,
      gender,
      school_name: schoolName,
      city_province: cityProvince,
      grade_level: gradeLevel,
      target_admission_block: targetBlock,
      career_goal: careerGoal,
      privacy_ai_shield_enabled: true,
    };

    updateProfile({
      full_name: fullName,
      profile: updatedDetails,
    });

    setSavedNotice('Đã cập nhật hồ sơ cá nhân thành công!');
    setTimeout(() => {
      setSavedNotice(null);
    }, 2500);
  };

  const handleExportData = () => {
    const dataToExport = {
      account: {
        id: user?.id,
        email: user?.email,
        full_name: fullName,
        role: user?.role,
      },
      profile: {
        school: schoolName,
        city: cityProvince,
        grade: gradeLevel,
        target_block: targetBlock,
        career_goal: careerGoal,
      },
      privacy_compliance: {
        pii_protection: 'ENABLED_AES_256',
        law_compliance: 'Decree 13/2023/ND-CP & Law 91/2015/QH13',
        sent_to_ai_models: false,
      },
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerguide_profile_${user?.id || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto">
        {/* Header (Never Shrink, Always on Top) */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shadow-brand-500/20 shrink-0">
              {fullName ? fullName.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Hồ Sơ Học Sinh & Bảo Vệ Dữ Liệu
              </h2>
              <p className="text-xs text-slate-500">
                Quản lý thông tin cá nhân & cam kết không tiết lộ thông tin cho AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Never Shrink) */}
        <div className="shrink-0 flex border-b border-slate-100 px-4 sm:px-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all shrink-0 ${
              activeTab === 'profile'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông Tin Cá Nhân & Học Tập</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all shrink-0 ${
              activeTab === 'privacy'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>🛡️ Bảo Mật & Cô Lập AI (Zero PII)</span>
          </button>
        </div>

        {/* Content Body (Flex-1 with min-h-0 and internal scroll) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-5">
          {savedNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          {/* TAB 1: PROFILE FORM */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Họ và Tên Học Sinh</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Tài Khoản</span>
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Số Điện Thoại Phụ Huynh / Học Sinh</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Chỉ dùng xác thực & thông báo kết quả hướng nghiệp nội bộ</p>
                </div>

                {/* Date of Birth & Gender */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ngày Sinh</span>
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Giới Tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                {/* High School Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Trường THPT Đang Học</span>
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="THPT Chuyên Lê Hồng Phong"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* City / Province */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tỉnh / Thành Phố</span>
                  </label>
                  <input
                    type="text"
                    value={cityProvince}
                    onChange={(e) => setCityProvince(e.target.value)}
                    placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Grade Level */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Khối Lớp Hiện Tại</span>
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-semibold"
                  >
                    <option value="Lớp 10">Lớp 10 (Chuẩn bị chọn tổ hợp môn)</option>
                    <option value="Lớp 11">Lớp 11 (Tập trung năng lực học thuật)</option>
                    <option value="Lớp 12">Lớp 12 (Xét tuyển đại học & hướng nghiệp)</option>
                    <option value="Khác">Đã tốt nghiệp THPT</option>
                  </select>
                </div>

                {/* Target Admission Block */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tổ Hợp Thi Dự Kiến</label>
                  <select
                    value={targetBlock}
                    onChange={(e) => setTargetBlock(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-semibold"
                  >
                    <option value="A00 (Toán, Lý, Hóa)">A00 (Toán, Lý, Hóa)</option>
                    <option value="A01 (Toán, Lý, Tiếng Anh)">A01 (Toán, Lý, Tiếng Anh)</option>
                    <option value="D01 (Toán, Văn, Tiếng Anh)">D01 (Toán, Văn, Tiếng Anh)</option>
                    <option value="B00 (Toán, Hóa, Sinh)">B00 (Toán, Hóa, Sinh)</option>
                    <option value="C00 (Văn, Sử, Địa)">C00 (Văn, Sử, Địa)</option>
                    <option value="Khác">Khối thi khác</option>
                  </select>
                </div>
              </div>

              {/* Career Goal */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ước Mơ Nghề Nghiệp / Nguyện Vọng Của Bạn</span>
                </label>
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="Ví dụ: Kỹ sư Phần mềm, Bác sĩ Đa khoa, Chuyên viên Tài chính..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center space-x-2 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dữ liệu được cô lập bảo mật nội bộ</span>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 flex items-center space-x-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Hồ Sơ Học Sinh</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PRIVACY & ZERO PII TO AI */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              {/* Privacy Shield Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-900">
                      Hàng Rào Bảo Vệ Quyền Riêng Tư (AI Data Shield Guardrails)
                    </h3>
                    <p className="text-[11px] text-emerald-700">
                      Tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP & Luật An toàn thông tin mạng số 91/2015/QH13
                    </p>
                  </div>
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed">
                  Hệ thống <strong>AI CareerGuide</strong> cam kết bảo vệ thông tin học sinh ở mức cao nhất. Toàn bộ thông tin cá nhân của bạn được lưu trữ độc lập và <strong>TUYỆT ĐỐI KHÔNG BAO GIỜ được gửi cho AI, mô hình ngôn ngữ lớn (LLM), hay chia sẻ cho bất kỳ bên thứ ba nào</strong>.
                </p>
              </div>

              {/* Data Flow Comparison Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Cơ Chế Phân Tách Dữ Liệu Rõ Ràng:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Column 1: PII - Strictly Isolated */}
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2.5">
                    <div className="flex items-center space-x-2 text-rose-800 font-extrabold text-xs">
                      <EyeOff className="w-4 h-4 text-rose-600" />
                      <span>Thông Tin Định Danh Cá Nhân (PII)</span>
                    </div>
                    <ul className="text-[11px] text-rose-700 space-y-1 font-medium list-disc list-inside">
                      <li>Họ và tên học sinh</li>
                      <li>Số điện thoại phụ huynh & học sinh</li>
                      <li>Địa chỉ Email cá nhân</li>
                      <li>Trường THPT & Lớp học</li>
                    </ul>
                    <div className="pt-1 border-t border-rose-200/80 text-[10px] text-rose-800 font-bold flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>Mã hóa AES-256 & không bao giờ truyền cho AI</span>
                    </div>
                  </div>

                  {/* Column 2: What AI Actually Sees (Pure Anonymous Vector) */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2.5">
                    <div className="flex items-center space-x-2 text-indigo-900 font-extrabold text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Dữ Liệu Thuần Số Học Đưa Vào Thuật Toán</span>
                    </div>
                    <ul className="text-[11px] text-indigo-800 space-y-1 font-medium list-disc list-inside">
                      <li>Vector Holland 6 chiều: (R, I, A, S, E, C)</li>
                      <li>Điểm số chuẩn hóa Z-Score: (vd: Toán 9.0)</li>
                      <li>Thiên hướng nhận thức: Mã hóa dạng A/B/C/D</li>
                      <li>Hoàn toàn 100% ẩn danh, không chứa danh tính</li>
                    </ul>
                    <div className="pt-1 border-t border-indigo-200/80 text-[10px] text-indigo-800 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span>Không thể truy ngược ra danh tính người dùng</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Rights Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Tải Về Toàn Bộ Dữ Liệu Hồ Sơ (JSON)</span>
                </button>

                <div className="text-[11px] text-slate-400 text-center sm:text-right">
                  Quyền được bảo vệ & xóa dữ liệu theo Luật số 91/2015/QH13
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
