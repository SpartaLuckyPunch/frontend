import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosClient';
import sampleImg from '../assets/images/고윤정.jpg';

export default function MyMeetingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // ALL | OPEN | CLOSED | COMPLETED
  const [filter, setFilter] = useState('ALL'); 

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

  // 클라이언트 사이드 필터링 로직
  // (API가 필터링을 지원한다면 fetchHosted에 filter를 전달하는 것이 더 좋습니다)
  const filteredItems = items.filter((m) => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  return (
    <div className="w-full px-4 py-3">
      {loading && items.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-8">로딩중...</div>
      )}

      {error && (
        <div className="text-center text-sm text-red-500 py-4">목록을 불러오는 중 오류가 발생했습니다.</div>
      )}

      {/* 필터 버튼 영역 */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setFilter('ALL')} className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${filter==='ALL' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          전체
        </button>
        <button onClick={() => setFilter('OPEN')} className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${filter==='OPEN' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
          모집중
        </button>
        {/* [추가] CLOSED 버튼 */}
        <button onClick={() => setFilter('CLOSED')} className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${filter==='CLOSED' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
          마감
        </button>
        <button onClick={() => setFilter('COMPLETED')} className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${filter==='COMPLETED' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
          완료
        </button>
      </div>

      <div className="space-y-4">
        {filteredItems.map((m) => (
            <div key={m.meetingId} className="h-32 bg-white rounded-md flex items-center p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = `/meetings/${m.meetingId}`}>
            <img src={m.imgUrl || sampleImg} alt={m.meetingTitle} className="w-24 h-full object-cover mr-3 rounded" />
            <div className="flex-1 min-w-0"> {/* min-w-0는 flex 내부 텍스트 truncate를 위해 필요 */}
              <div className="font-medium text-gray-800 mb-2 truncate">{m.meetingTitle}</div>
              <div className="text-sm text-gray-500 truncate">{m.location}</div>
              <div className="text-sm text-gray-500">{new Date(m.meetingDatetime).toLocaleString()}</div>
              <div className="text-sm text-gray-400 mt-2">현재 인원 : {m.currentAttendees} / {m.maxAttendees}</div>
            </div>
            <div className="ml-3 flex-shrink-0">
              {/* [수정] 배지 스타일 및 텍스트 로직 추가 */}
              <span className={`px-2 py-1 text-xs font-bold rounded ${
                m.status === 'COMPLETED' ? 'bg-red-100 text-red-600' : 
                m.status === 'OPEN' ? 'bg-green-100 text-green-600' : 
                m.status === 'CLOSED' ? 'bg-gray-200 text-gray-600' : // CLOSED 스타일 (진한 회색)
                'bg-gray-100 text-gray-500'
              }`}>
                  {
                    m.status === 'COMPLETED' ? '완료' : 
                    m.status === 'OPEN' ? '모집중' : 
                    m.status === 'CLOSED' ? '마감' : // CLOSED 텍스트
                    m.status
                  }
              </span>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && !loading && !error && (
          <div className="text-center text-sm text-gray-500 py-10 bg-gray-50 rounded-lg">
            {filter === 'ALL' ? '참여한 모임이 없습니다.' : '해당 상태의 모임이 없습니다.'}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        {hasMore ? (
          <button onClick={loadMore} className="px-4 py-2 bg-gray-200 text-sm text-gray-700 rounded hover:bg-gray-300 transition-colors" disabled={loading}>
            {loading ? '불러오는 중...' : '더 불러오기'}
          </button>
        ) : (
          items.length > 0 && <div className="text-sm text-gray-400 py-4">마지막 목록입니다.</div>
        )}
      </div>
    </div>
  );
}