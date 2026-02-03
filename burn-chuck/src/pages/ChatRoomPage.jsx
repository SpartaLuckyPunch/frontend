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
  console.log(currentUser);
  const currentUserId = currentUser?.id;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const listRef = useRef(null);
  const stompRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
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

    return () => {
      if (stompRef.current) stompRef.current.disconnect();
    };
  }, [roomId]);

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

    const token = useAuthStore.getState().token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    stompClient.connect(headers, function (frame) {
      try {
        stompClient.subscribe(`/sub/chat/room/${roomId}`, function (message) {
          if (!message || !message.body) return;
          let body;
          try {
            body = JSON.parse(message.body);
          } catch (e) {
            body = message.body;
          }

          // [핵심 변경 1] 내 메시지인지 검사하는 로직 제거
          // 내가 보낸 것도 서버 돌아서 소켓으로 오면 그때 그립니다.
          setMessages((prev) => {
            // 혹시 모를 ID 중복 방지 (안전장치)
            const exists = prev.some((m) => m.id === body.id);
            if (exists) return prev;
            return [...prev, body];
          });
          setTimeout(() => scrollToBottom(), 20);
        });
      } catch (err) {
        console.error('subscribe error', err);
      }
    }, function(err){
      console.error('stomp connect error', err);
    });
  }

  // [핵심 변경 2] handleSend 대폭 축소 (API 호출만 담당)
  async function handleSend(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // 1. 입력창 비우기 (UI 반응성 확보)
    setInput('');
    
    // 2. 화면에 메시지 추가(setMessages) 하지 않음! (소켓이 해줄 것임)

    try {
      // 3. 서버로 전송
      await apiClient.post(`/chat/rooms/${roomId}/messages`, { content: trimmed });
      // 성공하면 아무것도 안 해도 됨. 서버가 소켓으로 쏴주니까요.
    } catch (err) {
      console.error('send message failed', err);
      alert('메시지 전송에 실패했습니다.'); // 에러 처리만 간단히
    }
  }

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

    // [중요] ID 타입 비교 안전하게 처리 (이전 대화에서 적용한 내용 유지)
    const isMine = Number(msg.senderId) === Number(currentUserId);
    console.log('Rendering message', currentUserId);
    
    rendered.push(
      <div key={msg.id} className={`flex items-end px-4 mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && (
          <img src={msg.senderProfile || sampleImg} alt="avatar" className="w-8 h-8 rounded-full mr-2" />
        )}
        <div className={`${isMine ? 'bg-yellow-300 text-black' : 'bg-white border'} max-w-[72%] p-3 rounded-2xl`}>
          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
          <div className="text-xs text-gray-500 mt-1 text-right">{formatTime(msg.createdDatetime)}</div>
        </div>
      </div>
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ maxWidth: 430, margin: '0 auto' }}>
      <main className="flex-1 overflow-y-auto" ref={listRef} style={{ paddingBottom: 20 }}>
        <div className="pt-4">{rendered}</div>
      </main>

      <form onSubmit={handleSend} className="px-3 pb-4 pt-2 border-t bg-white translate-y-[-12px] sticky bottom-0">
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