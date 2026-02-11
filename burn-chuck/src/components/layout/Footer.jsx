import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Search, MessageCircle, User } from 'lucide-react';
import useAuthStore from '../../features/auth/store/authStore';

export default function Footer() {
  const location = useLocation();
  
  // 1. 스토어에서 유저 정보와 로그인 상태 가져오기
  // (구조 분해 할당으로 깔끔하게 가져옵니다)
  const { user, isLoggedIn } = useAuthStore();
  
  // 2. 프로필 경로 생성 로직 수정
  // 로그인이 되어있고(isLoggedIn) 유저 정보(user)가 있을 때만 프로필로 이동
  // 아니면 로그인 페이지로 이동
  const profilePath = (isLoggedIn && user?.id) ? `/profile/${user.id}` : '/login';

  // 3. 현재 경로가 active인지 확인하는 헬퍼 함수
  const getLinkClass = (path) => {
    // 정확히 일치하거나 해당 경로로 시작하는 경우 활성화
    const isActive = path === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(path);

    const baseClass = "flex flex-col items-center justify-center gap-1 no-underline transition-colors duration-200 cursor-pointer";
    // Tailwind 색상 클래스는 그대로 유지
    const activeClass = isActive ? "text-green-600 font-bold" : "text-gray-400 hover:text-gray-600";
    
    return `${baseClass} ${activeClass}`;
  };

  // 아이콘 스타일 헬퍼 (중복 코드 제거용)
  const getIconStyle = (path) => ({
    size: 24,
    // 활성화 여부에 따라 두께 조절
    strokeWidth: (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)) ? 2.5 : 2
  });

  return (
    // box-shadow를 추가하여 하단 네비게이션을 좀 더 돋보이게 함 (선택사항)
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[70px] bg-white border-t border-gray-100 z-[1000] pb-2 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      <div className="h-full flex items-center justify-around px-2">
        
        <Link to="/" className={getLinkClass('/')}>
          <Home {...getIconStyle('/')} />
          <span className="text-[10px] mt-1">홈</span>
        </Link>

        <Link to="/my-meetings" className={getLinkClass('/my-meetings')}>
          <Layers {...getIconStyle('/my-meetings')} />
          <span className="text-[10px] mt-1">나의 모임</span>
        </Link>

        <Link to="/search" className={getLinkClass('/search')}>
          <Search {...getIconStyle('/search')} />
          <span className="text-[10px] mt-1">검색</span>
        </Link>

        <Link to="/chat" className={getLinkClass('/chat')}>
          <MessageCircle {...getIconStyle('/chat')} />
          <span className="text-[10px] mt-1">채팅</span>
        </Link>

        {/* 4. 동적 프로필 링크 적용 */}
        {/* 링크의 active 상태 체크할 때 profilePath가 '/login'일 수도 있으므로 주의 */}
        <Link to={profilePath} className={getLinkClass(isLoggedIn ? `/profile/${user?.id}` : '/login')}>
          <User {...getIconStyle(isLoggedIn ? `/profile/${user?.id}` : '/login')} />
          <span className="text-[10px] mt-1">프로필</span>
        </Link>

      </div>
    </div>
  );
}