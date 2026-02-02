import React, { useState } from 'react';
import Category from '../components/home/Category';
import MyLocation from '../components/home/MyLocation';
import MeetingsList from '../components/home/MeetingsList';

export default function HomePage() {
	const [selectedCategory, setSelectedCategory] = useState(null);

	return (
		<div style={{ minHeight: 'calc(100vh - 180px)' }}>
			{/* Category (height 56px) */}
			<Category selected={selectedCategory} onSelect={setSelectedCategory} />

			{/* MyLocation (height 50px) */}
			<MyLocation />

			{/* Meetings list */}
			<div className="mt-3">
				<MeetingsList category={selectedCategory} />
			</div>
		</div>
	);
}
