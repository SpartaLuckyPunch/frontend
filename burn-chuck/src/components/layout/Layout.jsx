import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import ChatHeader from './ChatHeader';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="relative">
      {/* 고정 헤더: 채팅 경로면 ChatHeader 사용, 그 외는 기본 Header 사용 */}
      {(() => {
        const loc = useLocation();
        return loc.pathname && loc.pathname.startsWith('/chat') ? <ChatHeader /> : <Header />;
      })()}

      {/* main 설정:
        - h-screen: 화면 높이 꽉 채움
        - overflow-y-auto: 내부 스크롤 허용
        - pt-[90px] pb-[90px]: 헤더/푸터 높이만큼 패딩 (주의사항 적용)
      */}
      <main className="h-screen overflow-y-auto pt-[90px] pb-[90px] box-border">
        {/* 중앙 정렬 컨테이너 */}
        <div className="max-w-[430px] w-full mx-auto bg-white min-h-full">
          <Outlet />
        </div>
      </main>

      {/* 고정 푸터 */}
      <Footer />
    </div>
  );
}