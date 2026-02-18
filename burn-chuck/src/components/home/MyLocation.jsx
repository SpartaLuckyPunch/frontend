import React, { useEffect } from 'react';
import { MapPinned } from 'lucide-react';
import useUserStore from '../../features/auth/store/useUserStore'; // 경로 확인 필요

export default function MyLocation({ onUseCurrent = () => {} }) {
  const userAddress = useUserStore(state => state.userAddress);
  const fetchUserAddress = useUserStore((state) => state.fetchUserAddress);
  
  // [수정 1] 로그인 정보 가져오기 (store 구조에 따라 state.user 또는 state.isLoggedIn 사용)
  const isLoggedIn = useUserStore((state) => state.isLoggedIn); 

  useEffect(() => {
    // [수정 2] 유저가 로그인 상태일 때만 API 호출!
    if (isLoggedIn) {
      fetchUserAddress(); 
    }
  }, [fetchUserAddress, isLoggedIn]);

  // 로그인 안 했거나 주소 없으면 아무것도 안 그림 (또는 기본 위치 표시)
  if (!isLoggedIn || !userAddress) return <div className="h-[50px]"></div>; // 높이만 잡아둠

  return (
    <div className="w-full px-4" style={{ height: 50 }}>
      {/* ... 기존 JSX 내용 ... */}
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