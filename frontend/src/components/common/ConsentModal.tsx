import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onClose }) => {
  const { grantConsent } = useAuth();
  const [agreedGeneral, setAgreedGeneral] = useState(true);
  const [agreedAI, setAgreedAI] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (agreedGeneral && agreedAI) {
      await grantConsent();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">
              Bảo vệ Quyền riêng tư & Dữ liệu Cá nhân
            </h3>
            <p className="text-xs text-brand-600 font-semibold">
              Tuân thủ Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs text-slate-600 leading-relaxed max-h-56 overflow-y-auto">
          <div className="flex items-start space-x-2">
            <Lock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p>
              <strong className="text-slate-800">Mục đích xử lý dữ liệu:</strong> Thông tin khảo sát tính cách Holland (RIASEC), thiên hướng nhận thức và điểm học tập chỉ được dùng duy nhất để tính toán độ tương thích ngành và lập lộ trình tự học cá nhân hóa.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <Eye className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p>
              <strong className="text-slate-800">Khử khuẩn thông tin (PII Sanitization):</strong> Hệ thống tự động mã hóa và loại bỏ các định danh cá nhân (Email, Số điện thoại, CCCD) trước khi chuyển qua mô hình trí tuệ nhân tạo (LLM).
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p>
              <strong className="text-slate-800">Phạm vi Thuần Hướng nghiệp (Pure Guidance):</strong> Tuyệt đối không lưu trữ hay đánh giá thiên lệch dựa trên điều kiện tài chính gia đình hoặc vị trí địa lý.
            </p>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 text-xs">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedGeneral}
              onChange={(e) => setAgreedGeneral(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <span className="text-slate-700 font-medium">
              Tôi đồng ý cho phép hệ thống thu thập điểm học bạ và kết quả trắc nghiệm để xử lý gợi ý ngành học (Bắt buộc).
            </span>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedAI}
              onChange={(e) => setAgreedAI(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <span className="text-slate-700 font-medium">
              Tôi xác nhận đã đọc và hiểu cơ chế bảo mật ẩn danh PII khi sử dụng dịch vụ Guidance RAG (Bắt buộc).
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            type="button"
            disabled={!agreedGeneral || !agreedAI}
            onClick={handleConfirm}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg transition-all ${
              agreedGeneral && agreedAI
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-brand-500/25'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Đồng ý và Tiếp tục</span>
          </button>
        </div>
      </div>
    </div>
  );
};
