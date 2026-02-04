import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../../../api/axiosClient';

export const useUserStore = create(
  persist(
    (set, get) => ({
      // 상태 (State)
      userAddress: null, // { province, city, district, latitude, longitude }
      isLoading: false,
      error: null,

      // 액션 (Actions)
      
      // 1. 내 주소 정보 가져오기 (API 호출)
      fetchUserAddress: async () => {
        // 이미 로딩 중이면 중복 호출 방지 (선택 사항)
        if (get().isLoading) return;

        set({ isLoading: true, error: null });
        try {
          const res = await apiClient.get('/users/address');
          // API 응답 구조: res.data.data -> { latitude, longitude, ... }
          const addressData = res?.data?.data;

          if (addressData) {
            set({ userAddress: addressData, isLoading: false });
          } else {
            // 데이터가 없는 경우 (아직 주소 설정을 안 한 유저 등)
            set({ userAddress: null, isLoading: false });
          }
        } catch (err) {
          console.error('주소 조회 실패:', err);
          set({ error: err, isLoading: false });
        }
      },

      // 2. 수동으로 주소 업데이트 (예: 주소 변경 페이지에서 변경 성공 시 호출)
      setUserAddress: (newAddress) => {
        set({ userAddress: newAddress });
      },

      // 3. 초기화 (로그아웃 시 사용)
      clearUserStore: () => {
        set({ userAddress: null, error: null, isLoading: false });
      },
    }),
    {
      name: 'user-info-storage', // localStorage에 저장될 키 이름 (auth-storage와 다르게 설정)
      getStorage: () => localStorage, // 세션 스토리지로 바꾸고 싶으면 sessionStorage
    }
  )
);

export default useUserStore;