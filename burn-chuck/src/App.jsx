import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      {/* 여기서 app-container 클래스를 적용해줍니다 */}
      <div className="app-container">
        <Routes>
          {/* Layout 적용 (Header, Footer 포함) */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-meetings" element={<TempPage title="나의 모임" />} />
            <Route path="/search" element={<TempPage title="검색" />} />
            <Route path="/chat" element={<TempPage title="채팅" />} />
            <Route path="/profile" element={<TempPage title="프로필" />} />
          </Route>

          {/* Layout 미적용 (로그인 등) */}
          <Route path="/login" element={<div className="h-full overflow-y-auto"><LoginPage /></div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// 임시 페이지 컴포넌트 (간단하므로 파일 하단에 유지)
const TempPage = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
    <h2 className="text-xl font-bold mb-2 text-gray-800">{title}</h2>
    <p>준비 중인 페이지입니다.</p>
  </div>
);
