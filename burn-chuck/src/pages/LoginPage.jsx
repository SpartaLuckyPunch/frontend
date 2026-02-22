import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import useUserStore from '../features/auth/store/useUserStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { doLogin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchUserAddress = useUserStore((state) => state.fetchUserAddress);
  // [일반 로그인 핸들러]
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await doLogin(email, password);
      if (res?.success) {
        await fetchUserAddress();
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

  // [추가] 카카오 로그인 핸들러
  const handleKakaoLogin = () => {
    // 1. 카카오 REST API 키 (본인의 키로 교체하세요!)
    const REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;
    
    // 2. 리다이렉트 URI (백엔드 컨트롤러 주소)
    // 주의: 백엔드 AuthController의 @RequestMapping 경로를 확인하세요. 
    // 예: /api/auth/kakao/callback 라면 아래와 같이 설정
    const BACKEND_REDIRECT_URI = `${process.env.REACT_APP_API_URL}/auth/kakao/callback`; 
    
    // 3. 카카오 인가 URL 생성
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${BACKEND_REDIRECT_URI}&response_type=code`;
    
    // 4. 이동
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <div className="h-full bg-white flex justify-center">
      <div className="w-full max-w-[430px] p-6 box-border">

        {/* ... (상단 뒤로가기 및 타이틀은 동일) ... */}
        <div className="h-12 flex items-center">
          <button onClick={() => navigate('/')} className="bg-transparent border-0 p-0 cursor-pointer" aria-label="뒤로">
             {/* SVG 생략 */}
             <span className="text-xl">←</span>
          </button>
        </div>

        <div className="text-center mt-5 mb-3">
          <h1 className="m-0 text-2xl font-extrabold">로그인</h1>
          <div className="text-gray-500 mt-2 text-sm">기존 계정에 로그인 하세요</div>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          {/* ... (이메일/비밀번호 입력창 동일) ... */}
          <label className="block">
             <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-3 rounded-xl" placeholder="이메일" />
          </label>
          <label className="block">
             <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border p-3 rounded-xl" placeholder="비밀번호" />
          </label>

          <button type="submit" disabled={loading} className="bg-green-500 text-white py-3 rounded-xl font-bold text-base hover:bg-green-600 transition-colors">
            {loading ? '로딩중...' : '로그인'}
          </button>

          {error && <div className="text-center text-red-500 text-sm font-medium">{error}</div>}

          <div className="text-center text-gray-500 text-sm">
            계정이 없나요? <Link to="/signup" className="text-green-600 font-bold ml-1">회원가입하기</Link>
          </div>

          <div className="text-center text-gray-700 mt-2 text-xs">SNS로 시작해보세요 !</div>

          {/* [수정] 카카오 로그인 버튼에 onClick 연결 */}
          <button 
            type="button" 
            onClick={handleKakaoLogin}
            className="bg-[#FEE500] border-0 py-3 rounded-xl font-bold text-[#3c1e1e] hover:bg-[#fdd835] transition-colors"
          >
            카카오로 시작하기
          </button>

        </form>

      </div>
    </div>
  );
}