import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, fetchMyProfile } from '../features/auth/hooks/useAuth'; // fetchMyProfile import 필요
import { useAuthStore } from '../features/auth/store/authStore';
import useUserStore from '../features/auth/store/useUserStore';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const setLoginSuccess = useAuthStore((state) => state.setLoginSuccess);
  const fetchUserAddress = useUserStore((state) => state.fetchUserAddress);

  useEffect(() => {
    const syncLoginState = async () => {
      try {
        // 1. 이미 백엔드에서 쿠키를 설정했으므로, 바로 내 정보 조회
        const res = await fetchMyProfile();

        if (res && res.success) {
          const userData = res.data;

          // 2. 스토어에 유저 정보 저장 (일반 로그인 로직과 동일하게 매핑)
          const mappedUser = {
            id: userData.userId,
            email: userData.email,
            nickname: userData.nickname,
            role: userData.userRole,
          };
          
          setLoginSuccess(mappedUser);

          // 3. 주소 정보 등 추가 정보 로드
          await fetchUserAddress();

          // 4. 메인으로 이동
          navigate('/', { replace: true });
        } else {
          throw new Error("Profile fetch failed");
        }
      } catch (error) {
        console.error("Social Login Failed", error);
        alert("소셜 로그인 처리에 실패했습니다.");
        navigate('/login', { replace: true });
      }
    };

    syncLoginState();
  }, [navigate, setLoginSuccess, fetchUserAddress]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-gray-600 font-medium">로그인 처리 중입니다...</p>
    </div>
  );
}