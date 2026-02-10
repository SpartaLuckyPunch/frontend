import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/authStore';
import { Bell, Settings } from 'lucide-react';
import SettingsDrawer from './SettingsDrawer';
import apiClient from '../../api/axiosClient';
import { EventSourcePolyfill } from 'event-source-polyfill';

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
  // [수정 1] token 대신 isLoggedIn 상태를 가져옵니다.
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef(null);

  const openDrawer = () => {
    setMounted(true);
    requestAnimationFrame(() => setOpen(true));
  };
  const handleRequestClose = () => setOpen(false);
  const handleAfterClose = () => setMounted(false);

  // 1. 전체 목록 조회
  const fetchNotifications = async () => {
    if (!isLoggedIn) return; // [수정] isLoggedIn 체크
    try {
      // apiClient는 이미 withCredentials: true가 설정되어 있어 쿠키를 자동 전송합니다.
      const res = await apiClient.get('/notifications');
      if (res.data?.success) {
        const list = res.data.data.notificationList || [];
        setNotifications(list);
        
        const unread = list.filter(n => !n.check).length;
        setServerUnreadCount(unread);
      }
    } catch (err) {
      console.error('알림 목록 조회 실패:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchNotifications();
  }, [isLoggedIn]); // [수정] 의존성 배열 변경

  useEffect(() => {
    function handleClickOutside(event) {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsNotiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // [수정 2] SSE 연결 로직 (쿠키 기반으로 변경)
  useEffect(() => {
    if (!isLoggedIn) return; // 로그인이 안 되어 있으면 SSE 연결 안 함

    let eventSource = null;
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

    const timerId = setTimeout(() => {
        console.log("SSE 연결 시도...");
        
        // [핵심 변경] 토큰 헤더 제거하고 withCredentials: true 추가
        eventSource = new EventSourcePolyfill(`${baseURL}/notifications/subscribe`, {
          withCredentials: true, // 이게 있어야 쿠키(토큰)가 같이 날아갑니다.
          heartbeatTimeout: 86400000,
        });
    
        eventSource.onopen = () => {
          console.log('SSE 연결 성공');
        };
    
        const handleSseData = (e) => {
          // console.log('📢 SSE 수신:', e.data); // 로그 너무 많으면 주석 처리
          try {
            const res = JSON.parse(e.data); 
            
            if (res.event === "CONNECTION_SUCCESS") {
                setServerUnreadCount(res.unread);
            } 
            else if (res.newNotification) {
                setNotifications((prev) => [res.newNotification, ...prev]);
                setServerUnreadCount((prev) => prev + 1);
            }
          } catch (error) {
            console.error('알림 파싱 에러', error);
          }
        };
    
        eventSource.addEventListener('sse', handleSseData);
        eventSource.onmessage = handleSseData;
        eventSource.addEventListener('notification', handleSseData); 
    
        eventSource.onerror = (e) => {
           // 에러 발생 시(토큰 만료 등) 연결 종료
           eventSource.close();
        };

    }, 1000);

    return () => {
      clearTimeout(timerId);
      if (eventSource) {
        eventSource.close();
        console.log('SSE 연결 종료');
      }
    };
  }, [isLoggedIn]); // [수정] token -> isLoggedIn

  const handleBellClick = () => {
    if (!isNotiOpen) fetchNotifications();
    setIsNotiOpen(!isNotiOpen);
  };

  const readNotification = async (notificationId) => {
    try {
        await apiClient.get(`/notifications/${notificationId}`);

        setNotifications((prev) => 
            prev.map((n) => 
                n.notificationId === notificationId ? { ...n, check: true } : n
            )
        );
        setServerUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
        console.error('알림 읽음 처리 실패:', err);
    }
  };

  const handleNotificationClick = async (noti) => {
    setIsNotiOpen(false);

    if (!noti.check) {
        await readNotification(noti.notificationId);
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
            {/* 로고 크기 살짝 조정 */}
            <img src="/projectLogo.png" alt="Burn Chuck" className="h-16 object-contain" />
          </Link>

          <div className="flex items-center gap-2" ref={notiRef}>
            {/* [수정 3] !token -> !isLoggedIn 으로 조건 변경 */}
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
                      {/* 아이콘 사이즈 조정 */}
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