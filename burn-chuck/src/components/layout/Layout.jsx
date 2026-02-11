import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import ChatHeader from './ChatHeader';
import Footer from './Footer';
import { Plus } from 'lucide-react'; // 아이콘 추가

export default function Layout() {
  const loc = useLocation();
  const navigate = useNavigate();

  // 현재 페이지가 홈페이지('/')인지 확인
  const isHomePage = loc.pathname === '/';

  return (
    <div className="relative bg-gray-50 min-h-screen"> 
      {/* 배경색(bg-gray-50)은 선택사항입니다 */}

      {/* 헤더 영역 */}
      {loc.pathname && loc.pathname.startsWith('/chat') ? <ChatHeader /> : <Header />}

      <main className="h-screen overflow-y-auto pt-[90px] pb-[90px] box-border scrollbar-hide">
        <div className="max-w-[430px] w-full mx-auto bg-white min-h-full shadow-lg relative">
          <Outlet />
        </div>
      </main>

      {isHomePage && (
        <div className="fixed bottom-[105px] left-0 right-0 mx-auto max-w-[430px] w-full z-50 px-5 pointer-events-none flex justify-end">
          <button
            onClick={() => navigate('/meetings/create')}
            className="pointer-events-auto bg-indigo-600 text-white w-12 h-12 rounded-full shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center"
            aria-label="모임 만들기"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* 푸터 영역 */}
      <Footer />
    </div>
  );
}