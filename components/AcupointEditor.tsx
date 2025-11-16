
import React, { useState, useEffect } from 'react';
import { ImageData } from '../types';
import { suggestAcupointPrompt } from '../services/geminiService';
import { SparklesIcon } from './Icons';

interface AcupointEditorProps {
    isOpen: boolean;
    onClose: () => void;
    image: ImageData | null;
    onApply: (prompt: string) => void;
}

export const AcupointEditor: React.FC<AcupointEditorProps> = ({ isOpen, onClose, image, onApply }) => {
    const [prompt, setPrompt] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            setError(null);
            setIsSuggesting(false);
        }
    }, [isOpen]);

    const handleSuggest = async () => {
        if (!image) return;
        setIsSuggesting(true);
        setError(null);
        try {
            const suggestion = await suggestAcupointPrompt(image);
            setPrompt(suggestion);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to get suggestion.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleApplyClick = () => {
        if (prompt.trim()) {
            onApply(prompt);
            onClose();
        }
    };

    if (!isOpen || !image) return null;

    const imageUrl = `data:${image.mimeType};base64,${image.data}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="neu-card w-full max-w-2xl flex flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">경락/경혈 시각화</h2>
                    <button onClick={onClose} className="neu-button neu-button-icon-sm">
                        <span className="text-xl font-light">×</span>
                    </button>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="neu-card-inset flex items-center justify-center p-1 overflow-hidden">
                        <img src={imageUrl} alt="Source for Acupoint" className="max-w-full max-h-80 object-contain rounded-lg" />
                    </div>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-slate-700">
                           이미지 위에 표시하고 싶은 경혈과 경락을 설명해주세요. (예: 손등 합곡혈에 경락선을 표시해줘)
                        </p>
                        <textarea
                            placeholder="시각화 요청..."
                            rows={5}
                            className="neu-textarea text-sm"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                         {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            onClick={handleSuggest}
                            disabled={isSuggesting}
                            className="neu-button neu-button-secondary w-full"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            {isSuggesting ? '제안 중...' : '프롬프트 제안'}
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                     <button onClick={onClose} className="neu-button">취소</button>
                     <button 
                        onClick={handleApplyClick}
                        disabled={!prompt.trim()}
                        className="neu-button neu-button-primary"
                    >
                        적용하기
                    </button>
                </div>
            </div>
        </div>
    );
};