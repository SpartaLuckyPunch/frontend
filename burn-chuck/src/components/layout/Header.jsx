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
  const token = useAuthStore((s) => s.token);
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
    if (!token) return;
    try {
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
    if (token) fetchNotifications();
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsNotiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

// [수정] SSE 연결 로직 (Debounce 적용)
  useEffect(() => {
    if (!token) return;

    // 변수 선언
    let eventSource = null;
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

    // [핵심] 1초 뒤에 연결을 시도하도록 타이머 설정
    const timerId = setTimeout(() => {
        console.log("SSE 연결 시도...");
        
        eventSource = new EventSourcePolyfill(`${baseURL}/notifications/subscribe`, {
          headers: {
            Authorization: `${token}`, 
          },
          heartbeatTimeout: 86400000,
        });
    
        eventSource.onopen = () => {
          console.log('SSE 연결 성공');
        };
    
        const handleSseData = (e) => {
          console.log('📢 SSE 수신 (이벤트: ' + e.type + '):', e.data);
          try {
            const res = JSON.parse(e.data); 
            
            if (res.event === "CONNECTION_SUCCESS") {
                setServerUnreadCount(res.unread);
                
                // ⚠️ 주의: 여기서 eventSource.close()를 하면 절대 안 됩니다!
                // 여기서 닫으면 실시간 알림을 못 받습니다.
            } 
            else if (res.newNotification) {
                setNotifications((prev) => [res.newNotification, ...prev]);
                setServerUnreadCount((prev) => prev + 1);
            }
          } catch (error) {
            console.error('알림 파싱 에러', error);
          }
        };
    
        // 리스너 등록
        eventSource.addEventListener('sse', handleSseData); // 백엔드 설정에 맞춤
        eventSource.onmessage = handleSseData;
        
        // 혹시 모르니 notification 이벤트도 열어둠
        eventSource.addEventListener('notification', handleSseData); 
    
        eventSource.onerror = (e) => {
           eventSource.close();
        };

    }, 1000); // 1초(1000ms) 대기

    // Cleanup 함수 (언마운트 시 실행)
    return () => {
      // 1. 대기 중이던 연결 시도 취소 (새로고침 연타 방어 핵심!)
      clearTimeout(timerId);
      
      // 2. 이미 연결된 경우 종료
      if (eventSource) {
        eventSource.close();
        console.log('SSE 연결 종료');
      }
    };
  }, [token]);

  const handleBellClick = () => {
    if (!isNotiOpen) fetchNotifications();
    setIsNotiOpen(!isNotiOpen);
  };

  // 2. 알림 단건 조회 (읽음 처리) 함수
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

  // 3. 알림 클릭 핸들러
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
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[90px] bg-white border-b border-[#ddd] z-[1000] box-border">
        <div className="h-full flex items-center justify-between px-[14px]">
          <Link to="/" className="no-underline">
            <img src="/projectLogo.png" alt="Burn Chuck" className="h-16" />
          </Link>

          <div className="flex items-center gap-1" ref={notiRef}>
            {!token ? (
              <Link to="/login" className="bg-[#f3f3f3] px-[12px] py-[8px] rounded-[8px] border border-[#d1d5db] no-underline text-[#111] font-[600] hover:bg-gray-200 transition-colors">
                로그인
              </Link>
            ) : (
              <>
                <div className="relative">
                    <button
                      aria-label="알림"
                      className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${isNotiOpen ? 'bg-gray-100' : ''}`}
                      onClick={handleBellClick}
                    >
                      <Bell size={32} className="text-gray-700" />
                      
                      {/* 배지 표시 */}
                      {serverUnreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-[2px] border-white px-1">
                          {serverUnreadCount > 99 ? '99+' : serverUnreadCount}
                        </span>
                      )}
                    </button>

                    {isNotiOpen && (
                        <div className="absolute top-full right-[-50px] mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[1100]">
                            <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-sm">알림</h3>
                            </div>
                            <div className="max-h-[360px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        새로운 알림이 없습니다.
                                    </div>
                                ) : (
                                    notifications.map((noti) => (
                                        <div 
                                            key={noti.notificationId}
                                            onClick={() => handleNotificationClick(noti)}
                                            className={`p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${!noti.check ? 'bg-purple-50/40' : 'bg-white'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                                                    {noti.type || '알림'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                                    {formatTimeAgo(noti.notificatedDatetime)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 leading-snug line-clamp-2">
                                                {noti.description}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button aria-label="설정" className="p-2 rounded-md hover:bg-gray-100 transition-colors" onClick={openDrawer}>
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