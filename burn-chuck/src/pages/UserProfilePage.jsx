import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { useAuthStore } from '../features/auth/store/authStore';
import { ChevronLeft, Star, MessageCircle, UserPlus, MapPin, Calendar, SquarePen , MoreVertical, UserCheck } from 'lucide-react';
import sampleImg from '../assets/images/profileSampleImg.png'; // 기본 이미지

// 날짜 포맷팅 함수
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]}) ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function UserProfilePage() {
  const { userId } = useParams(); // URL의 userId
  const navigate = useNavigate();
  
  // 내 정보 가져오기 (Store에서)
  const myUser = useAuthStore((state) => state.user);
  const myId = myUser?.id; 
  
  // 현재 보고 있는 프로필이 '나'인지 확인
  const isMe = Number(userId) === Number(myId);

  // 상태 관리
  const [profile, setProfile] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [reviews, setReviews] = useState({ reactions: [], reviewList: [] });
  const [isFollowing, setIsFollowing] = useState(false); // 팔로우 여부
  const [loading, setLoading] = useState(true);
  const [meetingCount, setMeetingCount] = useState(0);

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 병렬 호출로 데이터 한번에 가져오기
        // 1. 프로필, 2. 주최 모임, 3. 후기, 4. 팔로우 여부(타인일 때만)
        const [profileRes, meetingRes, reviewRes, followRes] = await Promise.all([
          apiClient.get(`/users/${userId}`),
          apiClient.get(`/meetings/hosted-meetings`, { params: { userId } }),
          apiClient.get(`/reviews/users/${userId}`),
          !isMe ? apiClient.get(`/users/${userId}/follow-existence`) : Promise.resolve({ data: { data: false } })
        ]);

        setProfile(profileRes.data.data);
        setMeetings(meetingRes.data.data.content || []);
        setMeetingCount(meetingRes.data.data.totalElements || 0);
        setReviews({
          reactions: reviewRes.data.data.reactionCountList || [],
          reviewList: reviewRes.data.data.reviewList.content || []
        });
        
        // 팔로우 상태 설정
        setIsFollowing(followRes.data.data);

      } catch (err) {
        console.error("프로필 로딩 실패", err);
        // 에러 처리 (필요시 추가)
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isMe]);

  // 팔로우 토글 핸들러 (낙관적 업데이트 적용)
  const handleToggleFollow = async () => {
    const prevIsFollowing = isFollowing;
    
    // 1. UI 먼저 업데이트
    setIsFollowing(!prevIsFollowing);
    
    // 팔로워 숫자도 같이 변경 (UI 반응성 향상)
    setProfile(prev => ({
        ...prev,
        followers: prevIsFollowing ? prev.followers - 1 : prev.followers + 1
    }));

    try {
      if (prevIsFollowing) {
        // 이미 팔로우 중 -> 언팔로우 (DELETE)
        await apiClient.delete(`/users/${userId}/follow`);
      } else {
        // 미팔로우 -> 팔로우 (POST)
        await apiClient.post(`/users/${userId}/follow`);
      }
    } catch (err) {
      console.error("팔로우 처리 실패", err);
      // 에러 시 롤백
      setIsFollowing(prevIsFollowing);
      setProfile(prev => ({
        ...prev,
        followers: prevIsFollowing ? prev.followers : prev.followers
      }));
      alert("요청 처리에 실패했습니다.");
    }
  };

  // 🚀 1:1 채팅 버튼 핸들러
  const handleStartChat = async () => {
    // 혹시 모를 더블 클릭 방지
    if (loading) return; 
    
    try {
      // 1. 채팅방 생성 (혹은 조회) API 호출
      const res = await apiClient.post('/chat/rooms/private', {
        targetUserId: userId // 현재 프로필 보고 있는 유저의 ID
      });

      // 2. 응답에서 roomId 추출 (res.data.data가 roomId임)
      const roomId = res.data.data;

      // 3. 해당 채팅방으로 이동
      // 채팅방 제목용으로 상대방 닉네임을 state로 넘겨주면 좋습니다.
      navigate(`/chat/rooms/${roomId}`, { 
        state: { roomName: profile.nickname } 
      });
      
    } catch (err) {
      console.error('채팅방 생성 실패', err);
      alert('채팅방을 연결할 수 없습니다.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50">로딩중...</div>;
  if (!profile) return <div className="p-4 text-center">사용자 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 relative">
      
      {/* 1. 상단 헤더 & 프로필 카드 */}
      <div className="bg-white rounded-b-[2rem] shadow-sm pb-8 relative z-10">
        {/* 네비게이션 바 */}
        <div className="flex justify-between items-center p-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <div className="font-bold text-lg">프로필</div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            {isMe ? <SquarePen onClick={() => navigate('/profile/edit')} size={24} className="text-gray-700" /> : <MoreVertical size={24} className="text-gray-700" />}
          </button>
        </div>

        {/* 프로필 정보 */}
        <div className="flex flex-col items-center mt-2 px-6">
          <div className="relative">
            <img 
              src={profile.profileImgUrl || sampleImg} 
              alt="Profile" 
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
            />
            {/* 별점 뱃지 */}
            <div className="absolute -bottom-2 -right-2 bg-white px-2 py-1 rounded-full shadow-md flex items-center gap-1 border border-gray-100">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-gray-800">{profile.avgRates?.toFixed(1) || "0.0"}</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mt-4">{profile.nickname}</h1>
          <p className="text-sm text-gray-400 mt-1">안녕하세요, {profile.nickname}입니다.</p>

          {/* 팔로워/팔로잉 */}
          <div className="flex gap-8 mt-6">
            <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{profile.followers}</div>
                <div className="text-xs text-gray-500">팔로워</div>
            </div>
            <div className="w-[1px] h-full bg-gray-200"></div>
            <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{profile.followings}</div>
                <div className="text-xs text-gray-500">팔로우</div>
            </div>
          </div>

          {/* 액션 버튼 (나 vs 타인 구분) */}
          <div className="flex gap-3 w-full mt-8">
            {isMe ? (
                // 내 프로필일 경우
                <>
                </>
            ) : (
                // 타인 프로필일 경우 (팔로우 버튼 로직 적용)
                <>
                    {isFollowing ? (
                        // 팔로잉 중일 때 (회색 버튼)
                        <button 
                            onClick={handleToggleFollow}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl border border-gray-200 hover:bg-gray-200 transition flex items-center justify-center gap-2"
                        >
                            <UserCheck size={18} /> 팔로잉
                        </button>
                    ) : (
                        // 미팔로우 상태일 때 (파란색 버튼)
                        <button 
                            onClick={handleToggleFollow}
                            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                            <UserPlus size={18} /> 팔로우
                        </button>
                    )}
                    <button 
                        onClick={handleStartChat} // ✨ 클릭 이벤트 연결
                        className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={18} /> 1:1 채팅
                    </button>
                </>
            )}
          </div>
        </div>
      </div>

      {/* 2. 주최한 모임 (가로 스크롤) */}
      <div className="mt-6 px-4">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">주최 모임 <span className="text-indigo-600">{meetingCount}</span></h2>
            {meetings.length > 0 && <ChevronLeft className="rotate-180 text-gray-400" size={20} />}
        </div>

        {meetings.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {meetings.map((meeting) => (
                    <div 
                        key={meeting.meetingId} 
                        className="min-w-[180px] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                        onClick={() => navigate(`/meetings/${meeting.meetingId}`)}
                    >
                        <div className="relative">
                            <img src={meeting.imgUrl || meeting.imgUrl} alt={meeting.meetingTitle} className="w-full h-28 object-cover" />
                            <div className="absolute top-2 right-2">
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold text-white 
                                    ${meeting.status === 'OPEN' ? 'bg-indigo-500' : 'bg-gray-500'}`}>
                                    {meeting.status === 'OPEN' ? '모집중' : '마감'}
                                </span>
                            </div>
                        </div>
                        <div className="p-3">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{meeting.meetingTitle}</h3>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <Calendar size={12} />
                                <span>{formatDate(meeting.meetingDatetime).split('(')[0]}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 truncate">
                                <MapPin size={12} />
                                <span>{meeting.location}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                주최한 모임이 없습니다.
            </div>
        )}
      </div>

      {/* 3. 받은 후기 키워드 & 리스트 */}
      <div className="mt-4 px-4 pb-10">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">받은 후기</h2>
            <ChevronLeft className="rotate-180 text-gray-400" size={20} />
        </div>

        {/* 후기 키워드 (Reactions) */}
        {reviews.reactions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
                {reviews.reactions.map((item, idx) => (
                    <div key={idx} className="bg-white border border-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                        {item.reaction} <span className="text-indigo-400 ml-1">{item.count}</span>
                    </div>
                ))}
            </div>
        )}

        {/* 후기 리스트 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {reviews.reviewList.length > 0 ? (
                reviews.reviewList.map((review) => (
                    <div key={review.reviewId} className="p-4">
                        <div className="flex items-start gap-3">
                            <img 
                                src={review.reviewerProfileImgUrl || sampleImg} 
                                alt="reviewer" 
                                className="w-10 h-10 rounded-full object-cover bg-gray-100" 
                            />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-sm text-gray-900">{review.reviewerNickname}</span>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                size={12} 
                                                className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{review.detailedReview}</p>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                    아직 받은 후기가 없습니다.
                </div>
            )}
        </div>
      </div>

    </div>
  );
}