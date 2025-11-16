import React from 'react';
import { GeneratedPart, ImageData } from '../types';
import { PhotoIcon } from './Icons';

interface ResultDisplayProps {
    title: React.ReactNode;
    isLoading: boolean;
    error: string | null;
    parts: GeneratedPart[] | null;
    onImageClick: (src: string) => void;
    onPromoteToOriginal: (imageData: ImageData) => void;
    selectedImageIds: Set<string>;
    onToggleImageSelection: (id: string) => void;
    onClearSelection: () => void;
    onInitiateBatchFrameEdit: () => void;
    topic?: string;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-teal-600">
        <svg className="animate-spin h-10 w-10 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg">결과물을 생성 중입니다...</p>
    </div>
);

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
    title, isLoading, error, parts, onImageClick, onPromoteToOriginal,
    selectedImageIds, onToggleImageSelection, onClearSelection, onInitiateBatchFrameEdit,
    topic = 'image'
}) => {
    const imageParts = parts?.filter(p => p.inlineData).map(p => p.inlineData!) ?? [];
    const textPart = parts?.find(p => p.text)?.text;
    const hasImages = imageParts.length > 0;
    const hasSingleImage = imageParts.length === 1;
    const hasMultipleImages = imageParts.length > 1;
    const hasSelection = selectedImageIds.size > 0;
    
    const containerClasses = hasMultipleImages ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4";

    const downloadImage = (imageData: ImageData, name: string) => {
        const link = document.createElement('a');
        const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
        link.href = imageUrl;
        const extension = imageData.mimeType.split('/')[1] || 'png';
        
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const dateString = `${year}${month}${day}`;

        const filenameTopic = topic || 'image';
        
        const indexMatch = name.match(/\d+$/);
        const index = indexMatch ? indexMatch[0] : '1';

        const shouldAddIndex = imageParts.length > 1;

        const finalFilename = shouldAddIndex
            ? `${filenameTopic}_${dateString}_${index}.${extension}`
            : `${filenameTopic}_${dateString}.${extension}`;
        
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadSelected = () => {
        const selectedImages = imageParts.filter(img => selectedImageIds.has(img.id));
        selectedImages.forEach((imageData) => {
            const originalIndex = imageParts.findIndex(p => p.id === imageData.id);
            downloadImage(imageData, `selected-${originalIndex + 1}`);
        });
    };
    
    const handleDownloadAll = () => {
        imageParts.forEach((imageData, index) => {
            downloadImage(imageData, `all-${index + 1}`);
        });
    };

    const handlePromote = () => {
        if (hasSingleImage) {
            onPromoteToOriginal(imageParts[0]);
        }
    };


    const renderActionButtons = () => {
        if (hasSelection) {
            return (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700 self-center">{selectedImageIds.size}개 선택됨</span>
                     <button
                        onClick={handleDownloadSelected}
                        className="neu-button neu-button-sm"
                        title="선택한 이미지 저장"
                    >
                        <span>💾</span>
                        <span>선택 저장</span>
                    </button>
                    <button
                        onClick={onInitiateBatchFrameEdit}
                        className="neu-button neu-button-sm neu-button-secondary"
                        title="선택한 이미지에 액자/텍스트 일괄 적용"
                    >
                        <PhotoIcon className="w-4 h-4" />
                        <span>일괄 편집</span>
                    </button>
                    <button
                        onClick={onClearSelection}
                        className="neu-button neu-button-sm"
                        title="전체 선택 해제"
                    >
                        <span>❌</span>
                        <span>선택 취소</span>
                    </button>
                </div>
            );
        }

        return (
            <div className="flex gap-2">
                 <button
                    onClick={handleDownloadAll}
                    disabled={isLoading || !hasImages}
                    className="neu-button neu-button-sm"
                    title="모든 이미지 저장"
                >
                    <span>💾</span>
                    <span>저장하기</span>
                </button>
                <button
                    onClick={handlePromote}
                    disabled={isLoading || !hasSingleImage}
                    className="neu-button neu-button-sm neu-button-primary"
                    title={hasMultipleImages ? "각 이미지 위에서 '추가 편집' 버튼을 눌러주세요." : "이미지를 원본으로 사용하여 편집 계속"}
                >
                    <span>🔃</span>
                    <span>추가 편집하기</span>
                </button>
            </div>
        );
    };


    return (
        <div className="neu-card p-6 flex flex-col h-full">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    {title}
                </h3>
                {renderActionButtons()}
            </div>
            <div className="neu-card-inset flex-grow overflow-auto p-4 min-h-[200px]">
                {isLoading && <LoadingSpinner />}
                {!isLoading && error && <div className="text-red-800 p-4 rounded-lg bg-red-100 border border-red-300">{error}</div>}
                {!isLoading && !error && !parts && (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        결과물이 여기에 표시됩니다.
                    </div>
                )}
                {!isLoading && !error && parts && (
                     <div className={`${hasImages && textPart ? 'space-y-4' : ''}`}>
                        {textPart && (
                            <p className="text-slate-800 whitespace-pre-wrap p-3 bg-teal-100/30 rounded-md text-sm">{textPart}</p>
                        )}
                        <div className={containerClasses}>
                            {imageParts.map((imageData) => {
                                const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
                                const isSelected = selectedImageIds.has(imageData.id);
                                return (
                                    <div key={imageData.id} className="relative group cursor-pointer" onClick={() => onToggleImageSelection(imageData.id)}>
                                        <img
                                            src={imageUrl}
                                            alt="Generated content"
                                            className={`rounded-lg w-full object-contain transition-all duration-200 ${isSelected ? 'ring-4 ring-teal-500 ring-offset-2' : 'ring-2 ring-transparent'}`}
                                        />
                                        {isSelected && (
                                            <div className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center bg-teal-600 text-white rounded-full border-2 border-white shadow-md">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                        <div 
                                            className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                            onClick={(e) => { e.stopPropagation(); onImageClick(imageUrl); }}
                                            aria-label="Zoom image"
                                        >
                                            <span className="text-white text-3xl">🔍</span>
                                        </div>
                                        
                                        {hasMultipleImages && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onPromoteToOriginal(imageData); }}
                                                className="neu-button neu-button-sm absolute bottom-2 right-2 flex items-center gap-1 p-1.5 backdrop-blur-sm transition-all group-hover:opacity-100 opacity-0 text-xs font-semibold"
                                                title="이 이미지를 원본으로 사용"
                                            >
                                                <span>🔃 추가 편집</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};