import apiClient from '../../../api/axiosClient';
import { useAuthStore } from '../store/authStore';

export async function login(email, password) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
}

export function useAuth() {
  const setToken = useAuthStore((s) => s.setToken);
  const setRefreshToken = useAuthStore((s) => s.setRefreshToken);
  // const setUser = useAuthStore((s) => s.setUser); // 이건 필요 없음

  const doLogin = async (email, password) => {
    const data = await login(email, password);
    
    if (data && data.success) {
      const token = data.data?.token;
      const refresh = data.data?.refreshToken;
      // 토큰과 리프레시 토큰을 저장
      if (token) setToken(token);
      if (refresh) setRefreshToken(refresh);
    }
    return data;
  };

  return { doLogin };
}