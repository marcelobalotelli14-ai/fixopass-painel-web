import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_KEY = 'fixopass_api_base';
const DEFAULT_API_BASE = 'http://localhost:3000'; // Trocar pelo endereço real do backend em produção

export async function getApiBase(): Promise<string> {
  const saved = await AsyncStorage.getItem(API_BASE_KEY);
  return saved || DEFAULT_API_BASE;
}

export async function setApiBase(url: string): Promise<void> {
  await AsyncStorage.setItem(API_BASE_KEY, url);
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  userId?: string | null;
};

/**
 * Wrapper simples de fetch para a API do FIXO PASS.
 * Envia X-USER-ID quando userId é informado (sessão do app, MVP).
 */
export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const base = await getApiBase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.userId) headers['X-USER-ID'] = options.userId;

  const res = await fetch(`${base}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error((data && data.error) || `Erro ${res.status}`);
  }

  return data as T;
}
