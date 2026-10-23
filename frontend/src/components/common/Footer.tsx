import React from 'react';
import { ShieldCheck, BookOpen, Award, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 text-slate-500 text-xs mt-16 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Project Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <span className="text-base font-extrabold text-slate-800">CareerGuide</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              Hệ thống hỗ trợ ra quyết định chọn ngành đại học giải thích được (XAI) và lộ trình tự học cá nhân hóa cho học sinh THPT Việt Nam.
            </p>
            <p className="text-[11px] text-slate-400">
              Đề tài Capstone - Đại học Duy Tân (DTU)
            </p>
          </div>

          {/* Col 2: Regulatory Sources */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Chuẩn Dữ liệu & Quy phạm</h4>
            <ul className="space-y-1.5">
              <li className="flex items-center space-x-1.5 text-slate-600">
                <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                <span>Thông tư 09/2022/TT-BGDĐT</span>
              </li>
              <li className="flex items-center space-x-1.5 text-slate-600">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Mô hình Lý thuyết Holland (RIASEC)</span>
              </li>
              <li className="flex items-center space-x-1.5 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cây nghề nghiệp Phoenix Ho</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Privacy & Security */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Bảo mật & Quyền riêng tư</h4>
            <p className="text-slate-600 leading-relaxed">
              Bảo mật mật khẩu theo chuẩn OWASP ASVS Level 2 (Argon2id). Lưu vết đồng ý xử lý dữ liệu cá nhân theo Luật số 91/2025/QH15.
            </p>
            <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Khử khuẩn PII Sanitization 100%</span>
            </div>
          </div>

          {/* Col 4: Guardrails */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Cam kết Học thuật</h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>Pure Guidance Scope:</strong> Tuyệt đối không đưa yếu tố học phí hoặc khoảng cách địa lý vào công thức tính điểm để bảo đảm công bằng xã hội.
            </p>
            <a
              href="https://moet.gov.vn"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-brand-600 font-semibold hover:underline"
            >
              <span>Cổng Bộ Giáo dục & Đào tạo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px]">
          <p>© 2026 AI CareerGuide Project. Phát triển bởi Nhóm Kỹ sư Phần mềm Capstone DTU.</p>
          <p className="mt-2 sm:mt-0">Tuân thủ tiêu chuẩn Web Accessibility WCAG 2.1 AA</p>
        </div>
      </div>
    </footer>
  );
};
