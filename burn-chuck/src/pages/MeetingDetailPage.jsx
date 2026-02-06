import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import sampleImg from '../assets/images/고윤정.jpg';
// 아이콘 추가 임포트 (버튼 상태별 아이콘 추가: LogOut, UserPlus, Ban, CheckCircle)
import { Heart, MapPin, Calendar, Users, Eye, Clock, ChevronLeft, LogOut, UserPlus, Ban, CheckCircle } from 'lucide-react';

function formatKoreanDatetime(iso) {
  try {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
    const timePart = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return { date: datePart, time: timePart };
  } catch (e) {
    return { date: iso, time: '' };
  }
}

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [meeting, setMeeting] = useState(null);
  
  // 좋아요 상태
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 🚀 참여 상태 (추가됨)
  const [isAttending, setIsAttending] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // 🚀 3개의 API 병렬 호출 (상세정보, 좋아요여부, 참여목록)
    Promise.all([
      apiClient.get(`/meetings/${id}`),             // 1. 모임 상세
      apiClient.get(`/meetings/${id}/like-existence`), // 2. 좋아요 여부
      apiClient.get(`/meetings/attendance-meetings`)   // 3. 내 참여 목록 확인
    ])
    .then(([detailRes, likeRes, attendRes]) => {
      if (mounted) {
        const meetingData = detailRes?.data?.data || detailRes?.data;
        const likeStatus = likeRes?.data?.data;
        
        // 🚀 참여 목록에서 현재 보고 있는 모임 ID가 있는지 확인
        // attendRes.data.data.meetingList 구조에 맞춤
        const myMeetingList = attendRes?.data?.data?.meetingList || [];
        // useParams의 id는 string이므로 Number로 변환하여 비교
        const isUserAttending = myMeetingList.some(m => m.meetingId === Number(id));

        setMeeting(meetingData);
        setLikeCount(meetingData.likes || 0);
        setIsLiked(likeStatus);
        setIsAttending(isUserAttending);
      }
    })
    .catch((err) => {
      console.error('데이터 로딩 실패', err);
      if (mounted) setError(err);
    })
    .finally(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [id]);

  // 좋아요 핸들러
  const handleToggleLike = async () => {
    if (!meeting) return;
    const prevIsLiked = isLiked;
    const prevLikeCount = likeCount;

    const newIsLiked = !prevIsLiked;
    setIsLiked(newIsLiked);
    setLikeCount(newIsLiked ? prevLikeCount + 1 : prevLikeCount - 1);

    try {
      if (newIsLiked) {
        await apiClient.post(`/meetings/${id}/likes`);
      } else {
        await apiClient.delete(`/meetings/${id}/likes`);
      }
    } catch (err) {
      console.error('좋아요 처리 중 에러 발생', err);
      setIsLiked(prevIsLiked);
      setLikeCount(prevLikeCount);
      alert('요청을 처리하는 중 문제가 발생했습니다.');
    }
  };

  // 🚀 참여 / 취소 핸들러
  const handleAttendance = async () => {
    if (!meeting) return;

    try {
      if (isAttending) {
        // 이미 참여 중 -> 취소 로직
        if (!window.confirm("정말 참여를 취소하시겠습니까?")) return;
        
        await apiClient.delete(`/meetings/${id}/attendance`);
        
        setIsAttending(false);
        setMeeting(prev => ({ ...prev, currentAttendees: prev.currentAttendees - 1 }));
        alert("참여가 취소되었습니다.");
      } else {
        // 미참여 -> 참여 로직
        if (!window.confirm("이 모임에 참여하시겠습니까?")) return;
        
        await apiClient.post(`/meetings/${id}/attendance`);
        
        setIsAttending(true);
        setMeeting(prev => ({ ...prev, currentAttendees: prev.currentAttendees + 1 }));
        alert("참여 신청이 완료되었습니다!");
      }
    } catch (err) {
      console.error("참여 처리 에러", err);
      const msg = err.response?.data?.message || "처리 중 오류가 발생했습니다.";
      alert(msg);
    }
  };

  // 🚀 버튼 상태 결정 함수 (상태 + 참여여부 조합)
  const getButtonConfig = () => {
    if (!meeting) return { text: '', disabled: true, className: '' };

    // meetingStatus: OPEN, CLOSED, COMPLETED
    const { meetingStatus } = meeting;

    // 1. 모집 완료 (COMPLETED)
    if (meetingStatus === 'COMPLETED') {
      return {
        text: '모집 완료',
        disabled: true,
        icon: <CheckCircle size={20} />,
        className: 'bg-gray-300 text-gray-500 cursor-not-allowed'
      };
    }

    // 2. 모집 마감 (CLOSED)
    if (meetingStatus === 'CLOSED') {
      return {
        text: '모집 마감',
        disabled: true,
        icon: <Ban size={20} />,
        className: 'bg-gray-300 text-gray-500 cursor-not-allowed'
      };
    }

    // 3. 모집 중 (OPEN) 이면서 "이미 참여한 경우"
    if (isAttending) {
      return {
        text: '참여 취소',
        disabled: false,
        icon: <LogOut size={20} />,
        className: 'bg-white border-2 border-rose-500 text-rose-500 hover:bg-rose-50'
      };
    }

    // 4. 모집 중 (OPEN) 이면서 "참여 안 한 경우" (기본)
    return {
      text: '참여하기',
      disabled: false,
      icon: <UserPlus size={20} />,
      className: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-lg shadow-indigo-200'
    };
  };

  const btnConfig = getButtonConfig();

  // 로딩 스켈레톤
  if (loading) return (
    <div className="max-w-md mx-auto h-screen bg-white animate-pulse">
      <div className="h-64 bg-gray-200"></div>
      <div className="p-5 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
        <div className="text-red-500 mb-2">오류가 발생했습니다</div>
        <button onClick={() => window.location.reload()} className="text-sm underline text-gray-500">새로고침</button>
    </div>
  );
  
  if (!meeting) return <div className="p-4 text-center text-gray-500">모임 정보를 찾을 수 없습니다.</div>;

  const { date, time } = formatKoreanDatetime(meeting.meetingDatetime);
  const percent = Math.min((meeting.currentAttendees / meeting.maxAttendees) * 100, 100);

  return (
    <div className="bg-gray-50 min-h-screen pb-24 relative translate-y-[-20px]">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative overflow-hidden">
        
        {/* 1. 상단 네비게이션 & 이미지 */}
        <div className="relative">
          <div className="absolute top-0 left-0 w-full z-10 flex justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <button onClick={() => navigate(-1)} className="text-white hover:bg-white/20 p-2 rounded-full transition">
              <ChevronLeft size={24} />
            </button>
          </div>

          <img
            src={sampleImg || meeting.imgUrl}
            alt={meeting.meetingTitle}
            className="w-full h-72 object-contain"
          />
          
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 translate-y-[-12px]">
            <Eye size={12} />
            <span>{meeting.views ?? 0}</span>
          </div>
        </div>

        {/* 2. 메인 컨텐츠 */}
        <div className="p-6 -mt-6 bg-white rounded-t-3xl relative z-0">
          
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-4">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                {meeting.meetingTitle}
              </h1>
            </div>
            
            <div className="flex flex-col items-center">
                <button 
                    onClick={handleToggleLike}
                    className={`p-3 rounded-full transition-all duration-300 shadow-sm border
                        ${isLiked 
                            ? 'bg-rose-50 border-rose-100 text-rose-500 scale-110' 
                            : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                        }`}
                >
                    <Heart 
                        className={`w-6 h-6 ${isLiked ? 'fill-rose-500' : ''}`} 
                        strokeWidth={2}
                    />
                </button>
                <span className="text-xs text-gray-500 mt-1 font-medium">{likeCount}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-8 space-y-4">
            <div className="flex items-start gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm text-indigo-500">
                    <Calendar size={18} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">날짜</p>
                    <p className="text-gray-800 font-semibold">{date}</p>
                </div>
            </div>

            <div className="flex items-start gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm text-indigo-500">
                    <Clock size={18} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">시간</p>
                    <p className="text-gray-800 font-semibold">{time}</p>
                </div>
            </div>
            {/* 위치 영역 (디자인 통일) */}
            <div 
                className="flex items-start gap-3 cursor-pointer hover:bg-gray-100 p-2 -m-2 rounded-lg transition-colors"
                onClick={() => navigate(`/meetings/${meeting.meetingId}/map`, { 
                    state: { 
                        latitude: meeting.latitude, 
                        longitude: meeting.longitude, 
                        location: meeting.location, 
                        meetingTitle: meeting.meetingTitle 
                    } 
                })}
            >
                <div className="bg-white p-2 rounded-full shadow-sm text-indigo-500">
                    <MapPin size={18} />
                </div>
                <div className="w-full">
                    <p className="text-xs text-gray-500 font-medium">위치</p>
                    {/* 버튼 대신 p태그로 변경 (상위 div가 클릭 이벤트를 받으므로) */}
                    <p className="text-gray-800 font-semibold leading-tight mt-0.5">
                        {meeting.location}
                    </p>
                </div>
                {/* 우측 화살표 아이콘 (이동 가능함 표시) */}
                <div className="text-gray-400 self-center">
                    <ChevronLeft size={16} className="rotate-180" />
                </div>
            </div>
            <div 
                className="flex items-start gap-3 cursor-pointer hover:bg-gray-100 p-2 -m-2 rounded-lg transition-colors"
                onClick={() => navigate(`/meetings/${id}/members`)}
            >
                <div className="bg-white p-2 rounded-full shadow-sm text-indigo-500">
                    <Users size={18} />
                </div>
                <div className="w-full">
                    <div className="flex justify-between items-end mb-1">
                        <p className="text-xs text-gray-500 font-medium">참여 인원 (클릭하여 보기)</p> {/* 텍스트 살짝 수정 */}
                        <p className="text-xs font-bold text-indigo-600">
                            {meeting.currentAttendees} / {meeting.maxAttendees}명
                        </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>
                {/* 화살표 아이콘 추가 (이동 가능함을 암시) */}
                <div className="text-gray-400 self-center">
                    <ChevronLeft size={16} className="rotate-180" /> 
                </div>
            </div>
          </div>

          <div className="mb-4 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">모임 소개</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                {meeting.description}
            </p>
          </div>
        </div>

        {/* 🚀 5. 하단 고정 버튼 (Sticky Footer) - 상태에 따라 변함 */}
        <div className="absolute left-0 right-0 max-w-md mx-auto bg-white border-gray-100 p-4 z-50">
            <button 
                onClick={handleAttendance}
                disabled={btnConfig.disabled}
                className={`w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${btnConfig.className}`}
            >
                {/* 버튼 아이콘과 텍스트 */}
                {btnConfig.icon}
                <span>{btnConfig.text}</span>
            </button>
        </div>
      </div>
    </div>
  );
}