import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../api/axiosClient';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../features/auth/store/useUserStore';
import Category from '../components/home/Category';

// [팁] 실제 프로젝트에서는 src/assets/images 폴더에 이미지를 넣고 import 해서 쓰세요.
// 예: import myLocIcon from '../assets/images/my_location.png';
const MY_LOCATION_IMG_URL = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png"; // (예시) 빨간 핀
const MEETING_IMG_URL = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; // (예시) 파란 별 핀

export default function SearchPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  
  const markersRef = useRef([]); // 모임 마커 관리
  const overlaysRef = useRef([]); // [추가] 모임 이름 오버레이 관리
  
  const boundsListenerRef = useRef(null);
  const timerRef = useRef(null); 

  const navigate = useNavigate();
  const location = useLocation();
  const userAddress = useUserStore(state => state.userAddress);

  const myLat = userAddress?.latitude || 37.4979;
  const myLng = userAddress?.longitude || 127.0276;

  // [1] 데이터 Fetch 함수
  const fetchMeetings = async () => {
    if (!mapRef.current) return;

    try {
        const bounds = mapRef.current.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const centerPos = mapRef.current.getCenter();

        const query = new URLSearchParams(location.search);
        
        const params = {
            keyword: query.get('keyword') || '',
            category: selectedCategory || query.get('category'),
            startDate: query.get('startDate'),
            endDate: query.get('endDate'),
            startTime: query.get('startTime'),
            endTime: query.get('endTime'),
            centerLat: centerPos.getLat(),
            centerLng: centerPos.getLng(),
            minLat: sw.getLat(),
            minLng: sw.getLng(),
            maxLat: ne.getLat(),
            maxLng: ne.getLng(),
        };

        Object.keys(params).forEach(key => {
            if (params[key] == null || params[key] === '') delete params[key];
        });

        const res = await apiClient.get('/meetings/map', { params });
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];

        renderMarkers(data);

    } catch (err) {
        console.error('Meeting Map Fetch Error:', err);
    }
  };

// [2] 마커 및 오버레이 렌더링 함수
  const renderMarkers = (data) => {
      // 1. 기존 마커 및 오버레이 제거 (초기화)
      if (markersRef.current.length > 0) {
          markersRef.current.forEach(marker => marker.setMap(null));
          markersRef.current = [];
      }
      if (overlaysRef.current.length > 0) {
          overlaysRef.current.forEach(overlay => overlay.setMap(null));
          overlaysRef.current = [];
      }

      // 2. 모임 핀 이미지 설정
      const imageSrc = MEETING_IMG_URL; 
      const imageSize = new window.kakao.maps.Size(24, 35); 
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

      data.forEach((item) => {
          // 좌표 데이터 처리 (latitude/longitude 등)
          const lat = item.latitude ?? item.lat;
          const lng = item.longitude ?? item.lng;
          
          if (!lat || !lng) return;
          
          const position = new window.kakao.maps.LatLng(lat, lng);

          // (A) 마커 생성
          const marker = new window.kakao.maps.Marker({
              position: position,
              map: mapRef.current,
              title: item.meetingTitle,
              image: markerImage, 
              clickable: true,
              zIndex: 3 // 오버레이보다 뒤에, 내 위치보다 뒤에
          });

          // (B) 커스텀 오버레이 생성 (HTML 문자열 대신 DOM Element 사용)
          // [핵심] DOM을 직접 생성해야 addEventListener를 붙일 수 있습니다.
          const content = document.createElement('div');
          
          // 스타일 직접 지정
          content.style.cssText = `
            padding: 5px 10px;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            color: #333;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            white-space: nowrap;
            transform: translateY(-45px); /* 마커 위로 올리기 */
            cursor: pointer; /* 마우스 올렸을 때 손가락 모양 */
          `;
          content.innerText = item.meetingTitle;

          // [핵심] 오버레이(말풍선) 클릭 시 이동 이벤트 추가
          content.addEventListener('click', () => {
             navigate(`/meetings/${item.meetingId}`);
          });

          const overlay = new window.kakao.maps.CustomOverlay({
              position: position,
              content: content, // DOM 엘리먼트 전달
              map: mapRef.current,
              yAnchor: 1,
              zIndex: 4 // 마커보다 위에 보이도록
          });

          // (C) 마커 클릭 시 이동 이벤트 (기존 유지)
          // 사용자가 핀을 클릭해도 이동하고, 말풍선을 클릭해도 이동하게 함
          window.kakao.maps.event.addListener(marker, 'click', () => {
              navigate(`/meetings/${item.meetingId}`); 
          });

          // 배열에 저장
          markersRef.current.push(marker);
          overlaysRef.current.push(overlay);
      });
  };

  // [3] 지도 초기화 Effect
  useEffect(() => {
    if (mapRef.current) return;

    const waitForKakao = (cb) => {
        if (window.kakao) {
            window.kakao.maps.load(() => {
                cb();
            });
        } else {
            const id = setInterval(() => {
                if (window.kakao) {
                    clearInterval(id);
                    window.kakao.maps.load(() => {
                        cb();
                    });
                }
            }, 100);
        }
    };

    waitForKakao(() => {
        const container = containerRef.current;
        if (!container) return;

        const center = new window.kakao.maps.LatLng(myLat, myLng);
        const options = { center, level: 4 };
        const map = new window.kakao.maps.Map(container, options);
        mapRef.current = map;

        // [수정] 내 위치 마커 커스터마이징
        // 내 위치는 좀 더 눈에 띄거나 다른 색상으로 표시
        const myLocImageSrc = MY_LOCATION_IMG_URL; // 혹은 별도의 '내 위치' 아이콘 URL
        const myLocImageSize = new window.kakao.maps.Size(30, 40); // 조금 더 크게
        const myLocImageOption = { offset: new window.kakao.maps.Point(15, 40) };
        
        const myLocMarkerImage = new window.kakao.maps.MarkerImage(
            myLocImageSrc, 
            myLocImageSize, 
            myLocImageOption
        );

        new window.kakao.maps.Marker({ 
            position: center, 
            map: map,
            image: myLocMarkerImage, // 내 위치 전용 이미지
            zIndex: 5 // 다른 마커보다 위에 보이게
        });

        // 내 위치 라벨 (선택사항)
        const myContent = `<div style="padding:3px 8px; background:#FF5F5F; color:white; border-radius:12px; font-size:10px; font-weight:bold; transform:translateY(-50px);">내 위치</div>`;
        new window.kakao.maps.CustomOverlay({
            position: center,
            content: myContent,
            map: map
        });

        const onBoundsChanged = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(fetchMeetings, 500);
        };

        boundsListenerRef.current = window.kakao.maps.event.addListener(map, 'bounds_changed', onBoundsChanged);
        
        fetchMeetings(); 
    });

    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (boundsListenerRef.current && mapRef.current) {
            window.kakao.maps.event.removeListener(boundsListenerRef.current);
        }
    };
  }, []);

  useEffect(() => {
      if (mapRef.current) {
          fetchMeetings();
      }
  }, [location.search, selectedCategory]); 


  return (
    <div className="relative">
      <div className="absolute left-4 right-4 z-20 flex flex-col gap-2" style={{ top: 12 }}>
        
        <div
          onClick={() => navigate('/search/input')}
          className="flex items-center bg-white border rounded-full px-3 py-2 shadow-sm cursor-text"
        >
          <SearchIcon size={18} className="text-gray-400 mr-2" />
          <div className="text-gray-400 truncate text-sm">
             {new URLSearchParams(location.search).get('keyword') || "검색어를 입력하세요"}
          </div>
        </div>

        <Category selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      <div
        ref={containerRef}
        style={{ width: '100%', height: 'calc(100vh - 60px)', minHeight: '500px' }}
        className="rounded-md border bg-gray-100"
      />
    </div>
  );
}