import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'fixopass_user_session';

type Session = { userId: string; nomeCompleto: string } | null;

type AuthContextValue = {
  session: Session;
  carregando: boolean;
  entrar: (session: NonNullable<Session>) => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) setSession(JSON.parse(raw));
      })
      .catch(() => {
        // Se o AsyncStorage falhar, segue sem sessão salva em vez de travar
        // o app no spinner de carregamento pra sempre.
      })
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(novaSessao: NonNullable<Session>) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(novaSessao));
    setSession(novaSessao);
  }

  async function sair() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, carregando, entrar, sair }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
