import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  BrainCircuit,
  FileSpreadsheet,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  BookOpen,
  Scale,
  Microscope,
  Check,
  GraduationCap,
  Users,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const pillars = [
    {
      step: '01',
      title: 'Sở thích Nghề nghiệp',
      weight: '45% Trọng số',
      desc: 'Mô hình 6 chiều Holland (RIASEC) đo lường độ tương thích tính cách qua thuật toán Cosine Similarity chuẩn hóa.',
      icon: BrainCircuit,
      color: 'blue',
    },
    {
      step: '02',
      title: 'Năng lực Học thuật',
      weight: '35% Trọng số',
      desc: 'Chuẩn hóa điểm học bạ THPT qua phân phối Z-score và hàm tích lũy xác suất chuẩn (Normal CDF) theo các khối tuyển sinh quốc gia (A00, A01, D01...).',
      icon: FileSpreadsheet,
      color: 'emerald',
    },
    {
      step: '03',
      title: 'Thiên hướng Nhận thức',
      weight: '20% Trọng số',
      desc: 'Phân tích phương pháp tiếp nhận thông tin (thực hành vs. lý thuyết, độc lập vs. cộng tác) theo lý thuyết đa trí tuệ Gardner.',
      icon: Sparkles,
      color: 'amber',
    },
  ];

  const standards = [
    {
      title: 'Thông tư 09/2022/TT-BGDĐT',
      desc: 'Bám sát 100% danh mục giáo dục đào tạo cấp IV quốc gia với 108 ngành đại học chính quy.',
    },
    {
      title: 'Toán học Tất định 100%',
      desc: 'Thuật toán đối sánh vector Cosine và hàm Normal CDF có thể kiểm toán, không phụ thuộc phán đoán ngẫu nhiên.',
    },
    {
      title: 'Bảo mật theo Luật 91/2025/QH15',
      desc: 'Dữ liệu học bạ và bài test được cô lập theo tài khoản riêng biệt, khử khuẩn định danh PII trước khi xử lý.',
    },
    {
      title: 'Không thiên lệch thương mại',
      desc: 'Khuyến nghị hoàn toàn dựa trên năng lực và sở thích, không nhận tài trợ quảng cáo học phí hay địa phương.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Hệ thống Định hướng Giáo dục Đại học Chuẩn Quốc gia</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Định hướng ngành học đại học dựa trên cơ sở khoa học và dữ liệu thực tế
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Giải pháp tư vấn chọn ngành kết hợp 3 trụ cột độc lập: Bài khảo sát sở thích nghề nghiệp Holland RIASEC,
              phân tích học bạ THPT chuẩn hóa Z-Score, và đối chiếu với danh mục đào tạo cấp IV Thông tư 09/2022/TT-BGDĐT.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/guidance"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                <span>Bắt đầu khảo sát năng lực</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/taxonomy"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-colors"
              >
                <Compass className="w-4 h-4 text-slate-500" />
                <span>Tra cứu 108 ngành cấp IV</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
              <div>
                <p className="text-2xl font-bold text-slate-900">108</p>
                <p className="text-xs text-slate-500 mt-0.5">Mã ngành Cấp IV Bộ GD&ĐT</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">3 Trụ cột</p>
                <p className="text-xs text-slate-500 mt-0.5">RIASEC + Z-Score + Nhận thức</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">100%</p>
                <p className="text-xs text-slate-500 mt-0.5">Tất định & Minh bạch XAI</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">Luật 91</p>
                <p className="text-xs text-slate-500 mt-0.5">Bảo vệ dữ liệu cá nhân</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-3 mb-10">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <span>Phương pháp luận</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Khung đánh giá tương thích 3 trụ cột khoa học
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Thay vì dựa trên linh cảm hoặc các mô hình tạo sinh không kiểm soát, hệ thống sử dụng thuật toán tính điểm tất định với trọng số rõ ràng cho từng phương diện.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      BƯỚC {p.step}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {p.weight}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {p.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600">
                  <span>Xem chi tiết công thức</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="bg-slate-100 border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Quy trình 3 bước tiếp cận minh bạch
            </h2>
            <p className="text-sm text-slate-600 max-w-xl">
              Học sinh và phụ huynh có thể chủ động theo dõi từng giai đoạn đánh giá mà không gặp phải rào cản kỹ thuật.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Khảo sát Sở thích & Nhận thức</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hoàn thành 30 câu hỏi sở thích Holland (thang Likert 1-5 khách quan) và 8 câu trắc nghiệm phong cách tiếp thu tri thức.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Nhập Điểm Học bạ THPT</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Điền điểm số 9 môn văn hóa chính để hệ thống tính toán Z-score và đối chiếu xác suất theo các khối thi quốc gia (A00, A01, D01...).
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Nhận Khuyến nghị & Lộ trình XAI</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Xem bảng xếp hạng ngành đào tạo cấp IV có giải trình minh bạch, biểu đồ Radar đối sánh và lộ trình chuẩn bị từng kỳ học.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Standards & Transparency Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Cam kết chất lượng và tính minh bạch
          </h2>
          <p className="text-sm text-slate-600 max-w-xl">
            Các tiêu chuẩn kỹ thuật và pháp lý được tích hợp trực tiếp vào kiến trúc hệ thống.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {standards.map((s, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-start space-x-4">
              <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-slate-900 text-white rounded-lg p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight">
              Sẵn sàng xây dựng lộ trình hướng nghiệp cho bản thân?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Bắt đầu bài khảo sát ngay hôm nay. Mọi dữ liệu cá nhân của bạn đều được bảo mật an toàn theo tiêu chuẩn Luật số 91/2025/QH15.
            </p>
          </div>
          <Link
            to="/guidance"
            className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors shrink-0"
          >
            Thực hiện bài test ngay
          </Link>
        </div>
      </section>
    </div>
  );
};
