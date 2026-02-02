import apiClient from '../../../api/axiosClient';
import { useAuthStore } from '../store/authStore';

export async function login(email, password) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
}

export function useAuth() {
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const doLogin = async (email, password) => {
    const data = await login(email, password);
    if (data && data.success) {
      const token = data.data?.token;
      if (token) setToken(token);
      // if API returns user info, store it; otherwise store email as minimal info
      const user = data.data?.user ?? { email };
      setUser(user);
    }
    return data;
  };

  return { doLogin };
}
