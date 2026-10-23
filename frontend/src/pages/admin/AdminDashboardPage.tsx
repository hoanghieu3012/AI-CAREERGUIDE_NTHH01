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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-3">
            <span>Bảng Điều Khiển Quản Trị Hệ Thống</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
              v1.8 HITL
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Giám sát luồng nạp tri thức 2 luồng (Two-Stream Ingestion) & Kiểm duyệt bán tự động (Human-in-the-Loop)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {majorsCount > 6 ? (
            <button
              onClick={handleResetToSix}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Về 6 Ngành Ban Đầu</span>
            </button>
          ) : (
            <Link
              to="/admin/ingest"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-purple-900/30 transition-all flex items-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Nạp Thông Tư PDF Bộ GD&ĐT Ngay</span>
            </Link>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Majors */}
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Danh Mục Ngành Hoạt Động
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white">{majorsCount}</span>
              <span className="text-xs text-slate-400">ngành cấp IV</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {majorsCount > 6 ? (
                <span className="text-emerald-400 font-semibold">
                  ✓ Đã đồng bộ đầy đủ từ Thông tư 09/2022
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">
                  ⚠ Hiện có 6 ngành mẫu (Chờ nạp Thông tư PDF)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Staging Pending */}
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Chờ Phê Duyệt (HITL)
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white">{pendingStagingCount}</span>
              <span className="text-xs text-slate-400">bản ghi</span>
            </div>
            <p className="text-[11px] text-purple-400 mt-1">
              Tài liệu Stream B đang đợi Admin xác thực
            </p>
          </div>
        </div>

        {/* Vector Embeddings */}
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Knowledge Embeddings
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white">1,536</span>
              <span className="text-xs text-slate-400">chiều (pgvector)</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1">
              Cosine Similarity tất định ≤ 2.0s
            </p>
          </div>
        </div>

        {/* Guardrail Isolation */}
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pure Guidance Scope
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">100%</span>
              <span className="text-xs text-emerald-400 font-bold">Tuân thủ NFR04</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tuyệt đối không học phí hay địa phương
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Stream Workflows Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stream A Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 rounded-3xl p-6 border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Luồng 1: Stream A – Nạp Thông Tư Bộ GD&ĐT (PDF / Excel)
                  </h3>
                  <p className="text-[11px] text-slate-400">Văn bản quy phạm pháp luật Nhà nước (FR07, DF03)</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                Stream A
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tải lên tài liệu PDF Thông tư mới của Bộ Giáo dục (ví dụ Thông tư 09/2022/TT-BGDĐT). AI sẽ tự động phân tích bảng biểu, trích xuất mã ngành cấp IV (7xxxxxx), tên ngành, tổ hợp môn xét tuyển và vector RIASEC để cập nhật danh mục toàn hệ thống.
            </p>

            <div className="pt-2 flex items-center space-x-3">
              <Link
                to="/admin/ingest"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
              >
                <span>Mở Trình Quét AI PDF</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/admin/majors"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
              >
                <span>Xem {majorsCount} Ngành Đang Có</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stream B Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 rounded-3xl p-6 border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Luồng 2: Kiểm Duyệt Staging HITL (Human-in-the-Loop)
                  </h3>
                  <p className="text-[11px] text-slate-400">Rà soát xuất bản trước khi đưa vào RAG (Bảng 6, DF05)</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                HITL Audit
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Mọi tài liệu lộ trình đào tạo thu thập từ các trường đại học qua Tavily bắt buộc phải nằm ở vùng đệm Staging (status = PENDING). Admin có toàn quyền chỉnh sửa mốc thời gian, tài liệu tham khảo trước khi phê duyệt lưu vào cơ sở dữ liệu.
            </p>

            <div className="pt-2 flex items-center space-x-3">
              <Link
                to="/admin/staging"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
              >
                <span>Vào Bàn Kiểm Duyệt Staging</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
