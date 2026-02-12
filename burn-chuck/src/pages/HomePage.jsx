import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react'; 
import Category from '../components/home/Category';
import MyLocation from '../components/home/MyLocation';
import MeetingsList from '../components/home/MeetingsList';

export default function HomePage() {
    const [selectedCategory, setSelectedCategory] = useState(null);
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

            {/* MyLocation */}
            <MyLocation />

            {/* Meetings list */}
            <div className="mt-3">
                <MeetingsList 
                    category={selectedCategory} 
                    onItemClick={(m) => navigate(`/meetings/${m.meetingId}`)} 
                />
            </div>
        </div>
    );
}