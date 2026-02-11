import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import apiClient from '../api/axiosClient';
import sampleImg from '../assets/images/고윤정.jpg';
import { useNavigate } from 'react-router-dom';
import { Edit2, X } from 'lucide-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useAuthStore } from '../features/auth/store/authStore';

function timeAgoISO(iso) {
  if (!iso) return '';
  const t = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - t) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  const currentUser = useAuthStore((s) => s.user);
  const stompRef = useRef(null);

  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, roomId: null });
  const [modal, setModal] = useState({ open: false, roomId: null, currentName: '' });
  const [newName, setNewName] = useState('');
  
  const longPressTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/chat/rooms');
        const list = res?.data?.data || [];
        if (mounted) setRooms(list);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    
    // 목록 갱신용 소켓 연결
    connectListWebsocket();

    const handleClickOutside = () => setMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside);
    
    return () => { 
      mounted = false; 
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside);
      
      // [수정 포인트] 소켓 연결 해제 시 안전장치 추가
      if (stompRef.current) {
        if (stompRef.current.connected) {
            stompRef.current.disconnect();
        } else {
            // 연결 중이거나 이미 닫힌 경우 강제 종료 시도 (옵션)
            try {
                if (stompRef.current.ws) stompRef.current.ws.close();
            } catch (e) { /* ignore */ }
        }
        stompRef.current = null;
      }
    };
  }, []);

  const connectListWebsocket = () => {
    if (!currentUser?.id) return;
    if (stompRef.current) return;

    const baseApi = (process.env.REACT_APP_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '');
    const wsUrl = `${baseApi.replace(/\/api$/, '')}/ws-stomp`;
    
    const socket = new SockJS(wsUrl);
    const stompClient = Stomp.over(socket);
    stompClient.debug = null; 
    stompRef.current = stompClient;

    const token = useAuthStore.getState().token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    stompClient.connect(headers, function (frame) {
        // 내 개인 알림 채널 구독 (/sub/user/{myId}/chat)
        stompClient.subscribe(`/sub/user/${currentUser.id}/chat`, function (message) {
            if (!message.body) return;
            try {
                const event = JSON.parse(message.body);
                // event: { roomId, lastMessage, lastMessageTime }

                setRooms(prevRooms => {
                    const targetIndex = prevRooms.findIndex(r => r.roomId === event.roomId);
                    if (targetIndex === -1) return prevRooms; 

                    const targetRoom = { ...prevRooms[targetIndex] };

                    // 데이터 갱신
                    targetRoom.unreadCount = (targetRoom.unreadCount || 0) + 1;
                    targetRoom.lastMessage = event.lastMessage;
                    targetRoom.lastMessageTime = event.lastMessageTime;

                    // 방을 맨 위로 끌어올리기
                    const newRooms = [...prevRooms];
                    newRooms.splice(targetIndex, 1);
                    newRooms.unshift(targetRoom);

                    return newRooms;
                });
            } catch (e) {
                console.error('List update parse error', e);
            }
        });
    }, function(err) {
        console.error('Socket connect failed', err);
    });
  };

  const filtered = rooms
    .filter((r) => (filter === 'ALL' ? true : r.roomType === filter))
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

  const handleContextMenu = (e, roomId) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ visible: true, x: e.clientX, y: e.clientY, roomId });
  };

  const handleTouchStart = (e, roomId) => {
    const touch = e.touches[0];
    const { clientX, clientY } = touch;

    longPressTimerRef.current = setTimeout(() => {
      setMenu({ visible: true, x: clientX, y: clientY, roomId });
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    const targetRoom = rooms.find(r => r.roomId === menu.roomId);
    if (targetRoom) {
      setNewName(targetRoom.name);
      setModal({ open: true, roomId: menu.roomId, currentName: targetRoom.name });
    }
    setMenu(prev => ({ ...prev, visible: false }));
  };

  const handleSubmitRename = async () => {
    if (!newName.trim()) return;
    try {
      await apiClient.patch(`/chat/rooms/${modal.roomId}/name`, { name: newName });
      setRooms(prev => prev.map(r => 
        r.roomId === modal.roomId ? { ...r, name: newName } : r
      ));
      setModal({ open: false, roomId: null, currentName: '' });
    } catch (err) {
      console.error('Rename failed', err);
      alert('채팅방 이름 변경에 실패했습니다.');
    }
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="flex gap-2 mb-3">
        <button onClick={() => setFilter('ALL')} className={`px-3 py-1 rounded-full ${filter==='ALL' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>전체</button>
        <button onClick={() => setFilter('PRIVATE')} className={`px-3 py-1 rounded-full ${filter==='PRIVATE' ? 'bg-black text-white' : 'bg-gray-100'}`}>개인</button>
        <button onClick={() => setFilter('GROUP')} className={`px-3 py-1 rounded-full ${filter==='GROUP' ? 'bg-black text-white' : 'bg-gray-100'}`}>모임</button>
      </div>

      {loading && <div className="text-sm text-gray-500">불러오는 중...</div>}
      {error && <div className="text-sm text-red-500">오류 발생</div>}

      <div className="bg-white rounded-md overflow-hidden pb-20">
        {filtered.map((r) => (
          <div 
            key={r.roomId} 
            className="flex items-center p-3 border-b cursor-pointer select-none active:bg-gray-50"
            onClick={() => navigate(`/chat/rooms/${r.roomId}`, { state: { roomName: r.name } })}
            onContextMenu={(e) => handleContextMenu(e, r.roomId)}
            onTouchStart={(e) => handleTouchStart(e, r.roomId)}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
            <img src={r.chatRoomImg} alt="avatar" className="w-12 h-12 rounded-full mr-3 object-cover" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{r.name}</div>
                  {r.roomType === 'GROUP' && <div className="text-sm text-gray-400">{r.memberCount}</div>}
                </div>
                <div className="text-sm text-gray-400">{timeAgoISO(r.lastMessageTime)}</div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-sm text-gray-600 truncate max-w-[200px]">
                  {r.lastMessage ?? '메시지가 없습니다.'}
                </div>
                {/* 안 읽은 메시지 수 배지 (빨간색) */}
                {r.unreadCount > 0 && (
                  <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {r.unreadCount > 99 ? '99+' : r.unreadCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {menu.visible && createPortal(
        <div 
          className="fixed bg-white border shadow-xl rounded-lg z-[9999] overflow-hidden"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={handleEditClick}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-100 text-left whitespace-nowrap"
          >
            <Edit2 size={16} /> 채팅방 수정
          </button>
        </div>,
        document.body
      )}

      {modal.open && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={() => setModal({ ...modal, open: false })}>
          <div className="bg-white p-6 rounded-lg w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">채팅방 이름 변경</h3>
              <button onClick={() => setModal({ ...modal, open: false })}><X size={20}/></button>
            </div>
            
            <input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border p-3 rounded mb-4 focus:outline-none focus:border-green-500"
              placeholder="새로운 이름을 입력하세요"
              autoFocus
            />
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setModal({ ...modal, open: false })}
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                취소
              </button>
              <button 
                onClick={handleSubmitRename}
                className="px-4 py-2 bg-yellow-400 font-bold rounded hover:bg-yellow-500 text-sm"
              >
                변경
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}