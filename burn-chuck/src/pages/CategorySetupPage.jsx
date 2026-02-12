import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import { ArrowLeft, Check } from 'lucide-react';

// [수정] 실제 API 코드('sports', 'food'...)에 맞춰 아이콘 매핑
// 백엔드에서 아이콘을 안 주므로, 프론트에서 코드에 맞는 이모지를 정해줍니다.
function getCategoryIcon(code) {
    switch(code) {
        case 'sports': return '⚽';        // 운동
        case 'food': return '🍔';          // 식사
        case 'drink': return '🍺';         // 술
        case 'entertainment': return '🎮'; // 게임/오락
        case 'study': return '📚';         // 스터디
        case 'music': return '🎵';         // 음악
        case 'culture': return '🎬';       // 문화/공연/축제
        case 'etc': return '✨';           // 기타
        default: return '❓';
    }
}

export default function CategorySetupPage() {
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [selectedCodes, setSelectedCodes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. 카테고리 목록 조회
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/categories');
        
        // [확인] 실제 응답 구조: res.data.data.categoryResponseList
        const list = res.data.data?.categoryResponseList || [];
        setCategories(list);
      } catch (error) {
        console.error("카테고리 로딩 실패", error);
        // 에러 시 빈 배열 유지
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // 토글 핸들러
  const toggleCategory = (code) => {
    setSelectedCodes((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  // 완료 핸들러
  const handleSubmit = async () => {
    // 선택 안 했으면 그냥 메인으로
    if (selectedCodes.length === 0) {
        navigate('/'); 
        return;
    }

    setSubmitting(true);
    try {
      // DTO: { categoryCodeList: ["sports", "food"] }
      const payload = {
        categoryCodeList: selectedCodes
      };

      await apiClient.post('/users/categories', payload);
      
      alert("관심사가 설정되었습니다! 환영합니다 🎉");
      navigate('/'); 

    } catch (error) {
      console.error("관심사 저장 실패", error);
      alert(error.response?.data?.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-white flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen p-6 box-border flex flex-col bg-white">
        
        {/* 상단 네비게이션 */}
        <div className="h-12 flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} />
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            건너뛰기
          </button>
        </div>

        {/* 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold mb-2">관심사 설정</h1>
          <p className="text-gray-500 text-sm">
            관심있는 주제를 선택하면<br/>
            딱 맞는 모임을 추천해드려요.
          </p>
        </div>

        {/* 카테고리 그리드 */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-3 gap-3 content-start">
            {categories.map((cat) => {
              const isSelected = selectedCodes.includes(cat.code);
              return (
                <button
                  key={cat.code} // 고유값인 code를 키로 사용
                  onClick={() => toggleCategory(cat.code)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 p-2 transition-all duration-200 border-2 ${
                    isSelected 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-3xl">
                    {getCategoryIcon(cat.code)}
                  </span>
                  <span className="text-xs font-bold break-keep text-center">
                    {cat.category} {/* API의 한글 이름 ('운동', '식사' 등) */}
                  </span>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 text-green-500">
                        <Check size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="mt-6">
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                selectedCodes.length > 0 
                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-100' 
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {submitting ? '저장 중...' : (selectedCodes.length > 0 ? '시작하기' : '나중에 하기')}
          </button>
        </div>

      </div>
    </div>
  );
}