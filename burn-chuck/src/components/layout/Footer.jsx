import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[90px] bg-white border-t border-[#ddd] z-[1000] box-border">
      <div className="h-full flex items-center justify-around px-[10px]">
        <Link to="/" className="no-underline text-[#111] text-[12px]">홈</Link>
        <Link to="/my-meetings" className="no-underline text-[#111] text-[12px]">나의 모임</Link>
        <Link to="/search" className="no-underline text-[#111] text-[12px]">검색</Link>
        <Link to="/chat" className="no-underline text-[#111] text-[12px]">채팅</Link>
        <Link to="/profile" className="no-underline text-[#111] text-[12px]">프로필</Link>
      </div>
    </div>
  );
}