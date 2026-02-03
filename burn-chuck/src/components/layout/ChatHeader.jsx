import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function ChatHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  // roomName can be passed via location.state when navigating to /chat/rooms/:roomId
  const roomName = location.state?.roomName || '채팅';

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[90px] bg-white border-b border-[#ddd] z-[1000] box-border">
      <div className="h-full flex items-center justify-between px-[14px]">
        <button onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-gray-100" aria-label="뒤로">
          <ChevronLeft size={28} />
        </button>

        <div className="font-[800] text-[20px] text-[#111]">{roomName}</div>

        <div style={{ width: 40 }} />
      </div>
    </header>
  );
}
