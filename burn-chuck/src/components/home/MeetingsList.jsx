import React, { useEffect, useState } from 'react';
import apiClient from '../../api/axiosClient';

// keyword prop 추가
export default function MeetingsList({ category = null, keyword = null, onItemClick = () => {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchMeetings = async (p = 0, append = false) => {
    // 로딩 중이거나 더 가져올 게 없는데 append 하려는 경우 방지 (중복 호출 방지)
    if (loading) return;

    setLoading(true);
    setError(null);
    try {
      const params = { page: p };
      
      // 카테고리가 있으면 추가
      if (category) params.category = category;
      
      // [수정] 키워드가 있으면 추가 (MeetingSearchRequest DTO 필드명과 일치해야 함)
      if (keyword) params.keyword = keyword; 

      const res = await apiClient.get('/meetings', { params });
      const resData = res?.data?.data || res?.data || {};
      const newItems = resData?.content || resData?.items || [];

      setItems((prev) => (append ? [...prev, ...newItems] : newItems));
      
      if (typeof resData?.totalPages === 'number') {
        setHasMore(p < (resData.totalPages - 1));
      } else {
        setHasMore(newItems.length > 0);
      }
      setPage(p);
    } catch (err) {
      console.error('Failed to load meetings', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // [수정] category 또는 keyword가 변경되면 리스트 초기화 및 재조회
  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    fetchMeetings(0, false);
  }, [category, keyword]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    fetchMeetings(page + 1, true);
  };

  return (
    <div className="w-full px-4 pb-20"> {/* pb-20: 하단 탭바 등에 가려지지 않게 여백 추가 */}
      {/* ... (기존 렌더링 로직 동일) ... */}
      
      <div className="space-y-4">
        {items.map((m) => {
           // ... (기존 매핑 로직 동일) ...
           const { meetingId, meetingTitle, location, meetingDatetime, maxAttendees, currentAttendees, imgUrl } = m;
           return (
            <div
              key={meetingId}
              className="h-32 bg-white rounded-md flex items-center p-3 shadow-sm cursor-pointer hover:shadow-md"
              onClick={() => onItemClick(m)}
            >
              <img src={imgUrl} alt={meetingTitle} className="w-24 h-full object-cover mr-3 rounded" />
              <div className="flex-1 min-w-0"> {/* min-w-0 for truncate to work */}
                <div className="font-medium text-gray-800 mb-2 truncate">{meetingTitle}</div>
                <div className="text-sm text-gray-500 truncate">{location}</div>
                <div className="text-sm text-gray-500">{new Date(meetingDatetime).toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-1">참여 : {currentAttendees} / {maxAttendees}</div>
              </div>
            </div>
           );
        })}

        {items.length === 0 && !loading && !error && (
          <div className="text-center text-sm text-gray-500 py-12">
            {keyword ? `'${keyword}' 검색 결과가 없습니다.` : '조회된 모임이 없습니다.'}
          </div>
        )}
      </div>

      {/* ... (더보기 버튼 로직 동일) ... */}
      <div className="mt-4 flex justify-center">
        {hasMore && (
          <button onClick={loadMore} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full" disabled={loading}>
            {loading ? '로딩중...' : '더 보기'}
          </button>
        )}
      </div>
    </div>
  );
}