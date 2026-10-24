import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  Layers,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  GraduationCap,
  ChevronDown,
  Check,
} from 'lucide-react';
import { taxonomyService } from '../../services/careerServices';
import { MajorItem } from '../../data/defaultTaxonomy';
import { useAuth } from '../../context/AuthContext';

export const TaxonomyPage: React.FC = () => {
  const { user } = useAuth();
  const [majorsList, setMajorsList] = useState<MajorItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadMajors();
    const handleUpdate = () => loadMajors();
    window.addEventListener('careerguide_taxonomy_updated', handleUpdate);
    return () => window.removeEventListener('careerguide_taxonomy_updated', handleUpdate);
  }, []);

  const loadMajors = async () => {
    const list = await taxonomyService.fetchMajors();
    setMajorsList(list);
  };

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(majorsList.map((m) => m.category)))], [majorsList]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: majorsList.length };
    majorsList.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, [majorsList]);

  const filteredCategories = useMemo(() => {
    if (!categorySearchTerm.trim()) return categories;
    const term = categorySearchTerm.toLowerCase();
    return categories.filter((c) => (c === 'ALL' ? 'tất cả lĩnh vực' : c.toLowerCase()).includes(term));
  }, [categories, categorySearchTerm]);

  const filteredMajors = majorsList.filter((m) => {
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.major_code.includes(term) ||
      m.blocks.some((b) => b.toLowerCase().includes(term)) ||
      m.careers.some((c) => c.toLowerCase().includes(term));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 flex items-center space-x-2">
              <span>Danh Mục Ngành Giáo Dục Đào Tạo Cấp IV (Bộ GD&ĐT)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-brand-700 font-mono font-bold">
                TT 09/2022
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Tra cứu chính thức theo mã ngành cấp IV & Cây phân loại nghề nghiệp Phoenix Ho
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            Hiển thị {filteredMajors.length} / {majorsList.length} ngành
          </span>
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/ingest"
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nạp Thêm Thông Tư PDF</span>
            </Link>
          )}
        </div>
      </div>

      {/* Notice when only 6 majors loaded */}
      {majorsList.length <= 6 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              Hệ thống hiện có 6 ngành mẫu. Để xem toàn bộ 108 ngành theo Thông tư 09/2022/TT-BGDĐT, vui lòng vào trang Admin để nạp tệp PDF Thông tư.
            </span>
          </div>
          {user?.role === 'ADMIN' ? (
            <Link
              to="/admin/ingest"
              className="font-bold underline text-brand-700 shrink-0 hover:text-brand-800"
            >
              Mở Trình Quét PDF Thông Tư &rarr;
            </Link>
          ) : (
            <button
              onClick={() => {
                taxonomyService.publishExtractedMajors(taxonomyService.getAllOfficialMoetMajors());
                loadMajors();
              }}
              className="px-3 py-1 rounded-lg bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-bold shrink-0 text-[11px]"
            >
              Xem ngay 108 ngành đầy đủ
            </button>
          )}
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên ngành, mã ngành 7 chữ số (ví dụ: 7480201), tổ hợp thi (A00, D01)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white shadow-sm"
          />
        </div>

        {/* Category List Dropdown Selector (Replaces horizontal scrollbar) */}
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full sm:w-auto flex items-center justify-between space-x-3 px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 shadow-sm transition-all sm:min-w-[280px]"
          >
            <div className="flex items-center space-x-2 truncate">
              <Layers className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="truncate">
                {selectedCategory === 'ALL'
                  ? `Tất Cả Lĩnh Vực (${majorsList.length} ngành)`
                  : `${selectedCategory} (${categoryCounts[selectedCategory] || 0} ngành)`}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                isCategoryDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Sổ ra danh sách các lĩnh vực khi bấm vào */}
          {isCategoryDropdownOpen && (
            <div className="absolute left-0 sm:right-0 mt-2 w-full sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 pb-2 border-b border-slate-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    placeholder="Tìm nhanh tên lĩnh vực..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-50">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count = categoryCounts[cat] || 0;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-brand-50 text-brand-700 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-brand-600' : 'bg-slate-300'}`} />
                        <span className="truncate">{cat === 'ALL' ? 'Tất Cả Lĩnh Vực Đào Tạo' : cat}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {count} ngành
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Phoenix Ho Career Tree Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMajors.map((m) => (
          <div
            key={m.major_code}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all space-y-5"
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {m.major_code}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    {m.category}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">{m.name}</h3>
              </div>

              <Link
                to={`/roadmap/${m.major_code}`}
                className="p-2 rounded-xl bg-slate-50 hover:bg-brand-50 text-slate-500 hover:text-brand-600 transition-colors"
                title="Xem lộ trình học tập"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Tree Branch 1: Realistic Occupations */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold text-slate-700 flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                <span>Nghề nghiệp đầu ra thực tế (Cây Phoenix Ho):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {m.careers && m.careers.length > 0 ? (
                  m.careers.map((occ, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60"
                    >
                      {occ}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Cử nhân / Kỹ sư chuyên môn ngành {m.name}
                  </span>
                )}
              </div>
            </div>

            {/* Tree Branch 2: Admission Combinations & Holland Vector */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-400 font-bold block mb-1">Tổ hợp xét tuyển:</span>
                <div className="flex flex-wrap gap-1">
                  {m.blocks.map((b) => (
                    <span
                      key={b}
                      className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Holland RIASEC:</span>
                <div className="font-mono text-[10px] space-x-1">
                  <span className="text-rose-600 font-bold">R:{m.riasec.R}</span>
                  <span className="text-blue-600 font-bold">I:{m.riasec.I}</span>
                  <span className="text-amber-600 font-bold">A:{m.riasec.A}</span>
                  <span className="text-emerald-600 font-bold">S:{m.riasec.S}</span>
                </div>
              </div>
            </div>

            {/* Bottom Action */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-50">
              <span className="text-[11px] text-slate-500 line-clamp-1 max-w-[280px]">
                {m.outlook}
              </span>
              <Link
                to={`/roadmap/${m.major_code}`}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1 shrink-0"
              >
                <span>Chi tiết lộ trình</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
