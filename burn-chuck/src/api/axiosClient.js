import axios from 'axios';
// authStore는 이제 토큰이 아니라 '로그인 상태/유저 정보'만 관리하므로,
// 순환 참조 문제를 피하기 위해 필요하다면 가져오되, 토큰을 꺼내는 용도로는 쓰지 않습니다.
// 여기서는 reissue(재발급) 함수 호출을 위해 가져옵니다.
import { useAuthStore } from '../features/auth/store/authStore';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  withCredentials: true, // [필수] 이게 있어야 쿠키를 주고받습니다.
});

// [삭제됨] 요청 인터셉터: 더 이상 헤더에 토큰을 수동으로 넣을 필요가 없습니다.
// 브라우저가 쿠키에 있는 Access Token을 자동으로 보냅니다.

// 응답 인터셉터: 401 발생 시 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 401 에러가 났고, 아직 재시도하지 않은 요청이라면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 1. 스토어의 재발급 함수 호출 (내부적으로 POST /auth/reissue 호출)
        // 이 요청도 withCredentials: true 덕분에 Refresh Token 쿠키가 자동으로 실려갑니다.
        const reissued = await useAuthStore.getState().reissue();

        if (reissued) {
          // 2. 재발급 성공! (서버가 응답 헤더로 새 Access Token 쿠키를 구워줌)
          // 3. 원래 하려던 요청을 다시 시도합니다. (이제 새 쿠키가 있으니 성공할 것임)
          return apiClient(originalRequest);
        }
      } catch (e) {
        console.error('Auto-login (reissue) failed:', e);
        // 재발급 실패 시 로그아웃 처리 등을 할 수 있음
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// --- API 함수들은 그대로 두셔도 됩니다 ---

// 채팅방 이름 변경 API
export const updateChatRoomName = async (roomId, newName) => {
  const response = await apiClient.patch(`/chat/${roomId}/name`, { name: newName });
  return response.data;
};