import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { useAuthStore } from '../features/auth/store/authStore';
import sampleImg from '../assets/images/profileSampleImg.png';
import { Send } from 'lucide-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

function formatDateLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // [수정] 스토어에서 user와 isLoggedIn 가져오기
  const { user: currentUser, isLoggedIn } = useAuthStore();
  const currentUserId = currentUser?.id;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const [roomMembers, setRoomMembers] = useState([]); 
  const [readStatuses, setReadStatuses] = useState({}); 

  const listRef = useRef(null);
  const stompRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    if (!isLoggedIn) {
        alert("로그인이 필요합니다.");
        navigate('/login');
        return;
    }

    // 1. 채팅방 멤버 및 읽음 상태 조회
    apiClient.get(`/chat/rooms/${roomId}`)
      .then(res => {
        const data = res.data?.data;
        if(data) {
          setRoomMembers(data.members || []);
          setReadStatuses(data.memberReadStatuses || {});
        }
      })
      .catch(err => console.error('Room detail load failed', err));

    // 2. 메시지 목록 조회 (페이징은 추후 구현 필요)
    apiClient
      .get(`/chat/rooms/${roomId}/messages?page=0`)
      .then((res) => {
        const content = res.data?.data?.content || [];
        // 날짜순 정렬 (오래된 것 -> 최신 것)
        const ordered = [...content].reverse(); 
        setMessages(ordered);
        setTimeout(() => scrollToBottom(), 50);
        
        // 3. 웹소켓 연결 시작
        connectWebsocket();
      })
      .catch((err) => {
        console.error('messages load', err);
      });

    // 입장 시 읽음 처리
    markAsRead();

    return () => {
      // 소켓 연결 해제
      if (stompRef.current) {
         if (stompRef.current.connected) {
             stompRef.current.disconnect();
         } else {
             try {
                 if (stompRef.current.ws) stompRef.current.ws.close();
             } catch(e) { /* ignore */ }
         }
         stompRef.current = null;
      }
    };
  }, [roomId, isLoggedIn]); // 의존성 추가

  const markAsRead = async () => {
    if (!currentUserId) return;
    try {
      // 쿠키가 자동으로 전송되므로 별도 헤더 불필요
      await apiClient.post(`/chat/rooms/${roomId}/read`);
      
      // 내 읽음 상태 즉시 업데이트 (UI 반응성 향상)
      /* 주의: 여기서 state를 업데이트해도, 소켓으로 내 읽음 이벤트가 다시 날아올 수 있음.
         중복 처리는 괜찮으나, 시퀀스 번호 관리가 필요함.
         일단 서버 이벤트를 믿는 것이 가장 정확함.
      */
    } catch (err) {
      console.error('Mark as read failed', err);
    }
  };

  function scrollToBottom() {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }

  function connectWebsocket() {
    if (stompRef.current) return;

    const baseApi = (process.env.REACT_APP_API_URL).replace(/\/api$/, '');
    const wsUrl = `${baseApi.replace(/\/api$/, '')}/ws-stomp`;

    // [수정] SockJS 생성 시 withCredentials 옵션은 지원하지 않는 경우가 많음.
    // 하지만 대부분의 브라우저에서 SockJS는 쿠키를 자동으로 포함함.
    // 만약 CORS 문제가 있다면 백엔드에서 setAllowedOriginPatterns 설정을 확인해야 함.
    const socket = new SockJS(wsUrl);
    const stompClient = Stomp.over(socket);
    stompRef.current = stompClient;
    
    // 디버그 로그 끄기 (개발 중엔 켜두는 게 좋음)
    // stompClient.debug = null; 

    // [수정] 헤더에 토큰 넣는 로직 삭제 (쿠키 인증 사용)
    const headers = {}; 

    stompClient.connect(headers, function (frame) {
      console.log('STOMP Connected:', frame);

      // 1. 채팅 메시지 구독
      stompClient.subscribe(`/sub/chat/room/${roomId}`, function (message) {
        if (!message || !message.body) return;
        let body;
        try { body = JSON.parse(message.body); } catch (e) { body = message.body; }

        setMessages((prev) => {
          // 중복 메시지 방지 (id가 있다고 가정)
          const exists = prev.some((m) => m.id === body.id);
          if (exists) return prev;
          return [...prev, body];
        });
        
        // 메시지 받으면 읽음 처리 요청
        markAsRead();
        setTimeout(() => scrollToBottom(), 50);
      });

      // 2. 읽음 상태 업데이트 구독
      stompClient.subscribe(`/sub/chat/room/${roomId}/read`, function (message) {
        if (!message || !message.body) return;
        try {
            const readEvent = JSON.parse(message.body); 
            // { userId: 15, sequence: 100, ... }
            setReadStatuses(prev => ({
              ...prev,
              [String(readEvent.userId)]: readEvent.sequence 
            }));
        } catch (e) {
          console.error('Read event parse failed', e);
        }
      });

    }, function(err){
      console.error('STOMP Connection Error:', err);
      // 연결 실패 시 재연결 로직 추가 가능 (setTimeout 등)
    });
  }

  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // [중요] 메시지 전송 로직 (REST API 사용 시)
    // API 요청은 apiClient(axios)가 하므로 쿠키가 자동으로 감.
    // 만약 STOMP send()를 쓴다면: stompRef.current.send(...) 사용
    
    try {
      await apiClient.post(`/chat/rooms/${roomId}/messages`, { content: trimmed });
      setInput('');
      // markAsRead(); // 메시지 보내고 바로 읽음 처리 (선택)
    } catch (err) {
      console.error('send message failed', err);
      alert('메시지 전송에 실패했습니다.');
    }
  }

  // ... (렌더링 로직은 기존과 동일) ...
  // calculateUnreadCount 함수 등...

  const calculateUnreadCount = (messageSeq) => {
    if (!roomMembers || roomMembers.length === 0) return 0;
    if (!messageSeq) return 0;

    let count = 0;
    roomMembers.forEach(member => {
      const memberId = member.userId; 
      if (!memberId) return;

      const userReadSeq = readStatuses[String(memberId)] || 0;
      if (userReadSeq < messageSeq) {
        count++;
      }
    });
    return count;
  };

  const rendered = [];
  let lastDate = null;
  
  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdDatetime).toDateString();
    if (msgDate !== lastDate) {
      rendered.push(
        <div key={`date-${msgDate}`} className="w-full flex justify-center my-4">
          <div className="px-4 py-1 bg-gray-200 text-sm rounded-full text-gray-700">{formatDateLabel(msg.createdDatetime)}</div>
        </div>
      );
      lastDate = msgDate;
    }

    const isMine = Number(msg.senderId) === Number(currentUserId);
    // [수정] 읽음 카운트 계산 시 내 메시지/상대 메시지 구분 없이 모두 계산해야 함?
    // 보통 내 메시지 옆에 '1'이 떠야 안 읽은 사람이 있다는 뜻.
    const unreadCount = calculateUnreadCount(msg.sequence);

    rendered.push(
      <div key={msg.id} className={`flex items-end px-4 mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && (
          <img src={msg.senderProfile || sampleImg} alt="avatar" className="w-8 h-8 rounded-full mr-2 object-cover" />
        )}
        
        {/* 내 메시지일 경우: 읽음 카운트를 왼쪽(말풍선 앞)에 표시 */}
        {isMine && unreadCount > 0 && (
          <span className="text-[10px] text-yellow-500 font-bold mr-1 mb-1">{unreadCount}</span>
        )}

        <div className={`${isMine ? 'bg-yellow-300 text-black' : 'bg-white border'} max-w-[72%] p-3 rounded-2xl`}>
          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
          <div className="text-xs text-gray-500 mt-1 text-right">{formatTime(msg.createdDatetime)}</div>
        </div>

        {/* 상대 메시지일 경우: 읽음 카운트를 오른쪽(말풍선 뒤)에 표시?? 보통 안 함 */}
        {/* 상대방이 보낸 메시지에도 '몇 명이 안 읽었는지' 보여주고 싶다면 유지 */}
        {!isMine && unreadCount > 0 && (
          <span className="text-[10px] text-yellow-500 font-bold ml-1 mb-1">{unreadCount}</span>
        )}
      </div>
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ maxWidth: 430, margin: '0 auto' }}>
      <main className="flex-1 overflow-y-auto" ref={listRef} style={{ paddingBottom: 20 }}>
        <div className="pt-4">{rendered}</div>
      </main>

      <form onSubmit={handleSend} className="px-3 pb-4 pt-2 border-t bg-white translate-y-[-10px] sticky bottom-0">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메세지 보내기"
            className="flex-1 py-3 px-4 rounded-full bg-gray-100 focus:outline-none"
          />
          <button type="submit" className="ml-2 w-10 h-10 flex items-center justify-center bg-transparent">
            <Send className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </form>
    </div>
  );
}