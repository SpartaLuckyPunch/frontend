import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ChevronLeft } from 'lucide-react';

export default function SearchInputPage() {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e?.preventDefault();
    const q = keyword.trim();
    // navigate back to map with query param
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const goBack = () => navigate(-1);

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button onClick={goBack} className="p-1" aria-label="뒤로">
          <ChevronLeft size={24} />
        </button>
        <form onSubmit={submit} className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white border rounded-full px-3 py-2">
            <SearchIcon size={18} className="text-gray-400 mr-2" />
            <input
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 outline-none"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-gray-200 rounded">검색</button>
        </form>
      </div>

      {/* simple filter chips as placeholders */}
      <div className="flex gap-2">
        <div className="px-3 py-1 bg-gray-100 rounded-full">일정 범위</div>
        <div className="px-3 py-1 bg-gray-100 rounded-full">카테고리 ▾</div>
      </div>

    </div>
  );
}
