import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function MeetingMapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // 1. navigate state에서 위도, 경도 추출
  const { latitude, longitude, location: locationName } = location.state || {};

  useEffect(() => {
    // 좌표가 없으면 실행하지 않음
    if (!latitude || !longitude) return;

    const initMap = () => {
      const container = containerRef.current;
      if (!container || !window.kakao || !window.kakao.maps) return;

      const kakao = window.kakao;
      const coords = new kakao.maps.LatLng(latitude, longitude);

      // 지도 옵션
      const options = {
        center: coords,
        level: 3, // 확대 레벨
      };

      // 지도 생성
      const map = new kakao.maps.Map(container, options);

      // 마커(핀) 생성 및 표시
      new kakao.maps.Marker({
        position: coords,
        map: map,
      });
    };

    // Kakao SDK 로드 대기
    const waitForKakao = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(initMap);
      } else {
        setTimeout(waitForKakao, 100);
      }
    };

    waitForKakao();
  }, [latitude, longitude]);

  // 예외 처리: 데이터 없이 접근했을 때
  if (!latitude || !longitude) {
    return <div className="p-4 text-center">위치 정보가 없습니다.</div>;
  }

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* 뒤로가기 버튼 & 타이틀 */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center bg-gradient-to-b from-black/30 to-transparent pointer-events-none">
        <button 
          onClick={() => navigate(-1)} 
          className="pointer-events-auto bg-white p-2 rounded-full shadow-md text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="ml-3 text-white font-bold text-lg drop-shadow-md">
            {locationName || '모임 위치'}
        </h2>
      </div>

      {/* 지도 컨테이너 */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}