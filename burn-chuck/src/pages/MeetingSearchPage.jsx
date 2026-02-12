import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react'; // 아이콘 라이브러리 사용 가정
import MeetingsList from '../components/home/MeetingsList';

export default function MeetingSearchPage() {
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // searchInput: 입력창의 값 (실시간)
    // searchKeyword: 엔터를 쳤을 때 API로 보낼 값
    const [searchInput, setSearchInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');

    // 페이지 진입 시 인풋 포커스
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchInput.trim()) return;
        setSearchKeyword(searchInput); // 실제 검색 트리거
    };

    const handleClear = () => {
        setSearchInput('');
        setSearchKeyword('');
        if (inputRef.current) inputRef.current.focus();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 검색 헤더 */}
            <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="모임 이름 검색"
                        className="w-full bg-gray-100 text-gray-800 text-sm rounded-full pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    
                    {searchInput && (
                        <button 
                            type="button" 
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 bg-gray-200 rounded-full p-0.5 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </form>
            </div>

            {/* 검색 결과 리스트 */}
            <div className="mt-4">
                {searchKeyword ? (
                    <MeetingsList 
                        keyword={searchKeyword} 
                        onItemClick={(m) => navigate(`/meetings/${m.meetingId}`)} 
                    />
                ) : (
                    // 검색어 입력 전 안내 문구 (선택 사항)
                    <div className="text-center text-gray-400 text-sm py-20">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        찾고 싶은 모임을 검색해보세요.
                    </div>
                )}
            </div>
        </div>
    );
}