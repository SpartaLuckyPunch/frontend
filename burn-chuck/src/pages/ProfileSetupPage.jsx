import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import axios from 'axios'; // S3 직접 업로드를 위해 axios 별도 import
import apiClient from '../api/axiosClient'; // 우리 백엔드용 클라이언트
import { getCroppedImg } from '../utils/canvasUtils';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 상태값들
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  // [추가] 실제 업로드할 Blob 데이터를 저장할 state
  const [finalBlob, setFinalBlob] = useState(null);
  const [uploading, setUploading] = useState(false); // 로딩 상태

  const accessToken = location.state?.token;

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsCropping(true);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // [중요] 미리보기용 URL 생성 뿐만 아니라, 업로드용 Blob을 state에 저장
      setFinalBlob(croppedBlob); 
      
      const previewUrl = URL.createObjectURL(croppedBlob);
      setPreviewImage(previewUrl);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      alert('이미지 자르기에 실패했습니다.');
    }
  };

  // [핵심] API 호출 로직 구현
const handleComplete = async () => {
    if (!finalBlob) return;
    setUploading(true);

    try {
      // 1. Pre-signed URL 요청 (GET)
      const filename = `profile_${Date.now()}.jpg`; 
      
      const preSignRes = await apiClient.get('/users/profileImg', {
        params: { filename },
        headers: {
            Authorization: `${accessToken}`
        }
      });

      const { preSignedUrl, key } = preSignRes.data.data;

      // 2. S3로 이미지 직접 업로드 (PUT)
      // 여기는 S3 규격이라 PUT이 맞습니다. (변경 없음)
      await axios.put(preSignedUrl, finalBlob, {
        headers: {
            'Content-Type': finalBlob.type, 
        },
      },
    );

      // 3. 백엔드에 업로드 완료 알림 (PATCH) -> 여기가 수정되었습니다!
      // PATCH users/profileImg?key=...
      await apiClient.patch(`/users/profileImg?key=${key}`, null, {
        headers: {
            Authorization: `${accessToken}`
        }
      });

      alert("프로필 이미지가 등록되었습니다!");
      navigate('/category-setup'); 

    } catch (error) {
      console.error("업로드 실패:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    navigate('/category-setup');
  };

  return (
    <div className="h-full bg-white flex justify-center">
      <div className="w-full max-w-[430px] h-full p-6 box-border flex flex-col items-center relative overflow-hidden bg-white shadow-lg">
        
        <div className="mt-10 mb-8 text-center">
          <h1 className="text-2xl font-extrabold mb-2">프로필 설정</h1>
          <p className="text-gray-500 text-sm">나를 표현할 프로필 사진을 등록해주세요.</p>
        </div>

        <div className="relative mb-10">
          <div className="w-40 h-40 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shadow-sm">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          
          <label className="absolute bottom-1 right-1 bg-black text-white p-3 rounded-full cursor-pointer shadow-md hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
          </label>
        </div>

        <div className="w-full flex flex-col gap-3 mt-auto mb-10">
          <button 
            onClick={handleComplete} 
            className={`w-full py-3.5 rounded-full font-bold text-white transition-all ${
                previewImage && !uploading ? 'bg-green-500 hover:bg-green-600 shadow-md' : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!previewImage || uploading}
          >
            {uploading ? '업로드 중...' : '등록 완료'}
          </button>
          <button 
            onClick={handleSkip} 
            disabled={uploading}
            className="w-full py-3.5 rounded-full font-bold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            건너뛰기
          </button>
        </div>

        {/* 크롭 모달 영역 (이전과 동일) */}
        {isCropping && (
          <div className="absolute inset-0 z-[1300] bg-black flex flex-col">
            <div className="relative flex-1 bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="bg-white p-6 pb-10 rounded-t-2xl">
                <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2 text-center">확대/축소</p>
                    <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => { setIsCropping(false); setImageSrc(null); }}
                        className="flex-1 py-3 rounded-lg border border-gray-300 font-bold text-gray-700 hover:bg-gray-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={showCroppedImage}
                        className="flex-1 py-3 rounded-lg bg-green-500 font-bold text-white hover:bg-green-600 shadow-md"
                    >
                        자르기 완료
                    </button>
                </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}