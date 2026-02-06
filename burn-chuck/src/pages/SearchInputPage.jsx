import React, { useState, forwardRef, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ko } from 'date-fns/locale';

// [추가] 슬라이더 라이브러리 임포트
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function SearchInputPage() {
  const [keyword, setKeyword] = useState('');
  
  // 날짜 상태
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // [추가] 시간 상태 (0시 ~ 24시)
  const [timeRange, setTimeRange] = useState([0, 24]);
  const [isTimeIrrelevant, setIsTimeIrrelevant] = useState(false); // 시간 무관 체크 여부
  
  // DatePicker 참조 (닫기 기능을 위해 필요)
  const datePickerRef = useRef(null);

  const navigate = useNavigate();

  const submit = (e) => {
    e?.preventDefault();
    const q = keyword.trim();
    
    let url = `/search?q=${encodeURIComponent(q)}`;
    
    // 날짜 파라미터 추가
    if (startDate) url += `&startDate=${formatDate(startDate)}`;
    if (endDate) url += `&endDate=${formatDate(endDate)}`;
    
    // [추가] 시간 파라미터 추가 (시간 무관이 아닐 때만)
    if (!isTimeIrrelevant) {
        url += `&startTime=${timeRange[0]}&endTime=${timeRange[1]}`;
    }
    
    navigate(url);
  };

  // 날짜 포맷 헬퍼 (YYYY-MM-DD)
  const formatDate = (date) => {
      if (!date) return '';
      const offset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date - offset).toISOString().slice(0, 10);
      return localISOTime;
  };

  const goBack = () => navigate(-1);

  // 달력 아이콘 커스텀
  const CustomCalendarInput = forwardRef(({ onClick }, ref) => (
    <button 
      type="button" 
      onClick={onClick} 
      ref={ref}
      className="ml-1 text-gray-500 hover:text-green-600 transition-colors flex items-center"
      aria-label="날짜 선택"
    >
      <CalendarIcon size={20} />
    </button>
  ));

const CalendarContainer = ({ className, children }) => {
  // 이벤트 전파 방지 함수 (진짜 이벤트 객체가 들어올 때만 실행)
  const handleWrapperClick = (e) => {
    // e가 존재하고 stopPropagation 함수가 있을 때만 실행
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
  };

  return (
    <div 
      className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col" 
      style={{ width: '310px' }}
      // 1. 전체 컨테이너에서 마우스/터치 이벤트가 밖으로 나가는 것 방지
      onMouseDown={handleWrapperClick}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <span className="font-bold text-gray-800 text-base">일정 설정</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={isTimeIrrelevant}
            onChange={(e) => setIsTimeIrrelevant(e.target.checked)}
            className="w-4 h-4 accent-purple-600 rounded"
          />
          <span className="text-sm text-gray-500 font-medium">시간 무관</span>
        </label>
      </div>

      <div className="datepicker-content-area relative">
        {children}
      </div>

      {/* 2. 슬라이더 영역을 감싸는 div에 이벤트 차단 */}
      <div 
        className="p-5 bg-white border-t border-gray-50"
        onMouseDown={handleWrapperClick}
        onTouchStart={handleWrapperClick}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-gray-700">시간 선택</span>
          <span className={`text-sm font-bold ${isTimeIrrelevant ? 'text-gray-300' : 'text-purple-600'}`}>
            {isTimeIrrelevant ? "Anytime" : `${timeRange[0]}시 ~ ${timeRange[1]}시`}
          </span>
        </div>
        
        <div className="px-2 mb-8">
          <Slider 
            range
            min={0}
            max={24}
            value={timeRange}
            onChange={(val) => setTimeRange(val)} // 여기엔 handleWrapperClick을 넣으면 안 됩니다!
            disabled={isTimeIrrelevant}
            trackStyle={{ backgroundColor: isTimeIrrelevant ? '#E5E7EB' : '#A855F7', height: 6 }}
            handleStyle={[
              { borderColor: '#A855F7', height: 20, width: 20, marginTop: -7, backgroundColor: '#fff', opacity: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
              { borderColor: '#A855F7', height: 20, width: 20, marginTop: -7, backgroundColor: '#fff', opacity: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
            ]}
            railStyle={{ backgroundColor: '#F3F4F6', height: 6 }}
          />
        </div>

        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => {
              setDateRange([null, null]);
              setTimeRange([0, 24]);
              setIsTimeIrrelevant(false);
            }}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl text-sm hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // 버튼 클릭 시 달력이 멋대로 반응하지 않게 함
              datePickerRef.current?.setOpen(false);
            }}
            className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95"
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button onClick={goBack} className="p-1 mr-2" aria-label="뒤로">
          <ChevronLeft size={24} />
        </button>
        
        <form onSubmit={submit} className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white border rounded-full px-4 py-2 relative">
            
            <SearchIcon size={18} className="text-gray-400 mr-2" />
            
            <input
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 outline-none bg-transparent"
            />

            <div className="h-4 w-[1px] bg-gray-300 mx-2"></div>

            <div className="flex items-center">
                <DatePicker
                    ref={datePickerRef}
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => setDateRange(update)}
                    locale={ko}
                    dateFormat="yyyy.MM.dd"
                    customInput={<CustomCalendarInput />}
                    withPortal
                    placeholderText="날짜 선택"
                    shouldCloseOnSelect={false}
                    popperPlacement="bottom-end"
                    // [핵심] 커스텀 컨테이너 적용
                    calendarContainer={CalendarContainer}
                />
            </div>

          </div>
          
          <button type="submit" className="px-3 py-2 bg-gray-200 rounded font-medium text-sm whitespace-nowrap">
            검색
          </button>
        </form>
      </div>

      {(startDate || endDate) && (
        <div className="mb-4 flex flex-wrap gap-2">
            {/* 날짜 표시 칩 */}
            <div className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200 flex items-center">
                <span>
                    {startDate && startDate.toLocaleDateString()} 
                    {endDate && ` ~ ${endDate.toLocaleDateString()}`}
                </span>
                <button onClick={() => setDateRange([null, null])} className="ml-2 hover:text-green-900">✕</button>
            </div>

            {/* 시간 표시 칩 (시간 무관이 아닐 때만) */}
            {!isTimeIrrelevant && (
                <div className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200 flex items-center">
                    <span>{timeRange[0]}시 ~ {timeRange[1]}시</span>
                </div>
            )}
        </div>
      )}
    </div>
  );
}