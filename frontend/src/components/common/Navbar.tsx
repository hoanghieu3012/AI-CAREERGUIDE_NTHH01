import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  GraduationCap,
  Sparkles,
  Flame,
  FileSpreadsheet,
  BrainCircuit,
  MapPin,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAssessment } from '../../context/AssessmentContext';
import { StudentProfileModal } from '../profile/StudentProfileModal';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { xpPoints, streakDays } = useAssessment();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'privacy'>('profile');

  const navLinks = [
    { name: 'Giới Thiệu', path: '/', icon: Sparkles, public: true },
    { name: 'Định Hướng Nghề Nghiệp', path: '/guidance', icon: BrainCircuit, public: false },
    { name: 'Khám Phá Ngành', path: '/taxonomy', icon: Compass, public: true },
    { name: 'Lộ Trình Học Tập', path: '/roadmaps', icon: MapPin, public: false },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/guidance') {
      return (
        location.pathname.startsWith('/guidance') ||
        location.pathname === '/assessment' ||
        location.pathname === '/academic-transcript' ||
        location.pathname === '/recommendations'
      );
    }
    if (path === '/roadmaps') {
      return location.pathname.startsWith('/roadmaps') || location.pathname.startsWith('/roadmap/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-brand-700 via-indigo-600 to-gamify-violet bg-clip-text text-transparent">
                AI CareerGuide
              </span>
              <span className="hidden sm:inline-block ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                Thông tư 09
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const active = isActive(link.path);
              const targetPath = !isAuthenticated && !link.public ? `/login?redirect=${encodeURIComponent(link.path)}` : link.path;
              return (
                <Link
                  key={link.path}
                  to={targetPath}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-brand-50 text-brand-700 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-purple-900/20"
              >
                <ShieldCheck className="w-4 h-4 text-purple-200" />
                <span>🛡️ Admin Portal</span>
              </Link>
            )}
          </nav>

          {/* Gamification Badges & Auth Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Only display Streak & XP when user is authenticated */}
            {isAuthenticated && (
              <>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold shadow-sm">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{streakDays} ngày streak</span>
                </div>

                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-xs font-bold shadow-sm">
                  <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                  <span>{xpPoints} XP</span>
                </div>
              </>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user?.full_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hồ sơ cá nhân</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700">
                          {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Học sinh'}
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-900 truncate">
                        {user?.full_name || 'Học Sinh Demo'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {user?.email}
                      </p>
                      {user?.profile?.school_name && (
                        <p className="text-[10px] text-slate-400 truncate">
                          🏫 {user.profile.school_name}
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileModalTab('profile');
                          setProfileModalOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-bold transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-brand-600" />
                        <span>Xem & Chỉnh Sửa Hồ Sơ</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileModalTab('privacy');
                          setProfileModalOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-emerald-700 hover:bg-emerald-50/60 font-bold transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>🛡️ Bảo Mật Dữ Liệu & AI Shield</span>
                      </button>
                    </div>

                    {isAdmin && (
                      <div className="border-t border-slate-100 py-1">
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs text-purple-700 bg-purple-50/50 hover:bg-purple-100 font-bold"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Vào Admin Portal Quản Trị</span>
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/25 transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map(link => {
            const Icon = link.icon;
            const active = isActive(link.path);
            const targetPath = !isAuthenticated && !link.public ? `/login?redirect=${encodeURIComponent(link.path)}` : link.path;
            return (
              <Link
                key={link.path}
                to={targetPath}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                  active ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <ShieldCheck className="w-5 h-5 text-purple-200" />
              <span>Vào Cổng Quản Trị (Admin Portal)</span>
            </Link>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setProfileModalTab('profile');
                    setProfileModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 text-slate-700 font-bold text-sm py-1.5"
                >
                  <UserIcon className="w-4 h-4 text-brand-600" />
                  <span>Hồ Sơ Học Sinh ({user?.full_name || user?.email})</span>
                </button>

                <button
                  onClick={() => {
                    setProfileModalTab('privacy');
                    setProfileModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 text-emerald-700 font-bold text-sm py-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Bảo Mật Dữ Liệu & AI Shield</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 text-rose-600 font-bold text-sm py-1.5 border-t border-slate-100 pt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-md"
              >
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Student Profile & Privacy Shield Modal */}
      <StudentProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        defaultTab={profileModalTab}
      />
    </header>
  );
};
