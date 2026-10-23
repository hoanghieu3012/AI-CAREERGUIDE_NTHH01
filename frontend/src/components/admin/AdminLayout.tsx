import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  UploadCloud,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  LogOut,
  ExternalLink,
  Sparkles,
  Server,
  Layers,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Tổng Quan Hệ Thống',
      icon: LayoutDashboard,
      badge: 'Real-time',
    },
    {
      to: '/admin/ingest',
      label: 'Quét & Nạp Thông Tư PDF (AI)',
      icon: UploadCloud,
      badge: 'Stream A & B',
    },
    {
      to: '/admin/staging',
      label: 'Kiểm Duyệt Staging (HITL)',
      icon: ShieldCheck,
      badge: 'DF05',
    },
    {
      to: '/admin/majors',
      label: 'Danh Mục Ngành Cấp IV',
      icon: BookOpen,
      badge: 'TT 09/2022',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  AI CareerGuide
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Governance & Dual RAG Console</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quản Lý & Vận Hành
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-mono">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Cổng Thông Tin Học Sinh
          </div>

          <Link
            to="/recommendations"
            className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30 border border-transparent hover:border-indigo-800/40 transition-all"
          >
            <div className="flex items-center space-x-3">
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              <span>Xem Giao Diện Học Sinh</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>

        {/* Admin User Profile Bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                AD
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {user?.full_name || 'Quản Trị Viên'}
                </p>
                <p className="text-[10px] text-purple-400 font-mono truncate">
                  {user?.email || 'admin@careerguide.edu.vn'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi Admin Portal"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Admin Portal</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-purple-400 font-medium">Bảng Điều Khiển Quản Trị Hệ Thống</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Status Pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>FastAPI & Vector RAG: ONLINE</span>
            </div>

            {/* Quick Switch to Student Portal */}
            <Link
              to="/recommendations"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sang Portal Học Sinh</span>
            </Link>
          </div>
        </header>

        {/* Nested Page View */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
