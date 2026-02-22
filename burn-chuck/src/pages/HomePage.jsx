import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react'; 
import Category from '../components/home/Category';
import MyLocation from '../components/home/MyLocation';
import MeetingsList from '../components/home/MeetingsList';

export default function HomePage() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sortOrder, setSortOrder] = useState('LATEST');
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: 'calc(100vh - 180px)' }}>
            
            {/* Header: 검색바 영역 */}
            <div className="px-4 py-3 bg-white sticky top-0 z-10">
                <button 
                    onClick={() => navigate('/search/meetings')} 
                    className="w-full h-11 bg-gray-100 rounded-full px-4 flex items-center justify-between transition-colors hover:bg-gray-200 active:bg-gray-300"
                    aria-label="모임 검색"
                >
                    {/* 왼쪽: 플레이스홀더 텍스트 */}
                    <span className="text-sm text-gray-400 font-medium ml-1">
                        관심사를 검색해보세요
                    </span>
                    
                    {/* 오른쪽: 돋보기 아이콘 */}
                    <Search size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Category */}
            <Category selected={selectedCategory} onSelect={setSelectedCategory} />

            {/* 위치 및 정렬 영역 (한 줄로 배치) */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                
                {/* 왼쪽: 내 위치 (flex-1로 남은 공간 차지, 글자가 길면 말줄임표 처리되도록 min-w-0 추가) */}
                <div className="flex-1 min-w-0">
                    <MyLocation />
                </div>

                {/* 오른쪽: 정렬 드롭다운 (영역이 찌그러지지 않도록 flex-shrink-0 추가) */}
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="text-sm bg-white border border-gray-200 text-gray-700 py-1.5 px-3 rounded-md focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm ml-3 flex-shrink-0"
                >
                    <option value="LATEST">최신순</option>
                    <option value="POPULAR">인기순</option>
                    <option value="UPCOMING">마감임박순</option>
                    <option value="NEAREST">거리순</option>
                </select>
            </div>
            
            {/* Meetings list */}
            <div className="mt-3">
                <MeetingsList 
                    category={selectedCategory}
                    order={sortOrder}
                    onItemClick={(m) => navigate(`/meetings/${m.meetingId}`)} 
                />
            </div>
        </div>
    );
}