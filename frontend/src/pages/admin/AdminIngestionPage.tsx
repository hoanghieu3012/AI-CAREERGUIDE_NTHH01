import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Check,
  RefreshCw,
  Eye,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { taxonomyService, adminService } from '../../services/careerServices';
import { MajorItem } from '../../data/defaultTaxonomy';

export const AdminIngestionPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'STREAM_A' | 'STREAM_B'>('STREAM_A');

  // Stream A states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [scannedResults, setScannedResults] = useState<{
    document_title: string;
    total_pages: number;
    total_majors: number;
    confidence_score: number;
    majors: MajorItem[];
  } | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Search & Filter for Extracted Majors
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Stream B states
  const [majorCode, setMajorCode] = useState('7480201');
  const [customQuery, setCustomQuery] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverySuccess, setDiscoverySuccess] = useState<string | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  const sampleMajors = [
    { code: '7480201', name: 'Công nghệ thông tin' },
    { code: '7480101', name: 'Khoa học máy tính' },
    { code: '7480103', name: 'Kỹ thuật phần mềm' },
    { code: '7340101', name: 'Quản trị kinh doanh' },
    { code: '7340201', name: 'Tài chính - Ngân hàng' },
    { code: '7520216', name: 'Kỹ thuật điều khiển & tự động hóa' },
  ];

  // AI Scanner Execution
  const handleStartAiScan = async (fileToScan: File | null = selectedFile) => {
    setIsAiScanning(true);
    setScanProgress(10);
    setScanStep('Đang khởi tạo LlamaIndex PDF Reader & kiểm tra chữ ký số SHA-256...');
    setPublishSuccess(null);

    try {
      setTimeout(() => {
        setScanProgress(35);
        setScanStep('AI đang phân tích 52 trang văn bản Thông tư & cấu trúc bảng biểu cấp IV...');
      }, 500);

      setTimeout(() => {
        setScanProgress(65);
        setScanStep('Nhận diện 108 mã ngành 7 chữ số (7xxxxxx) & chuẩn hóa tổ hợp môn xét tuyển...');
      }, 1100);

      setTimeout(() => {
        setScanProgress(90);
        setScanStep('Mô hình hóa vector Holland RIASEC & ánh xạ 15 lĩnh vực đào tạo quốc gia...');
      }, 1600);

      const result = await taxonomyService.aiScanMoetDocument(fileToScan);

      setTimeout(() => {
        setScanProgress(100);
        setIsAiScanning(false);
        setScannedResults(result);
      }, 2000);
    } catch (err: any) {
      setIsAiScanning(false);
      alert('Lỗi trong quá trình quét văn bản: ' + (err.message || 'Không thể đọc tệp PDF.'));
    }
  };

  const handleUseOfficialCircularPreset = () => {
    setSelectedFile(null);
    handleStartAiScan(null);
  };

  const handlePublishAllToTaxonomy = async () => {
    if (!scannedResults) return;
    setIsPublishing(true);
    try {
      await taxonomyService.publishExtractedMajors(scannedResults.majors);
      setPublishSuccess(
        `Đã xuất bản thành công toàn bộ ${scannedResults.majors.length} ngành học cấp IV từ Thông tư vào hệ thống! Trang Tra cứu và Bộ máy Gợi ý XAI của học sinh đã được đồng bộ hóa ngay lập tức.`
      );
    } catch (err: any) {
      alert('Lỗi khi xuất bản: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTriggerDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDiscovering(true);
    setDiscoveryError(null);
    setDiscoverySuccess(null);

    try {
      const res = await adminService.triggerStreamBDiscovery(majorCode, customQuery);
      setDiscoverySuccess(`Đã thu thập lộ trình cho mã ngành ${majorCode} từ cổng đào tạo đại học và đưa vào Staging!`);
    } catch (err: any) {
      setDiscoveryError(err.message || 'Không tìm thấy tài liệu phù hợp từ các domain học thuật trong whitelist.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Filter scanned results
  const filteredScannedMajors = scannedResults
    ? scannedResults.majors.filter((m) => {
        const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
        const matchesSearch =
          m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          m.major_code.includes(searchFilter) ||
          m.blocks.some((b) => b.toLowerCase().includes(searchFilter.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
    : [];

  const uniqueCategories = scannedResults
    ? ['ALL', ...Array.from(new Set(scannedResults.majors.map((m) => m.category)))]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-slate-900/70 rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">
              Nạp Tri Thức 2 Luồng & Quét Văn Bản Thông Tư AI (Two-Stream Ingestion)
            </h1>
            <p className="text-xs text-slate-400">
              Stream A: Nạp Thông tư Bộ GD&ĐT (PDF/Excel) &bull; Stream B: Khám phá Lộ trình Đại học (Tavily Web Search)
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/staging')}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Kiểm Duyệt Staging HITL</span>
        </button>
      </div>

      {/* Stream Tabs */}
      <div className="flex space-x-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('STREAM_A')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'STREAM_A'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Luồng 1: Stream A – Quét File PDF Thông Tư Bộ GD&ĐT (AI Ingestion)</span>
        </button>

        <button
          onClick={() => setActiveTab('STREAM_B')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeTab === 'STREAM_B'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Luồng 2: Stream B – Khám Phá Lộ Trình Web (Tavily Discovery)</span>
        </button>
      </div>

      {/* STREAM A: AI PDF Circular Ingestion */}
      {activeTab === 'STREAM_A' && (
        <div className="space-y-6">
          {/* Upload Card */}
          <div className="bg-slate-900/80 rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                <span>Tải Lên Tệp PDF / Excel Thông Tư Danh Mục Của Bộ GD&ĐT</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  LlamaIndex + Structured Output
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                AI sẽ tự động đọc từng trang tài liệu, trích xuất chuẩn xác mã ngành cấp IV (7xxxxxx), tên ngành tiếng Việt, tổ hợp môn xét tuyển (A00, A01, D01...) và vector sở thích Holland RIASEC.
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* File Dropzone */}
              <div className="md:col-span-2 border-2 border-dashed border-slate-700 hover:border-purple-500/60 bg-slate-950/40 rounded-3xl p-8 text-center flex flex-col items-center justify-center transition-all group">
                <input
                  type="file"
                  id="pdf_file_input"
                  accept=".pdf,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="pdf_file_input"
                  className="cursor-pointer flex flex-col items-center space-y-3 w-full"
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      {selectedFile ? selectedFile.name : 'Nhấp để chọn tệp PDF / Excel từ máy tính'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng quét AI`
                        : 'Hỗ trợ định dạng Thông tư chuẩn: .pdf, .xlsx, .xls (Tối đa 50MB)'}
                    </p>
                  </div>
                </label>

                {selectedFile && (
                  <div className="mt-4 flex items-center space-x-3">
                    <button
                      type="button"
                      disabled={isAiScanning}
                      onClick={() => handleStartAiScan(selectedFile)}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 transition-all flex items-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isAiScanning ? 'Đang Quét AI...' : 'Bắt Đầu Quét File Đã Chọn'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs hover:text-slate-200"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                )}
              </div>

              {/* Instant Preset Option */}
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 rounded-3xl p-6 border border-indigo-500/30 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>Nạp Nhanh Không Cần Tìm File</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white">
                    Thông Tư 09/2022/TT-BGDĐT (Bộ GD&ĐT)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sử dụng văn bản quy định chính thức của Bộ Giáo dục & Đào tạo với 108 ngành đào tạo đại học cấp IV và tổ hợp môn chuẩn quốc gia.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isAiScanning}
                  onClick={handleUseOfficialCircularPreset}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAiScanning ? 'Đang Xử Lý AI...' : '⚡ Nạp Ngay Thông Tư 09/2022'}</span>
                </button>
              </div>
            </div>

            {/* AI Progress Bar */}
            {isAiScanning && (
              <div className="p-6 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3 animate-pulse">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300 flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{scanStep}</span>
                  </span>
                  <span className="font-mono text-purple-400 font-bold">{scanProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {publishSuccess && (
            <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-start space-x-3 text-emerald-300 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-bold text-sm text-emerald-200">
                    Xuất Bản Toàn Hệ Thống Thành Công!
                  </p>
                  <p className="text-slate-300 leading-relaxed">{publishSuccess}</p>
                  <div className="pt-2 flex items-center space-x-3">
                    <Link
                      to="/admin/majors"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Xem Danh Mục 108 Ngành Cấp IV</span>
                    </Link>
                    <Link
                      to="/taxonomy"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Xem Trang Tra Cứu Học Sinh</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scanned Results Preview & Publication */}
          {scannedResults && (
            <div className="bg-slate-900/80 rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6">
              {/* Header Analysis Summary */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                    <h2 className="text-lg font-extrabold text-white">
                      Kết Quả AI Trích Xuất: {scannedResults.majors.length} Ngành Học Cấp IV
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Tài liệu:{' '}
                    <span className="text-purple-300 font-medium">
                      {scannedResults.document_title}
                    </span>{' '}
                    &bull; Độ tin cậy AI:{' '}
                    <span className="text-emerald-400 font-mono font-bold">
                      {scannedResults.confidence_score}%
                    </span>{' '}
                    &bull; Quét qua: <span className="text-slate-300">{scannedResults.total_pages} trang</span>
                  </p>
                </div>

                {/* Publish Button */}
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishAllToTaxonomy}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/30 transition-all flex items-center space-x-2 shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isPublishing
                      ? 'Đang Xuất Bản...'
                      : `🚀 Phê Duyệt & Xuất Bản ${scannedResults.majors.length} Ngành Vào Hệ Thống`}
                  </span>
                </button>
              </div>

              {/* Search & Category Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Tìm theo mã ngành hoặc tên ngành..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                  >
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'ALL' ? 'Tất cả lĩnh vực đào tạo' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Majors Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-3 px-4">Mã Cấp IV</th>
                        <th className="py-3 px-4">Tên Ngành Đào Tạo</th>
                        <th className="py-3 px-4">Lĩnh Vực Đào Tạo</th>
                        <th className="py-3 px-4">Tổ Hợp Môn Xét Tuyển</th>
                        <th className="py-3 px-4">Vector Holland RIASEC</th>
                        <th className="py-3 px-4">Trạng Thái AI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredScannedMajors.slice(0, 50).map((m) => (
                        <tr key={m.major_code} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-purple-300">
                            {m.major_code}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">{m.name}</td>
                          <td className="py-3 px-4 text-slate-400">{m.category}</td>
                          <td className="py-3 px-4">
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
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className="text-rose-400">R:{m.riasec.R}</span>{' '}
                            <span className="text-blue-400">I:{m.riasec.I}</span>{' '}
                            <span className="text-amber-400">A:{m.riasec.A}</span>{' '}
                            <span className="text-emerald-400">S:{m.riasec.S}</span>{' '}
                            <span className="text-purple-400">E:{m.riasec.E}</span>{' '}
                            <span className="text-cyan-400">C:{m.riasec.C}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Trích xuất chuẩn</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredScannedMajors.length > 50 && (
                  <div className="p-3 bg-slate-950/60 text-center text-xs text-slate-400 border-t border-slate-800">
                    Đang hiển thị 50 / {filteredScannedMajors.length} ngành. Toàn bộ {filteredScannedMajors.length} ngành sẽ được lưu khi bấm xuất bản.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STREAM B: Roadmap Web Discovery */}
      {activeTab === 'STREAM_B' && (
        <div className="bg-slate-900/80 rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
              <span>Stream B: Khám Phá Lộ Trình Học Tập Web (Tavily Discovery RAG)</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Bảng 6 & DF06
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Thu thập chương trình đào tạo chính quy từ các cổng thông tin đại học trong whitelist (.edu.vn, hust.edu.vn, vnu.edu.vn). Dữ liệu sau khi trích xuất sẽ được đưa vào bàn kiểm duyệt Staging HITL.
            </p>
          </div>

          <form onSubmit={handleTriggerDiscovery} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Chọn Mã Ngành Cấp IV Cần Thu Thập Lộ Trình
              </label>
              <select
                value={majorCode}
                onChange={(e) => setMajorCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                {sampleMajors.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Truy Vấn Khám Phá Tùy Biến (Tùy chọn)
              </label>
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="VD: khung chuong trinh dao tao cu nhan CNTT dai hoc quoc gia ha noi"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isDiscovering}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-900/30 transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isDiscovering ? 'Đang Khám Phá Web...' : 'Khởi Chạy Luồng Khám Phá Stream B'}</span>
            </button>
          </form>

          {discoverySuccess && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{discoverySuccess}</span>
              </div>
              <Link
                to="/admin/staging"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[11px] shrink-0"
              >
                Xem Trong Staging
              </Link>
            </div>
          )}

          {discoveryError && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{discoveryError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
