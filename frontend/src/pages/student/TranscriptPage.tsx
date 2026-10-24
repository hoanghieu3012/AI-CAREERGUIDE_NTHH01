import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  TrendingUp,
  Award,
  ArrowRight,
  Calculator,
  CheckCircle2,
  BookOpen,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getScopedItem,
  setScopedItem,
  removeScopedItem,
} from '../../utils/userStorage';

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

export const TranscriptPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;

  const [grades, setGrades] = useState<SemesterGrades>(() => {
    const saved = getScopedItem('student_grades', userId);
    return saved ? JSON.parse(saved) : EMPTY_GRADES;
  });

  const [isSaved, setIsSaved] = useState<boolean>(() => {
    return getScopedItem('student_grades', userId) !== null;
  });

  useEffect(() => {
    const saved = getScopedItem('student_grades', userId);
    if (saved) {
      try {
        setGrades(JSON.parse(saved));
        setIsSaved(true);
      } catch {
        setGrades(EMPTY_GRADES);
        setIsSaved(false);
      }
    } else {
      setGrades(EMPTY_GRADES);
      setIsSaved(false);
    }
  }, [userId]);

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
    setIsSaved(true);
  };

  const handleResetGrades = () => {
    setGrades(EMPTY_GRADES);
    setIsSaved(false);
    removeScopedItem('student_grades', userId);
  };

  const hasAnyGrade = Object.values(grades).some(val => val > 0);

  // Calculate National Admission Blocks
  const blocks = [
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
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">
              Nhập Điểm Học Bạ & Chuẩn Hóa Z-Score Quốc Gia
            </h1>
            <p className="text-xs text-slate-500">
              Điểm số được chuẩn hóa theo phân phối xác suất kỳ thi tốt nghiệp THPT toàn quốc (Trụ cột 2: 35% trọng số)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasAnyGrade && (
            <button
              onClick={handleResetGrades}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa điểm</span>
            </button>
          )}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tự động tính Z-Score</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input Subject Grades */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-brand-600" />
              <span>Nhập điểm trung bình các môn THPT của bạn (Thang điểm 10)</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {subjects.map(s => {
              const val = grades[s.key as keyof SemesterGrades];
              return (
                <div key={s.key} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center space-x-1.5">
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="0.0"
                    value={val === 0 ? '' : val}
                    onChange={(e) => handleGradeChange(s.key as keyof SemesterGrades, e.target.value)}
                    className="w-full text-center py-2 rounded-xl border border-slate-200 text-base font-extrabold text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 leading-relaxed flex items-start space-x-2 flex-1 mr-4">
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <p>
                Hệ thống áp dụng công thức toán học <code className="font-bold bg-white px-1 rounded">Z = (X - μ) / σ</code> đối chiếu với kỳ thi tốt nghiệp THPT quốc gia.
              </p>
            </div>

            <button
              onClick={handleSaveGrades}
              disabled={!hasAnyGrade}
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md disabled:opacity-40 transition-all shrink-0"
            >
              {isSaved ? '✓ Đã Lưu Điểm' : 'Lưu Điểm Học Bạ'}
            </button>
          </div>
        </div>

        {/* Right: National Admission Blocks Calculations */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Điểm Tổ Hợp & Thứ Hạng Z-Score</span>
            </h3>

            {!hasAnyGrade ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-600">Chưa có điểm môn học nào</p>
                <p className="text-[11px] text-slate-400">Hãy nhập điểm các môn ở cột bên trái để hệ thống tự động tính điểm tổ hợp khối thi của bạn.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map(b => {
                  const z = b.score > 0 ? Number(((b.score - b.mu) / b.sigma).toFixed(2)) : 0;
                  const percentile = b.score > 0 ? Math.min(99, Math.max(1, Math.round(50 + z * 34))) : 0;
                  const isHigh = z > 0.8;

                  return (
                    <div
                      key={b.code}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isHigh ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/60 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-lg bg-white border font-black text-xs text-slate-800 shadow-xs">
                            {b.code}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">
                            {b.name}
                          </span>
                        </div>
                        <span className="text-sm font-black text-slate-800">{b.score} / 30</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-semibold">
                          Z-Score: <strong className={isHigh ? 'text-emerald-700' : 'text-slate-700'}>{z >= 0 ? `+${z}σ` : `${z}σ`}</strong>
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          isHigh ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          Phân vị {percentile}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/recommendations')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all mt-4"
          >
            <span>Tiếp tục: Xem Gợi ý Ngành XAI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
