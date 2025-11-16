
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageData } from '../types';

interface SpeechBubbleEditorProps {
    isOpen: boolean;
    onClose: () => void;
    image: ImageData | null;
    onApply: (imageData: ImageData, text: string) => void;
}

type Position = [number, number]; // [rowIndex, colIndex] from 0 to 2

const defaultSettings = {
    text: '',
    fontSize: 48,
    textColor: '#000000',
    textAlign: 'center' as CanvasTextAlign,
    
    bubbleColor: '#FFFFFF',
    bubbleOpacity: 0.9,
    bubblePadding: 25,
    bubblePosition: [2, 1] as Position, // Bottom-center
    
    tailWidth: 40,
    tailHeight: 30,
    tailPositionRatio: 0.5, // 0 to 1, percentage along the edge
};

const ControlWrapper: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="neu-card p-3">
        <h4 className="font-semibold text-slate-800 mb-3">{title}</h4>
        <div className="flex flex-col gap-3">{children}</div>
    </div>
);

const LabeledControl: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div className="flex items-center justify-between gap-4">
        <label className="text-sm text-slate-700 whitespace-nowrap">{label}</label>
        {children}
    </div>
);

export const SpeechBubbleEditor: React.FC<SpeechBubbleEditorProps> = ({ isOpen, onClose, image, onApply }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [settings, setSettings] = useState(defaultSettings);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imageRef.current;

        if (!ctx || !canvas || !img || !img.complete || img.naturalWidth === 0) return;
        
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        if (!settings.text.trim()) return;

        // --- 1. Text Metrics ---
        ctx.font = `bold ${settings.fontSize}px 'Noto Sans KR', sans-serif`;
        ctx.textAlign = settings.textAlign;
        const lines = settings.text.split('\n');
        const lineHeight = settings.fontSize * 1.2;
        const textMetrics = lines.map(line => ctx.measureText(line));
        const textWidth = Math.max(...textMetrics.map(m => m.width));
        const textHeight = (lines.length * lineHeight) - (lineHeight - settings.fontSize);

        // --- 2. Bubble Sizing ---
        const { tailHeight: th } = settings;
        const bubbleWidth = textWidth + settings.bubblePadding * 2;
        const bubbleHeight = textHeight + settings.bubblePadding * 2;
        const [row, col] = settings.bubblePosition;
        const margin = 20; // Margin from canvas edges

        // --- 3. Tail Direction ---
        let tailDirection = 'none';
        if (row === 0) tailDirection = 'down';
        if (row === 2) tailDirection = 'up';
        if (row === 1 && col === 0) tailDirection = 'right';
        if (row === 1 && col === 2) tailDirection = 'left';
        
        // --- 4. Calculate Bubble Box (bubble excluding tail) Position ---
        const totalHeight = bubbleHeight + (tailDirection === 'up' || tailDirection === 'down' ? th : 0);
        const totalWidth = bubbleWidth + (tailDirection === 'left' || tailDirection === 'right' ? th : 0);
        
        let boxX = col === 0 ? margin : col === 1 ? (canvas.width - totalWidth) / 2 : canvas.width - totalWidth - margin;
        let boxY = row === 0 ? margin : row === 1 ? (canvas.height - totalHeight) / 2 : canvas.height - totalHeight - margin;
        
        // Adjust box position to account for tail space (the box is just the bubble part)
        if (tailDirection === 'left') boxX += th;
        if (tailDirection === 'up') boxY += th;

        // --- 5. Draw Path ---
        ctx.beginPath();
        const r = 25; // border radius
        const { tailWidth: tw, tailPositionRatio: tp } = settings;
        
        // Start top-left
        ctx.moveTo(boxX + r, boxY);
        
        // Top Edge + (maybe) Tail Up
        const tailBaseX = boxX + Math.max(r, Math.min(bubbleWidth - r, bubbleWidth * tp));
        if (tailDirection === 'up') {
            ctx.lineTo(tailBaseX - tw / 2, boxY);
            ctx.lineTo(tailBaseX, boxY - th);
            ctx.lineTo(tailBaseX + tw / 2, boxY);
        }
        ctx.lineTo(boxX + bubbleWidth - r, boxY);
        
        // Top-right corner
        ctx.arcTo(boxX + bubbleWidth, boxY, boxX + bubbleWidth, boxY + r, r);
        
        // Right Edge + (maybe) Tail Right
        const tailBaseY = boxY + Math.max(r, Math.min(bubbleHeight - r, bubbleHeight * tp));
        if (tailDirection === 'right') {
            ctx.lineTo(boxX + bubbleWidth, tailBaseY - tw / 2);
            ctx.lineTo(boxX + bubbleWidth + th, tailBaseY);
            ctx.lineTo(boxX + bubbleWidth, tailBaseY + tw / 2);
        }
        ctx.lineTo(boxX + bubbleWidth, boxY + bubbleHeight - r);
        
        // Bottom-right corner
        ctx.arcTo(boxX + bubbleWidth, boxY + bubbleHeight, boxX + bubbleWidth - r, boxY + bubbleHeight, r);
        
        // Bottom Edge + (maybe) Tail Down
        if (tailDirection === 'down') {
            ctx.lineTo(tailBaseX + tw / 2, boxY + bubbleHeight);
            ctx.lineTo(tailBaseX, boxY + bubbleHeight + th);
            ctx.lineTo(tailBaseX - tw / 2, boxY + bubbleHeight);
        }
        ctx.lineTo(boxX + r, boxY + bubbleHeight);

        // Bottom-left corner
        ctx.arcTo(boxX, boxY + bubbleHeight, boxX, boxY + bubbleHeight - r, r);
        
        // Left Edge + (maybe) Tail Left
        if (tailDirection === 'left') {
            ctx.lineTo(boxX, tailBaseY + tw / 2);
            ctx.lineTo(boxX - th, tailBaseY);
            ctx.lineTo(boxX, tailBaseY - tw / 2);
        }
        ctx.lineTo(boxX, boxY + r);
        
        // Top-left corner
        ctx.arcTo(boxX, boxY, boxX + r, boxY, r);
        ctx.closePath();

        // --- 6. Fill & Draw Text ---
        ctx.globalAlpha = settings.bubbleOpacity;
        ctx.fillStyle = settings.bubbleColor;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = settings.textColor;
        ctx.textBaseline = 'top';
        lines.forEach((line, index) => {
            const textX = boxX + bubbleWidth / 2;
            const textY = boxY + settings.bubblePadding + (index * lineHeight);
            ctx.fillText(line, textX, textY);
        });

    }, [settings]);
    
    useEffect(() => {
        if (isOpen && image) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = `data:${image.mimeType};base64,${image.data}`;
            img.onload = () => {
                imageRef.current = img;
                draw();
            };
        }
    }, [isOpen, image, draw]);

    useEffect(() => {
        if (imageRef.current) draw();
    }, [settings, draw]);

    const handleApplyClick = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        onApply({ id: crypto.randomUUID(), mimeType: 'image/png', data: base64Data }, settings.text);
        onClose();
    };
    
    const handleReset = () => setSettings(defaultSettings);
    const handleSettingChange = (key: keyof typeof settings, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="neu-card w-full max-w-5xl h-[90vh] flex gap-4 p-4" onClick={(e) => e.stopPropagation()}>
                <div className="neu-card-inset flex-grow flex items-center justify-center p-1 overflow-hidden">
                    <canvas ref={canvasRef} className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
                <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2">
                    <ControlWrapper title="텍스트">
                        <textarea
                            placeholder="말풍선 텍스트..."
                            rows={3}
                            className="neu-textarea text-sm"
                            value={settings.text}
                            onChange={(e) => handleSettingChange('text', e.target.value)}
                        />
                         <LabeledControl label="크기">
                             <input type="range" min="12" max="128" value={settings.fontSize} onChange={(e) => handleSettingChange('fontSize', Number(e.target.value))} className="neu-range" />
                             <span className="text-sm w-8 text-center">{settings.fontSize}</span>
                         </LabeledControl>
                         <LabeledControl label="색상">
                             <input type="color" value={settings.textColor} onChange={(e) => handleSettingChange('textColor', e.target.value)} className="w-full h-8 bg-transparent" />
                         </LabeledControl>
                    </ControlWrapper>
                    
                    <ControlWrapper title="말풍선">
                         <LabeledControl label="배경색">
                             <input type="color" value={settings.bubbleColor} onChange={(e) => handleSettingChange('bubbleColor', e.target.value)} className="w-full h-8 bg-transparent" />
                         </LabeledControl>
                         <LabeledControl label="투명도">
                             <input type="range" min="0" max="1" step="0.1" value={settings.bubbleOpacity} onChange={(e) => handleSettingChange('bubbleOpacity', Number(e.target.value))} className="neu-range" />
                             <span className="text-sm w-8 text-center">{settings.bubbleOpacity}</span>
                         </LabeledControl>
                         <LabeledControl label="여백">
                             <input type="range" min="0" max="50" value={settings.bubblePadding} onChange={(e) => handleSettingChange('bubblePadding', Number(e.target.value))} className="neu-range" />
                             <span className="text-sm w-8 text-center">{settings.bubblePadding}</span>
                         </LabeledControl>
                    </ControlWrapper>

                     <ControlWrapper title="위치 및 꼬리">
                        <LabeledControl label="위치">
                            <div className="grid grid-cols-3 gap-1 w-24 h-24 p-1 rounded-md neu-card-inset">
                                {[...Array(3)].map((_, row) =>
                                    [...Array(3)].map((_, col) => (
                                        <button
                                            key={`${row}-${col}`}
                                            onClick={() => handleSettingChange('bubblePosition', [row, col])}
                                            className={`neu-button !rounded-md transition-colors ${(settings.bubblePosition[0] === row && settings.bubblePosition[1] === col) ? 'neu-button-active neu-button-primary' : ''}`}
                                            aria-label={`Position ${row}, ${col}`}
                                        />
                                    ))
                                )}
                            </div>
                        </LabeledControl>
                         <LabeledControl label="꼬리 위치">
                             <input type="range" min="0.1" max="0.9" step="0.05" value={settings.tailPositionRatio} onChange={(e) => handleSettingChange('tailPositionRatio', Number(e.target.value))} className="neu-range" />
                         </LabeledControl>
                         <LabeledControl label="꼬리 너비">
                             <input type="range" min="10" max="100" value={settings.tailWidth} onChange={(e) => handleSettingChange('tailWidth', Number(e.target.value))} className="neu-range" />
                         </LabeledControl>
                         <LabeledControl label="꼬리 길이">
                             <input type="range" min="10" max="100" value={settings.tailHeight} onChange={(e) => handleSettingChange('tailHeight', Number(e.target.value))} className="neu-range" />
                         </LabeledControl>
                    </ControlWrapper>

                    <div className="mt-auto flex flex-col gap-2 pt-4">
                        <button onClick={handleReset} className="neu-button w-full">초기화</button>
                        <div className="flex gap-2">
                             <button onClick={onClose} className="neu-button w-full">취소</button>
                             <button onClick={handleApplyClick} className="neu-button neu-button-primary w-full">적용하기</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};