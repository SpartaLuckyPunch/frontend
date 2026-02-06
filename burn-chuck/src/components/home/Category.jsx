import React, { useEffect, useState } from 'react';
import apiClient from '../../api/axiosClient';

export default function Category({ selected = null, onSelect = () => {} }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/categories');
        const list = res?.data?.data?.categoryResponseList || [];
        // prepend an '전체' (all) option that clears filters when selected
        const withAll = [{ category: '전체', isAll: true }, ...list];
        if (mounted) setCategories(withAll);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="w-full" style={{ height: 56 }}>
      <div className="h-full flex items-center overflow-x-auto px-3">
        {loading && <div className="text-sm text-gray-400">로딩중...</div>}

        {!loading && categories.map((c) => {
          const key = c.code || c.categoryId || c.category;
          const label = c.category;
          const isSelected = c.isAll ? selected === null : selected === c.code;
          return (
            <button
              key={key}
              onClick={() => onSelect(c.isAll ? null : c.code)}
              className={`flex-shrink-0 mr-3 px-4 py-2 rounded-full whitespace-nowrap ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              aria-pressed={isSelected}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
