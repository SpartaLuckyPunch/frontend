import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadAddresses } from '../utils/loadAddresses';
import apiClient from '../api/axiosClient';

export default function SignupPage() {
  const navigate = useNavigate();

  // 1. 기존 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthRaw, setBirthRaw] = useState('');
  
  // 2. 이메일 인증 관련 상태
  const [verificationCode, setVerificationCode] = useState(''); 
  const [isCodeSent, setIsCodeSent] = useState(false);          
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [timer, setTimer] = useState(0);                        

  // [추가] 3. 닉네임 중복 확인 관련 상태
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);   // 중복 확인 버튼 눌렀는지
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false); // 사용 가능한지
  const [nicknameMsg, setNicknameMsg] = useState('');                  // 안내 메시지 (사용 가능/불가능)

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

  // --- 주소 로직 (기존 동일) ---
  useEffect(() => {
    let mounted = true;
    loadAddresses().then((map) => {
      if (!mounted) return;
      setAddressMap(map);
      const provinces = Object.keys(map);
      setProvinceList(provinces);
      if (provinces.length) setProvince(provinces[0]);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!province) return setCityList([]);
    const cities = Object.keys(addressMap[province] || {});
    setCityList(cities);
    setCity(cities[0] || '');
  }, [province, addressMap]);

  useEffect(() => {
    if (!province || !city) return setDistrictList([]);
    const districts = addressMap[province]?.[city] || [];
    setDistrictList(districts);
    setDistrict(districts[0] || '');
  }, [province, city, addressMap]);

  // --- 타이머 로직 (기존 동일) ---
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- 이메일 인증 핸들러 (기존 동일) ---
  const handleSendVerification = async () => {
    if (!email) { alert('이메일을 입력해주세요.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('올바른 이메일 형식이 아닙니다.'); return; }

    try {
      await apiClient.post('/auth/email-verifications', { email });
      alert('인증번호가 발송되었습니다. 이메일을 확인해주세요.');
      setIsCodeSent(true);
      setIsEmailVerified(false); 
      setTimer(300); 
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || '인증번호 발송 실패');
    }
  };

  const handleConfirmVerification = async () => {
    if (!verificationCode) { alert('인증번호를 입력해주세요.'); return; }
    try {
      const res = await apiClient.post('/auth/email-verifications/confirm', { email, verificationCode });
      if (res.data.data) {
        alert('이메일 인증이 완료되었습니다.');
        setIsEmailVerified(true);
        setIsCodeSent(false);
        setTimer(0);
      } else {
        alert('인증번호가 올바르지 않습니다.');
      }
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || '인증 확인 실패');
    }
  };

  // [추가] 닉네임 중복 확인 핸들러
  const handleCheckNickname = async () => {
    if (!nickname.trim()) {
        alert('닉네임을 입력해주세요.');
        return;
    }
    // 닉네임 길이 체크 (DTO의 @Size(max=50) 대응 및 최소 길이 등)
    if (nickname.length > 50) {
        alert('닉네임은 50자 이하여야 합니다.');
        return;
    }

    try {
        const res = await apiClient.post('/auth/nickname-availability', { nickname });
        const isAvailable = res.data.data; // true: 사용 가능, false: 중복

        setIsNicknameChecked(true);
        setIsNicknameAvailable(isAvailable);
        
        if (isAvailable) {
            setNicknameMsg('사용 가능한 닉네임입니다.');
        } else {
            setNicknameMsg('이미 사용 중인 닉네임입니다.');
        }
    } catch (err) {
        console.error(err);
        alert(err?.response?.data?.message || '닉네임 중복 확인 중 오류가 발생했습니다.');
        setIsNicknameChecked(true);
        setIsNicknameAvailable(false);
    }
  };

  // [추가] 닉네임 입력 변경 핸들러 (입력값이 바뀌면 다시 중복확인 해야 함)
  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
    setIsNicknameChecked(false);   // 내용이 바뀌었으므로 체크 상태 초기화
    setIsNicknameAvailable(false); // 사용 가능 여부 초기화
    setNicknameMsg('');            // 메시지 초기화
  };

  // 회원가입 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // [수정] 필수 인증 체크 (이메일 & 닉네임)
    if (!isEmailVerified) {
        alert('이메일 인증을 완료해주세요.');
        return;
    }
    if (!isNicknameChecked || !isNicknameAvailable) {
        alert('닉네임 중복 확인을 완료해주세요.');
        return;
    }

    setSubmitting(true);

    try {
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

      await apiClient.post('/auth/signup', body);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-white flex justify-center pb-10">
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
          
          {/* 1. 이메일 입력 + 인증 */}
          <div>
            <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-3 border-2 border-black rounded-xl p-3">
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 8V16C21 17.1046 20.1046 18 19 18H5C3.89543 18 3 17.1046 3 16V8" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13Z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input 
                        value={email} 
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setIsEmailVerified(false);
                            setIsCodeSent(false);
                        }} 
                        className="flex-1 text-base outline-none border-0" 
                        placeholder="이메일" 
                        disabled={isEmailVerified} 
                    />
                </div>
                <button 
                    type="button" 
                    onClick={handleSendVerification}
                    disabled={isEmailVerified || timer > 0} 
                    className={`whitespace-nowrap px-4 rounded-xl text-sm font-bold ${
                        isEmailVerified 
                        ? 'bg-gray-100 text-green-600 border border-green-600' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                >
                    {isEmailVerified ? '인증완료' : (timer > 0 ? '재발송' : '인증하기')}
                </button>
            </div>
            
            {/* 인증번호 입력 필드 */}
            {isCodeSent && !isEmailVerified && (
                <div className="mt-2 flex gap-2">
                    <div className="flex-1 flex items-center gap-3 border-2 border-gray-300 rounded-xl p-3 bg-gray-50">
                        <input 
                            value={verificationCode} 
                            onChange={(e) => setVerificationCode(e.target.value)} 
                            className="flex-1 text-base outline-none border-0 bg-transparent" 
                            placeholder="인증번호 6자리" 
                        />
                        <span className="text-red-500 text-sm font-medium">{formatTime(timer)}</span>
                    </div>
                    <button 
                        type="button"
                        onClick={handleConfirmVerification}
                        className="whitespace-nowrap px-4 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300"
                    >
                        확인
                    </button>
                </div>
            )}
          </div>

          {/* 2. 비밀번호 입력 */}
          <label>
            <div className="flex items-center gap-3 border-2 border-black rounded-xl p-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 11V8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V11" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="7" y="11" width="10" height="8" rx="2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="flex-1 text-base outline-none border-0" placeholder="비밀번호" />
            </div>
          </label>

          {/* 3. [수정] 닉네임 입력 + 중복확인 버튼 */}
          <div>
            <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-3 border-2 border-black rounded-xl p-3">
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21V19C20 17.8954 19.1046 17 18 17H6C4.89543 17 4 17.8954 4 19V21" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input 
                        value={nickname} 
                        onChange={handleNicknameChange} 
                        className="flex-1 text-base outline-none border-0" 
                        placeholder="닉네임" 
                    />
                </div>
                <button 
                    type="button" 
                    onClick={handleCheckNickname}
                    // 이미 사용 가능한 상태면 버튼 비활성화 (수정하면 다시 활성화됨)
                    disabled={isNicknameAvailable}
                    className={`whitespace-nowrap px-4 rounded-xl text-sm font-bold ${
                        isNicknameAvailable 
                        ? 'bg-gray-100 text-blue-600 border border-blue-600' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                >
                    {isNicknameAvailable ? '확인완료' : '중복확인'}
                </button>
            </div>
            {/* 닉네임 상태 메시지 */}
            {isNicknameChecked && (
                <div className={`text-xs mt-1 ml-1 ${isNicknameAvailable ? 'text-blue-600' : 'text-red-500'}`}>
                    {nicknameMsg}
                </div>
            )}
          </div>

          {/* 4. 생년월일 입력 */}
          <label>
            <div className="flex items-center gap-3 border-2 border-black rounded-xl p-3">
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

          {/* 5. 주소 선택 */}
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

          {/* 6. 성별 선택 */}
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

          {/* 7. 가입 버튼 */}
          <button 
            type="submit" 
            // [수정] 이메일 인증 + 닉네임 중복확인 모두 완료되어야 버튼 활성화
            disabled={submitting || !isEmailVerified || !isNicknameChecked || !isNicknameAvailable} 
            className={`py-3 rounded-full font-bold text-base mt-4 transition-colors ${
                (submitting || !isEmailVerified || !isNicknameChecked || !isNicknameAvailable) 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
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