import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Search, MessageCircle, User } from 'lucide-react';
import useAuthStore from '../../features/auth/store/authStore';

export default function Footer() {
  const location = useLocation();
  
  // 1. 스토어에서 내 정보 가져오기
  const user = useAuthStore((state) => state.user);
  const myId = user?.id;

  // 2. 프로필 경로 생성 (로그인 안했으면 로그인 페이지로)
  const profilePath = myId ? `/profile/${myId}` : '/login';

  // 3. 현재 경로가 active인지 확인하는 헬퍼 함수
  const getLinkClass = (path) => {
    // 정확히 일치하거나 해당 경로로 시작하는 경우 활성화
    // (단, 홈('/')은 정확히 일치해야 함)
    const isActive = path === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(path);

    const baseClass = "flex flex-col items-center justify-center gap-1 no-underline transition-colors duration-200 cursor-pointer";
    const activeClass = isActive ? "text-indigo-600 font-bold" : "text-gray-400 hover:text-gray-600";
    
    return `${baseClass} ${activeClass}`;
  };

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[80px] bg-white border-t border-[#eee] z-[1000] box-border pb-2">
      <div className="h-full flex items-center justify-around px-2">
        
        <Link to="/" className={getLinkClass('/')}>
          <Home size={24} strokeWidth={getLinkClass('/').includes('text-indigo-600') ? 2.5 : 2} />
          <span className="text-[10px]">홈</span>
        </Link>

        <Link to="/my-meetings" className={getLinkClass('/my-meetings')}>
          <Layers size={24} strokeWidth={getLinkClass('/my-meetings').includes('text-indigo-600') ? 2.5 : 2} />
          <span className="text-[10px]">나의 모임</span>
        </Link>

        <Link to="/search" className={getLinkClass('/search')}>
          <Search size={24} strokeWidth={getLinkClass('/search').includes('text-indigo-600') ? 2.5 : 2} />
          <span className="text-[10px]">검색</span>
        </Link>

        <Link to="/chat" className={getLinkClass('/chat')}>
          <MessageCircle size={24} strokeWidth={getLinkClass('/chat').includes('text-indigo-600') ? 2.5 : 2} />
          <span className="text-[10px]">채팅</span>
        </Link>

        {/* 4. 동적 프로필 링크 적용 */}
        <Link to={profilePath} className={getLinkClass('/profile/' + myId)}>
          <User size={24} strokeWidth={getLinkClass('/profile/' + myId).includes('text-indigo-600') ? 2.5 : 2} />
          <span className="text-[10px]">프로필</span>
        </Link>

      </div>
    </div>
  );
}