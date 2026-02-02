import axios from 'axios';
import { useAuthStore } from '../features/auth/store/authStore';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  withCredentials: true, // 쿠키 등 인증 정보 포함
});

// 요청 인터셉터: 헤더에 JWT 토큰 자동 추가
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token; // Zustand에서 토큰 꺼내기
  if (token) {
    config.headers.Authorization = `${token}`;
  }
  return config;
});

export default apiClient;