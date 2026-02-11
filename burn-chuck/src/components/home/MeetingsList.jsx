import React, { useEffect, useState } from 'react';
import apiClient from '../../api/axiosClient';
import sampleImg from '../../assets/images/고윤정.jpg';

export default function MeetingsList({ category = null, onItemClick = () => {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // use 0-based page index to match backend (number: 0 for first page)
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchMeetings = async (p = 0, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: p };
      if (category) params.category = category;
      const res = await apiClient.get('/meetings', { params });
      const resData = res?.data?.data || res?.data || {};
      const newItems = resData?.content || resData?.items || (Array.isArray(resData) ? resData : []);
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

  useEffect(() => {
    // reset when category changes
    setItems([]);
    setPage(0);
    setHasMore(true);
    fetchMeetings(0, false);
  }, [category]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    fetchMeetings(page + 1, true);
  };

  return (
    <div className="w-full px-4">
      {loading && items.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-8">로딩중...</div>
      )}

      {error && (
        <div className="text-center text-sm text-red-500 py-4">목록을 불러오는 중 오류가 발생했습니다.</div>
      )}

      <div className="space-y-4">
        {items.map((m, idx) => {
          const id = m.meetingId;
          const title = m.meetingTitle;
          const location = m.location;
          const date = m.meetingDatetime;
          const maxAttendees = m.maxAttendees;
          const currentAttendees = m.currentAttendees;
          return (
            <div
              key={id}
              className="h-32 bg-white rounded-md flex items-center p-3 shadow-sm cursor-pointer hover:shadow-md"
              role="button"
              tabIndex={0}
              onClick={() => onItemClick(m)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onItemClick(m);
                }
              }}
            >
              <img src={m.imgUrl} alt={title} className="w-24 h-full object-cover mr-3 rounded" />
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-4">{title}</div>
                <div className="text-sm text-gray-500">{location}</div>
                <div className="text-sm text-gray-500">{new Date(date).toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-2">현재 인원 : {currentAttendees} / {maxAttendees}</div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && !loading && !error && (
          <div className="text-center text-sm text-gray-500 py-8">조회된 모임이 없습니다.</div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        {hasMore ? (
          <button onClick={loadMore} className="px-4 py-2 bg-gray-200 rounded" disabled={loading}>
            {loading ? '불러오는 중...' : '더 불러오기'}
          </button>
        ) : (
          items.length > 0 && <div className="text-sm text-gray-400">마지막 목록입니다.</div>
        )}
      </div>
    </div>
  );
}
