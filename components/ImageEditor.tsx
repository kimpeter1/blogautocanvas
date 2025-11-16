

import React, { useRef, useEffect, useState } from 'react';
import { ImageData } from '../types';

interface ImageEditorProps {
    image: ImageData;
    onApply: (mask: ImageData, prompt: string) => void;
    onCancel: () => void;
    isDisabled?: boolean;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ image, onApply, onCancel, isDisabled }) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
    const [prompt, setPrompt] = useState('');

    const imageUrl = `data:${image.mimeType};base64,${image.data}`;

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        const imageEl = imageRef.current;
        if (canvas && imageEl) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const setSize = () => {
                    const { width, height } = imageEl.getBoundingClientRect();
                     if (width > 0 && height > 0) {
                        canvas.width = width;
                        canvas.height = height;
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(0, 0, width, height);
                    }
                }
                
                if (imageEl.complete) {
                    setSize();
                } else {
                    imageEl.onload = setSize;
                }
            }
        }
    }
    
    useEffect(() => {
        resetCanvas();
        window.addEventListener('resize', resetCanvas);
        return () => window.removeEventListener('resize', resetCanvas);
    }, [imageUrl]);

    const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            const pos = getMousePos(e);

            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            if (lastPos) {
                 ctx.moveTo(lastPos.x, lastPos.y);
            } else {
                 ctx.moveTo(pos.x, pos.y);
            }
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            setLastPos(pos);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        setLastPos(getMousePos(e));
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        setLastPos(null);
    };
    
    const handleMouseLeave = () => {
        setIsDrawing(false);
        setLastPos(null);
    };

    const handleApply = async () => {
        const canvas = canvasRef.current; // The overlay canvas
        const imageEl = imageRef.current;
        if (!canvas || !imageEl || !imageEl.naturalWidth) return;

        // Final mask, sized to the original image
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = imageEl.naturalWidth;
        maskCanvas.height = imageEl.naturalHeight;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return;

        // Temp canvas to get a positive of the erased area
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // 1. Fill temp canvas with white
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 2. Use destination-out: The destination (white) is kept only where the source (overlay) is transparent.
        // This leaves white only where the user drew/erased.
        tempCtx.globalCompositeOperation = 'destination-out';
        tempCtx.drawImage(canvas, 0, 0);
        
        // 3. Create the final mask: black background
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        // 4. Draw the white shape (from tempCanvas) onto the black background, scaling as needed.
        const scaleX = maskCanvas.width / canvas.width;
        const scaleY = maskCanvas.height / canvas.height;
        maskCtx.save();
        maskCtx.scale(scaleX, scaleY);
        maskCtx.drawImage(tempCanvas, 0, 0);
        maskCtx.restore();

        const maskDataUrl = maskCanvas.toDataURL('image/png');
        const maskBase64 = maskDataUrl.split(',')[1];
        
        // Use a default prompt for content-aware fill if the user leaves it blank
        const finalPrompt = prompt.trim() || "지워진 부분을 주변과 어울리게 자연스럽게 채워줘. 감쪽같이 만들어줘.";
        
        onApply({ id: crypto.randomUUID(), mimeType: 'image/png', data: maskBase64 }, finalPrompt);
    };

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-slate-900">부분 삭제 (마우스로 지울 영역을 선택)</h3>
            <div className="neu-card-inset relative w-full max-w-[600px] aspect-square p-1 flex items-center justify-center overflow-hidden">
                <img ref={imageRef} src={imageUrl} alt="Edit" className="object-contain w-full h-full rounded-lg" />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={draw}
                    onMouseLeave={handleMouseLeave}
                />
            </div>
            <div className="flex flex-col gap-3">
                <div className='flex items-center gap-3'>
                    <label htmlFor="brushSize" className="text-sm font-medium text-slate-700">브러시 크기:</label>
                    <input
                        id="brushSize"
                        type="range"
                        min="10"
                        max="100"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="neu-range"
                        disabled={isDisabled}
                    />
                     <span className="text-sm text-slate-600 w-8 text-center">{brushSize}</span>
                </div>
                 <div>
                    <label htmlFor="editPrompt" className="text-sm font-medium text-slate-700 block mb-1">삭제된 영역을 어떻게 채울까요?</label>
                    <textarea
                        id="editPrompt"
                        rows={2}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="예: 푸른 하늘로 채워줘 (비워두면 AI가 자동으로 채웁니다)"
                        className="neu-textarea w-full text-sm"
                        disabled={isDisabled}
                    />
                </div>
                 <button 
                    onClick={resetCanvas}
                    disabled={isDisabled}
                    className="neu-button"
                >
                    <span>🔄</span>
                    <span>마스크 초기화</span>
                </button>
            </div>
            <div className="flex gap-2 mt-2">
                <button
                    onClick={onCancel}
                    disabled={isDisabled}
                    className="neu-button w-full"
                >
                    취소
                </button>
                <button
                    onClick={handleApply}
                    disabled={isDisabled}
                    className="neu-button neu-button-primary w-full"
                >
                    삭제 실행
                </button>
            </div>
        </div>
    );
};