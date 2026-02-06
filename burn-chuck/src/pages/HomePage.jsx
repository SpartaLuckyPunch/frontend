import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Category from '../components/home/Category';
import MyLocation from '../components/home/MyLocation';
import MeetingsList from '../components/home/MeetingsList';

export default function HomePage() {
	const [selectedCategory, setSelectedCategory] = useState(null);
	const navigate = useNavigate();

	return (
		<div style={{ minHeight: 'calc(100vh - 180px)' }}>
			{/* Category (height 56px) */}
			<Category selected={selectedCategory} onSelect={setSelectedCategory} />

			{/* MyLocation (height 50px) */}
			<MyLocation />

			{/* Meetings list */}
			<div className="mt-3">
				<MeetingsList category={selectedCategory} onItemClick={(m) => navigate(`/meetings/${m.meetingId}`)} />
			</div>
		</div>
	);
}
