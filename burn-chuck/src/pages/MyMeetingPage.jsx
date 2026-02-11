import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosClient';
import sampleImg from '../assets/images/고윤정.jpg';

export default function MyMeetingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | OPEN | COMPLETED

  const fetchHosted = async (p = 0, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/meetings/attendance-meetings', { params: { page: p } });
      const resData = res?.data?.data || res?.data || {};
      const newItems = resData?.meetingList || resData?.content || [];
      setItems((prev) => (append ? [...prev, ...newItems] : newItems));
      if (typeof resData?.totalPages === 'number') {
        setHasMore(p < (resData.totalPages - 1));
      } else {
        setHasMore(newItems.length > 0);
      }
      setPage(p);
    } catch (err) {
      console.error('Failed to load hosted meetings', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    fetchHosted(0, false);
  }, []);

  const loadMore = () => {
    if (loading || !hasMore) return;
    fetchHosted(page + 1, true);
  };

  return (
    <div className="w-full px-4 py-3 translate-y-[-16px]">
      {loading && items.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-8">로딩중...</div>
      )}

      {error && (
        <div className="text-center text-sm text-red-500 py-4">목록을 불러오는 중 오류가 발생했습니다.</div>
      )}

      <div className="flex gap-2 mb-3">
        <button onClick={() => setFilter('ALL')} className={`px-3 py-1 rounded-full ${filter==='ALL' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
          전체
        </button>
        <button onClick={() => setFilter('OPEN')} className={`px-3 py-1 rounded-full ${filter==='OPEN' ? 'bg-black text-white' : 'bg-gray-100'}`}>
          모집중
        </button>
        <button onClick={() => setFilter('COMPLETED')} className={`px-3 py-1 rounded-full ${filter==='COMPLETED' ? 'bg-black text-white' : 'bg-gray-100'}`}>
          완료
        </button>
      </div>

      <div className="space-y-4">
        {items.filter((m) => (filter === 'ALL' ? true : m.status === filter)).map((m) => (
            <div key={m.meetingId} className="h-32 bg-white rounded-md flex items-center p-3 shadow-sm cursor-pointer hover:shadow-md" onClick={() => window.location.href = `/meetings/${m.meetingId}`}>
            <img src={m.imgUrl || sampleImg} alt={m.meetingTitle} className="w-24 h-full object-cover mr-3 rounded" />
            <div className="flex-1">
              <div className="font-medium text-gray-800 mb-2">{m.meetingTitle}</div>
              <div className="text-sm text-gray-500">{m.location}</div>
              <div className="text-sm text-gray-500">{new Date(m.meetingDatetime).toLocaleString()}</div>
              <div className="text-sm text-gray-400 mt-2">현재 인원 : {m.currentAttendees} / {m.maxAttendees}</div>
            </div>
            <div className="ml-3">
              <span className={`px-2 py-1 text-sm font-medium ${
                m.status === 'COMPLETED' ? 'bg-red-100 text-red-700' : m.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                  {m.status === 'COMPLETED' ? '완료' : m.status === 'OPEN' ? '모집중' : m.status}
              </span>
            </div>
          </div>
        ))}

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