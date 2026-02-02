import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { Settings } from 'lucide-react';
import SettingsDrawer from './SettingsDrawer';

export default function Header() {
  const token = useAuthStore((s) => s.token);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openDrawer = () => {
    setMounted(true);
    requestAnimationFrame(() => setOpen(true));
  };

  const handleRequestClose = () => {
    setOpen(false);
  };

  const handleAfterClose = () => {
    setMounted(false);
  };

  return (
    <>
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[90px] bg-white border-b border-[#ddd] z-[1000] box-border">
        <div className="h-full flex items-center justify-between px-[14px]">
          <Link to="/" className="font-[800] text-[20px] text-[#111] no-underline">
            LOGO
          </Link>

          {!token ? (
            <Link to="/login" className="bg-[#f3f3f3] px-[12px] py-[8px] rounded-[8px] border border-[#d1d5db] no-underline text-[#111] font-[600]">
              로그인
            </Link>
          ) : (
            <button aria-label="설정" className="p-2 rounded-md hover:bg-gray-100" onClick={openDrawer}>
              <Settings size={32} />
            </button>
          )}
        </div>
      </header>

      {mounted && (
        <SettingsDrawer open={open} onRequestClose={handleRequestClose} onAfterClose={handleAfterClose} />
      )}
    </>
  );
}