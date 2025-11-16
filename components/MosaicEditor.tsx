import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ImageData } from '../types';

interface MosaicEditorProps {
    image: ImageData;
    onApply: (mask: ImageData) => void;
    onCancel: () => void;
    isDisabled?: boolean;
}

export const MosaicEditor: React.FC<MosaicEditorProps> = ({ image, onApply, onCancel, isDisabled }) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

    const [renderedGeom, setRenderedGeom] = useState({ width: 0, height: 0, top: 0, left: 0 });

    const imageUrl = `data:${image.mimeType};base64,${image.data}`;
    
    const calculateGeometry = useCallback(() => {
        const imageEl = imageRef.current;
        const container = imageEl?.parentElement;

        if (imageEl && container && imageEl.naturalWidth > 0) {
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const imgNaturalWidth = imageEl.naturalWidth;
            const imgNaturalHeight = imageEl.naturalHeight;

            const imgAspectRatio = imgNaturalWidth / imgNaturalHeight;
            const containerAspectRatio = containerWidth / containerHeight;

            let width, height, left, top;

            if (imgAspectRatio > containerAspectRatio) {
                width = containerWidth;
                height = containerWidth / imgAspectRatio;
                left = 0;
                top = (containerHeight - height) / 2;
            } else {
                height = containerHeight;
                width = containerHeight * imgAspectRatio;
                top = 0;
                left = (containerWidth - width) / 2;
            }
            
            setRenderedGeom(prev => {
                if(prev.width !== width || prev.height !== height || prev.top !== top || prev.left !== left) {
                    return { width, height, top, left };
                }
                return prev;
            });
        }
    }, []);

    useEffect(() => {
        const imageEl = imageRef.current;
        if (!imageEl) return;
        
        const handleResizeOrLoad = () => {
            calculateGeometry();
        };

        if (imageEl.complete && imageEl.naturalWidth > 0) {
            handleResizeOrLoad();
        } else {
            imageEl.addEventListener('load', handleResizeOrLoad);
        }
        
        window.addEventListener('resize', handleResizeOrLoad);

        return () => {
            imageEl.removeEventListener('load', handleResizeOrLoad);
            window.removeEventListener('resize', handleResizeOrLoad);
        };
    }, [imageUrl, calculateGeometry]);

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }
    
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

            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; // Use a red overlay to show selection
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
        const canvas = canvasRef.current; // The overlay canvas, now perfectly sized
        const imageEl = imageRef.current;
        if (!canvas || !imageEl || !imageEl.naturalWidth) return;

        // The canvas drawing is already aligned with the image. We just need to scale it
        // to the natural resolution of the image for the final mask.
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = imageEl.naturalWidth;
        maskCanvas.height = imageEl.naturalHeight;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (!maskCtx) return;

        // Draw the (potentially smaller) canvas onto the full-size mask canvas.
        maskCtx.drawImage(canvas, 0, 0, maskCanvas.width, maskCanvas.height);
        
        // Convert this red-line drawing into a pure black and white mask.
        const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // If pixel is not transparent (i.e., user drew here)
            if (data[i + 3] > 0) {
                data[i] = 255;     // R -> White
                data[i + 1] = 255; // G -> White
                data[i + 2] = 255; // B -> White
            } else {
                data[i] = 0;       // R -> Black
                data[i + 1] = 0;   // G -> Black
                data[i + 2] = 0;   // B -> Black
            }
            data[i+3] = 255; // Make fully opaque
        }
        maskCtx.putImageData(imageData, 0, 0);

        const maskDataUrl = maskCanvas.toDataURL('image/png');
        const maskBase64 = maskDataUrl.split(',')[1];
        onApply({ id: crypto.randomUUID(), mimeType: 'image/png', data: maskBase64 });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onCancel}>
            <div className="neu-card p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-semibold text-slate-900">모자이크 처리 (마우스로 영역을 선택)</h3>
                <div className="neu-card-inset relative w-full max-w-[600px] aspect-square p-1 overflow-hidden">
                    <img ref={imageRef} src={imageUrl} alt="Edit" className="object-contain w-full h-full rounded-lg" />
                    {renderedGeom.width > 0 && (
                        <canvas
                            ref={canvasRef}
                            className="absolute cursor-crosshair"
                            style={{ 
                                top: `${renderedGeom.top}px`, 
                                left: `${renderedGeom.left}px`, 
                                width: `${renderedGeom.width}px`, 
                                height: `${renderedGeom.height}px` 
                            }}
                            width={renderedGeom.width}
                            height={renderedGeom.height}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseMove={draw}
                            onMouseLeave={handleMouseLeave}
                        />
                    )}
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
                     <button 
                        onClick={resetCanvas}
                        disabled={isDisabled}
                        className="neu-button"
                    >
                        <span>🔄</span>
                        <span>선택 초기화</span>
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
                        모자이크 적용
                    </button>
                </div>
            </div>
        </div>
    );
};
