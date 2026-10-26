import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  UploadCloud,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Server,
  Database,
  RefreshCw,
} from 'lucide-react';
import { taxonomyService, adminService } from '../../services/careerServices';
import { MajorItem } from '../../data/defaultTaxonomy';

export const AdminDashboardPage: React.FC = () => {
  const [majorsCount, setMajorsCount] = useState(0);
  const [pendingStagingCount, setPendingStagingCount] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    updateCounts();
    const handleUpdate = () => updateCounts();
    window.addEventListener('careerguide_taxonomy_updated', handleUpdate);
    return () => window.removeEventListener('careerguide_taxonomy_updated', handleUpdate);
  }, []);

  const updateCounts = () => {
    const majors = taxonomyService.getMajors();
    setMajorsCount(majors.length);
  };

  const handleResetToSix = () => {
    taxonomyService.resetToInitial();
    setSyncMessage('Đã đưa danh mục về 6 ngành ban đầu để bạn kiểm thử luồng nạp PDF!');
    setTimeout(() => setSyncMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-lg border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Bảng Điều Khiển Quản Trị Hệ Thống
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
              v1.8 HITL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Giám sát luồng nạp tri thức 2 luồng (Two-Stream Ingestion) và quy trình kiểm duyệt (Human-in-the-Loop).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {majorsCount > 6 ? (
            <button
              onClick={handleResetToSix}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset 6 ngành mẫu</span>
            </button>
          ) : (
            <Link
              to="/admin/ingest"
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Nạp Thông Tư PDF</span>
            </Link>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-md bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Majors */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Danh Mục Ngành Hoạt Động
            </span>
            <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-white">{majorsCount}</span>
              <span className="text-xs text-slate-400">ngành Cấp IV</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {majorsCount > 6 ? (
                <span className="text-emerald-400 font-medium">
                  Đã đồng bộ đầy đủ Thông tư 09/2022
                </span>
              ) : (
                <span className="text-amber-400 font-medium">
                  Hiện có 6 ngành mẫu (chờ nạp PDF)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Staging Pending */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Chờ Phê Duyệt (HITL)
            </span>
            <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-white">{pendingStagingCount}</span>
              <span className="text-xs text-slate-400">bản ghi</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tài liệu Stream B đang chờ quản trị viên xác thực
            </p>
          </div>
        </div>

        {/* Vector Embeddings */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Knowledge Embeddings
            </span>
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-white">1,536</span>
              <span className="text-xs text-slate-400">chiều (pgvector)</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1">
              Cosine Similarity tất định ≤ 2.0s
            </p>
          </div>
        </div>

        {/* Guardrail Isolation */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pure Guidance Scope
            </span>
            <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-white">100%</span>
              <span className="text-xs text-emerald-400 font-medium">Tuân thủ NFR04</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Không thiên lệch học phí hay địa phương
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Stream Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stream A Card */}
        <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Luồng 1: Stream A – Nạp Thông Tư Bộ GD&ĐT (PDF)
                </h3>
                <p className="text-[11px] text-slate-400">Văn bản quy phạm pháp luật Nhà nước (FR07, DF03)</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              Stream A
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Tải lên tài liệu PDF Thông tư mới của Bộ Giáo dục (ví dụ Thông tư 09/2022/TT-BGDĐT). Hệ thống tự động phân tích cấu trúc bảng biểu, trích xuất mã ngành cấp IV (7xxxxxx), tổ hợp môn xét tuyển và vector RIASEC để cập nhật danh mục.
          </p>

          <div className="pt-2 flex items-center space-x-2">
            <Link
              to="/admin/ingest"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <span>Mở Trình Quét AI PDF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/admin/majors"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
            >
              <span>Xem {majorsCount} Ngành</span>
            </Link>
          </div>
        </div>

        {/* Stream B Card */}
        <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Luồng 2: Kiểm Duyệt Staging HITL
                </h3>
                <p className="text-[11px] text-slate-400">Rà soát xuất bản trước khi đưa vào RAG (Bảng 6, DF05)</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              HITL Audit
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Mọi tài liệu lộ trình đào tạo thu thập từ các trường đại học bắt buộc phải nằm ở vùng đệm Staging (trạng thái PENDING). Quản trị viên rà soát, chỉnh sửa mốc thời gian và tài liệu tham khảo trước khi phê duyệt lưu trữ.
          </p>

          <div className="pt-2 flex items-center space-x-2">
            <Link
              to="/admin/staging"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
            >
              <span>Vào Bàn Kiểm Duyệt Staging</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
