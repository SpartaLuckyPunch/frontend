import React, { useEffect, useRef } from 'react';
import apiClient from '../api/axiosClient';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SearchPage() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const searchMarkersRef = useRef([]);
  const markersRef = useRef([]);
  const boundsListenerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 내 위치
  const myLat = 37.5450159;
  const myLng = 127.1368066;

  useEffect(() => {
    // 1. 이미 지도가 생성되어 있다면 초기화 로직을 건너뜀 (불필요한 리셋 방지)
    if (mapRef.current) return;

    const waitForKakao = (cb) => {
      if (window.kakao && window.kakao.maps) return cb();
      const id = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(id);
          cb();
        }
      }, 100);
    };

    waitForKakao(() => {
      const kakao = window.kakao;
      const container = containerRef.current;
      if (!container) return;

      const center = new kakao.maps.LatLng(myLat, myLng);
      const options = { center, level: 4 };
      
      const map = new kakao.maps.Map(container, options);
      mapRef.current = map;

      // 내 위치 마커 표시
      new kakao.maps.Marker({ position: center, map });

      const onBoundsChanged = async () => {
        try {
          if (!mapRef.current) return; // map 인스턴스 확인
          
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          const centerPos = map.getCenter(); // 이름 충돌 방지

          const params = {
            centerLat: centerPos.getLat(),
            centerLng: centerPos.getLng(),
            minLat: sw.getLat(),
            minLng: sw.getLng(),
            maxLat: ne.getLat(),
            maxLng: ne.getLng(),
          };

          // API 호출
          const res = await apiClient.get('/meetings/map', { params });
          const data = res?.data?.data || [];

          // 기존 마커 제거
          markersRef.current.forEach((m) => m.setMap(null));
          markersRef.current = [];

          // 새 마커 추가
          data.forEach((item) => {
            const lat = item.latitude ?? item.lat ?? item.y;
            const lng = item.longitude ?? item.lng ?? item.x;
            if (lat == null || lng == null) return;
            
            const marker = new kakao.maps.Marker({
              position: new kakao.maps.LatLng(lat, lng),
              map
            });
            markersRef.current.push(marker);
          });
        } catch (err) {
          console.error('meetings map fetch error', err);
        }
      };

      // 이벤트 등록 (debounce 처리를 해주면 API 호출 횟수를 줄일 수 있어 더 좋습니다)
      boundsListenerRef.current = kakao.maps.event.addListener(map, 'bounds_changed', onBoundsChanged);
      
      // 초기 데이터 로드
      onBoundsChanged();
    });

    return () => {
        // 컴포넌트 언마운트 시 정리
        // 주의: 만약 부모가 자주 리렌더링 시키는 구조라면 이 cleanup 때문에 지도가 자꾸 사라질 수 있습니다.
        if (boundsListenerRef.current && mapRef.current) {
            window.kakao.maps.event.removeListener(boundsListenerRef.current);
        }
    };
  }, []); // 의존성 배열 비움

  // helper: perform places keyword search and render markers
  const performPlacesSearch = (keyword) => {
    if (!keyword || !window.kakao || !mapRef.current) return;
    const kakao = window.kakao;
    const ps = new kakao.maps.services.Places();

    ps.keywordSearch(keyword, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        // clear previous search markers
        searchMarkersRef.current.forEach((m) => m.setMap(null));
        searchMarkersRef.current = [];

        const bounds = new kakao.maps.LatLngBounds();
        data.forEach((item) => {
          const lat = item.y;
          const lng = item.x;
          const marker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(lat, lng), map: mapRef.current });
          searchMarkersRef.current.push(marker);
          bounds.extend(new kakao.maps.LatLng(lat, lng));
        });
        if (!bounds.isEmpty()) mapRef.current.setBounds(bounds);
      }
    });
  };

  // watch query param 'q' to run places search when user returns from input page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) performPlacesSearch(q);
  }, [location.search]);

  return (
    <div className="relative">
      {/* top overlay search box */}
      <div className="absolute left-4 right-4 z-20" style={{ top: 12 }}>
        <div
          onClick={() => navigate('/search/input')}
          className="flex items-center bg-white border rounded-full px-3 py-2 shadow-sm cursor-text"
        >
          <SearchIcon size={18} className="text-gray-400 mr-2" />
          <div className="text-gray-400">검색어를 입력하세요</div>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ width: '100%', height: 835, transform: 'translateY(-20px)' }}
        className="rounded-md border"
      />
    </div>
  );
}