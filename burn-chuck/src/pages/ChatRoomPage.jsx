import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { useAuthStore } from '../features/auth/store/authStore';
import sampleImg from '../assets/images/고윤정.jpg';
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
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.id;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const [roomMembers, setRoomMembers] = useState([]); 
  const [readStatuses, setReadStatuses] = useState({}); 

  const listRef = useRef(null);
  const stompRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    apiClient.get(`/chat/rooms/${roomId}`)
      .then(res => {
        const data = res.data?.data;
        if(data) {
          setRoomMembers(data.members || []);
          setReadStatuses(data.memberReadStatuses || {});
        }
      })
      .catch(err => console.error('Room detail load failed', err));

    apiClient
      .get(`/chat/rooms/${roomId}/messages?page=0`)
      .then((res) => {
        const content = res.data?.data?.content || [];
        const ordered = [...content].reverse();
        setMessages(ordered);
        setTimeout(() => scrollToBottom(), 50);
        
        connectWebsocket();
      })
      .catch((err) => {
        console.error('messages load', err);
      });

    markAsRead();

    return () => {
      // [수정 포인트] 소켓 연결 해제 시 안전장치 추가
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
  }, [roomId]);

  const markAsRead = async () => {
    try {
      await apiClient.post(`/chat/rooms/${roomId}/read`);
      if (currentUserId) {
          setReadStatuses(prev => ({
              ...prev,
              [String(currentUserId)]: Number.MAX_SAFE_INTEGER 
          }));
      }
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

    const baseApi = (process.env.REACT_APP_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '');
    const wsUrl = `${baseApi.replace(/\/api$/, '')}/ws-stomp`;

    const socket = new SockJS(wsUrl);
    const stompClient = Stomp.over(socket);
    stompRef.current = stompClient;
    stompClient.debug = null; 

    const token = useAuthStore.getState().token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    stompClient.connect(headers, function (frame) {
      
      stompClient.subscribe(`/sub/chat/room/${roomId}`, function (message) {
        if (!message || !message.body) return;
        let body;
        try { body = JSON.parse(message.body); } catch (e) { body = message.body; }

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === body.id);
          if (exists) return prev;
          return [...prev, body];
        });
        
        markAsRead();
        setTimeout(() => scrollToBottom(), 20);
      });

      stompClient.subscribe(`/sub/chat/room/${roomId}/read`, function (message) {
        if (!message || !message.body) return;
        try {
           const readEvent = JSON.parse(message.body); 
           setReadStatuses(prev => ({
             ...prev,
             [String(readEvent.userId)]: readEvent.sequence 
           }));
        } catch (e) {
          console.error('Read event parse failed', e);
        }
      });

    }, function(err){
      console.error('stomp connect error', err);
    });
  }

  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput('');

    try {
      await apiClient.post(`/chat/rooms/${roomId}/messages`, { content: trimmed });
      markAsRead();
    } catch (err) {
      console.error('send message failed', err);
      alert('메시지 전송에 실패했습니다.');
    }
  }

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
    const unreadCount = calculateUnreadCount(msg.sequence);

    rendered.push(
      <div key={msg.id} className={`flex items-end px-4 mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && (
          <img src={msg.senderProfile || sampleImg} alt="avatar" className="w-8 h-8 rounded-full mr-2" />
        )}
        
        {isMine && unreadCount > 0 && (
          <span className="text-[10px] text-yellow-500 font-bold mr-1 mb-1">{unreadCount}</span>
        )}

        <div className={`${isMine ? 'bg-yellow-300 text-black' : 'bg-white border'} max-w-[72%] p-3 rounded-2xl`}>
          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
          <div className="text-xs text-gray-500 mt-1 text-right">{formatTime(msg.createdDatetime)}</div>
        </div>

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