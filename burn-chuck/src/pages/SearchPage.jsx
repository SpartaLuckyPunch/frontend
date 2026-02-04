import React, { useEffect, useRef } from 'react';
import apiClient from '../api/axiosClient';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../features/auth/store/useUserStore';

export default function SearchPage() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const searchMarkersRef = useRef([]);
  const markersRef = useRef([]);
  const boundsListenerRef = useRef(null);
  
  // ✏️ 디바운싱을 위한 타이머 Ref 추가
  const timerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const userAddress= useUserStore(state => state.userAddress);

  // 현재 내 위치
  const myLat = userAddress?.latitude;
  const myLng = userAddress?.longitude;

  useEffect(() => {
    // 1. 이미 지도가 생성되어 있다면 초기화 로직을 건너뜀
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

      // 내 위치 마커 표시 (구분을 위해 이미지를 다르게 하거나 색상을 다르게 할 수 있음)
      new kakao.maps.Marker({ position: center, map });

      // ✏️ 지도 영역 변경 핸들러 (디바운싱 적용)
      const onBoundsChanged = () => {
        // 기존 타이머가 있다면 취소 (연속 호출 방지)
        if (timerRef.current) clearTimeout(timerRef.current);

        // 0.5초 뒤에 실행되도록 예약
        timerRef.current = setTimeout(async () => {
            try {
              if (!mapRef.current) return;
              
              const bounds = map.getBounds();
              const sw = bounds.getSouthWest();
              const ne = bounds.getNorthEast();
              const centerPos = map.getCenter();

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
              // ✏️ 응답 데이터 처리 (배열인지 확인)
              const data = Array.isArray(res?.data?.data) ? res.data.data : [];

              // 기존 마커 제거
              markersRef.current.forEach((m) => m.setMap(null));
              markersRef.current = [];

              // 새 마커 추가
              data.forEach((item) => {
                // ✏️ JSON 응답 키값 매핑 (latitude, longitude)
                const lat = item.latitude ?? item.lat ?? item.y;
                const lng = item.longitude ?? item.lng ?? item.x;
                
                if (lat == null || lng == null) return;
                
                const marker = new kakao.maps.Marker({
                  position: new kakao.maps.LatLng(lat, lng),
                  map,
                  title: item.meetingTitle, // 마우스 올리면 제목 표시
                  clickable: true // 클릭 가능하도록 설정
                });

                // ✏️ [핵심] 마커 클릭 시 상세 페이지 이동 이벤트 등록
                kakao.maps.event.addListener(marker, 'click', function() {
                    // item.meetingId를 사용하여 이동
                    navigate(`/meetings/${item.meetingId}`);
                });

                markersRef.current.push(marker);
              });
            } catch (err) {
              console.error('meetings map fetch error', err);
            }
        }, 500); // 0.5초 딜레이
      };

      // 이벤트 등록
      boundsListenerRef.current = kakao.maps.event.addListener(map, 'bounds_changed', onBoundsChanged);
      
      // 초기 데이터 로드 (첫 실행은 바로 호출)
      onBoundsChanged();
    });

    return () => {
        // cleanup
        if (timerRef.current) clearTimeout(timerRef.current);
        if (boundsListenerRef.current && mapRef.current && window.kakao) {
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