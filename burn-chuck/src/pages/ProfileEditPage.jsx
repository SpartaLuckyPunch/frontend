import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import axios from 'axios'; // S3 업로드용
import { loadAddresses } from '../utils/loadAddresses';
import { ArrowLeft, Camera, Loader2, Check } from 'lucide-react';
import useAuthStore from '../features/auth/store/authStore'; // 경로 확인 필요
import sampleImg from '../assets/images/profileSampleImg.png';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // 1. 내 정보 및 스토어 액션 가져오기
  const user = useAuthStore((state) => state.user);
  const setLoginSuccess = useAuthStore((state) => state.setLoginSuccess); // 스토어 업데이트용
  const myId = user?.id;

  // 폼 상태
  const [nickname, setNickname] = useState('');
  const [profileImgUrl, setProfileImgUrl] = useState(''); // DB 전송용 (S3 URL)
  const [previewUrl, setPreviewUrl] = useState('');       // UI 표시용
  
  // 주소 상태
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  
  // 주소 데이터
  const [addressMap, setAddressMap] = useState({});
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [districtList, setDistrictList] = useState([]);

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);

// 2. [추가] User Address 스토어 (주소 정보 갱신용)
  const fetchUserAddress = useAuthStore((state) => state.fetchUserAddress);

  // ------------------------------------------------------------------
  // [초기 데이터 로드]
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!myId) {
        alert("로그인 정보가 없습니다.");
        navigate('/login');
        return;
    }

    const initData = async () => {
      try {
        setLoading(true);
        // 병렬 호출: 주소 데이터 & 내 프로필 조회
        const [addrMap, profileRes] = await Promise.all([
          loadAddresses(),
          apiClient.get(`/users/${myId}`)
        ]);

        // 1. 주소 데이터 세팅
        setAddressMap(addrMap);
        setProvinceList(Object.keys(addrMap));

        // 2. 내 정보 세팅
        const myProfile = profileRes.data.data;
        
        setNickname(myProfile.nickname || '');
        // 기존 이미지가 있으면 세팅, 없으면 빈값
        const currentImg = myProfile.profileImgUrl || '';
        setProfileImgUrl(currentImg);
        setPreviewUrl(currentImg || sampleImg); 

        // 주소 세팅 (DB에 저장된 값)
        setProvince(myProfile.province || '');
        setCity(myProfile.city || '');
        setDistrict(myProfile.district || '');

      } catch (err) {
        console.error("데이터 로딩 실패", err);
        alert("정보를 불러오지 못했습니다.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [myId, navigate]);

  // ------------------------------------------------------------------
  // [주소 선택 로직] - Cascading
  // ------------------------------------------------------------------
  // 시/도 변경 -> 시/군/구 리스트 갱신
  useEffect(() => {
    if (!province) {
        setCityList([]);
        return;
    }
    const cities = Object.keys(addressMap[province] || {});
    setCityList(cities);
    
    // 리스트에 없는 값이 선택되어 있다면 초기화 (초기 로딩 시엔 유지)
    if (city && !cities.includes(city)) setCity(''); 
  }, [province, addressMap]); // city 의존성 제거 (무한루프 방지)

  // 시/군/구 변경 -> 읍/면/동 리스트 갱신
  useEffect(() => {
    if (!province || !city) {
        setDistrictList([]);
        return;
    }
    const districts = addressMap[province]?.[city] || [];
    setDistrictList(districts);

    if (district && !districts.includes(district)) setDistrict('');
  }, [province, city, addressMap]); // district 의존성 제거


  // ------------------------------------------------------------------
  // [이미지 업로드 핸들러] - Pre-signed URL 방식
  // ------------------------------------------------------------------
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("이미지는 5MB 이하여야 합니다.");
        return;
    }

    // 1. 미리보기 즉시 변경
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImgUploading(true);

    try {
        // 2. Pre-signed URL 요청
        const res = await apiClient.get('/users/profileImg', {
            params: { filename: file.name }
        });
        
        // 백엔드 응답에서 업로드용 URL(preSignedUrl)과 저장용 URL(cloudFrontUrl) 추출
        // (만약 cloudFrontUrl을 안 주면 key를 받아서 조합해야 함)
        const { preSignedUrl, cloudFrontUrl } = res.data.data;

        // 3. AWS S3로 직접 업로드
        await axios.put(preSignedUrl, file, {
            headers: { 'Content-Type': file.type }
        });

        // 4. 최종 저장할 URL 상태 업데이트
        setProfileImgUrl(cloudFrontUrl); 
        console.log("S3 업로드 완료:", cloudFrontUrl);

    } catch (err) {
        console.error("이미지 업로드 실패", err);
        alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
        // 실패 시 기존 이미지로 롤백하려면 아래 로직 추가 가능
        // setPreviewUrl(profileImgUrl); 
    } finally {
        setImgUploading(false);
    }
  };

  // ------------------------------------------------------------------
  // [프로필 수정 요청] - PATCH
  // ------------------------------------------------------------------
  const handleSubmit = async () => {
    // 유효성 검사
    if (!nickname.trim()) { alert("닉네임을 입력해주세요."); return; }
    if (!province || !city) { alert("활동 지역을 선택해주세요."); return; }

    if (imgUploading) {
        alert("이미지 업로드 중입니다. 잠시만 기다려주세요.");
        return;
    }

    setSubmitting(true);
    try {
        // 1. DTO 구조에 맞춰 요청 데이터 구성
        const payload = {
            nickname,
            province,
            city,
            district,
            profileImgUrl: profileImgUrl // 기존 URL or 새 URL
        };

        // 2. 수정 API 호출
        await apiClient.patch('/users', payload);
        
        // 3. [중요] 스토어(UI) 정보 갱신을 위해 최신 유저 정보 조회
        // (백엔드 PATCH 응답에 갱신된 User 정보가 오면 그걸 써도 됨. 안 오면 GET 호출)
        const refreshRes = await apiClient.get('/users');
        const updatedUser = refreshRes.data.data; // { userId, nickname, userRole, email, ... }

        // 스토어 업데이트 (매핑 필요 시 수행)
        const mappedUser = {
            id: updatedUser.userId,
            email: updatedUser.email,
            nickname: updatedUser.nickname,
            role: updatedUser.userRole,
            // 필요하다면 profileImgUrl도 스토어에 추가 가능
        };
        setLoginSuccess(mappedUser);

        await fetchUserAddress();

        alert("프로필이 수정되었습니다.");
        navigate(-1); // 뒤로 가기 (프로필 페이지로)

    } catch (err) {
        console.error("수정 실패", err);
        const msg = err.response?.data?.message || "수정 중 오류가 발생했습니다.";
        alert(msg);
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32}/></div>;

  return (
    <div className="bg-white min-h-screen pb-10">
      {/* 헤더 */}
      <header className="fixed top-0 max-w-[430px] w-full bg-white z-10 h-[60px] flex items-center px-4 border-b">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold ml-2">프로필 수정</h1>
      </header>

      <main className="pt-[80px] px-6 flex flex-col gap-8">
        
        {/* 프로필 이미지 수정 */}
        <div className="flex justify-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img 
                    src={previewUrl} 
                    alt="profile" 
                    className={`w-32 h-32 rounded-full object-cover border-4 border-gray-100 ${imgUploading ? 'opacity-50' : ''}`}
                />
                <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-100">
                    <Camera size={20} className="text-gray-600" />
                </div>
                {imgUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                )}
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageChange}
            />
        </div>

        {/* 닉네임 입력 */}
        <section>
            <label className="block text-sm font-bold text-gray-700 mb-2">닉네임</label>
            <input 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="닉네임을 입력하세요"
            />
        </section>

        {/* 주소 선택 */}
        <section>
            <label className="block text-sm font-bold text-gray-700 mb-2">활동 지역</label>
            <div className="flex flex-col gap-3">
                <select 
                    value={province} 
                    onChange={(e) => setProvince(e.target.value)} 
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 appearance-none"
                >
                    <option value="">시/도 선택</option>
                    {provinceList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <div className="flex gap-3">
                    <select 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        disabled={!province}
                        className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 appearance-none disabled:bg-gray-100"
                    >
                        <option value="">시/군/구 선택</option>
                        {cityList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select 
                        value={district} 
                        onChange={(e) => setDistrict(e.target.value)} 
                        disabled={!city}
                        className="flex-1 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 appearance-none disabled:bg-gray-100"
                    >
                        <option value="">읍/면/동 (선택)</option>
                        {districtList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>
        </section>

      </main>

      {/* [수정] 하단 고정 완료 버튼 */}
      <div className="fixed bottom-0 max-w-[430px] w-full bg-white p-4 border-t z-20">
        <button
            onClick={handleSubmit}
            disabled={submitting || imgUploading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition active:scale-[0.98] disabled:bg-gray-400 flex justify-center items-center gap-2 shadow-lg shadow-indigo-100"
        >
            {(submitting || imgUploading) ? (
                <>
                    <Loader2 className="animate-spin" size={20} />
                    {imgUploading ? '이미지 업로드 중...' : '저장 중...'}
                </>
            ) : (
                <>
                    <Check size={20} />
                    수정 완료
                </>
            )}
        </button>
      </div>
    </div>
  );
}