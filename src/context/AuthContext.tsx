import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // For a loading indicator

// This interface defines the structure of the decoded user object from the JWT
interface User {
  user_id: number;
  sub: string; // The user's email
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // <-- ADDED loading state
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // <-- ADDED loading state, default to true
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decodedUser: User = jwtDecode(token);
          const tokenExp = (jwtDecode(token) as any).exp;
          if (Date.now() >= tokenExp * 1000) {
            localStorage.removeItem('accessToken');
            setUser(null);
          } else {
            setUser(decodedUser);
          }
        } catch (error) {
          console.error("Invalid token found:", error);
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      }
      // --- CRITICAL: Set loading to false after the check is complete ---
      setIsLoading(false);
    };

    checkUser();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('accessToken', token);
    const decodedUser: User = jwtDecode(token);
    setUser(decodedUser);
    if (decodedUser.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, user, login, logout }}>
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

