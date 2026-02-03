import apiClient from '../../../api/axiosClient';
import { useAuthStore } from '../store/authStore';

export async function login(email, password) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
}

export function useAuth() {
  const setToken = useAuthStore((s) => s.setToken);
  // const setUser = useAuthStore((s) => s.setUser); // 이건 필요 없음

  const doLogin = async (email, password) => {
    const data = await login(email, password);
    
    if (data && data.success) {
      const token = data.data?.token;
      // 토큰만 던져주면 Store가 알아서 해석하고 id, user 정보 다 채워넣음
      if (token) setToken(token);
    }
    return data;
  };

  return { doLogin };
}