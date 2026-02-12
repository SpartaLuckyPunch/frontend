import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadAddresses } from '../utils/loadAddresses';
import apiClient from '../api/axiosClient';

export default function SignupPage() {
  const navigate = useNavigate();
  
  // 입력 폼 상태들
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthRaw, setBirthRaw] = useState('');
  
  // 주소 관련 상태
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [addressMap, setAddressMap] = useState({});
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  
  // UI 상태
  const [submitting, setSubmitting] = useState(false);
  const [gender, setGender] = useState('male');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // [삭제됨] 쿠키 방식이므로 토큰을 state로 관리할 필요 없음
  // const [signUpToken, setSignUpToken] = useState(''); 

  // 1. 주소 데이터 로드
  useEffect(() => {
    let mounted = true;
    loadAddresses().then((map) => {
      if (!mounted) return;
      setAddressMap(map);
      const provinces = Object.keys(map);
      setProvinceList(provinces);
      if (provinces.length) {
        setProvince(provinces[0]);
      }
    });
    return () => { mounted = false; };
  }, []);

  // 2. 시/도 변경 시 시/군/구 목록 갱신
  useEffect(() => {
    if (!province) return setCityList([]);
    const cities = Object.keys(addressMap[province] || {});
    setCityList(cities);
    setCity(cities[0] || '');
  }, [province, addressMap]);

  // 3. 시/군/구 변경 시 읍/면/동 목록 갱신
  useEffect(() => {
    if (!province || !city) return setDistrictList([]);
    const districts = addressMap[province]?.[city] || [];
    setDistrictList(districts);
    setDistrict(districts[0] || '');
  }, [province, city, addressMap]);

  // 회원가입 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 생년월일 포맷팅 (YYYYMMDD -> YYYY-MM-DD)
      const formatBirth = (raw) => {
        const m = String(raw || '').match(/^(\d{4})(\d{2})(\d{2})$/);
        if (!m) return null;
        return `${m[1]}-${m[2]}-${m[3]}`;
      };

      const birthDate = formatBirth(birthRaw);
      if (!birthDate) {
        alert('생년월일은 YYYYMMDD 형식(예: 19970502)으로 입력해 주세요.');
        setSubmitting(false);
        return;
      }

      const body = {
        email,
        password,
        nickname,
        birthDate,
        province: province || '',
        city: city || '',
        district: district || '',
        gender: gender === 'female' ? '여' : '남',
      };

      // [수정] 회원가입 요청
      // 백엔드가 성공 응답 시 Set-Cookie 헤더를 보내주면 브라우저가 알아서 저장함
      await apiClient.post('/auth/signup', body);

      // [수정] 토큰 추출 로직 제거
      // const { token } = res.data.data;
      // setSignUpToken(token);

      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-white flex justify-center">
      <div className="w-full max-w-[430px] p-6 box-border">

        {/* 뒤로가기 버튼 */}
        <div className="h-12 flex items-center">
          <button onClick={() => navigate(-1)} className="bg-transparent border-0 p-0 cursor-pointer" aria-label="뒤로">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 타이틀 */}
        <div className="text-center mt-5 mb-3">
          <h1 className="m-0 text-2xl font-extrabold">회원가입</h1>
          <div className="text-gray-500 mt-2 text-sm">새로운 계정을 만들어보세요</div>
        </div>

        {/* 폼 영역 */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label>
            <div className="flex items-center gap-3 border-2 border-black rounded-xl p-3">
                {/* 이메일 아이콘 */}
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 8V16C21 17.1046 20.1046 18 19 18H5C3.89543 18 3 17.1046 3 16V8" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13Z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 text-base outline-none border-0" placeholder="이메일" />
            </div>
          </label>

          <label>
            <div className="flex items-center gap-3 border-2 border-black rounded-xl p-3">
                {/* 비밀번호 아이콘 */}
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 11V8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V11" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="7" y="11" width="10" height="8" rx="2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="flex-1 text-base outline-none border-0" placeholder="비밀번호" />
            </div>
          </label>

          <label>
            <div className="flex items-center gap-3 border-2 border-black rounded-xl p-3">
                {/* 닉네임 아이콘 */}
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.8954 19.1046 17 18 17H6C4.89543 17 4 17.8954 4 19V21" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="flex-1 text-base outline-none border-0" placeholder="닉네임" />
            </div>
          </label>

          <label>
            <div className="flex items-center gap-3 border-2 border-black rounded-xl p-3">
                {/* 생년월일 아이콘 */}
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 7V3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 7V3" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 11H21" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                value={birthRaw}
                onChange={(e) => {
                  const v = (e.target.value || '').replace(/\D/g, '').slice(0, 8);
                  setBirthRaw(v);
                }}
                inputMode="numeric"
                pattern="\d{8}"
                className="flex-1 text-base outline-none border-0"
                placeholder="생년월일 (예: 19970502)"
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">8자리 숫자만 입력하세요 (YYYYMMDD)</div>
          </label>

          <div className="flex gap-2">
            <select value={province} onChange={(e) => setProvince(e.target.value)} className="flex-1 text-xs border-2 border-black rounded-xl p-3">
              {provinceList.length === 0 && <option>불러오는 중...</option>}
              {provinceList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="flex-1 text-xs border-2 border-black rounded-xl p-3">
              {cityList.length === 0 && <option>선택 없음</option>}
              {cityList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="flex-1 text-xs border-2 border-black rounded-xl p-3">
              {districtList.length === 0 && <option>선택 없음</option>}
              {districtList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="border-2 border-black rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} />
                <span className="ml-1">남성</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} />
                <span className="ml-1">여성</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="bg-green-500 text-white py-3 rounded-full font-bold text-base mt-4">
            {submitting ? '가입중...' : '회원가입'}
          </button>
        </form>

        {/* 성공 모달 */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50">
            <div className="w-[320px] bg-white rounded-lg shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-3">회원가입이 성공했습니다!</h3>
              <p className="text-sm text-gray-600 mb-6">가입이 완료되었습니다.</p>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // [수정] state 전달 없이 바로 이동 (쿠키가 있으므로 다음 페이지 API 호출 시 자동 인증됨)
                    navigate('/profile-setup'); 
                  }}
                  className="bg-green-500 text-white px-6 py-2 rounded-md font-medium"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}