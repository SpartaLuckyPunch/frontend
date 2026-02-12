import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../../../api/axiosClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // =================================================
      // [1] 인증(Auth) 관련 상태
      // =================================================
      user: null,       // { id, nickname, email, role... }
      isLoggedIn: false,

      setLoginSuccess: (userData) => {
        set({ user: userData, isLoggedIn: true });
      },

      logout: () => {
        // 로그아웃 시 유저 정보와 주소 정보 모두 초기화
        set({ user: null, isLoggedIn: false, userAddress: null });
      },

      reissue: async () => {
        try {
          const res = await apiClient.post('/auth/reissue');
          if (res?.data?.success) {
            return true;
          }
          throw new Error('Reissue failed');
        } catch (err) {
          console.error('Auto-login failed:', err);
          get().logout();
          return false;
        }
      },

      // =================================================
      // [2] 주소(Address) 관련 상태 (병합됨)
      // =================================================
      userAddress: null, 
      isAddressLoading: false, // 로딩 상태 충돌 방지를 위해 이름 변경

      // 주소 정보 가져오기 액션
      fetchUserAddress: async () => {
        if (get().isAddressLoading) return;

        set({ isAddressLoading: true });
        try {
          const res = await apiClient.get('/users/address');
          // 응답 구조: res.data.data -> { province, city, district, latitude, longitude }
          const addressData = res?.data?.data;

          if (addressData) {
            set({ userAddress: addressData, isAddressLoading: false });
          } else {
            set({ userAddress: null, isAddressLoading: false });
          }
        } catch (err) {
          console.error('주소 조회 실패:', err);
          set({ isAddressLoading: false });
        }
      },

      // 수동 주소 업데이트
      setUserAddress: (newAddress) => {
        set({ userAddress: newAddress });
      },
    }),
    {
      name: 'auth-user-storage', // 로컬 스토리지 키 이름
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;