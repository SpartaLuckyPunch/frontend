import { create } from 'zustand';
import { EventSourcePolyfill } from 'event-source-polyfill';
import apiClient from '../../../api/axiosClient'; // 경로 확인 필요

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  eventSource: null, // 연결 객체를 여기에 보관

  // 1. 연결 함수
  connect: () => {
    const { eventSource } = get();
    // 이미 연결되어 있으면 중복 연결 방지
    if (eventSource) return;

    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    console.log("📡 SSE 연결 시도...");

    const newEventSource = new EventSourcePolyfill(`${baseURL}/notifications/subscribe`, {
      withCredentials: true,
      heartbeatTimeout: 86400000,
    });

    // 연결 성공
    newEventSource.onopen = () => {
      console.log('✅ SSE 연결 성공');
    };

    // 데이터 수신
    const handleSseData = (e) => {
      try {
        const res = JSON.parse(e.data);
        
        if (res.event === "CONNECTION_SUCCESS") {
           set({ unreadCount: res.unread });
        } 
        else if (res.newNotification) {
           set((state) => ({
             notifications: [res.newNotification, ...state.notifications],
             unreadCount: state.unreadCount + 1
           }));
        }
      } catch (error) {
        console.error('알림 파싱 에러', error);
      }
    };

    newEventSource.addEventListener('sse', handleSseData);
    newEventSource.onmessage = handleSseData;
    newEventSource.addEventListener('notification', handleSseData);

    newEventSource.onerror = () => {
      // 에러 시 닫기 (재연결 로직은 필요에 따라 추가)
      get().disconnect();
    };

    set({ eventSource: newEventSource });
  },

  // 2. 연결 해제 함수 (이게 제일 중요! ⭐)
  disconnect: () => {
    const { eventSource } = get();
    if (eventSource) {
      eventSource.close();
      console.log('🔌 SSE 연결 종료');
      set({ eventSource: null });
    }
  },

  // 3. 알림 목록 조회 (API)
  fetchNotifications: async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.data?.success) {
        const list = res.data.data.notificationList || [];
        set({ 
            notifications: list,
            unreadCount: list.filter(n => !n.check).length
        });
      }
    } catch (err) {
      console.error('알림 목록 조회 실패:', err);
    }
  },

  // 4. 읽음 처리
  markAsRead: async (notificationId) => {
      // (기존 Header에 있던 readNotification 로직 이동)
      try {
        await apiClient.get(`/notifications/${notificationId}`);
        set(state => ({
            notifications: state.notifications.map(n => 
                n.notificationId === notificationId ? { ...n, check: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      } catch(err) { console.error(err); }
  }
}));

export default useNotificationStore;