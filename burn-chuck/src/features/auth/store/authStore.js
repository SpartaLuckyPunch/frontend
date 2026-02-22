import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
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

      logout: async (skipApiCall = false) => {
        
        // skipApiCall이 false일 때만(평소 로그아웃) 서버에 요청을 보냄
        if (!skipApiCall) {
          try {
            await apiClient.post('/auth/logout');
          } catch (err) {
            console.error('Logout API failed:', err);
          }
        }

        // [중요] API 요청 여부와 상관없이, 내 화면(State)은 무조건 비워야 함!
        set({ user: null, isLoggedIn: false, userAddress: null, isAddressLoading: false });
        
        // (필요하다면 로컬스토리지 강제 삭제)
        // localStorage.removeItem('auth-user-storage');
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
        console.log('fetchUserAddress - isAddressLoading:', get().isAddressLoading);
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
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        userAddress: state.userAddress,
      }),
    }
  )
);

export default useAuthStore;