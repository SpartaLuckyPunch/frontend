import React from 'react';
import { MapPinned } from 'lucide-react';

export default function MyLocation({ location = null, onUseCurrent = () => {} }) {
  return (
    <div className="w-full px-4" style={{ height: 50 }}>
      {/* Placeholder MyLocation (height 50px). Implement geolocation/manual selection later. */}
      <div className="h-full flex items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MapPinned size={24} className="text-gray-700" />
          <span className="text-sm text-gray-700">{location ? `${location.province} ${location.city} ${location.district}` : '내 위치를 설정해주세요'}</span>
        </div>
        <div className="ml-auto">
          <button onClick={onUseCurrent} className="text-sm text-green-600">현재위치 사용</button>
        </div>
      </div>
    </div>
  );
}
