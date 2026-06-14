import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User } from '../types/user';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../utils/tokenStorage';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean
  ) => Promise<User>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authService
      .getMe()
      .then((userData) => setUser(userData))
      .catch((err) => {
        console.warn('Auth bootstrap failed, clearing tokens:', err.message);
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean
  ): Promise<User> => {
    tokenStorage.setTokens(accessToken, refreshToken, rememberMe);
    setIsLoading(true);
    try {
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } catch (err) {
      tokenStorage.clear();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      // Fire-and-forget, không đợi BE
      authService.logout(refreshToken).catch(() => {});
    }
    tokenStorage.clear();
    setUser(null);
  };

  const refetchUser = async (): Promise<void> => {
    if (!tokenStorage.getAccessToken()) return;
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Refetch user failed:', err);
      logout();
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}