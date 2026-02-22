// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/store/authStore'; // 스토어 경로에 맞게 수정해주세요

export default function ProtectedRoute() {
  const currentUser = useAuthStore((s) => s.user);

  // 1. 유저 정보가 없으면 로그인 페이지로 강제 이동 (뒤로가기 방지 replace: true)
  if (!currentUser) {
    alert("로그인이 필요한 서비스입니다."); // 필요시 알림창
    return <Navigate to="/login" replace />;
  }

  // 2. 로그인이 되어 있다면 하위 라우트들을 정상적으로 렌더링
  return <Outlet />;
}