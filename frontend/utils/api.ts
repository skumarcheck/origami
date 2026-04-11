import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function apiCall(endpoint: string, options: any = {}) {
  const token = await AsyncStorage.getItem('access_token');
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = `${BASE_URL}/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Something went wrong' }));
    const detail = error.detail;
    let message = 'Something went wrong';
    if (typeof detail === 'string') message = detail;
    else if (Array.isArray(detail)) message = detail.map((e: any) => e.msg || JSON.stringify(e)).join(' ');
    else if (detail?.msg) message = detail.msg;
    throw new Error(message);
  }
  return response.json();
}
