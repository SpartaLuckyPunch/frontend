import React, { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { addressData } from '../../assets/data/addressData'; // 위에서 만든 데이터 임포트

export default function AddressSearchModal({ onClose, onSelect }) {
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // 1. 시/도 목록 추출 (중복 제거)
    const provinces = useMemo(() => {
        return [...new Set(addressData.map(item => item.province))];
    }, []);

    // 2. 선택된 시/도에 따른 시/군/구 목록 추출
    const cities = useMemo(() => {
        if (!selectedProvince) return [];
        return [...new Set(
            addressData
                .filter(item => item.province === selectedProvince)
                .map(item => item.city)
        )];
    }, [selectedProvince]);

    // 3. 선택된 시/군/구에 따른 읍/면/동 목록 추출
    const districts = useMemo(() => {
        if (!selectedCity) return [];
        return addressData
            .filter(item => item.province === selectedProvince && item.city === selectedCity)
            .map(item => item); // 객체 전체 반환 (위경도 포함)
    }, [selectedProvince, selectedCity]);

    // 완료 핸들러
    const handleComplete = () => {
        if (!selectedDistrict) return;
        
        // district는 객체임 { province, city, district, lat, lng }
        const fullAddress = `${selectedProvince} ${selectedCity} ${selectedDistrict.district}`;
        onSelect({
            address: fullAddress,
            latitude: selectedDistrict.latitude,
            longitude: selectedDistrict.longitude
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
            <div className="w-full max-w-[430px] bg-white rounded-t-2xl sm:rounded-2xl p-5 flex flex-col max-h-[80vh]">
                
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-lg font-bold">주소 선택</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                {/* 선택 영역 (스크롤 가능) */}
                <div className="flex-1 overflow-y-auto space-y-4">
                    
                    {/* 1단계: 시/도 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">시/도</label>
                        <div className="grid grid-cols-3 gap-2">
                            {provinces.map(prov => (
                                <button
                                    key={prov}
                                    onClick={() => {
                                        setSelectedProvince(prov);
                                        setSelectedCity('');
                                        setSelectedDistrict('');
                                    }}
                                    className={`py-2 text-sm rounded-lg border ${
                                        selectedProvince === prov 
                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                        : 'bg-white text-gray-600 border-gray-200'
                                    }`}
                                >
                                    {prov}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2단계: 시/군/구 */}
                    {selectedProvince && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <label className="block text-sm font-bold text-gray-700 mb-2">시/군/구</label>
                            <div className="grid grid-cols-3 gap-2">
                                {cities.map(city => (
                                    <button
                                        key={city}
                                        onClick={() => {
                                            setSelectedCity(city);
                                            setSelectedDistrict('');
                                        }}
                                        className={`py-2 text-sm rounded-lg border ${
                                            selectedCity === city 
                                            ? 'bg-indigo-600 text-white border-indigo-600' 
                                            : 'bg-white text-gray-600 border-gray-200'
                                        }`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3단계: 읍/면/동 */}
                    {selectedCity && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <label className="block text-sm font-bold text-gray-700 mb-2">읍/면/동</label>
                            <div className="grid grid-cols-3 gap-2">
                                {districts.map(dist => (
                                    <button
                                        key={dist.district}
                                        onClick={() => setSelectedDistrict(dist)}
                                        className={`py-2 text-sm rounded-lg border ${
                                            selectedDistrict.district === dist.district 
                                            ? 'bg-indigo-600 text-white border-indigo-600' 
                                            : 'bg-white text-gray-600 border-gray-200'
                                        }`}
                                    >
                                        {dist.district}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 하단 완료 버튼 */}
                <div className="mt-4 pt-4 border-t">
                    <button
                        onClick={handleComplete}
                        disabled={!selectedDistrict}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:bg-gray-300 transition-colors"
                    >
                        선택 완료
                    </button>
                </div>
            </div>
        </div>
    );
}