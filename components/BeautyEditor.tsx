import React, { useState, useEffect } from 'react';
import { ImageData } from '../types';

interface BeautyEditorProps {
    isOpen: boolean;
    onClose: () => void;
    image: ImageData | null;
    onApply: (prompt: string) => void;
}

const retouchOptions = [
    { label: "잡티 제거", prompt: "사진 속 인물의 얼굴에 있는 여드름, 잡티 등 일시적인 피부 트러블을 자연스럽게 제거해주세요. 점이나 원래 얼굴의 특징은 그대로 유지해주세요." },
    { label: "피부 톤 보정", prompt: "사진 속 인물의 피부 톤을 자연스럽고 균일하게 보정해주세요. 붉은 기나 얼룩덜룩한 부분을 부드럽게 만들어주세요." },
    { label: "자연스러운 미소", prompt: "사진 속 인물이 아주 살짝, 자연스럽게 미소 짓는 표정으로 만들어주세요. 입꼬리만 미세하게 올려주세요." },
    { label: "안경 제거", prompt: "사진 속 인물이 쓰고 있는 안경을 자연스럽게 제거해주세요. 안경이 있던 자리의 눈과 피부가 어색하지 않게 처리해주세요." },
    { label: "눈 크게 하기", prompt: "사진 속 인물의 눈을 아주 살짝, 자연스럽게 크게 만들어주세요. 원래 눈의 모양은 유지하면서 전체적인 크기만 미세하게 키워서 더 또렷해 보이게 해주세요." },
    { label: "얼굴 좌우 균형", prompt: "사진 속 인물 얼굴의 좌우 비대칭을 미세하게 교정하여 전체적으로 더 균형 잡힌 인상으로 만들어주세요. 완벽한 대칭이 아닌, 자연스러운 범위 내에서 미세한 조정만 해주세요." }
];

export const BeautyEditor: React.FC<BeautyEditorProps> = ({ isOpen, onClose, image, onApply }) => {
    const [customPrompt, setCustomPrompt] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCustomPrompt('');
        }
    }, [isOpen]);

    const handleApplyClick = () => {
        if (customPrompt.trim()) {
            onApply(customPrompt);
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
                    <h2 className="text-2xl font-bold text-slate-900">뽀샵 처리</h2>
                    <button onClick={onClose} className="neu-button neu-button-icon-sm">
                        <span className="text-xl font-light">×</span>
                    </button>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="neu-card-inset flex items-center justify-center p-1 overflow-hidden">
                        <img src={imageUrl} alt="Source for Retouching" className="max-w-full max-h-[50vh] object-contain rounded-lg" />
                    </div>
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-sm text-slate-700 mb-2">
                                원하는 보정 효과를 선택하거나, 아래 입력창에 직접 지시사항을 입력하세요.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {retouchOptions.map(opt => (
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
                                직접 입력 (예: 오른쪽 뺨의 점을 없애줘)
                            </p>
                            <textarea
                                placeholder="상세 보정 요청..."
                                rows={3}
                                className="neu-textarea text-sm"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                     <button onClick={onClose} className="neu-button">취소</button>
                     <button 
                        onClick={handleApplyClick}
                        disabled={!customPrompt.trim()}
                        className="neu-button neu-button-primary"
                    >
                        직접 입력 적용
                    </button>
                </div>
            </div>
        </div>
    );
};