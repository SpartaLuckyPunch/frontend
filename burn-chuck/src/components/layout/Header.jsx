import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { Bell, Settings } from 'lucide-react';
import SettingsDrawer from './SettingsDrawer';
// [수정] Store import 추가
import useNotificationStore from '../../features/notification/store/useNotificationStore'; 

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function Header() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  
  // [수정] Store에서 상태와 액션들 가져오기 (변수명 매핑)
  const { 
    notifications, 
    unreadCount: serverUnreadCount, // 기존 코드와 변수명 맞춤
    connect, 
    disconnect, 
    fetchNotifications,
    markAsRead 
  } = useNotificationStore();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef(null);

  const openDrawer = () => {
    setMounted(true);
    requestAnimationFrame(() => setOpen(true));
  };
  const handleRequestClose = () => setOpen(false);
  const handleAfterClose = () => setMounted(false);

  // [수정] SSE 연결 및 데이터 로드 관리 (Store 활용)
  useEffect(() => {
    if (isLoggedIn) {
      // 로그인 상태면 목록 가져오고 SSE 연결
      fetchNotifications();
      connect();
    } else {
      // 로그아웃 상태면 연결 끊기
      disconnect();
    }

    // (선택) 컴포넌트 언마운트 시 정리 로직이 필요하다면 추가
    // return () => disconnect(); 
  }, [isLoggedIn, connect, disconnect, fetchNotifications]);

  // 외부 클릭 시 알림창 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsNotiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    if (!isNotiOpen) fetchNotifications(); // 열 때 최신화
    setIsNotiOpen(!isNotiOpen);
  };

  const handleNotificationClick = async (noti) => {
    setIsNotiOpen(false);

    if (!noti.check) {
        // [수정] Store의 함수 사용
        await markAsRead(noti.notificationId); 
    }

    if (noti.meetingId) {
        navigate(`/meetings/${noti.meetingId}`);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[90px] bg-white border-b border-[#f0f0f0] z-[1000] box-border shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="h-full flex items-center justify-between px-[16px]">
          <Link to="/" className="no-underline flex items-center">
            <img src="/projectLogo.png" alt="Burn Chuck" className="h-16 object-contain" />
          </Link>

          <div className="flex items-center gap-2" ref={notiRef}>
            {!isLoggedIn ? (
              <Link to="/login" className="bg-[#f3f3f3] px-[12px] py-[8px] rounded-[8px] border border-[#d1d5db] no-underline text-[#111] font-[600] hover:bg-gray-200 transition-colors">
                로그인
              </Link>
            ) : (
              <>
                <div className="relative">
                    <button
                      aria-label="알림"
                      className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isNotiOpen ? 'bg-gray-100' : ''}`}
                      onClick={handleBellClick}
                    >
                      <Bell size={32} className="text-gray-700" />
                      
                      {serverUnreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-[2px] border-white">
                          {serverUnreadCount > 99 ? '99+' : serverUnreadCount}
                        </span>
                      )}
                    </button>

                    {isNotiOpen && (
                        <div className="absolute top-full right-[-50px] mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[1100]">
                            <div className="px-5 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 text-base">알림</h3>
                            </div>
                            <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center justify-center text-gray-400">
                                        <Bell size={32} className="mb-2 opacity-20" />
                                        <span className="text-sm">새로운 알림이 없습니다.</span>
                                    </div>
                                ) : (
                                    notifications.map((noti) => (
                                        <div 
                                            key={noti.notificationId}
                                            onClick={() => handleNotificationClick(noti)}
                                            className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${!noti.check ? 'bg-purple-50/60' : 'bg-white'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1.5">
                                                <span className="text-[11px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                                                    {noti.type || '알림'}
                                                </span>
                                                <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                                                    {formatTimeAgo(noti.notificatedDatetime)}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-gray-800 leading-normal">
                                                {noti.description}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button aria-label="설정" className="p-2 rounded-full hover:bg-gray-100 transition-colors" onClick={openDrawer}>
                  <Settings size={32} className="text-gray-700" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      {mounted && <SettingsDrawer open={open} onRequestClose={handleRequestClose} onAfterClose={handleAfterClose} />}
    </>
  );
}