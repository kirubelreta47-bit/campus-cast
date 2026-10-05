import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lecturer } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  lecturer: Lecturer | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  switchAccount: (lecturerId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lecturer, setLecturer] = useState<Lecturer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await api.getCurrentLecturer();
        setLecturer(user);
      } catch {
        setLecturer(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password?: string) => {
    const user = await api.logIn(email, password);
    setLecturer(user);
  };

  const signup = async (name: string, email: string, password?: string) => {
    const user = await api.signUp(name, email, password);
    setLecturer(user);
  };

  const loginWithGoogle = async () => {
    const user = await api.logInWithGoogle();
    setLecturer(user);
  };

  const switchAccount = async (lecturerId: string) => {
    const user = await api.switchLecturer(lecturerId);
    setLecturer(user);
  };

  const logout = async () => {
    await api.logOut();
    setLecturer(null);
  };

  return (
    <AuthContext.Provider
      value={{
        lecturer,
        loading,
        login,
        signup,
        loginWithGoogle,
        switchAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
