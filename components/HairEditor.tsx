import React, { useState, useEffect } from 'react';
import { ImageData } from '../types';

interface HairEditorProps {
    isOpen: boolean;
    onClose: () => void;
    image: ImageData | null;
    onApply: (prompt: string) => void;
}

const hairOptions = [
    { 
        label: "머리카락 개수 늘리기", 
        prompt: `[임무: 헐리우드 VFX 헤어 아티스트]

**최우선 목표: 시각적 밀도 200% 증가 및 두피 완전 차폐**
당신의 임무는 미세 조정이 아닙니다. 기존 헤어스타일의 **상층부 아래에, 눈에 보이지 않는 빽빽한 머리카락의 '언더레이어(underlayer)'를 새로 생성**하여 두피를 완전히 덮어버리는 것입니다. 결과물은 머리숱이 최소 두 배 이상 늘어난 것처럼 보여야 합니다.

**작업 방식**
1.  **기존 헤어스타일 분석:** 현재 머리카락의 흐름, 컬, 색상을 파악합니다.
2.  **언더레이어 생성:** 기존 머리카락 가닥들 '사이'와 '아래'에 새로운 머리카락을 촘촘하게 그려 넣어, 두피가 보이는 모든 틈을 메웁니다. 이 언더레이어는 깊이감과 풍성함을 만드는 핵심입니다.
3.  **자연스러운 통합:** 새로 생성된 언더레이어가 기존 머리카락과 그림자, 색상 면에서 완벽하게 어우러지도록 블렌딩합니다.

**가장 중요한 제약 조건: 기존 스타일 외곽선 유지**
이 모든 작업은 기존 헤어스타일의 **전체적인 길이와 바깥쪽 실루엣(외곽선)을 절대 변경하지 않는 선에서** 이루어져야 합니다. 머리가 길어지거나 헤어컷이 바뀌어서는 안 됩니다.

**최종 목표**
사용자가 결과를 봤을 때 "뭔가 자연스럽게 채워졌네"가 아니라, "머리숱이 엄청나게 많아졌다"고 즉시 느낄 수 있도록, 극적이고 확실한 변화를 만들어내세요.`
    },
    { 
        label: "헤어라인 조정", 
        prompt: `[임무: 블록버스터 영화의 하이퍼리얼리즘 VFX 디렉터]

**최우선 목표: 충격적일 정도로 명확한 이마 축소**
당신은 사진 보정가가 아닙니다. 당신은 배우의 이마를 CGI로 완벽하게 재창조하는 VFX 전문가입니다. '자연스러움'은 '소심함'을 의미하지 않습니다. 변화를 알아보기 위해 자세히 봐야 하는 결과물은 절대적인 실패입니다.

**핵심 지시사항: '디지털 이마 성형' 실행**
1.  **측정 및 목표 설정:** 현재 헤어라인의 위치를 정밀하게 측정합니다. 그 지점으로부터 **최소 2cm, 권장 3cm 아래**에 새로운 헤어라인의 최종 목표선을 설정합니다.
2.  **완벽한 재창조:** 기존 헤어라인과 새로운 목표선 사이의 모든 이마 피부를, 원래부터 그 자리에 있었던 것처럼 보이는 머리카락으로 100% 완벽하게 덮어야 합니다.
    -   **밀도와 디테일:** 모근 하나하나가 보일 정도의 극사실적인 디테일로, 피부가 단 한 픽셀도 보이지 않도록 빽빽하게 채웁니다.
    -   **흐름과 통합:** 새로 생성된 머리카락은 기존 머리카락의 방향, 색상, 질감과 완벽하게 이어져야 합니다. 인위적인 경계선은 절대 용납되지 않습니다.
    -   **가장자리 처리:** 새로운 헤어라인의 가장자리는 실제 사람처럼 미세하고 부드러운 잔머리를 포함하여, 이식 수술의 흔적이 전혀 느껴지지 않도록 처리해야 합니다.

**성공 기준:**
-   **수치적 목표:** 최종 이미지에서 이마가 차지하는 면적이 시각적으로 **최소 30% 이상** 줄어들어야 합니다.
-   **절대 규칙:** 다른 얼굴 부위나 머리 길이는 절대 변경하지 마십시오. 오직 이마 영역만 재창조합니다.

**결과물:**
누가 보더라도 즉시 "이마가 엄청나게 좁아졌다"고 외칠 정도의, 극적이고 논란의 여지가 없는 결과물을 생성하세요.` 
    },
    { 
        label: "머리카락 단정하게 정리", 
        prompt: "사진 속 인물의 머리카락을 전체적으로 깔끔하게 정돈해주세요. 특히, 머리카락의 주된 흐름에서 벗어나 삐져나온 가닥이나 여러 방향으로 뻗친 잔머리들을 제거하여, 마치 방금 빗질을 한 것처럼 단정하고 차분한 헤어스타일로 만들어주세요." 
    }
];

export const HairEditor: React.FC<HairEditorProps> = ({ isOpen, onClose, image, onApply }) => {
    const [hairColor, setHairColor] = useState('');

    useEffect(() => {
        if (isOpen) {
            setHairColor('');
        }
    }, [isOpen]);

    const handleApplyColor = () => {
        if (hairColor.trim()) {
            onApply(`머리카락 색을 ${hairColor}(으)로 바꿔주세요.`);
        }
    };
    
    const handleOptionClick = (prompt: string) => {
        onApply(prompt);
    };

    if (!isOpen || !image) return null;

    const imageUrl = `data:${image.mimeType};base64,${image.data}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="neu-card w-full max-w-4xl flex flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">머리카락 보정</h2>
                    <button onClick={onClose} className="neu-button neu-button-icon-sm">
                        <span className="text-xl font-light">×</span>
                    </button>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="neu-card-inset flex items-center justify-center p-1 overflow-hidden">
                        <img src={imageUrl} alt="Source for Hair Correction" className="max-w-full max-h-[50vh] object-contain rounded-lg" />
                    </div>
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-sm text-slate-700 mb-2">
                                원하는 보정 효과를 선택하거나, 아래 입력창에 직접 지시사항을 입력하세요.
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                {hairOptions.map(opt => (
                                    <button
                                        key={opt.label}
                                        onClick={() => handleOptionClick(opt.prompt)}
                                        className="neu-button text-sm w-full"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-teal-200/50 pt-4">
                            <p className="text-sm text-slate-700 mb-2">
                                머리카락 색깔 바꾸기 (예: 갈색, 검은색, 금발)
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="원하는 색상 입력"
                                    className="neu-input text-sm flex-grow"
                                    value={hairColor}
                                    onChange={(e) => setHairColor(e.target.value)}
                                />
                                <button
                                    onClick={handleApplyColor}
                                    disabled={!hairColor.trim()}
                                    className="neu-button neu-button-primary flex-shrink-0"
                                >
                                    색상 변경
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                    <button onClick={onClose} className="neu-button">닫기</button>
                </div>
            </div>
        </div>
    );
};