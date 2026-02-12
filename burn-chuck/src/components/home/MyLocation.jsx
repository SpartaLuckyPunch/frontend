import React, { useEffect } from 'react';
import { MapPinned } from 'lucide-react';
import useUserStore from '../../features/auth/store/useUserStore';

export default function MyLocation({ onUseCurrent = () => {} }) {
  const userAddress = useUserStore(state => state.userAddress);
  const fetchUserAddress = useUserStore((state) => state.fetchUserAddress);

  // [수정] 조건문(if !userAddress)을 제거하여, 
  // 페이지 진입 시 무조건 한 번 최신 주소를 받아오도록 설정
  useEffect(() => {
    fetchUserAddress(); 
  }, [fetchUserAddress]);

  // 혹시 모를 데이터 로딩 시점 대비 (Safe Guard)
  if (!userAddress) return null; 

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