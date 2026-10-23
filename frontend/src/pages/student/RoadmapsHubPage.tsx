import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  Compass,
  Search,
  Filter,
  X,
  Layers,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FolderOpen,
} from 'lucide-react';
import { SavedRoadmapItem } from '../../types';
import { roadmapStorageService, taxonomyService } from '../../services/careerServices';
import { MajorItem } from '../../data/defaultTaxonomy';

export const RoadmapsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmapItem[]>([]);
  const [isSelectMajorModalOpen, setIsSelectMajorModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const allMajors = taxonomyService.getAllOfficialMoetMajors();
  const categories = ['ALL', ...Array.from(new Set(allMajors.map((m) => m.category)))];

  const loadSaved = () => {
    setSavedRoadmaps(roadmapStorageService.getSavedRoadmaps());
  };

  useEffect(() => {
    loadSaved();
    window.addEventListener('careerguide_roadmaps_updated', loadSaved);
    return () => window.removeEventListener('careerguide_roadmaps_updated', loadSaved);
  }, []);

  const handleCreateRoadmapForMajor = (m: MajorItem) => {
    roadmapStorageService.saveRoadmap(m.major_code, m.name, m.category);
    setIsSelectMajorModalOpen(false);
    navigate(`/roadmap/${m.major_code}`);
  };

  const handleDeleteRoadmap = (e: React.MouseEvent, majorCode: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Bạn có chắc chắn muốn xóa lộ trình học tập này khỏi danh sách đã lưu?')) {
      roadmapStorageService.removeRoadmap(majorCode);
      loadSaved();
    }
  };

  const filteredMajors = allMajors.filter((m) => {
    const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.major_code.includes(term) ||
      m.blocks.some((b) => b.toLowerCase().includes(term));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-brand-700 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <span>Kế Hoạch Tự Học & Chuẩn Bị Đại Học (Standard Roadmaps & RAG)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Lộ Trình Học Tập Của Bạn
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Lưu lại và quản lý tiến trình học tập các ngành bạn đã chọn từ bài khảo sát, hoặc chủ động chọn bất kỳ ngành nào để tạo lộ trình mới.
          </p>
        </div>

        {/* Action button: Create roadmap for another major */}
        <button
          type="button"
          onClick={() => setIsSelectMajorModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-brand-500/25 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Chọn Ngành Khác Để Tạo Lộ Trình</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* EMPTY STATE: WHEN USER HAS NOT CREATED ANY ROADMAP YET         */}
      {/* ============================================================== */}
      {savedRoadmaps.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-16 border border-slate-100 shadow-sm text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50/70 border border-indigo-100 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
            <FolderOpen className="w-10 h-10 text-brand-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Phần Lộ Trình Học Tập Đang Trống
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal max-w-lg mx-auto">
              Bạn chưa bấm tạo lộ trình học tập cho ngành nào. Hãy làm bài kiểm tra để nhận đề xuất ngành và bấm <strong>"Tạo Lộ Trình"</strong>, hoặc chủ động chọn một ngành bất kỳ bên dưới để bắt đầu tự học ngay hôm nay!
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/guidance?tab=recommendation"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Đi Đến Trung Tâm Định Hướng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setIsSelectMajorModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Chọn Ngành Học Để Tạo Lộ Trình Ngay</span>
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* LIST OF SAVED ROADMAPS (HISTORY)                               */
        /* ============================================================== */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Danh Sách Lộ Trình Đã Lưu ({savedRoadmaps.length} ngành)
            </h2>
            <span className="text-xs text-slate-500">
              Cập nhật tự động theo tiến độ học tập thực tế
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedRoadmaps.map((rm) => (
              <div
                key={rm.id}
                onClick={() => navigate(`/roadmap/${rm.major_code}`)}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all cursor-pointer space-y-4 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {rm.major_code}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {rm.category_name}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-brand-600 transition-colors">
                      {rm.major_name}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {rm.overall_score && (
                      <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-black text-xs border border-purple-100">
                        {rm.overall_score}% hợp
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteRoadmap(e, rm.major_code)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa lộ trình này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Tiến độ tự học:</span>
                    <span className="text-brand-600 font-black">
                      {rm.progress_percent}% hoàn thành
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${rm.progress_percent}%` }}
                    />
                  </div>
                </div>

                {/* Footer Info & Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tạo ngày: {new Date(rm.created_at).toLocaleDateString('vi-VN')}</span>
                  </span>

                  <span className="font-bold text-brand-600 group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                    <span>Tiếp tục học</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHỌN NGÀNH KHÁC TRONG LỘ TRÌNH HỌC TẬP                 */}
      {/* ============================================================== */}
      {isSelectMajorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Chọn Ngành Học Khác Để Lập Lộ Trình
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tra cứu trong toàn bộ 108 ngành cấp IV của Bộ GD&ĐT (Thông tư 09/2022/TT-BGDĐT)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSelectMajorModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Inputs */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nhập tên ngành, mã ngành (ví dụ: 7480201) hoặc khối thi..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-medium"
                />
              </div>

              {/* Category selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-600 shrink-0">Lĩnh vực:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'ALL' ? 'Tất cả lĩnh vực đào tạo' : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Majors List Results */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-1">
              {filteredMajors.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Không tìm thấy ngành đào tạo phù hợp với từ khóa "{searchTerm}".
                </div>
              ) : (
                filteredMajors.map((m) => {
                  const isAlreadySaved = savedRoadmaps.some((r) => r.major_code === m.major_code);

                  return (
                    <div
                      key={m.major_code}
                      onClick={() => handleCreateRoadmapForMajor(m)}
                      className="p-3.5 rounded-2xl hover:bg-indigo-50/50 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-0.5 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            {m.major_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {m.category}
                          </span>
                          {isAlreadySaved && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              ✓ Đã trong lộ trình
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {m.name}
                        </h4>
                        <div className="text-[10px] text-slate-500">
                          Tổ hợp môn: {m.blocks.slice(0, 3).join(', ')}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shrink-0 shadow-xs flex items-center space-x-1"
                      >
                        <span>{isAlreadySaved ? 'Vào học' : 'Tạo lộ trình'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Hiển thị {filteredMajors.length} / {allMajors.length} ngành</span>
              <button
                type="button"
                onClick={() => setIsSelectMajorModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
