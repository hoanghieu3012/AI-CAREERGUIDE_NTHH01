import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  UploadCloud,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { taxonomyService } from '../../services/careerServices';
import { MajorItem } from '../../data/defaultTaxonomy';

export const AdminMajorsManagementPage: React.FC = () => {
  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadMajors();
    const handleUpdate = () => loadMajors();
    window.addEventListener('careerguide_taxonomy_updated', handleUpdate);
    return () => window.removeEventListener('careerguide_taxonomy_updated', handleUpdate);
  }, []);

  const loadMajors = () => {
    const list = taxonomyService.getMajors();
    setMajors(list);
  };

  const handleResetToSix = () => {
    const updated = taxonomyService.resetToInitial();
    setMajors(updated);
    setActionNotice('Đã khôi phục về danh mục 6 ngành ban đầu (Chưa nạp Thông tư PDF).');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSyncAll108 = async () => {
    const all = taxonomyService.getAllOfficialMoetMajors();
    await taxonomyService.publishExtractedMajors(all);
    setMajors(all);
    setActionNotice('Đã đồng bộ toàn bộ 108 ngành cấp IV theo Thông tư 09/2022/TT-BGDĐT!');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const categories = ['ALL', ...Array.from(new Set(majors.map((m) => m.category)))];

  const filtered = majors.filter((m) => {
    const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    const term = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.major_code.includes(term) ||
      m.blocks.some((b) => b.toLowerCase().includes(term));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <span>Quản Lý Danh Mục Ngành Cấp IV Hệ Thống</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {majors.length} Ngành
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Danh mục giáo dục đào tạo cấp IV theo Thông tư 09/2022/TT-BGDĐT phục vụ bộ máy gợi ý XAI
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {majors.length <= 6 ? (
            <Link
              to="/admin/ingest"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md flex items-center space-x-2"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Quét PDF Để Nạp 108 Ngành</span>
            </Link>
          ) : (
            <button
              onClick={handleResetToSix}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center space-x-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Về 6 Ngành Ban Đầu</span>
            </button>
          )}

          <Link
            to="/taxonomy"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Giao Diện Học Sinh</span>
          </Link>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Status Warning if only 6 majors */}
      {majors.length <= 6 && (
        <div className="p-5 rounded-3xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3 text-xs text-amber-300">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">
                Hệ thống đang chạy với 6 ngành học mặc định ban đầu
              </p>
              <p className="text-slate-300 mt-0.5">
                Vui lòng vào tab <strong>"Quét & Nạp Thông Tư PDF"</strong> để AI tự động trích xuất và mở rộng danh mục lên 108 ngành học chính thức của Bộ GD&ĐT.
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncAll108}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 shadow-md flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đồng Bộ Nhanh 108 Ngành</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã ngành, tên ngành hoặc khối thi..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'Tất cả lĩnh vực đào tạo' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Majors Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Mã Cấp IV</th>
                <th className="py-3.5 px-4">Tên Ngành</th>
                <th className="py-3.5 px-4">Lĩnh Vực Đào Tạo</th>
                <th className="py-3.5 px-4">Tổ Hợp Xét Tuyển</th>
                <th className="py-3.5 px-4">Vector RIASEC</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((m) => (
                <tr key={m.major_code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                    {m.major_code}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white">{m.name}</span>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{m.outlook}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-medium">{m.category}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {m.blocks.map((b) => (
                        <span
                          key={b}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <span className="text-rose-400">R:{m.riasec.R}</span>{' '}
                    <span className="text-blue-400">I:{m.riasec.I}</span>{' '}
                    <span className="text-amber-400">A:{m.riasec.A}</span>{' '}
                    <span className="text-emerald-400">S:{m.riasec.S}</span>{' '}
                    <span className="text-purple-400">E:{m.riasec.E}</span>{' '}
                    <span className="text-cyan-400">C:{m.riasec.C}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đang Hoạt Động</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
