
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageData } from '../types';

// FIX: Define and export FrameTextSettings to provide a strong type for frame/text settings.
export type FrameTextSettings = typeof defaultSettings;

interface FrameTextEditorProps {
    isOpen: boolean;
    onClose: () => void;
    image: ImageData | null;
    // FIX: Use the strongly-typed FrameTextSettings for the onApply callback.
    onApply: (imageData: ImageData, settings: FrameTextSettings) => void;
}

// Default settings for reset
const defaultSettings = {
    text: '',
    fontSize: 48,
    textColor: '#FFFFFF',
    textAlign: 'center' as CanvasTextAlign,
    textBaseline: 'middle' as CanvasTextBaseline,
    
    bgEnabled: false,
    bgColor: '#000000',
    bgOpacity: 0.5,
    bgPadding: 20,

    frameEnabled: false,
    frameColor: '#FFFFFF',
    frameSize: 20,
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

const CheckboxControl: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }> = ({ checked, onChange, children }) => {
    return (
        <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm text-slate-700 whitespace-nowrap">{children}</span>
            <div className="neu-checkbox-box">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="neu-checkbox-input" />
                <div className="neu-checkbox-box">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                </div>
            </div>
        </label>
    );
};

export const drawFrameAndTextOnCanvas = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    // FIX: Use the strongly-typed FrameTextSettings for settings.
    settings: FrameTextSettings
) => {
    const canvas = ctx.canvas;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.drawImage(img, 0, 0);

    if (settings.frameEnabled && settings.frameSize > 0) {
        ctx.fillStyle = settings.frameColor;
        const size = settings.frameSize;
        ctx.fillRect(0, 0, canvas.width, size); // Top
        ctx.fillRect(0, canvas.height - size, canvas.width, size); // Bottom
        ctx.fillRect(0, 0, size, canvas.height); // Left
        ctx.fillRect(canvas.width - size, 0, size, canvas.height); // Right
    }

    if (settings.text.trim()) {
        ctx.font = `bold ${settings.fontSize}px 'Noto Sans KR', sans-serif`;
        ctx.textAlign = settings.textAlign;
        
        const lines = settings.text.split('\n');
        const lineHeight = settings.fontSize * 1.2;
        const totalTextHeight = (lines.length - 1) * lineHeight + settings.fontSize;

        const textMetrics = lines.map(line => ctx.measureText(line));
        const maxWidth = Math.max(...textMetrics.map(m => m.width));
        
        const boxWidth = settings.bgEnabled ? maxWidth + settings.bgPadding * 2 : maxWidth;
        const boxHeight = settings.bgEnabled ? totalTextHeight + settings.bgPadding * 2 : totalTextHeight;

        let boxX;
        if (settings.textAlign === 'center') {
            boxX = (canvas.width / 2) - (boxWidth / 2);
        } else if (settings.textAlign === 'left') {
            boxX = settings.frameSize + 20; // Add some margin
        } else { // right
            boxX = canvas.width - boxWidth - settings.frameSize - 20;
        }

        let boxY;
        if (settings.textBaseline === 'top') {
            boxY = settings.frameSize + 20;
        } else if (settings.textBaseline === 'bottom') {
            boxY = canvas.height - boxHeight - settings.frameSize - 20;
        } else { // middle
            boxY = (canvas.height / 2) - (boxHeight / 2);
        }

        if (settings.bgEnabled) {
            ctx.globalAlpha = settings.bgOpacity;
            ctx.fillStyle = settings.bgColor;
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            ctx.globalAlpha = 1.0;
        }

        ctx.textBaseline = 'middle';
        ctx.fillStyle = settings.textColor;

        const textBlockCenterY = boxY + (boxHeight / 2);
        const startY = textBlockCenterY - (totalTextHeight / 2) + (settings.fontSize / 2);
        
        lines.forEach((line, index) => {
            let lineX;
            if (settings.textAlign === 'center') {
                lineX = boxX + (boxWidth / 2);
            } else if (settings.textAlign === 'left') {
                lineX = boxX + (settings.bgEnabled ? settings.bgPadding : 0);
            } else { // right
                lineX = boxX + boxWidth - (settings.bgEnabled ? settings.bgPadding : 0);
            }
            ctx.fillText(line, lineX, startY + (index * lineHeight));
        });
    }
};

export const FrameTextEditor: React.FC<FrameTextEditorProps> = ({ isOpen, onClose, image, onApply }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const [settings, setSettings] = useState(defaultSettings);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imageRef.current;

        if (!ctx || !canvas || !img || !img.complete || img.naturalWidth === 0) {
            return;
        }
        drawFrameAndTextOnCanvas(ctx, img, settings);
        
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
        if (imageRef.current) {
            draw();
        }
    }, [settings, draw]);

    const handleApplyClick = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        onApply({ id: crypto.randomUUID(), mimeType: 'image/png', data: base64Data }, settings);
        onClose();
    };
    
    const handleReset = () => setSettings(defaultSettings);
    const handleSettingChange = (key: keyof FrameTextSettings, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

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
                            placeholder="텍스트를 입력하세요..."
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
                             <input type="color" value={settings.textColor} onChange={(e) => handleSettingChange('textColor', e.target.value)} className="w-full h-8 bg-transparent border-none" />
                         </LabeledControl>
                         <LabeledControl label="가로 정렬">
                             <div className="grid grid-cols-3 gap-1 w-full p-1 rounded-md neu-card-inset">
                                 <button onClick={() => handleSettingChange('textAlign', 'left')} className={`neu-button neu-button-sm !p-1 ${settings.textAlign === 'left' ? 'neu-button-active neu-button-primary' : ''}`}>좌</button>
                                 <button onClick={() => handleSettingChange('textAlign', 'center')} className={`neu-button neu-button-sm !p-1 ${settings.textAlign === 'center' ? 'neu-button-active neu-button-primary' : ''}`}>중</button>
                                 <button onClick={() => handleSettingChange('textAlign', 'right')} className={`neu-button neu-button-sm !p-1 ${settings.textAlign === 'right' ? 'neu-button-active neu-button-primary' : ''}`}>우</button>
                             </div>
                         </LabeledControl>
                         <LabeledControl label="세로 위치">
                              <div className="grid grid-cols-3 gap-1 w-full p-1 rounded-md neu-card-inset">
                                 <button onClick={() => handleSettingChange('textBaseline', 'top')} className={`neu-button neu-button-sm !p-1 ${settings.textBaseline === 'top' ? 'neu-button-active neu-button-primary' : ''}`}>상</button>
                                 <button onClick={() => handleSettingChange('textBaseline', 'middle')} className={`neu-button neu-button-sm !p-1 ${settings.textBaseline === 'middle' ? 'neu-button-active neu-button-primary' : ''}`}>중</button>
                                 <button onClick={() => handleSettingChange('textBaseline', 'bottom')} className={`neu-button neu-button-sm !p-1 ${settings.textBaseline === 'bottom' ? 'neu-button-active neu-button-primary' : ''}`}>하</button>
                             </div>
                         </LabeledControl>
                    </ControlWrapper>
                    
                    <ControlWrapper title="텍스트 배경">
                        <CheckboxControl checked={settings.bgEnabled} onChange={(checked) => handleSettingChange('bgEnabled', checked)}>활성화</CheckboxControl>
                         <LabeledControl label="배경색">
                             <input type="color" value={settings.bgColor} onChange={(e) => handleSettingChange('bgColor', e.target.value)} className="w-full h-8 bg-transparent" disabled={!settings.bgEnabled} />
                         </LabeledControl>
                         <LabeledControl label="투명도">
                             <input type="range" min="0" max="1" step="0.1" value={settings.bgOpacity} onChange={(e) => handleSettingChange('bgOpacity', Number(e.target.value))} className="neu-range" disabled={!settings.bgEnabled} />
                             <span className="text-sm w-8 text-center">{settings.bgOpacity}</span>
                         </LabeledControl>
                         <LabeledControl label="여백">
                             <input type="range" min="0" max="50" value={settings.bgPadding} onChange={(e) => handleSettingChange('bgPadding', Number(e.target.value))} className="neu-range" disabled={!settings.bgEnabled} />
                             <span className="text-sm w-8 text-center">{settings.bgPadding}</span>
                         </LabeledControl>
                    </ControlWrapper>
                    
                     <ControlWrapper title="액자">
                        <CheckboxControl checked={settings.frameEnabled} onChange={(checked) => handleSettingChange('frameEnabled', checked)}>활성화</CheckboxControl>
                         <LabeledControl label="액자색">
                             <input type="color" value={settings.frameColor} onChange={(e) => handleSettingChange('frameColor', e.target.value)} className="w-full h-8 bg-transparent" disabled={!settings.frameEnabled} />
                         </LabeledControl>
                         <LabeledControl label="두께">
                             <input type="range" min="0" max="100" value={settings.frameSize} onChange={(e) => handleSettingChange('frameSize', Number(e.target.value))} className="neu-range" disabled={!settings.frameEnabled} />
                             <span className="text-sm w-8 text-center">{settings.frameSize}</span>
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