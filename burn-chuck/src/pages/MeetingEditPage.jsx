import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axiosClient';
import axios from 'axios';
import { ArrowLeft, MapPin, Calendar, Users, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import AddressSearchModal from '../components/meeting/AddressSearchModal';

export default function MeetingEditPage() {
    const navigate = useNavigate();
    const { id } = useParams(); // URL에서 meetingId 가져오기

    // 로딩 상태 (초기 데이터 로딩용)
    const [initialLoading, setInitialLoading] = useState(true);
    
    // 카테고리 목록 상태
    const [categories, setCategories] = useState([]);
    
    // UI 상태
    const [loading, setLoading] = useState(false);
    const [imgUploading, setImgUploading] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    
    const [previewUrl, setPreviewUrl] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imgUrl: '', 
        location: '',
        latitude: 0, 
        longitude: 0,
        maxAttendees: 2,
        meetingDateTime: '',
        categoryCode: '',
    });

    // [핵심] 초기 데이터 로딩 (카테고리 + 기존 모임 정보)
    useEffect(() => {
        const loadData = async () => {
            try {
                // 병렬로 API 호출 (카테고리 목록, 모임 상세 정보)
                const [categoryRes, meetingRes] = await Promise.all([
                    apiClient.get('/categories'),
                    apiClient.get(`/meetings/${id}`)
                ]);

                // 1. 카테고리 세팅
                const categoryList = categoryRes.data.data.categoryResponseList || [];
                setCategories(categoryList);

                // 2. 기존 모임 정보 세팅 (매핑)
                const m = meetingRes.data.data;
                
                // 날짜 포맷팅: YYYY-MM-DDTHH:mm:ss -> YYYY-MM-DDTHH:mm (초 단위 제거 for input)
                const formattedDateTime = m.meetingDatetime ? m.meetingDatetime.slice(0, 16) : '';

                setFormData({
                    title: m.meetingTitle,       // API 필드명 -> State 필드명 매핑
                    description: m.description,
                    imgUrl: m.imgUrl,
                    location: m.location,
                    latitude: m.latitude,
                    longitude: m.longitude,
                    maxAttendees: m.maxAttendees,
                    meetingDateTime: formattedDateTime,
                    // 주의: 상세 조회 API에 categoryCode가 없다면 빈값. 
                    // (만약 백엔드에서 categoryCode를 안 주면 사용자가 다시 선택해야 함)
                    categoryCode: m.categoryCode || '' 
                });

            } catch (error) {
                console.error("데이터 로딩 실패", error);
                alert("모임 정보를 불러오지 못했습니다.");
                navigate(-1); // 에러 시 뒤로가기
            } finally {
                setInitialLoading(false);
            }
        };

        if (id) loadData();
    }, [id, navigate]);

    // ... (이하 핸들러들은 CreatePage와 거의 동일) ...

    const handleAddressSelect = ({ address, latitude, longitude }) => {
        setFormData(prev => ({
            ...prev,
            location: address,
            latitude: latitude,
            longitude: longitude
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategorySelect = (code) => {
        setFormData(prev => ({ ...prev, categoryCode: code }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("파일 크기는 5MB 이하여야 합니다.");
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setImgUploading(true);

        try {
            const res = await apiClient.get('/meetings/img', {
                params: { filename: file.name }
            });
            
            const { preSignedUrl, cloudFrontUrl } = res.data.data;

            await axios.put(preSignedUrl, file, {
                headers: { 'Content-Type': file.type }
            });

            setFormData(prev => ({ ...prev, imgUrl: cloudFrontUrl }));
            
        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            alert("이미지 업로드에 실패했습니다.");
            setPreviewUrl(null);
        } finally {
            setImgUploading(false);
        }
    };

    // [수정] 수정 완료 핸들러 (PATCH)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 필수값 체크
        if (!formData.title || !formData.description || !formData.imgUrl || !formData.meetingDateTime || !formData.location) {
            alert("모든 필수 항목을 입력해주세요.");
            return;
        }
        
        // 카테고리 코드가 비어있으면(상세조회에서 못 받아왔을 경우) 체크
        if (!formData.categoryCode) {
            alert("카테고리를 선택해주세요.");
            return;
        }

        setLoading(true);
        try {
            // PATCH 요청 보내기
            await apiClient.patch(`/meetings/${id}`, formData);
            
            alert("모임 정보가 수정되었습니다!");
            // 수정 후 상세 페이지로 이동
            navigate(`/meetings/${id}`, { replace: true });
        } catch (error) {
            console.error("모임 수정 실패", error);
            const msg = error.response?.data?.message || "모임 수정 중 오류가 발생했습니다.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    // 초기 로딩 중일 때 스켈레톤 UI
    if (initialLoading) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-24 translate-y-[-12px]">
            <header className="fixed top-0 max-w-[430px] w-full bg-white z-10 h-[60px] flex items-center px-4 border-b">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold ml-2">모임 수정하기</h1>
            </header>

            <main className="pt-[80px] px-5 flex flex-col gap-6">
                
                {/* 1. 이미지 업로드 */}
                <section>
                    <label className="block mb-2 font-bold text-gray-700">대표 이미지</label>
                    <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition group">
                        {(previewUrl || formData.imgUrl) ? (
                            <>
                                <img 
                                    src={previewUrl || formData.imgUrl} 
                                    alt="preview" 
                                    className={`w-full h-full object-cover transition-opacity ${imgUploading ? 'opacity-50' : 'opacity-100'}`} 
                                />
                                {imgUploading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                                        <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
                                    </div>
                                )}
                                {!imgUploading && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <ImageIcon className="text-white" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-gray-400">
                                <ImageIcon className="mx-auto mb-2" />
                                <span className="text-sm">클릭하여 이미지 변경</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={handleImageUpload}
                            disabled={imgUploading}
                        />
                    </div>
                </section>

                {/* 2. 제목 */}
                <section>
                    <label className="block mb-2 font-bold text-gray-700">모임 이름</label>
                    <input 
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        maxLength={50}
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 transition"
                    />
                </section>

                {/* 3. 카테고리 */}
                <section>
                    <label className="block mb-2 font-bold text-gray-700">카테고리</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.code}
                                type="button"
                                onClick={() => handleCategorySelect(cat.code)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    formData.categoryCode === cat.code
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {cat.category || cat.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 4. 일시 */}
                <section>
                    <label className="block mb-2 font-bold text-gray-700">일시</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="datetime-local"
                            name="meetingDateTime"
                            value={formData.meetingDateTime}
                            onChange={handleChange}
                            className="w-full pl-12 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </section>

                {/* 5. 장소 */}
                <section>
                    <label className="block mb-2 font-bold text-gray-700">장소</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                readOnly
                                value={formData.location}
                                onClick={() => setIsAddressModalOpen(true)}
                                className="w-full pl-12 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none cursor-pointer"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setIsAddressModalOpen(true)}
                            className="px-4 bg-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-200"
                        >
                            검색
                        </button>
                    </div>
                </section>

                {/* 주소 검색 모달 */}
                {isAddressModalOpen && (
                    <AddressSearchModal 
                        onClose={() => setIsAddressModalOpen(false)} 
                        onSelect={handleAddressSelect} 
                    />
                )}

                {/* 6. 인원 */}
                <section>
                    <label className="block mb-2 font-bold text-gray-700">모집 인원</label>
                    <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="number"
                            name="maxAttendees"
                            min={2}
                            value={formData.maxAttendees}
                            onChange={handleChange}
                            className="w-full pl-12 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </section>

                {/* 7. 상세 설명 */}
                <section>
                    <label className="block mb-2 font-bold text-gray-700">상세 설명</label>
                    <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        maxLength={500}
                        rows={5}
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">
                        {formData.description.length}/500
                    </div>
                </section>
            </main>

            {/* 하단 수정 완료 버튼 */}
            <div className="fixed bottom-0 max-w-[430px] w-full bg-white p-4 border-t z-10">
                <button
                    onClick={handleSubmit}
                    disabled={loading || imgUploading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition active:scale-[0.98] disabled:bg-gray-400 flex justify-center items-center gap-2"
                >
                    {(loading || imgUploading) ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            {imgUploading ? '이미지 업로드 중...' : '수정 중...'}
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