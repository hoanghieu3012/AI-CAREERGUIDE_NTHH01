import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse, UserProfileDetails } from '../types';
import { authService } from '../services/careerServices';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, fullName?: string, role?: string) => Promise<AuthResponse>;
  logout: () => void;
  consentGranted: boolean;
  grantConsent: () => Promise<void>;
  updateProfile: (profileData: { full_name?: string; profile?: UserProfileDetails }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('careerguide_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('careerguide_token');
  });
  const [consentGranted, setConsentGranted] = useState<boolean>(() => {
    return localStorage.getItem('careerguide_consent') === 'true';
  });

  useEffect(() => {
    if (token && !user) {
      authService.getProfile()
        .then(u => {
          setUser(u);
          localStorage.setItem('careerguide_user', JSON.stringify(u));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res: AuthResponse = await authService.login({ email, password });
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('careerguide_token', res.access_token);
    localStorage.setItem('careerguide_user', JSON.stringify(res.user));
    return res;
  };

  const register = async (email: string, password: string, fullName?: string, role?: string) => {
    const res: AuthResponse = await authService.register({
      email,
      password,
      full_name: fullName,
      role: role || 'STUDENT',
    });
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('careerguide_token', res.access_token);
    localStorage.setItem('careerguide_user', JSON.stringify(res.user));
    return res;
  };

  const grantConsent = async () => {
    setConsentGranted(true);
    localStorage.setItem('careerguide_consent', 'true');
    if (token) {
      try {
        await authService.submitConsent({
          consent_purpose: 'Xử lý dữ liệu định hướng nghề nghiệp theo Luật số 91/2025/QH15',
          granted: true,
        });
      } catch (e) {
        console.warn('Failed to sync consent with backend:', e);
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('careerguide_token');
    localStorage.removeItem('careerguide_user');
  };

  const updateProfile = (profileData: { full_name?: string; profile?: UserProfileDetails }) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      full_name: profileData.full_name !== undefined ? profileData.full_name : user.full_name,
      profile: {
        ...(user.profile || {}),
        ...(profileData.profile || {}),
      },
    };
    setUser(updatedUser);
    localStorage.setItem('careerguide_user', JSON.stringify(updatedUser));
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin,
        login,
        register,
        logout,
        consentGranted,
        grantConsent,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
