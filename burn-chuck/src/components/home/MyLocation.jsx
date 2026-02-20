import React, { useEffect } from 'react';
import { MapPinned } from 'lucide-react';
// 🚨 1. 경로와 훅 이름을 authStore로 변경! (경로는 실제 폴더 구조에 맞게 조절하세요)
import { useAuthStore } from '../../features/auth/store/authStore'; 

export default function MyLocation({ onUseCurrent = () => {} }) {
  // 🚨 2. 전부 useAuthStore에서 꺼내오기!
  const userAddress = useAuthStore(state => state.userAddress);
  const fetchUserAddress = useAuthStore(state => state.fetchUserAddress);
  const isLoggedIn = useAuthStore(state => state.isLoggedIn); 

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserAddress(); 
    }
  }, [fetchUserAddress, isLoggedIn]);

  if (!isLoggedIn || !userAddress) return <div className="h-[50px]"></div>;

  return (
    <div className="w-full px-4" style={{ height: 50 }}>
       <div className="h-full flex items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MapPinned size={24} className="text-gray-700" />
          <span className="text-sm text-gray-700">
            {`${userAddress.province} ${userAddress.city} ${userAddress.district}`}
          </span>
        </div>
        <div className="ml-auto">
          <button onClick={onUseCurrent} className="text-sm text-green-600">
            현재위치 사용
          </button>
        </div>
      </div>
    </div>
  );
}