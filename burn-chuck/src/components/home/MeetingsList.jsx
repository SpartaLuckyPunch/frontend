import React, { useEffect, useState } from 'react';
import apiClient from '../../api/axiosClient';

// 👇 1. order prop 추가 (기본값 LATEST)
export default function MeetingsList({ category = null, keyword = null, order = 'LATEST', onItemClick = () => {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchMeetings = async (p = 0, append = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);
    try {
      const params = { page: p };
      
      if (category) params.category = category;
      if (keyword) params.keyword = keyword;
      // 👇 2. 파라미터에 order 추가 (백엔드 @RequestParam 에 매핑됨)
      if (order) params.order = order; 

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

  // 👇 3. 의존성 배열에 order 추가 (카테고리, 키워드, 정렬 중 하나라도 바뀌면 재조회)
  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    fetchMeetings(0, false);
  }, [category, keyword, order]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    fetchMeetings(page + 1, true);
  };

  return (
    <div className="w-full px-4 pb-20">
      <div className="space-y-4">
        {items.map((m) => {
          const { meetingId, meetingTitle, location, meetingDatetime, maxAttendees, currentAttendees, imgUrl } = m;
          return (
            <div
              key={meetingId}
              className="h-32 bg-white rounded-md flex items-center p-3 shadow-sm cursor-pointer hover:shadow-md"
              onClick={() => onItemClick(m)}
            >
              <img src={imgUrl} alt={meetingTitle} className="w-24 h-full object-cover mr-3 rounded" />
              <div className="flex-1 min-w-0">
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