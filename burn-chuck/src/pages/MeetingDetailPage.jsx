import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import sampleImg from '../assets/images/고윤정.jpg';
import { Heart, MapPin, Calendar, Users, Eye, Clock, ChevronLeft, LogOut, UserPlus, Ban, CheckCircle, MessageSquarePlus, Star, X, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react';

// 스토어 import
import useAuthStore from '../features/auth/store/useUserStore'; 

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

// ----------------------------------------------------------------------
// [후기 작성 모달]
// ----------------------------------------------------------------------
function ReviewModal({ isOpen, onClose, meetingId, members, myId }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [rating, setRating] = useState(5);
  const [detailedReview, setDetailedReview] = useState('');
  
  const [reactionOptions, setReactionOptions] = useState([]);
  const [selectedReactions, setSelectedReactions] = useState([]);

  useEffect(() => {
    const fetchReactions = async () => {
        try {
            const res = await apiClient.get('/reactions');
            const list = res.data.data || [];
            setReactionOptions(list);
        } catch (err) {
            console.error("리액션 목록 로딩 실패", err);
        }
    };

    if (isOpen) {
        fetchReactions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const reviewTargets = [];
  
  if (members.hostId && members.hostId !== myId) {
    reviewTargets.push({ id: members.hostId, nickname: members.hostNickname, img: members.hostProfileImgUrl, role: 'HOST' });
  }
  
  if (members.attendeeList) {
    members.attendeeList.forEach(m => {
        if (m.attendeeId !== myId) {
            reviewTargets.push({ id: m.attendeeId, nickname: m.attendeeNickname, img: m.attendeeProfileImgUrl, role: 'MEMBER' });
        }
    });
  }

  const toggleReaction = (reactionId) => {
    setSelectedReactions(prev => 
      prev.includes(reactionId) ? prev.filter(r => r !== reactionId) : [...prev, reactionId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      alert("후기를 남길 멤버를 선택해주세요.");
      return;
    }

    try {
      const payload = {
        meetingId: Number(meetingId),
        rating: rating,
        reactionList: selectedReactions,
        detailedReview: detailedReview
      };

      await apiClient.post(`/users/${selectedUserId}/review`, payload);
      alert("후기가 등록되었습니다!");
      onClose(); 
      
      setRating(5);
      setDetailedReview('');
      setSelectedReactions([]);
      setSelectedUserId(null);

    } catch (error) {
      console.error("후기 등록 실패", error);
      alert(error.response?.data?.message || "후기 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-center">후기 작성</h2>
        
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">누구에게 후기를 남길까요?</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {reviewTargets.length === 0 ? (
               <p className="text-sm text-gray-400 w-full text-center py-2">작성할 대상이 없습니다.</p>
            ) : (
                reviewTargets.map(target => (
                <button
                    key={target.id}
                    onClick={() => setSelectedUserId(target.id)}
                    className={`flex flex-col items-center min-w-[70px] p-2 rounded-xl border transition-all ${
                    selectedUserId === target.id 
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mb-1">
                        {target.img ? <img src={target.img} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-300"/>}
                    </div>
                    <span className="text-xs truncate w-full text-center font-medium">{target.nickname}</span>
                    <span className="text-[10px] text-gray-400">{target.role === 'HOST' ? '방장' : '참여자'}</span>
                </button>
                ))
            )}
          </div>
        </div>

        <div className="mb-6 text-center">
            <p className="text-sm font-semibold text-gray-700 mb-2">별점</p>
            <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                        <Star 
                            size={32} 
                            className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                        />
                    </button>
                ))}
            </div>
        </div>

        <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">어떤 점이 좋았나요?</p>
            <div className="flex flex-wrap gap-2">
                {reactionOptions.length === 0 ? (
                    <div className="w-full text-center text-gray-400 text-xs py-2">
                        태그 목록을 불러오는 중...
                    </div>
                ) : (
                    reactionOptions.map((tag) => (
                        <button
                            key={tag.reactionId}
                            onClick={() => toggleReaction(tag.reactionId)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                selectedReactions.includes(tag.reactionId)
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tag.reaction}
                        </button>
                    ))
                )}
            </div>
        </div>

        <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">상세 후기 (선택)</label>
            <textarea 
                value={detailedReview}
                onChange={(e) => setDetailedReview(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 min-h-[80px]"
                placeholder="자유롭게 후기를 작성해주세요."
            />
        </div>

        <button 
            onClick={handleSubmit}
            disabled={!selectedUserId}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:bg-gray-300 transition-colors"
        >
            등록하기
        </button>
      </div>
    </div>
  );
}


// ----------------------------------------------------------------------
// [메인 페이지] MeetingDetailPage
// ----------------------------------------------------------------------
export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const user = useAuthStore((state) => state.user);
  const myId = user?.id; 

  const [meeting, setMeeting] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [meetingMembers, setMeetingMembers] = useState(null);

  // 더보기 메뉴 상태
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      apiClient.get(`/meetings/${id}`),
      apiClient.get(`/meetings/${id}/like-existence`),
      apiClient.get(`/meetings/attendance-meetings`)
    ])
    .then(([detailRes, likeRes, attendRes]) => {
      if (mounted) {
        const meetingData = detailRes?.data?.data || detailRes?.data;
        const likeStatus = likeRes?.data?.data;
        const myMeetingList = attendRes?.data?.data?.meetingList || [];
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

  const handleAttendance = async () => {
    if (!meeting) return;

    try {
      if (isAttending) {
        if (!window.confirm("정말 참여를 취소하시겠습니까?")) return;
        await apiClient.delete(`/meetings/${id}/attendance`);
        setIsAttending(false);
        setMeeting(prev => ({ ...prev, currentAttendees: prev.currentAttendees - 1 }));
        alert("참여가 취소되었습니다.");
      } else {
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

  const handleOpenReviewModal = async () => {
    try {
        const res = await apiClient.get(`/meetings/${id}/attendees`);
        setMeetingMembers(res.data.data);
        setIsReviewModalOpen(true);
    } catch (err) {
        console.error("참여자 목록 조회 실패", err);
        alert("참여자 목록을 불러오지 못했습니다.");
    }
  };

  // 수정 페이지 이동
  const handleEdit = () => {
    navigate(`/meetings/${id}/edit`);
  };

  // 삭제 요청
  const handleDelete = async () => {
    if (!window.confirm("정말로 이 모임을 삭제하시겠습니까?")) return;

    try {
        await apiClient.delete(`/meetings/${id}`);
        alert("모임이 삭제되었습니다.");
        navigate('/'); // 홈으로 이동
    } catch (err) {
        console.error("삭제 실패", err);
        // 백엔드에서 권한 체크(403 등)를 하면 여기서 에러 메시지가 뜹니다.
        alert(err.response?.data?.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const getButtonConfig = () => {
    if (!meeting) return { text: '', disabled: true, className: '' };

    const { meetingStatus } = meeting;

    // 1. 모집 완료 (COMPLETED) -> 후기 작성 (참여자만)
    if (meetingStatus === 'COMPLETED') {
        if (isAttending) {
            return {
                text: '후기 작성',
                disabled: false,
                icon: <MessageSquarePlus size={20} />,
                className: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200',
                onClick: handleOpenReviewModal
            };
        } else {
            return {
                text: '모집 완료',
                disabled: true,
                icon: <CheckCircle size={20} />,
                className: 'bg-gray-300 text-gray-500 cursor-not-allowed'
            };
        }
    }

    // 2. 모집 마감 (CLOSED) -> 단순히 '모집 마감'
    if (meetingStatus === 'CLOSED') {
        return {
            text: '모집 마감',
            disabled: true,
            icon: <Ban size={20} />,
            className: 'bg-gray-300 text-gray-500 cursor-not-allowed'
        };
    }

    // 3. 모집 중 + 참여 중 -> 취소
    if (isAttending) {
      return {
        text: '참여 취소',
        disabled: false,
        icon: <LogOut size={20} />,
        className: 'bg-white border-2 border-rose-500 text-rose-500 hover:bg-rose-50',
        onClick: handleAttendance
      };
    }

    // 4. 모집 중 + 미참여 -> 참여
    return {
      text: '참여하기',
      disabled: false,
      icon: <UserPlus size={20} />,
      className: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-lg shadow-indigo-200',
      onClick: handleAttendance
    };
  };

  const btnConfig = getButtonConfig();

  if (loading) return <div className="max-w-md mx-auto h-screen bg-white animate-pulse">
      <div className="h-64 bg-gray-200"></div>
      <div className="p-5 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
  </div>;
  
  if (error) return <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
      <div className="text-red-500 mb-2">오류가 발생했습니다</div>
      <button onClick={() => window.location.reload()} className="text-sm underline text-gray-500">새로고침</button>
  </div>;

  if (!meeting) return <div className="p-4 text-center text-gray-500">모임 정보를 찾을 수 없습니다.</div>;

  const { date, time } = formatKoreanDatetime(meeting.meetingDatetime);
  const percent = Math.min((meeting.currentAttendees / meeting.maxAttendees) * 100, 100);

  return (
    <div className="bg-gray-50 min-h-screen relative">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative overflow-hidden">
        
        {/* 상단 이미지 영역 */}
        <div className="relative">
          <div className="absolute top-0 left-0 w-full z-10 flex justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <button onClick={() => navigate(-1)} className="text-white hover:bg-white/20 p-2 rounded-full transition">
              <ChevronLeft size={24} />
            </button>

            {/* [수정] 조건 없이 항상 표시되는 더보기 메뉴 */}
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setShowMenu(!showMenu)} 
                    className="text-white hover:bg-white/20 p-2 rounded-full transition"
                >
                    <MoreVertical size={24} />
                </button>

                {/* 드롭다운 메뉴 */}
                {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right z-20">
                        <button 
                            onClick={handleEdit}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                            <Edit size={16} />
                            수정하기
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                            <Trash2 size={16} />
                            삭제하기
                        </button>
                    </div>
                )}
            </div>
          </div>

          <img
            src={meeting.imgUrl || sampleImg}
            alt={meeting.meetingTitle}
            className="w-full h-72 object-cover"
          />
          
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 translate-y-[-12px]">
            <Eye size={12} />
            <span>{meeting.views ?? 0}</span>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
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
                    <p className="text-gray-800 font-semibold leading-tight mt-0.5">
                        {meeting.location}
                    </p>
                </div>
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
                        <p className="text-xs text-gray-500 font-medium">참여 인원 (클릭하여 보기)</p>
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

        {/* 하단 고정 버튼 */}
        <div className="absolute left-0 right-0 max-w-md mx-auto bottom-0 bg-white border-t border-gray-100 p-4 z-50">
            <button 
                onClick={btnConfig.onClick} 
                disabled={btnConfig.disabled}
                className={`w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${btnConfig.className}`}
            >
                {btnConfig.icon}
                <span>{btnConfig.text}</span>
            </button>
        </div>

        {/* 후기 작성 모달 */}
        {meetingMembers && (
            <ReviewModal 
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                meetingId={id}
                members={meetingMembers}
                myId={myId}
            />
        )}

      </div>
    </div>
  );
}