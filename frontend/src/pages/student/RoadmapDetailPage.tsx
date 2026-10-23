import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Download,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Check,
  Compass,
  Search,
  X,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { MajorRoadmap, GuidancePersonalizationResponse, RoadmapMilestone } from '../../types';
import { recommendationService, roadmapStorageService, taxonomyService } from '../../services/careerServices';
import { MajorItem } from '../../data/defaultTaxonomy';

export const RoadmapDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { major_code } = useParams<{ major_code: string }>();
  const code = major_code || '7480201';

  const [roadmap, setRoadmap] = useState<MajorRoadmap | null>(null);
  const [schedule, setSchedule] = useState<GuidancePersonalizationResponse | null>(null);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isSavedInRoadmaps, setIsSavedInRoadmaps] = useState(false);

  // Switch Major Modal state
  const [isSwitchMajorModalOpen, setIsSwitchMajorModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const allMajors = taxonomyService.getAllOfficialMoetMajors();
  const categories = ['ALL', ...Array.from(new Set(allMajors.map((m) => m.category)))];

  useEffect(() => {
    setLoading(true);
    // Load previously saved progress if any
    const savedList = roadmapStorageService.getSavedRoadmaps();
    const existing = savedList.find(r => r.major_code === code);
    setIsSavedInRoadmaps(!!existing);

    if (existing && existing.completed_action_keys) {
      const keysMap: Record<string, boolean> = {};
      existing.completed_action_keys.forEach(k => {
        keysMap[k] = true;
      });
      setCompletedActions(keysMap);
    } else {
      setCompletedActions({});
    }

    const majorInfo = taxonomyService.getMajorByCode(code);
    const domainSkills = (existing && existing.target_skills && existing.target_skills.length > 0)
      ? existing.target_skills
      : recommendationService.getDomainMissingSkills(code);

    Promise.all([
      recommendationService.getMajorRoadmap(code),
      recommendationService.getPersonalizedSchedule(code, domainSkills),
    ])
      .then(([rm, sch]) => {
        setRoadmap(rm);
        setSchedule(sch);
        // If already in user's saved list, refresh study timestamp
        if (existing) {
          const titleClean = rm.title.replace('Lộ trình học tập chuẩn hóa: ', '');
          roadmapStorageService.saveRoadmap(code, majorInfo?.name || titleClean, majorInfo?.category || 'Đào tạo chuẩn', existing.overall_score, domainSkills);
        }
      })
      .finally(() => setLoading(false));
  }, [code]);

  const handleSaveToMyRoadmaps = () => {
    if (!roadmap) return;
    const majorInfo = taxonomyService.getMajorByCode(code);
    const domainSkills = recommendationService.getDomainMissingSkills(code);
    const titleClean = roadmap.title.replace('Lộ trình học tập chuẩn hóa: ', '');
    roadmapStorageService.saveRoadmap(code, majorInfo?.name || titleClean, majorInfo?.category || 'Đào tạo chuẩn', undefined, domainSkills);
    setIsSavedInRoadmaps(true);
  };

  const toggleAction = (key: string) => {
    const updated = {
      ...completedActions,
      [key]: !completedActions[key],
    };
    setCompletedActions(updated);

    if (roadmap) {
      const milestones = roadmap.roadmap_data.milestones;
      const totalActions = milestones.reduce((acc, m) => acc + m.actions.length, 0);
      const completedKeys = Object.keys(updated).filter(k => updated[k]);
      const progressPct = totalActions > 0 ? Math.round((completedKeys.length / totalActions) * 100) : 0;
      
      // Auto-save roadmap if first action toggled
      if (!isSavedInRoadmaps) {
        handleSaveToMyRoadmaps();
      }
      roadmapStorageService.updateProgress(code, completedKeys, progressPct);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleSwitchToMajor = (m: MajorItem) => {
    roadmapStorageService.saveRoadmap(m.major_code, m.name, m.category);
    setIsSwitchMajorModalOpen(false);
    navigate(`/roadmap/${m.major_code}`);
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

  if (loading || !roadmap) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Đang truy xuất lộ trình chuẩn hóa ({code})...</p>
      </div>
    );
  }

  const milestones = roadmap.roadmap_data.milestones;
  const totalActions = milestones.reduce((acc, m) => acc + m.actions.length, 0);
  const completedCount = Object.values(completedActions).filter(Boolean).length;
  const progressPct = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar with Navigation & Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3 text-xs font-bold no-print mb-1">
            <Link to="/roadmaps" className="inline-flex items-center space-x-1 text-slate-500 hover:text-brand-600">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Danh Sách Lộ Trình</span>
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/guidance?tab=recommendation" className="text-slate-500 hover:text-brand-600">
              Định Hướng Nghề Nghiệp
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              {roadmap.major_code}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              {roadmap.is_fallback ? 'Bản dự phòng chuẩn hóa' : 'Đã duyệt chính thức (APPROVED)'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {roadmap.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 no-print">
          {isSavedInRoadmaps ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã lưu vào Lộ trình</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSaveToMyRoadmaps}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Lưu Vào Lộ Trình Của Tôi</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSwitchMajorModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-brand-700 font-bold text-xs border border-indigo-200 transition-all shadow-xs"
          >
            <Compass className="w-4 h-4 text-brand-600" />
            <span>Đổi Sang Ngành Khác</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 hover:from-brand-700 hover:to-indigo-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Provenance Metadata Badge */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-brand-600 shrink-0" />
          <span>
            <strong>Nguồn gốc tài liệu:</strong> {roadmap.roadmap_data.source_title} ({roadmap.roadmap_data.source_page || 'Chương trình khung'})
          </span>
        </div>
        <a
          href={roadmap.roadmap_data.source_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center space-x-1 text-brand-600 font-bold hover:underline"
        >
          <span>Xem tài liệu gốc</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Progress Checklist Tracker */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Tiến độ Hoàn thành Nhiệm vụ Tự học
          </h3>
          <span className="text-xs font-black text-brand-600">
            {completedCount} / {totalActions} việc ({progressPct}%)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-brand-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Guidance RAG 4-Week Schedule */}
      {schedule && (
        <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-brand-700 text-xs font-bold mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Kế hoạch Học tập 4 Tuần Cá nhân hóa (Guidance RAG)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {schedule.personalization_summary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {schedule.schedule.map(task => (
              <div key={task.week_number} className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-brand-800 font-extrabold">Tuần {task.week_number}: {task.focus_skill}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">{task.estimated_hours}h / tuần</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {task.tasks.map((t, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-brand-500 font-black shrink-0">•</span>
                      <span className="leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step-by-Step Curriculum Milestones */}
      <div className="space-y-6">
        <h2 className="text-base font-extrabold text-slate-800">
          Các Cột Mốc Đào Tạo Chi Tiết
        </h2>

        <div className="space-y-4">
          {milestones.map(m => (
            <div key={m.step} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    Mốc {m.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{m.title}</h3>
                    <span className="text-[11px] text-slate-400 font-medium">Thời lượng dự kiến: {m.duration_weeks} tuần</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {m.description}
              </p>

              {/* Learning Objectives */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">Mục tiêu cần đạt:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  {m.learning_objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action items with interactive checkboxes */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase">Hành động thực hành & Đánh giá:</span>
                <div className="space-y-2">
                  {m.actions.map((act, idx) => {
                    const actionKey = `m_${m.step}_act_${idx}`;
                    const isDone = !!completedActions[actionKey];

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleAction(actionKey)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isDone ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50/70 border-slate-100 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                          }`}>
                            {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className={isDone ? 'line-through text-slate-500' : ''}>{act}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">+15 XP</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: CHỌN / ĐỔI SANG NGÀNH KHÁC TRONG LỘ TRÌNH HỌC TẬP      */}
      {/* ============================================================== */}
      {isSwitchMajorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Đổi Sang Lộ Trình Ngành Khác
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chọn bất kỳ ngành nào trong 108 ngành cấp IV của Bộ GD&ĐT để xem và học theo lộ trình
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSwitchMajorModalOpen(false)}
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
                  placeholder="Nhập tên ngành, mã ngành (ví dụ: 7480109) hoặc tổ hợp môn..."
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
                  const isCurrentMajor = m.major_code === code;

                  return (
                    <div
                      key={m.major_code}
                      onClick={() => handleSwitchToMajor(m)}
                      className={`p-3.5 rounded-2xl transition-colors cursor-pointer flex items-center justify-between group ${
                        isCurrentMajor ? 'bg-brand-50/70 border border-brand-200' : 'hover:bg-indigo-50/50'
                      }`}
                    >
                      <div className="space-y-0.5 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            {m.major_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {m.category}
                          </span>
                          {isCurrentMajor && (
                            <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold">
                              Đang xem
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
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 shadow-xs flex items-center space-x-1 ${
                          isCurrentMajor
                            ? 'bg-slate-200 text-slate-700 cursor-default'
                            : 'bg-brand-600 hover:bg-brand-700 text-white'
                        }`}
                      >
                        <span>{isCurrentMajor ? 'Đang học' : 'Chuyển ngành'}</span>
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
                onClick={() => setIsSwitchMajorModalOpen(false)}
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
