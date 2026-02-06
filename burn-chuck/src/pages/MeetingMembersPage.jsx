import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { ChevronLeft, Crown, User as UserIcon, ChevronRight } from 'lucide-react'; // ChevronRight 추가
import sampleImg from '../assets/images/고윤정.jpg'; 

export default function MeetingMembersPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchMembers = async () => {
      try {
        const res = await apiClient.get(`/meetings/${id}/attendees`);
        if (mounted) {
          setMembers(res.data.data);
        }
      } catch (err) {
        console.error('참여자 조회 실패', err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMembers();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return (
    <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error || !members) return (
    <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <p className="text-gray-500 mb-4">참여자 목록을 불러올 수 없습니다.</p>
      <button onClick={() => navigate(-1)} className="text-indigo-600 font-medium">돌아가기</button>
    </div>
  );

  const { hostId, hostProfileImgUrl, hostNickname, attendeeList } = members;

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">
        
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="ml-2 text-lg font-bold text-gray-900">참여자 목록</h1>
          <span className="ml-auto text-sm text-gray-500 font-medium">
            총 {1 + (attendeeList?.length || 0)}명
          </span>
        </div>

        <div className="p-4 space-y-6">
          
          {/* 👑 방장 (HOST) 섹션 */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
              주최자
            </h2>
            <div 
                // ✏️ [수정] 클릭 이벤트 추가 및 커서 스타일 변경
                onClick={() => navigate(`/profile/${hostId}`)}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
            >
              <Crown className="absolute -right-4 -bottom-4 text-amber-100 w-24 h-24 rotate-12 pointer-events-none" />
              
              <div className="relative">
                <img 
                  src={hostProfileImgUrl || sampleImg} 
                  alt="Host" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md z-10 relative"
                />
                <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-amber-100 z-20">
                  <Crown size={14} className="text-amber-500 fill-amber-500" />
                </div>
              </div>
              
              <div className="flex-1 z-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-lg">{hostNickname}</span>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    방장
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">모임 주최자</p>
              </div>

              {/* 이동 아이콘 힌트 (선택사항) */}
              <ChevronRight size={18} className="text-amber-300 mr-1" />
            </div>
          </section>

          {/* 👥 참여자 (Attendees) 섹션 */}
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
              참여자
            </h2>
            
            {attendeeList && attendeeList.length > 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
                {attendeeList.map((member) => (
                  <div 
                    key={member.attendeeId} 
                    // ✏️ [수정] 클릭 이벤트 추가 및 커서 스타일 변경
                    onClick={() => navigate(`/profile/${member.attendeeId}`)}
                    className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                  >
                    <div className="relative">
                      {member.attendeeProfileImgUrl ? (
                        <img 
                          src={member.attendeeProfileImgUrl} 
                          alt={member.attendeeNickname} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 border border-indigo-100">
                           <UserIcon size={20} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{member.attendeeNickname}</p>
                    </div>

                    {/* 이동 아이콘 힌트 */}
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <UserIcon size={24} />
                </div>
                <p className="text-gray-500 text-sm">아직 참여자가 없습니다.</p>
                <p className="text-gray-400 text-xs mt-1">첫 번째 참여자가 되어보세요!</p>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}