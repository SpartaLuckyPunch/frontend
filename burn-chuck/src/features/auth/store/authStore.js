import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../../../api/axiosClient'; // axios import 수정

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,       // 유저 정보 (닉네임, 이메일, 권한 등)
      isLoggedIn: false, // 로그인 상태 여부

      // 로그인 성공 시 호출: 백엔드에서 받은 유저 정보를 저장
      setLoginSuccess: (userData) => {
        set({ user: userData, isLoggedIn: true });
      },

      // 로그아웃: 스토어 비우기 (서버 로그아웃 요청은 useAuth 등에서 처리)
      logout: () => {
        set({ user: null, isLoggedIn: false });
      },

      // 토큰 재발급 (Reissue)
      // 쿠키 방식에서는 브라우저가 알아서 Refresh Token 쿠키를 보냄
      // 성공하면 서버가 알아서 새로운 Access Token 쿠키를 구워줌
      reissue: async () => {
        try {
          // endpoint는 서버 설정에 따라 다름 (보통 /auth/reissue)
          const res = await apiClient.post('/auth/reissue');
          // 서버가 200 OK를 주면 쿠키가 갱신된 것임 -> 로그인 유지
          if (res?.data?.success) {
            return true;
          }
          throw new Error('Reissue failed');
        } catch (err) {
          console.error('Auto-login failed:', err);
          get().logout(); // 실패 시 로그아웃 처리
          return false;
        }
      },
    }),
    {
      name: 'auth-user-storage', // 토큰이 없으므로 이름 변경 (선택사항)
      getStorage: () => localStorage, // 유저 정보(닉네임 등)는 유지해도 됨
    }
  )
);

export default useAuthStore;