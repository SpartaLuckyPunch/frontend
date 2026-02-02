import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';

export default function Header() {
  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[90px] bg-white border-b border-[#ddd] z-[1000] box-border">
      <div className="h-full flex items-center justify-between px-[14px]">
        <Link to="/" className="font-[800] text-[20px] text-[#111] no-underline">
          LOGO
        </Link>
        { !useAuthStore((s) => s.token) && (
          <Link to="/login" className="bg-[#f3f3f3] px-[12px] py-[8px] rounded-[8px] border border-[#d1d5db] no-underline text-[#111] font-[600]">
            로그인
          </Link>
        ) }
      </div>
    </header>
  );
}