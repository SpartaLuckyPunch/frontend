import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import useUserStore from '../features/auth/store/useUserStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { doLogin } = useAuth(); // useAuth에서 수정된 doLogin 가져옴
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchUserAddress = useUserStore((state) => state.fetchUserAddress);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. 로그인 요청 (쿠키 세팅됨)
      const res = await doLogin(email, password);
      
      if (res?.success) {
        // 2. 로그인 성공 시 주소 정보 Fetch
        // (쿠키가 세팅된 상태이므로 API 호출 시 자동으로 인증됨)
        await fetchUserAddress();
        
        // 3. 메인으로 이동
        navigate('/');
      } else {
        setError(res?.message || '로그인에 실패했습니다');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.response?.data?.message || err.message || '서버 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-white flex justify-center">
      <div className="w-full max-w-[430px] p-6 box-border">

        {/* 뒤로가기 버튼 */}
        <div className="h-12 flex items-center">
          <button onClick={() => navigate('/')} className="bg-transparent border-0 p-0 cursor-pointer" aria-label="뒤로">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 타이틀 */}
        <div className="text-center mt-5 mb-3">
          <h1 className="m-0 text-2xl font-extrabold">로그인</h1>
          <div className="text-gray-500 mt-2 text-sm">기존 계정에 로그인 하세요</div>
        </div>

        {/* 폼 영역 */}
        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <label className="block">
            <div className="flex items-center gap-3 border-2 border-black rounded-xl p-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 8V16C21 17.1046 20.1046 18 19 18H5C3.89543 18 3 17.1046 3 16V8" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13Z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="flex-1 text-base outline-none border-0" 
                placeholder="이메일" 
                autoComplete="username" 
              />
            </div>
          </label>

          <label className="block">
            <div className="flex items-center gap-3 border-2 border-black rounded-xl p-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 11V8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V11" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="7" y="11" width="10" height="8" rx="2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                type="password" 
                className="flex-1 text-base outline-none border-0" 
                placeholder="비밀번호" 
                autoComplete="current-password" 
              />
            </div>
          </label>

          <button type="submit" disabled={loading} className="bg-green-500 text-white py-3 rounded-xl font-bold text-base hover:bg-green-600 transition-colors">
            {loading ? '로딩중...' : '로그인'}
          </button>

          {error && <div className="text-center text-red-500 text-sm font-medium">{error}</div>}

          <div className="text-center text-gray-500 text-sm">
            계정이 없나요? <Link to="/signup" className="text-green-600 font-bold ml-1">회원가입하기</Link>
          </div>

          <div className="text-center text-gray-700 mt-2 text-xs">SNS로 시작해보세요 !</div>

          <button type="button" className="bg-[#FEE500] border-0 py-3 rounded-xl font-bold text-[#3c1e1e]">카카오로 시작하기</button>
          <button type="button" className="bg-white border-2 border-gray-200 py-3 rounded-xl font-bold text-gray-700">구글로 시작하기</button>
        </form>

      </div>
    </div>
  );
}