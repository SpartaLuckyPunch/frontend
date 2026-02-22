import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosClient'; // 백엔드 통신용
import axios from 'axios'; // S3 직접 업로드용
import { ArrowLeft, MapPin, Calendar, Users, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import AddressSearchModal from '../components/meeting/AddressSearchModal';

export default function MeetingCreatePage() {
    const navigate = useNavigate();
    
    // 카테고리 목록 상태
    const [categories, setCategories] = useState([]);
    
    // UI 상태
    const [loading, setLoading] = useState(false);
    const [imgUploading, setImgUploading] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    
    // [추가] 즉시 미리보기용 이미지 URL 상태
    const [previewUrl, setPreviewUrl] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imgUrl: '', 
        location: '',
        latitude: 37.5665, 
        longitude: 126.9780,
        maxAttendees: 2,
        meetingDateTime: '',
        categoryCode: '',
    });

    // 컴포넌트 마운트 시 카테고리 목록 조회
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiClient.get('/categories');
                const categoryList = res.data.data.categoryResponseList || []; 
                setCategories(categoryList);
            } catch (error) {
                console.error("카테고리 조회 실패", error);
            }
        };

        fetchCategories();
    }, []);

    // 주소 선택 완료 핸들러
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

    // [수정] 이미지 업로드 핸들러
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 5MB 용량 제한
        if (file.size > 5 * 1024 * 1024) {
            alert("파일 크기는 5MB 이하여야 합니다.");
            return;
        }

        // 1. [핵심] 즉시 미리보기 생성 (파일 선택하자마자 보여줌)
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        setImgUploading(true);

        try {
            // 2. Pre-signed URL 요청
            const res = await apiClient.get('/meetings/img', {
                params: { filename: file.name }
            });
            
            // [수정] 백엔드 응답에서 cloudFrontUrl 추출
            // 응답 예시: { preSignedUrl: "...", cloudFrontUrl: "..." }
            const { preSignedUrl, cloudFrontUrl } = res.data.data;

            // 3. S3 직접 업로드
            await axios.put(preSignedUrl, file, {
                headers: { 'Content-Type': file.type }
            });

            // 4. 업로드 성공 시 실제 DB 저장용 URL 업데이트
            // 여기서 cloudFrontUrl을 사용해야 합니다.
            setFormData(prev => ({ ...prev, imgUrl: cloudFrontUrl }));
            
        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
            setPreviewUrl(null); // 실패 시 미리보기 취소
        } finally {
            setImgUploading(false);
        }
    };

    // 폼 제출
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || !formData.description || !formData.imgUrl || !formData.meetingDateTime || !formData.location || !formData.categoryCode) {
            alert("모든 필수 항목을 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/meetings', formData);
            const createdMeetingId = res.data.data.meetingId;

            alert("모임이 성공적으로 생성되었습니다!");
            
            // [핵심] 생성된 모임 상세 페이지로 이동
            navigate(`/meetings/${createdMeetingId}`);
        } catch (error) {
            console.error("모임 생성 실패", error);
            const msg = error.response?.data?.message || "모임 생성 중 오류가 발생했습니다.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen pb-24">
            <main className="pt-[16px] px-5 flex flex-col gap-6">
                
                {/* 1. 이미지 업로드 섹션 */}
                <section>
                    <label className="block mb-2 font-bold text-gray-700">대표 이미지</label>
                    <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition group">
                        
                        {/* [수정] previewUrl이 있으면 우선 표시, 아니면 formData.imgUrl 표시 */}
                        {(previewUrl || formData.imgUrl) ? (
                            <>
                                <img 
                                    src={previewUrl || formData.imgUrl} 
                                    alt="preview" 
                                    className={`w-full h-full object-cover transition-opacity ${imgUploading ? 'opacity-50' : 'opacity-100'}`} 
                                />
                                
                                {/* 업로드 중일 때 로딩 오버레이 */}
                                {imgUploading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                                        <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
                                        <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">업로드 중...</span>
                                    </div>
                                )}

                                {/* 마우스 올렸을 때 아이콘 */}
                                {!imgUploading && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <ImageIcon className="text-white" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-gray-400">
                                {imgUploading ? (
                                    <div className="flex flex-col items-center animate-pulse">
                                        <Loader2 className="animate-spin mb-2" />
                                        <span className="text-sm">준비 중...</span>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon className="mx-auto mb-2" />
                                        <span className="text-sm">클릭하여 이미지 업로드</span>
                                    </>
                                )}
                            </div>
                        )}
                        
                        {/* 파일 인풋 */}
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
                        placeholder="어떤 모임인가요? (최대 50자)"
                        maxLength={50}
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 transition"
                    />
                </section>

                {/* 3. 카테고리 */}
                <section>
                    <label className="block mb-2 font-bold text-gray-700">카테고리</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.length > 0 ? (
                            categories.map((cat) => (
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
                            ))
                        ) : (
                            <div className="text-sm text-gray-400 p-2">카테고리를 불러오는 중...</div>
                        )}
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
                                placeholder="장소를 검색해주세요"
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
                        placeholder="모임 내용을 입력해주세요."
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">
                        {formData.description.length}/500
                    </div>
                </section>
            </main>

            {/* 하단 생성 버튼 */}
            <div className="fixed bottom-16 max-w-[430px] w-full bg-white p-4 border-t z-10">
                <button
                    onClick={handleSubmit}
                    disabled={loading || imgUploading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition active:scale-[0.98] disabled:bg-gray-400 flex justify-center items-center gap-2"
                >
                    {(loading || imgUploading) ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            {imgUploading ? '이미지 업로드 중...' : '생성 중...'}
                        </>
                    ) : (
                        <>
                            <Check size={20} />
                            모임 개설하기
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}