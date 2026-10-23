import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  BrainCircuit,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';

export const LandingPage: React.FC = () => {
  const { xpPoints, streakDays } = useAssessment();

  const pillars = [
    {
      title: 'Trụ cột 1: Sở thích Nghề nghiệp (45%)',
      weight: '45% Trọng số',
      desc: 'Mô hình 6 chiều Holland (RIASEC) đo lường độ tương thích tính cách qua thuật toán Cosine Similarity.',
      icon: BrainCircuit,
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      iconColor: 'text-indigo-600',
    },
    {
      title: 'Trụ cột 2: Năng lực Học thuật (35%)',
      weight: '35% Trọng số',
      desc: 'Chuẩn hóa điểm học bạ qua phân phối Z-score và hàm tích lũy xác suất chuẩn (Normal CDF) theo tổ hợp môn quốc gia (A00, A01, D01...).',
      icon: FileSpreadsheet,
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Trụ cột 3: Thiên hướng Nhận thức (20%)',
      weight: '20% Trọng số',
      desc: 'Đối chiếu phương pháp học tập tối ưu (thực hành vs. lý thuyết, độc lập vs. nhóm) bằng mô hình Rule-based.',
      icon: Sparkles,
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Background decorative glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-300/30 to-purple-300/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Gamified Banner */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 shadow-sm animate-bounce-slow">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-slate-700">
              Khám phá năng lực – Nhận ngay <strong className="text-brand-600">+100 XP</strong> và bản đồ ngành học tương thích
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Định hướng Ngành học Chuẩn xác với{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-gamify-violet bg-clip-text text-transparent">
              Trí tuệ Nhân tạo Giải thích được (XAI)
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Không còn băn khoăn chọn sai ngành. Hệ thống tổng hợp 3 trụ cột (Sở thích Holland, Điểm học thuật Z-Score và Thiên hướng nhận thức) bám sát danh mục đào tạo cấp IV Thông tư 09/2022/TT-BGDĐT.
          </p>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/guidance"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-700 hover:to-indigo-800 shadow-xl shadow-brand-500/30 hover:scale-[1.02] transition-all"
            >
              <BrainCircuit className="w-5 h-5" />
              <span>Bắt Đầu Định Hướng Nghề Nghiệp</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/taxonomy"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition-all"
            >
              <Compass className="w-5 h-5 text-brand-600" />
              <span>Tra cứu 80+ Ngành cấp IV</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Thuần toán học 100% tất định</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Không thiên lệch học phí & địa lý</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Bảo vệ quyền riêng tư Luật số 91</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-brand-700 border border-indigo-100">
            Lõi Thuật toán XAI Độc quyền
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Mô hình Tương thích 3 Trụ cột Khoa học
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Quyết định tương lai cần cơ sở khoa học vững chắc thay vì những lời khuyên cảm tính hay may rủi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-50 border border-slate-100 space-y-4 transition-all duration-300 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${p.iconColor} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${p.badgeColor}`}>
                    {p.weight}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-800 group-hover:text-brand-600 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gamification Progress Preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-xs font-bold inline-flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Gamification Portal</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Vừa Định hướng Ngành vừa Tích lũy Điểm Thưởng
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Từng câu trả lời trắc nghiệm, từng môn học bạ nhập vào sẽ mở khóa các huy hiệu năng lực nghề nghiệp, giúp bạn tự tin chọn ngành đúng chuẩn.
              </p>
              <div className="pt-2 flex items-center space-x-4">
                <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <p className="text-[10px] text-slate-300 font-semibold uppercase">Điểm XP hiện tại</p>
                  <p className="text-xl font-extrabold text-amber-300">{xpPoints} XP</p>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <p className="text-[10px] text-slate-300 font-semibold uppercase">Chuỗi liên tục</p>
                  <p className="text-xl font-extrabold text-emerald-400">{streakDays} Ngày</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Huy hiệu đang mở khóa</span>
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="font-semibold text-slate-200">🔍 Nhà Thám Hiểm Holland RIASEC</span>
                  <span className="text-[11px] font-bold text-amber-300">+100 XP</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="font-semibold text-slate-200">📊 Chuyên Gia Z-Score Học Thuật</span>
                  <span className="text-[11px] font-bold text-emerald-300">+80 XP</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="font-semibold text-slate-200">🎯 Bậc Thầy Lộ Trình Tự Học</span>
                  <span className="text-[11px] font-bold text-indigo-300">+120 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
