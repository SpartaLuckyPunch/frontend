import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useUserStore } from '../../features/auth/store/useUserStore';

// Props:
// - open: boolean (controls enter/exit)
// - onRequestClose: called when user requests close (backdrop/x)
// - onAfterClose: called after exit animation completes so parent can unmount
export default function SettingsDrawer({ open, onRequestClose, onAfterClose }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let t;
    if (open) {
      // entering — ensure not exiting
      setIsExiting(false);
    } else {
      // start exit animation, then notify parent to unmount
      setIsExiting(true);
      t = setTimeout(() => {
        setIsExiting(false);
        onAfterClose && onAfterClose();
      }, 320); // matches duration classes (200-300ms)
    }
    return () => clearTimeout(t);
  }, [open, onAfterClose]);

  const handleLogout = () => {
    try {
      useAuthStore.getState().logout();       // 토큰 삭제
      useUserStore.getState().clearUserStore(); // 주소 정보 삭제
      logout();
    } finally {
      onRequestClose && onRequestClose();
      navigate('/');
    }
  };

  const active = open && !isExiting;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] h-screen z-[1100] pointer-events-none">
      {/* Backdrop inside centered frame */}
      <div
        onClick={() => onRequestClose && onRequestClose()}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${active ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
      />

      {/* Panel anchored to right edge of centered 430px frame */}
      <aside
        className={`absolute right-0 top-0 h-full w-[320px] bg-white shadow-lg transform transition-transform duration-300 ${active ? 'translate-x-0 pointer-events-auto' : 'translate-x-full'}`}
        aria-hidden={!active}
      >
        <div className="p-4 flex items-center justify-between border-b">
          <h3 className="text-lg font-semibold">설정</h3>
          <button onClick={() => onRequestClose && onRequestClose()} aria-label="닫기" className="text-2xl leading-none p-1">×</button>
        </div>

        <div className="p-4 space-y-2">
          <button className="w-full text-left py-3 rounded hover:bg-gray-50">내 정보</button>
          <button className="w-full text-left py-3 rounded hover:bg-gray-50">비밀번호 변경</button>
          <div className="border-t my-2" />
          <button onClick={handleLogout} className="w-full text-left py-3 rounded text-red-600 hover:bg-red-50">로그아웃</button>
        </div>
      </aside>
    </div>
  );
}
