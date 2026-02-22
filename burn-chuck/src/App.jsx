import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SearchPage from './pages/SearchPage';
import SearchInputPage from './pages/SearchInputPage';
import ChatPage from './pages/ChatPage';
import ChatRoomPage from './pages/ChatRoomPage';
import MyMeetingPage from './pages/MyMeetingPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import MeetingMapPage from './pages/MeetingMapPage';
import MeetingMembersPage from './pages/MeetingMembersPage';
import ProfilePage from './pages/UserProfilePage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import MeetingCreatePage from './pages/MeetingCreatePage';
import CategorySetupPage from './pages/CategorySetupPage';
import MeetingEditPage from './pages/MeetingEditPage';
import ProfileEditPage from './pages/ProfileEditPage';
import MeetingSearchPage from './pages/MeetingSearchPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          
          {/* ========================================== */}
          {/* 1. Layout이 적용된 화면 (Header, Footer 포함) */}
          {/* ========================================== */}
          <Route element={<Layout />}>
            
            {/* 🟢 누구나 접근 가능한 공개 페이지 */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/search/input" element={<SearchInputPage />} />
            <Route path="/search/meetings" element={<MeetingSearchPage />} />
            <Route path="/meetings/:id" element={<MeetingDetailPage />} />
            <Route path="/meetings/:id/map" element={<MeetingMapPage />} />
            <Route path="/meetings/:id/members" element={<MeetingMembersPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />

            {/* 🔴 로그인한 유저만 접근 가능한 보호된 페이지 */}
            <Route element={<ProtectedRoute />}>
              <Route path="/my-meetings" element={<MyMeetingPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/rooms/:roomId" element={<ChatRoomPage />} />
              <Route path="/meetings/create" element={<MeetingCreatePage />} />
              <Route path="/meetings/:id/edit" element={<MeetingEditPage />} />
            </Route>

          </Route>

          {/* ========================================== */}
          {/* 2. Layout 미적용 화면 (전체 화면 사용) */}
          {/* ========================================== */}
          
          {/* 🟢 누구나 접근 가능한 공개 페이지 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          
          {/* 🔴 로그인한 유저만 접근 가능한 보호된 페이지 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
            <Route path="/category-setup" element={<CategorySetupPage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
          </Route>

        </Routes>
      </div>
    </BrowserRouter>
  );
}