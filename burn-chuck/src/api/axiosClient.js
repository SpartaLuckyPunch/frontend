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

// 응답 인터셉터: 401 발생 시 토큰 재발급 시도하고 원래 요청 재시도
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // 이미 재시도 한 요청인지 확인
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const reissued = await useAuthStore.getState().reissue();
        if (reissued) {
          // 새로운 토큰이 적용되었으므로 원래 요청 재시도
          return apiClient(originalRequest);
        }
      } catch (e) {
        console.error('reissue failed in interceptor', e);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// 채팅방 이름 변경 API
export const updateChatRoomName = async (roomId, newName) => {
  const response = await apiClient.patch(`/chat/${roomId}/name`, { name: newName });
  return response.data;
};