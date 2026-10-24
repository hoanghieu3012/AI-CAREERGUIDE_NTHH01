import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  BrainCircuit,
  Sparkles,
  FileSpreadsheet,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Save,
  Flame,
  HelpCircle,
  Wrench,
  Compass,
  Sprout,
  Microscope,
  ShieldCheck,
  Code2,
  Dna,
  Atom,
  BookOpenCheck,
  Palette,
  Layers,
  Clapperboard,
  Music,
  GraduationCap,
  HeartPulse,
  Users,
  Handshake,
  Globe2,
  Briefcase,
  TrendingUp,
  Scale,
  Megaphone,
  Building2,
  Calculator,
  FolderKanban,
  Truck,
  ClipboardCheck,
  RefreshCw,
  Zap,
  BookOpen,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Check,
  Play,
  Eye,
  SlidersHorizontal,
  History,
  Trash2,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';
import { useAssessmentQuestions } from '../../hooks/useAssessmentQuestions';
import {
  recommendationService,
  taxonomyService,
  recommendationHistoryService,
  roadmapStorageService,
} from '../../services/careerServices';
import {
  MajorRecommendation,
  BroadFieldRecommendation,
  RecommendationHistoryItem,
  QAPersonaPreset,
  RIASECVector,
} from '../../types';
import {
  getScopedItem,
  setScopedItem,
  removeScopedItem,
} from '../../utils/userStorage';

// Map icon names to Lucide icons
const LUCIDE_ICONS: Record<string, React.ElementType> = {
  Wrench,
  Compass,
  Sprout,
  Microscope,
  ShieldCheck,
  BrainCircuit,
  Code2,
  Dna,
  Atom,
  BookOpenCheck,
  Palette,
  Layers,
  Clapperboard,
  Music,
  Sparkles,
  GraduationCap,
  HeartPulse,
  Users,
  Handshake,
  Globe2,
  Briefcase,
  TrendingUp,
  Scale,
  Megaphone,
  Building2,
  Calculator,
  FolderKanban,
  CheckCircle2,
  Truck,
  ClipboardCheck,
};

interface SemesterGrades {
  math: number;
  physics: number;
  chemistry: number;
  biology: number;
  informatics: number;
  literature: number;
  history: number;
  geography: number;
  english: number;
}

const EMPTY_GRADES: SemesterGrades = {
  math: 0,
  physics: 0,
  chemistry: 0,
  biology: 0,
  informatics: 0,
  literature: 0,
  history: 0,
  geography: 0,
  english: 0,
};

export const GuidanceHubPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const userId = user?.id || null;
  const location = useLocation();
  const navigate = useNavigate();

  // Query parameter tab support: ?tab=riasec | transcript | recommendation
  const searchParams = new URLSearchParams(location.search);
  const initialTabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'riasec' | 'transcript' | 'recommendation'>(() => {
    if (initialTabParam === 'transcript') return 'transcript';
    if (initialTabParam === 'recommendation') return 'recommendation';
    return 'riasec';
  });

  // Keep activeTab in sync if query param changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'transcript' || tab === 'recommendation' || tab === 'riasec') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleTabChange = (newTab: 'riasec' | 'transcript' | 'recommendation') => {
    setActiveTab(newTab);
    navigate(`/guidance?tab=${newTab}`, { replace: true });
  };

  // =========================================================================
  // STATE 1: ASSESSMENT (RIASEC & COGNITIVE)
  // =========================================================================
  const { data: questionSet, isLoading: isQuestionSetLoading } = useAssessmentQuestions();
  const {
    riasecAnswers,
    setRiasecAnswer,
    cognitiveAnswers,
    setCognitiveAnswer,
    applyQAPreset,
    submitAssessment,
    isSubmitting: isAssessmentSubmitting,
    isCompleted: isAssessmentCompleted,
    calculatedVector,
    dominantTraits,
    resetAssessment,
    xpPoints,
  } = useAssessment();

  // Internal assessment step: 0-5 (RIASEC R,I,A,S,E,C), 6 (Cognitive), 7 (Review / Completed Summary)
  const [assessmentStep, setAssessmentStep] = useState<number>(0);
  const [presetNotice, setPresetNotice] = useState<string | null>(null);

  // =========================================================================
  // STATE 2: ACADEMIC TRANSCRIPT & Z-SCORE
  // =========================================================================
  const [grades, setGrades] = useState<SemesterGrades>(() => {
    const saved = getScopedItem('student_grades', userId);
    return saved ? JSON.parse(saved) : EMPTY_GRADES;
  });

  const [isGradesSaved, setIsGradesSaved] = useState<boolean>(() => {
    return getScopedItem('student_grades', userId) !== null;
  });

  // Synchronize student grades and recommendation state when active user changes
  useEffect(() => {
    const saved = getScopedItem('student_grades', userId);
    if (saved) {
      try {
        setGrades(JSON.parse(saved));
        setIsGradesSaved(true);
      } catch {
        setGrades(EMPTY_GRADES);
        setIsGradesSaved(false);
      }
    } else {
      setGrades(EMPTY_GRADES);
      setIsGradesSaved(false);
    }

    // Reset current recommendations view when switching users so no stale recs show
    setHasCalculatedRecommendations(false);
    setBroadFields([]);
    setSelectedField(null);
    setSelectedMajor(null);
    setLastCalculatedInputsHash('');
  }, [userId]);

  const [gradesNotice, setGradesNotice] = useState<string | null>(null);

  const subjects = [
    { key: 'math', label: 'Toán học', icon: '📐' },
    { key: 'physics', label: 'Vật lý', icon: '⚡' },
    { key: 'chemistry', label: 'Hóa học', icon: '🧪' },
    { key: 'biology', label: 'Sinh học', icon: '🧬' },
    { key: 'informatics', label: 'Tin học', icon: '💻' },
    { key: 'literature', label: 'Ngữ văn', icon: '📖' },
    { key: 'history', label: 'Lịch sử', icon: '🏛️' },
    { key: 'geography', label: 'Địa lý', icon: '🌏' },
    { key: 'english', label: 'Tiếng Anh', icon: '🇬🇧' },
  ];

  const handleGradeChange = (key: keyof SemesterGrades, val: string) => {
    const num = Math.min(10, Math.max(0, parseFloat(val) || 0));
    setGrades(prev => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleSaveGrades = () => {
    setScopedItem('student_grades', JSON.stringify(grades), userId);
    setIsGradesSaved(true);
    setGradesNotice('Đã lưu thành công điểm học bạ THPT!');
    setTimeout(() => setGradesNotice(null), 3000);
  };

  const handleResetGrades = () => {
    setGrades(EMPTY_GRADES);
    setIsGradesSaved(false);
    removeScopedItem('student_grades', userId);
    setGradesNotice('Đã xóa dữ liệu bảng điểm học bạ.');
    setTimeout(() => setGradesNotice(null), 3000);
  };

  const applyPresetGrades = (type: 'EXCELLENT_STEM' | 'EXCELLENT_HUMANITIES' | 'GOOD_ALL') => {
    let preset: SemesterGrades;
    if (type === 'EXCELLENT_STEM') {
      preset = { math: 9.2, physics: 9.0, chemistry: 8.8, biology: 8.5, informatics: 9.5, literature: 7.8, history: 7.5, geography: 8.0, english: 8.8 };
    } else if (type === 'EXCELLENT_HUMANITIES') {
      preset = { math: 8.0, physics: 7.5, chemistry: 7.2, biology: 7.8, informatics: 8.0, literature: 9.2, history: 9.0, geography: 9.1, english: 9.0 };
    } else {
      preset = { math: 8.0, physics: 8.0, chemistry: 7.8, biology: 7.5, informatics: 8.2, literature: 8.0, history: 7.8, geography: 8.0, english: 8.2 };
    }
    setGrades(preset);
    setScopedItem('student_grades', JSON.stringify(preset), userId);
    setIsGradesSaved(true);
    setGradesNotice(`Đã áp dụng mẫu điểm: ${type === 'EXCELLENT_STEM' ? 'Học sinh Giỏi Tự nhiên (STEM)' : type === 'EXCELLENT_HUMANITIES' ? 'Học sinh Giỏi Xã hội & Ngoại ngữ' : 'Học sinh Khá - Giỏi toàn diện'}`);
    setTimeout(() => setGradesNotice(null), 3000);
  };

  const hasAnyGrade = Object.values(grades).some(val => val > 0);

  // Admission blocks calculated
  const blocks = useMemo(() => [
    {
      code: 'A00',
      name: 'Toán, Vật lý, Hóa học',
      score: Number((grades.math + grades.physics + grades.chemistry).toFixed(2)),
      mu: 20.85,
      sigma: 3.25,
    },
    {
      code: 'A01',
      name: 'Toán, Vật lý, Tiếng Anh',
      score: Number((grades.math + grades.physics + grades.english).toFixed(2)),
      mu: 20.40,
      sigma: 3.35,
    },
    {
      code: 'D01',
      name: 'Toán, Ngữ văn, Tiếng Anh',
      score: Number((grades.math + grades.literature + grades.english).toFixed(2)),
      mu: 19.95,
      sigma: 3.10,
    },
    {
      code: 'B00',
      name: 'Toán, Hóa học, Sinh học',
      score: Number((grades.math + grades.chemistry + grades.biology).toFixed(2)),
      mu: 19.80,
      sigma: 3.40,
    },
    {
      code: 'C00',
      name: 'Ngữ văn, Lịch sử, Địa lý',
      score: Number((grades.literature + grades.history + grades.geography).toFixed(2)),
      mu: 19.20,
      sigma: 3.15,
    },
  ], [grades]);

  // Standard Normal CDF for Z-Score Percentile
  const normalCDF = (z: number) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };

  // =========================================================================
  // STATE 3: XAI RECOMMENDATIONS (ONLY REVEALED ON DEMAND)
  // =========================================================================
  // IMPORTANT: When entering Tab 3, recommendations DO NOT SHOW BY DEFAULT.
  // User must click "Sử dụng kết quả test để đề xuất ngành học" to trigger.
  const [hasCalculatedRecommendations, setHasCalculatedRecommendations] = useState<boolean>(false);
  const [isCalculatingRecs, setIsCalculatingRecs] = useState<boolean>(false);
  const [broadFields, setBroadFields] = useState<BroadFieldRecommendation[]>([]);
  const [selectedField, setSelectedField] = useState<BroadFieldRecommendation | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<MajorRecommendation | null>(null);

  // Recommendation History state
  const [historyList, setHistoryList] = useState<RecommendationHistoryItem[]>(() =>
    recommendationHistoryService.getHistory(userId)
  );
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdateHistory = () => {
      setHistoryList(recommendationHistoryService.getHistory(userId));
    };
    handleUpdateHistory();
    window.addEventListener('careerguide_recommendation_history_updated', handleUpdateHistory);
    return () => window.removeEventListener('careerguide_recommendation_history_updated', handleUpdateHistory);
  }, [userId]);

  const hasTestResults = Boolean(calculatedVector !== null);
  const hasTranscriptResults = hasAnyGrade;

  // Hash current assessment & transcript inputs to detect changes
  const currentInputsHash = useMemo(() => {
    return JSON.stringify({
      v: calculatedVector,
      c: cognitiveAnswers,
      g: grades,
    });
  }, [calculatedVector, cognitiveAnswers, grades]);

  const [lastCalculatedInputsHash, setLastCalculatedInputsHash] = useState<string>('');

  // Synchronize state: if student has not completed test, ensure recommendations cannot be displayed from fallback
  useEffect(() => {
    if (!calculatedVector && hasCalculatedRecommendations) {
      setHasCalculatedRecommendations(false);
      setBroadFields([]);
      setSelectedField(null);
      setSelectedMajor(null);
    }
  }, [calculatedVector, hasCalculatedRecommendations]);

  const handleClearCurrentRecommendations = () => {
    setHasCalculatedRecommendations(false);
    setBroadFields([]);
    setSelectedField(null);
    setSelectedMajor(null);
    setLastCalculatedInputsHash('');
  };

  const handleTriggerRecommendations = () => {
    // STRICT GUARD: Must have completed assessment vector
    if (!calculatedVector) {
      alert('Bạn chưa hoàn thành bài khảo sát sở thích nghề nghiệp (Mục 1). Hệ thống tuân thủ nguyên tắc không đề xuất ngẫu nhiên, vui lòng hoàn thành bài test trước!');
      handleTabChange('riasec');
      return;
    }

    setIsCalculatingRecs(true);
    const effectiveVector: RIASECVector = calculatedVector;

    // Simulate realistic deterministic calculation latency (450ms)
    setTimeout(() => {
      recommendationService.getHierarchicalRecommendations(
        effectiveVector,
        grades as unknown as Record<string, number>,
        cognitiveAnswers
      )
        .then(fields => {
          setBroadFields(fields);
          if (fields.length > 0) {
            setSelectedField(fields[0]);
            if (fields[0].majors.length > 0) {
              setSelectedMajor(fields[0].majors[0]);
            }
          }

          setLastCalculatedInputsHash(currentInputsHash);

          // Save to Recommendation History
          const historyItem: RecommendationHistoryItem = {
            id: 'hist_' + Date.now(),
            created_at: new Date().toISOString(),
            dominant_traits: dominantTraits.length > 0 ? dominantTraits : ['Sở thích thực tế'],
            riasec_vector: effectiveVector,
            top_fields: fields.map(f => ({
              field_name: f.field_name,
              field_score: f.field_score,
              matching_traits: f.matching_traits,
              top_major_names: f.majors.map(m => m.major_name),
            })),
            full_broad_fields: fields,
          };
          recommendationHistoryService.addHistory(historyItem, userId);
          setHasCalculatedRecommendations(true);
        })
        .finally(() => {
          setIsCalculatingRecs(false);
        });
    }, 450);
  };

  // Auto-refresh recommendations when inputs change (cognitive answers or grades) and recommendations are already active
  useEffect(() => {
    if (
      hasCalculatedRecommendations &&
      calculatedVector &&
      lastCalculatedInputsHash &&
      currentInputsHash !== lastCalculatedInputsHash
    ) {
      handleTriggerRecommendations();
    }
  }, [currentInputsHash, hasCalculatedRecommendations, calculatedVector, lastCalculatedInputsHash]);

  const handleRestoreHistoryItem = (item: RecommendationHistoryItem) => {
    setBroadFields(item.full_broad_fields);
    if (item.full_broad_fields.length > 0) {
      setSelectedField(item.full_broad_fields[0]);
      if (item.full_broad_fields[0].majors.length > 0) {
        setSelectedMajor(item.full_broad_fields[0].majors[0]);
      }
    }
    setHasCalculatedRecommendations(true);
    setIsHistoryModalOpen(false);
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    recommendationHistoryService.deleteHistory(id);
    setHistoryList(recommendationHistoryService.getHistory());
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đề xuất ngành?')) {
      recommendationHistoryService.clearHistory();
      setHistoryList([]);
    }
  };

  const handleCreateAndOpenRoadmap = (major: MajorRecommendation) => {
    const missingSkillNames = major.missing_skills.map(s => s.skill_name);
    roadmapStorageService.saveRoadmap(
      major.major_code,
      major.major_name,
      major.category_name,
      major.overall_score,
      missingSkillNames
    );
    navigate(`/roadmap/${major.major_code}`);
  };

  const handleFullResetAssessment = () => {
    resetAssessment();
    setAssessmentStep(0);
    handleClearCurrentRecommendations();
  };
  // =========================================================================
  const riasecGroups = questionSet?.riasec_groups || [];
  const riasecQuestions = questionSet?.riasec_questions || [];
  const cognitiveQuestions = questionSet?.cognitive_questions || [];
  const likertScale = questionSet?.likert_scale || [];
  const presets = questionSet?.qa_persona_presets || [];

  const currentGroupMeta = riasecGroups[assessmentStep];
  const currentGroupQuestions = useMemo(() => {
    if (!currentGroupMeta) return [];
    return riasecQuestions.filter(q => q.dimension === currentGroupMeta.dimension);
  }, [riasecQuestions, currentGroupMeta]);

  const totalAnsweredRIASEC = Object.keys(riasecAnswers).length;
  const totalAnsweredCognitive = Object.keys(cognitiveAnswers).length;
  const totalQuestions = riasecQuestions.length + cognitiveQuestions.length;
  const totalAnswered = totalAnsweredRIASEC + totalAnsweredCognitive;
  const progressPercent = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  const handleApplyPreset = (p: QAPersonaPreset) => {
    applyQAPreset(p);
    setPresetNotice(`Đã điền tự động mẫu hồ sơ: "${p.name}".`);
    setTimeout(() => setPresetNotice(null), 3500);
  };

  const handleFinalSubmitAssessment = async () => {
    await submitAssessment();
    setAssessmentStep(7);
    if (hasCalculatedRecommendations) {
      handleTriggerRecommendations();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ============================================================== */}
      {/* 1. UNIFIED HUB HEADER & 3-STEP SEGMENTED NAVIGATION TABS       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Quy Trình Định Hướng Nghề Nghiệp Khép Kín 3 Trụ Cột</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Trung Tâm Định Hướng Nghề Nghiệp
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Thực hiện trắc nghiệm sở thích, nhập điểm học bạ và bấm kích hoạt thuật toán XAI tất định để nhận đề xuất ngành học chuẩn xác theo Thông tư 09/2022/TT-BGDĐT.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{xpPoints} XP</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Tiến độ: <strong className="text-slate-800">{progressPercent}%</strong>
            </div>
          </div>
        </div>

        {/* 3 Unified Tabs / Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Tab 1: Trắc nghiệm sở thích */}
          <button
            type="button"
            onClick={() => handleTabChange('riasec')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3 ${
              activeTab === 'riasec'
                ? 'bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                    activeTab === 'riasec'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  1
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Mục 1: Trắc Nghiệm Sở Thích</div>
                  <div className="text-[11px] text-slate-500 font-medium">Holland RIASEC & Nhận thức</div>
                </div>
              </div>
              {hasTestResults && (
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>Đã trả lời: {totalAnsweredRIASEC}/30 câu</span>
              <span className="font-bold text-brand-600">45% trọng số</span>
            </div>
          </button>

          {/* Tab 2: Nhập điểm học bạ */}
          <button
            type="button"
            onClick={() => handleTabChange('transcript')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3 ${
              activeTab === 'transcript'
                ? 'bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                    activeTab === 'transcript'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  2
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Mục 2: Điểm Học Bạ & Z-Score</div>
                  <div className="text-[11px] text-slate-500 font-medium">9 môn & Tổ hợp A00, A01, D01...</div>
                </div>
              </div>
              {hasTranscriptResults && (
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>{isGradesSaved ? 'Đã lưu điểm học bạ' : 'Chưa lưu điểm'}</span>
              <span className="font-bold text-emerald-600">35% trọng số</span>
            </div>
          </button>

          {/* Tab 3: Đề xuất ngành học XAI */}
          <button
            type="button"
            onClick={() => handleTabChange('recommendation')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3 ${
              activeTab === 'recommendation'
                ? 'bg-gradient-to-br from-purple-50/80 to-indigo-50/50 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                    activeTab === 'recommendation'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  3
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Mục 3: Đề Xuất Ngành Học XAI</div>
                  <div className="text-[11px] text-slate-500 font-medium">Tổng hợp 3 trụ cột tất định</div>
                </div>
              </div>
              {hasCalculatedRecommendations && (
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
              <span>{hasCalculatedRecommendations ? 'Đã tạo đề xuất ngành' : 'Chờ học sinh kích hoạt'}</span>
              <span className="font-bold text-purple-600">100% tất định</span>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1 CONTENT: VOCATIONAL ASSESSMENT (RIASEC & COGNITIVE)      */}
      {/* ============================================================== */}
      {activeTab === 'riasec' && (
        <div className="space-y-4">
          {/* QA Presets Bar - Only visible for ADMIN/Dev mode to avoid cluttering Student view */}
          {isAdmin && (
            <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-slate-800">
                    Công Cụ Kiểm Thử Dành Cho Quản Trị Viên (QA Presets):
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Chế độ Admin Preview</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {presets.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center space-x-1 transition-all"
                  >
                    <span>{p.badge}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {presetNotice && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{presetNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* Stepper Inside RIASEC: Steps 0 to 5 (R,I,A,S,E,C), Step 6 (Cognitive), Step 7 (Completed) */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm overflow-x-auto">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-max">
              {riasecGroups.map((g, idx) => {
                const groupQuestions = riasecQuestions.filter(q => q.dimension === g.dimension);
                const answeredInGroup = groupQuestions.filter(q => riasecAnswers[q.code] !== undefined).length;
                const isGroupDone = groupQuestions.length > 0 && answeredInGroup === groupQuestions.length;
                const isCurrent = assessmentStep === idx;

                return (
                  <button
                    key={g.dimension}
                    type="button"
                    onClick={() => setAssessmentStep(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      isCurrent
                        ? 'bg-brand-600 text-white shadow-sm'
                        : isGroupDone
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{g.badge}</span>
                    <span className="hidden md:inline">{g.name_vi.split(' ')[0]}</span>
                    {isGroupDone && <Check className="w-3 h-3 text-emerald-600" />}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setAssessmentStep(6)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  assessmentStep === 6
                    ? 'bg-purple-600 text-white shadow-sm'
                    : totalAnsweredCognitive === cognitiveQuestions.length && cognitiveQuestions.length > 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <span>🧠</span>
                <span>Nhận Thức</span>
                {totalAnsweredCognitive === cognitiveQuestions.length && cognitiveQuestions.length > 0 && (
                  <Check className="w-3 h-3 text-emerald-600" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleFullResetAssessment}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-600 font-medium flex items-center space-x-1"
              title="Làm lại từ đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm lại</span>
            </button>
          </div>

          {/* QUESTION RENDER: Steps 0-5 (RIASEC Group Questions) */}
          {assessmentStep >= 0 && assessmentStep <= 5 && currentGroupMeta && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{currentGroupMeta.badge}</span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Nhóm {currentGroupMeta.dimension}: {currentGroupMeta.name_vi} ({currentGroupMeta.name_en})
                  </h2>
                </div>
                <p className="text-xs text-slate-500">{currentGroupMeta.description}</p>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {currentGroupQuestions.map(q => {
                  const IconComp = (q.icon_name && LUCIDE_ICONS[q.icon_name]) ? LUCIDE_ICONS[q.icon_name] : BrainCircuit;
                  const currentScore = riasecAnswers[q.code];

                  return (
                    <div
                      key={q.code}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-2.5 ${
                        currentScore
                          ? 'border-brand-200 bg-brand-50/20 shadow-xs ring-1 ring-brand-100'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          {q.domain_tag && (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {q.domain_tag}
                              </span>
                            </div>
                          )}
                          <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">{q.question_text}</p>
                        </div>
                      </div>

                      {/* Likert Scale 1 - 5 */}
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-w-xl mx-auto">
                        {likertScale.map(opt => {
                          const isSelected = currentScore === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setRiasecAnswer(q.code, opt.value)}
                              className={`py-1.5 px-1 rounded-xl text-center border transition-all ${
                                isSelected
                                  ? 'bg-brand-600 border-brand-600 text-white font-extrabold shadow-sm'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="text-sm leading-none">{opt.emoji}</div>
                              <div className="text-[10px] mt-1 font-semibold truncate">
                                {opt.label}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation buttons inside RIASEC */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={assessmentStep === 0}
                  onClick={() => setAssessmentStep(prev => prev - 1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Nhóm Trước</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssessmentStep(prev => prev + 1)}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
                >
                  <span>{assessmentStep === 5 ? 'Sang Khảo Sát Nhận Thức' : 'Nhóm Tiếp Theo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: COGNITIVE PREFERENCES */}
          {assessmentStep === 6 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🧠</span>
                  <h2 className="text-lg font-black text-slate-900">
                    Khảo Sát Thiên Hướng Nhận Thức (Cognitive Preferences)
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Chọn 1 phương án phản ánh đúng phong cách tư duy và học tập của bạn (20% trọng số XAI).
                </p>
              </div>

              <div className="space-y-6">
                {cognitiveQuestions.map(q => {
                  const dimKey = q.dimension || q.dimension_key || q.code;
                  const currentChoice = cognitiveAnswers[dimKey] || cognitiveAnswers[q.code];

                  return (
                    <div key={q.code} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/40 space-y-3">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-extrabold text-slate-900">{q.question_text || q.title}</h3>
                        {q.subtitle && <p className="text-xs text-slate-500">{q.subtitle}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {q.options?.map(opt => {
                          const isSelected = currentChoice === opt.option_key;
                          return (
                            <div
                              key={opt.option_key}
                              onClick={() => {
                                setCognitiveAnswer(dimKey, opt.option_key);
                                setCognitiveAnswer(q.code, opt.option_key);
                              }}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                                isSelected
                                  ? 'bg-purple-50/80 border-purple-500 shadow-xs ring-1 ring-purple-400'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                                    isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {opt.option_key}
                                </span>
                                <span className="text-[10px] text-purple-600 font-mono font-bold">
                                  {opt.trait_code}
                                </span>
                              </div>
                              <h4 className="text-xs font-extrabold text-slate-900">{opt.title}</h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                                {opt.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssessmentStep(5)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay Lại Nhóm C</span>
                </button>

                <button
                  type="button"
                  disabled={isAssessmentSubmitting}
                  onClick={handleFinalSubmitAssessment}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-900/20 flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAssessmentSubmitting ? 'Đang Tính Toán...' : '🚀 Hoàn Tất & Nộp Bài Khảo Sát'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: RESULT SUMMARY VIEW */}
          {assessmentStep === 7 && calculatedVector && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Award className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-lg mx-auto">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold font-mono">
                  +1,150 XP HOÀN TẤT
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Chân Dung Sở Thích Holland RIASEC Đã Hoàn Tất!
                </h2>
                <p className="text-xs text-slate-500">
                  Tính toán 100% tất định (Deterministic) theo Thông tư 09/2022/TT-BGDĐT.
                </p>
              </div>

              {/* Dominant Traits */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {dominantTraits.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-800 font-extrabold text-xs border border-purple-200"
                  >
                    ★ {t}
                  </span>
                ))}
              </div>

              {/* 6 Dimension Percentages */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 max-w-3xl mx-auto">
                {Object.entries(calculatedVector).map(([dim, val]) => (
                  <div key={dim} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="font-mono text-xs font-bold text-slate-500 uppercase">{dim}</span>
                    <div className="text-lg font-black text-slate-900">{((val as number) * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons: Next to Step 2 or directly to Step 3 */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTabChange('transcript')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
                >
                  <span>Chuyển Sang Mục 2: Nhập Điểm Học Bạ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('recommendation')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Chuyển Sang Mục 3: Đề Xuất Ngành Học</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2 CONTENT: ACADEMIC TRANSCRIPT & Z-SCORE                   */}
      {/* ============================================================== */}
      {activeTab === 'transcript' && (
        <div className="space-y-4">
          {/* Quick Preset Buttons for Grades - Only visible for ADMIN/Dev mode */}
          {isAdmin && (
            <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black text-slate-800">
                    Công Cụ Điền Điểm Nhanh Dành Cho Quản Trị Viên:
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Chế độ Admin Preview</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPresetGrades('EXCELLENT_STEM')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-[11px] transition-all"
                >
                  🔬 Giỏi Tự Nhiên (Toán 9.2, Lý 9.0, Tin 9.5)
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetGrades('EXCELLENT_HUMANITIES')}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-[11px] transition-all"
                >
                  📖 Giỏi Xã Hội (Văn 9.2, Sử 9.0, Anh 9.0)
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetGrades('GOOD_ALL')}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-bold text-[11px] transition-all"
                >
                  ⭐ Khá - Giỏi Toàn Diện (~8.0)
                </button>
                <button
                  type="button"
                  onClick={handleResetGrades}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[11px] flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa Điểm</span>
                </button>
              </div>

              {gradesNotice && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{gradesNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* 9 Subjects Input Form */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 space-y-0.5">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Nhập Điểm Trung Bình Các Môn Học THPT (Thang Điểm 10)
              </h2>
              <p className="text-xs text-slate-500">
                Dữ liệu được chuẩn hóa Z-Score so với phân phối điểm chuẩn quốc gia (35% trọng số XAI).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {subjects.map(sub => {
                const val = grades[sub.key as keyof SemesterGrades];
                return (
                  <div
                    key={sub.key}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-lg">{sub.icon}</span>
                      <span className="text-xs font-bold text-slate-800">{sub.label}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={val > 0 ? val : ''}
                        placeholder="0.0"
                        onChange={e => handleGradeChange(sub.key as keyof SemesterGrades, e.target.value)}
                        className="w-16 text-center font-mono font-bold text-sm bg-white border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-400 font-bold">/10</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculated Admission Blocks Table */}
            <div className="pt-2 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Điểm Các Khối Thi Xét Tuyển Đại Học Tự Động Tính Toán:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {blocks.map(b => {
                  const z = (b.score - b.mu) / b.sigma;
                  const pct = Math.round(normalCDF(z) * 100);

                  return (
                    <div key={b.code} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {b.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Z: {z > 0 ? `+${z.toFixed(2)}` : z.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xl font-black text-slate-900">{b.score.toFixed(2)}</div>
                      <div className="text-[11px] text-slate-500">Phân vị quốc gia: <strong>{pct}%</strong></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save & Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveGrades}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Bảng Điểm Vào Hồ Sơ</span>
              </button>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleTabChange('riasec')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Mục 1: Trắc Nghiệm</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSaveGrades();
                    handleTabChange('recommendation');
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2"
                >
                  <span>Mục 3: Xem Đề Xuất Ngành</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3 CONTENT: XAI RECOMMENDATIONS (ONLY REVEALED ON DEMAND)   */}
      {/* ============================================================== */}
      {activeTab === 'recommendation' && (
        <div className="space-y-8">
          {/* Section A: SUMMARY OF COMPLETED TESTS (MỤC ĐIỂM SỐ & TRẮC NGHIỆM ĐÃ LÀM) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Dữ Liệu Kiểm Tra Hiện Tại Của Bạn
                </h2>
                <p className="text-xs text-slate-500">
                  Hệ thống sử dụng các kết quả này để tính toán độ tương thích đa chiều tất định (Deterministic XAI).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Lịch Sử Đề Xuất ({historyList.length})</span>
                  </button>
                )}
                <span className="text-xs font-mono text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full font-bold">
                  Nguyên tắc: Không đề xuất ngẫu nhiên
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Summary of RIASEC & Cognitive Test */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-brand-600 flex items-center justify-center font-bold">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">1. Kết Quả Khảo Sát Sở Thích</h3>
                      <p className="text-[11px] text-slate-500">Holland RIASEC & Thiên hướng nhận thức</p>
                    </div>
                  </div>

                  {hasTestResults ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold inline-flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Đã Có Dữ Liệu</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      Chưa Làm
                    </span>
                  )}
                </div>

                {hasTestResults ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {dominantTraits.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-brand-700 font-extrabold text-[11px] border border-indigo-100"
                        >
                          ★ {t}
                        </span>
                      ))}
                    </div>

                    {calculatedVector && (
                      <div className="grid grid-cols-6 gap-1 pt-1">
                        {Object.entries(calculatedVector).map(([dim, val]) => (
                          <div key={dim} className="p-2 rounded-xl bg-slate-50 text-center border border-slate-100">
                            <div className="font-mono text-[10px] text-slate-400 font-bold uppercase">{dim}</div>
                            <div className="text-xs font-black text-slate-800">{((val as number) * 100).toFixed(0)}%</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Đã nạp câu trả lời đầy đủ</span>
                      <button
                        type="button"
                        onClick={() => handleTabChange('riasec')}
                        className="text-brand-600 hover:text-brand-700 font-bold underline"
                      >
                        Làm lại trắc nghiệm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 text-center space-y-2">
                    <p className="text-xs text-amber-800 font-medium">
                      Bạn chưa hoàn thành bài khảo sát sở thích nghề nghiệp Holland RIASEC.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTabChange('riasec')}
                      className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs inline-flex items-center space-x-1"
                    >
                      <span>Làm Khảo Sát Ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Card 2: Summary of Academic Transcript */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">2. Kết Quả Điểm Số Học Bạ</h3>
                      <p className="text-[11px] text-slate-500">Tổ hợp môn xét tuyển chuẩn hóa Z-Score</p>
                    </div>
                  </div>

                  {hasTranscriptResults ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold inline-flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Đã Nhập Điểm</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      Chưa Nhập
                    </span>
                  )}
                </div>

                {hasTranscriptResults ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {blocks.map(b => (
                        <div key={b.code} className="p-2 rounded-xl bg-slate-50 text-center border border-slate-100">
                          <div className="font-mono text-[10px] text-slate-400 font-bold">{b.code}</div>
                          <div className="text-xs font-black text-slate-800">{b.score.toFixed(1)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Toán: {grades.math} | Lý: {grades.physics} | Hóa: {grades.chemistry} | Văn: {grades.literature} | Anh: {grades.english}</span>
                      <button
                        type="button"
                        onClick={() => handleTabChange('transcript')}
                        className="text-emerald-600 hover:text-emerald-700 font-bold underline"
                      >
                        Sửa điểm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 text-center space-y-2">
                    <p className="text-xs text-amber-800 font-medium">
                      Bạn chưa nhập bảng điểm học bạ THPT để tính điểm tổ hợp xét tuyển.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTabChange('transcript')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center space-x-1"
                    >
                      <span>Nhập Điểm Ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section B: PROMINENT ACTIVATION BUTTON & PREREQUISITE GUARD */}
          {!hasCalculatedRecommendations && (
            <div>
              {!hasTestResults ? (
                /* GUARD: Student has NOT completed assessment */
                <div className="bg-gradient-to-br from-slate-900 via-amber-950/70 to-slate-950 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-xl relative overflow-hidden border border-amber-500/30">
                  <div className="max-w-2xl mx-auto space-y-3">
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md text-amber-300 text-xs font-bold border border-amber-400/30">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Yêu Cầu Hoàn Thành Bài Khảo Sát Sở Thích (Mục 1)</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      Chưa Thể Đề Xuất Ngành Học
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      Hệ thống tuân thủ nghiêm ngặt nguyên tắc <strong>Không Đề Xuất Ngẫu Nhiên / Không Suy Đoán Vô Căn Cứ</strong>. Thuật toán XAI cần dữ liệu trắc nghiệm sở thích RIASEC (chiếm <strong>45% trọng số</strong>) và thiên hướng nhận thức (<strong>20% trọng số</strong>) của bạn để đối chiếu với danh mục 108 ngành cấp IV của Bộ GD&ĐT.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleTabChange('riasec')}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 mx-auto"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>👉 LÀM BÀI KHẢO SÁT SỞ THÍCH NGAY (MỤC 1)</span>
                    </button>
                    {!hasTranscriptResults && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('transcript')}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 transition-all flex items-center justify-center space-x-2"
                      >
                        <span>Nhập Điểm Học Bạ (Mục 2)</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      <span className="text-rose-300 font-bold">Mục 1: Trắc nghiệm (45%) — Chưa có</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${hasTranscriptResults ? 'bg-emerald-400' : 'bg-rose-500'} inline-block`}></span>
                      <span className={hasTranscriptResults ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                        Mục 2: Học bạ (35%) — {hasTranscriptResults ? 'Đã nhập điểm' : 'Chưa nhập'}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      <span className="text-rose-300 font-bold">Trụ cột 3: Nhận thức (20%) — Chưa có</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* READY: Student HAS completed assessment */
                <div className="bg-gradient-to-br from-indigo-900 via-brand-900 to-purple-950 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-xl relative overflow-hidden">
                  <div className="max-w-2xl mx-auto space-y-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-bold border border-white/10">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Bộ Máy Trí Tuệ Nhân Tạo Giải Thích Được (XAI Recommender)</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      Sẵn Sàng Đề Xuất Ngành Học Phù Hợp Nhất
                    </h2>
                    <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-normal">
                      Hồ sơ của bạn đã sẵn sàng! Khi bạn nhấn nút bên dưới, thuật toán sẽ đối chiếu hồ sơ sở thích thực tế ({dominantTraits.length > 0 ? dominantTraits.join(', ') : 'RIASEC'}) và điểm học bạ của bạn trên toàn bộ danh mục 108 ngành cấp IV của Bộ GD&ĐT (Thông tư 09/2022/TT-BGDĐT).
                    </p>
                  </div>

                  {/* The Key Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isCalculatingRecs}
                      onClick={handleTriggerRecommendations}
                      className="px-8 sm:px-12 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 mx-auto"
                    >
                      {isCalculatingRecs ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                          <span>Đang Phân Tích Toán Học 3 Trụ Cột...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-slate-950" />
                          <span>🚀 SỬ DỤNG KẾT QUẢ TEST ĐỂ ĐỀ XUẤT NGÀNH HỌC</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-indigo-300">
                    <span>✓ Cosine Similarity Thực Tế (45%)</span>
                    <span>•</span>
                    <span>✓ Z-Score Quốc Gia (35%)</span>
                    <span>•</span>
                    <span>✓ Rule-based Nhận Thức (20%)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section C: REVEALED RECOMMENDATIONS - HIERARCHICAL 2-TIER FUNNEL */}
          {hasCalculatedRecommendations && (
            <div className="space-y-8 animate-fadeIn">
              {/* Header with Close / Re-run */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-brand-700 text-xs font-bold border border-indigo-100">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Mô Hình Phễu 2 Tầng (Hierarchical Recommendation - Chuẩn O*NET & Phoenix Ho)</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    Bản Đồ Định Hướng Nghề Nghiệp Đa Tầng Của Bạn
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  {historyList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Lịch sử ({historyList.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleTriggerRecommendations}
                    disabled={isCalculatingRecs}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCalculatingRecs ? 'animate-spin' : ''}`} />
                    <span>Tính toán lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCurrentRecommendations}
                    className="px-3 py-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center space-x-1 transition-all"
                    title="Xóa bảng kết quả đề xuất hiện tại"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa kết quả</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasCalculatedRecommendations(false)}
                    className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 font-bold text-xs"
                  >
                    Ẩn kết quả
                  </button>
                </div>
              </div>

              {/* ============================================================== */}
              {/* TẦNG 1: TOP 3 LĨNH VỰC PHÙ HỢP NHẤT (BROAD FIELDS)            */}
              {/* ============================================================== */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black tracking-wider uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                      TẦNG 1: ĐỀ XUẤT TOP 3 LĨNH VỰC ĐÀO TẠO PHÙ HỢP NHẤT (BROAD FIELDS)
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Bấm vào từng Lĩnh vực để mở rộng xem các ngành đào tạo cụ thể và lộ trình học tập ở Tầng 2:
                    </p>
                  </div>
                </div>

                {/* 3 Broad Field Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {broadFields.map((field, idx) => {
                    const isSelected = selectedField?.field_id === field.field_id;
                    const rankLabels = ['#1 Phù Hợp Nhất', '#2 Tương Thích Cao', '#3 Tiềm Năng'];
                    const rankGradients = [
                      'from-purple-600 to-indigo-600',
                      'from-blue-600 to-cyan-600',
                      'from-teal-600 to-emerald-600',
                    ];

                    return (
                      <div
                        key={field.field_id}
                        onClick={() => {
                          setSelectedField(field);
                          if (field.majors.length > 0) {
                            setSelectedMajor(field.majors[0]);
                          }
                        }}
                        className={`p-5 rounded-3xl border cursor-pointer transition-all relative space-y-3 ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-50/90 to-indigo-50/60 border-purple-500 shadow-lg ring-2 ring-purple-500/30 -translate-y-0.5'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-xs hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-white font-black text-[10px] bg-gradient-to-r ${
                              rankGradients[idx] || 'from-slate-600 to-slate-700'
                            } shadow-xs`}
                          >
                            {rankLabels[idx] || `#${idx + 1}`}
                          </span>

                          <div className="text-right">
                            <span className="text-2xl font-black text-purple-700 leading-none">
                              {field.field_score}%
                            </span>
                            <div className="text-[10px] text-slate-400 font-bold">Phù hợp</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900 leading-snug">
                            {field.field_name}
                          </h4>
                        </div>

                        {/* Matching Traits Tag */}
                        <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-[11px] font-bold text-slate-700 space-y-1">
                          <div className="text-purple-700 flex items-center space-x-1">
                            <span>💡</span>
                            <span>{field.matching_traits}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Gợi ý {field.majors.length} ngành trọng điểm
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between text-xs font-bold">
                          <span className={isSelected ? 'text-purple-700' : 'text-slate-400'}>
                            {isSelected ? 'Đang chọn lĩnh vực này ⏷' : 'Bấm để xem ngành cụ thể'}
                          </span>
                          <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-purple-700' : 'text-slate-300'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================== */}
              {/* TẦNG 2: TOP 2-3 NGÀNH CỤ THỂ TRONG LĨNH VỰC ĐÃ CHỌN (SPECIFIC) */}
              {/* ============================================================== */}
              {selectedField && (
                <div className="space-y-4 pt-2">
                  <div className="border-t border-slate-200 pt-5 space-y-1">
                    <span className="text-[11px] font-black tracking-wider uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                      TẦNG 2: ĐI SÂU VÀO TOP CÁC NGÀNH CỤ THỂ (SPECIFIC MAJORS)
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      Ngành Học Tiêu Biểu Trong Lĩnh Vực: <span className="text-purple-700">{selectedField.field_name}</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chọn 1 ngành để xem chi tiết tổ hợp xét tuyển, phân tích khoảng trống kỹ năng (Skill Gap) và lộ trình tự học:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (5 cols): Specific Majors Cards */}
                    <div className="lg:col-span-5 space-y-3">
                      {selectedField.majors.map((rec, index) => {
                        const isSelected = selectedMajor?.major_code === rec.major_code;

                        return (
                          <div
                            key={rec.major_code}
                            onClick={() => setSelectedMajor(rec)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                              isSelected
                                ? 'bg-purple-50/90 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                                : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                                    MÃ: {rec.major_code}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400">
                                    Ngành #{index + 1}
                                  </span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 leading-tight">
                                  {rec.major_name}
                                </h4>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <div className="text-xl font-black text-purple-700 leading-none">
                                  {rec.overall_score}%
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">Tương thích</span>
                              </div>
                            </div>

                            {/* 3 Pillar Micro Badges */}
                            <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] border-t border-slate-100">
                              <div className="text-indigo-600 font-medium">Sở thích: {rec.riasec_score}%</div>
                              <div className="text-emerald-600 font-medium">Học bạ: {rec.academic_score}%</div>
                              <div className="text-amber-600 font-medium">Nhận thức: {rec.preference_score}%</div>
                            </div>

                            {/* Best Admission Block */}
                            <div className="p-2 rounded-xl bg-slate-50 text-[11px] font-medium text-slate-600 flex items-center justify-between">
                              <span>Tổ hợp xét tuyển tiêu chuẩn:</span>
                              <strong className="text-slate-800 font-mono font-bold">
                                {rec.admitted_blocks.slice(0, 3).join(', ')}
                              </strong>
                            </div>

                            {/* Skill Gap highlight */}
                            {rec.missing_skills.length > 0 && (
                              <div className="space-y-1 pt-0.5">
                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                                  <span>Khoảng trống kỹ năng cần bổ trợ:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {rec.missing_skills.map((s, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-semibold border border-rose-100"
                                    >
                                      {s.skill_name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column (7 cols): Selected Major XAI & Roadmap Action */}
                    <div className="lg:col-span-7">
                      {selectedMajor ? (
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-5 sticky top-20">
                          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                                  MÃ: {selectedMajor.major_code}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                  {selectedMajor.category_name}
                                </span>
                              </div>
                              <h3 className="text-xl font-black text-slate-900 mt-1">
                                {selectedMajor.major_name}
                              </h3>
                            </div>

                            <div className="text-right">
                              <div className="text-3xl font-black text-purple-700 leading-none">
                                {selectedMajor.overall_score}%
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">Điểm tổng hợp</span>
                            </div>
                          </div>

                          {/* Radar Chart: Student Vector vs Major Vector */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                Biểu Đồ Radar Đối Chiếu Vector Holland RIASEC:
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Xanh: Bạn | Đỏ tím: Chuẩn Ngành
                              </span>
                            </div>

                            <div className="h-60 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart
                                  data={[
                                    {
                                      dim: 'R (Thực tế)',
                                      student: calculatedVector?.R !== undefined ? Math.round((calculatedVector.R as number) * 100) : 0,
                                      major: Math.round((selectedMajor.riasec_vector.R || 0.5) * 100),
                                    },
                                    {
                                      dim: 'I (Nghiên cứu)',
                                      student: calculatedVector?.I !== undefined ? Math.round((calculatedVector.I as number) * 100) : 0,
                                      major: Math.round((selectedMajor.riasec_vector.I || 0.5) * 100),
                                    },
                                    {
                                      dim: 'A (Nghệ thuật)',
                                      student: calculatedVector?.A !== undefined ? Math.round((calculatedVector.A as number) * 100) : 0,
                                      major: Math.round((selectedMajor.riasec_vector.A || 0.5) * 100),
                                    },
                                    {
                                      dim: 'S (Xã hội)',
                                      student: calculatedVector?.S !== undefined ? Math.round((calculatedVector.S as number) * 100) : 0,
                                      major: Math.round((selectedMajor.riasec_vector.S || 0.5) * 100),
                                    },
                                    {
                                      dim: 'E (Quản lý)',
                                      student: calculatedVector?.E !== undefined ? Math.round((calculatedVector.E as number) * 100) : 0,
                                      major: Math.round((selectedMajor.riasec_vector.E || 0.5) * 100),
                                    },
                                    {
                                      dim: 'C (Nghiệp vụ)',
                                      student: calculatedVector?.C !== undefined ? Math.round((calculatedVector.C as number) * 100) : 0,
                                      major: Math.round((selectedMajor.riasec_vector.C || 0.5) * 100),
                                    },
                                  ]}
                                >
                                  <PolarGrid stroke="#e2e8f0" />
                                  <PolarAngleAxis dataKey="dim" tick={{ fill: '#64748b', fontSize: 11 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                                  <Radar
                                    name="Hồ Sơ Của Bạn"
                                    dataKey="student"
                                    stroke="#4f46e5"
                                    fill="#4f46e5"
                                    fillOpacity={0.4}
                                  />
                                  <Radar
                                    name="Chuẩn Ngành Đào Tạo"
                                    dataKey="major"
                                    stroke="#ec4899"
                                    fill="#ec4899"
                                    fillOpacity={0.25}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                                  <Tooltip />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Skill Gap Analysis Detail */}
                          {selectedMajor.missing_skills.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center space-x-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                <span>Phân Tích Khoảng Trống Kỹ Năng (Skill Gap Analysis):</span>
                              </h4>
                              <div className="space-y-1.5">
                                {selectedMajor.missing_skills.map((s, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-xs text-rose-900">{s.skill_name}</span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200/70 text-rose-900">
                                        Mức độ: {s.severity === 'HIGH' ? 'Ưu tiên cao' : 'Cần bổ trợ'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-rose-800 leading-relaxed font-normal">
                                      👉 {s.remedy_action}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Top Supporting Factors (XAI Factors) */}
                          <div className="space-y-2 pt-1">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                              Yếu Tố Ủng Hộ Đề Xuất (XAI Factors):
                            </h4>
                            <div className="space-y-1.5">
                              {selectedMajor.top_supporting_factors.map((f, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-xs text-slate-800">
                                      {f.factor_title}
                                    </span>
                                    <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                      +{f.contribution_score} điểm
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                                    {f.factor_description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Key Action Button: Create & Open RAG personalized roadmap */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => handleCreateAndOpenRoadmap(selectedMajor)}
                              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
                            >
                              <Compass className="w-4 h-4" />
                              <span>🧭 TẠO & XEM LỘ TRÌNH TỰ HỌC (RAG CÁ NHÂN HÓA)</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-3xl p-12 text-center text-slate-400">
                          Chọn 1 ngành trong danh sách để xem biểu đồ XAI chi tiết.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LỊCH SỬ CÁC ĐOẠN KẾT QUẢ ĐỀ XUẤT NGÀNH                  */}
      {/* ============================================================== */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Lịch Sử Kết Quả Đề Xuất Ngành Học
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lưu trữ các phiên đề xuất trước đây để bạn dễ dàng xem lại và so sánh
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of history sessions */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có lịch sử đề xuất nào được lưu.
                </div>
              ) : (
                historyList.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleRestoreHistoryItem(item)}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-purple-300 transition-all cursor-pointer space-y-2.5 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                          Phiên #{historyList.length - idx}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.created_at).toLocaleString('vi-VN')}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa phiên này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Dominant Traits */}
                    <div className="flex flex-wrap gap-1">
                      {item.dominant_traits.map((trait, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 text-brand-700 text-[10px] font-bold"
                        >
                          ★ {trait}
                        </span>
                      ))}
                    </div>

                    {/* Top 3 fields preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                      {item.top_fields.map((field, fIdx) => (
                        <div
                          key={fIdx}
                          className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] font-black">
                            <span className="truncate text-slate-800">{field.field_name}</span>
                            <span className="text-purple-700 ml-1">{field.field_score}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {field.top_major_names.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs font-bold text-brand-600">
                      <span>Bấm để khôi phục & xem lại kết quả phiên này</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleClearAllHistory}
                disabled={historyList.length === 0}
                className="text-rose-600 hover:text-rose-700 font-bold disabled:opacity-40"
              >
                Xóa toàn bộ lịch sử
              </button>

              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors"
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
