import apiClient from '../../../api/axiosClient';
import { useAuthStore } from '../store/authStore';

// 1. 로그인 요청
export async function login(email, password) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
}

// 2. [추가] 내 프로필 조회 요청 (쿠키가 세팅된 상태에서 호출됨)
export async function fetchMyProfile() {
  const res = await apiClient.get('/users'); 
  return res.data;
}

export function useAuth() {
  const setLoginSuccess = useAuthStore((s) => s.setLoginSuccess);
  const logoutStore = useAuthStore((s) => s.logout);

  const doLogin = async (email, password) => {
    try {
      // 1단계: 로그인 시도 (HttpOnly 쿠키 발급)
      const loginRes = await login(email, password);

      if (loginRes && loginRes.success) {
        // 2단계: 쿠키가 세팅되었으니, 바로 내 정보 조회 API 호출
        const profileRes = await fetchMyProfile();

        if (profileRes && profileRes.success) {
          const userData = profileRes.data; // 백엔드의 UserGetOneResponse

          // [중요] 백엔드 DTO(userId)와 프론트엔드 스토어(id)의 필드명을 맞춰줍니다.
          // Footer.jsx에서 user.id를 쓰고 있으므로 여기서 매핑해주는 게 좋습니다.
          const mappedUser = {
            id: userData.userId,        // userId -> id 로 매핑
            email: userData.email,
            nickname: userData.nickname,
            role: userData.userRole,
          };

          // 3단계: 스토어에 저장 및 로그인 상태 true 변경
          setLoginSuccess(mappedUser);
        }
      }
      return loginRes;
    } catch (error) {
      // 로그인 실패 시 스토어 초기화
      logoutStore();
      throw error;
    }
  };

  const doLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      logoutStore();
    }
  };

  return { doLogin, doLogout };
}