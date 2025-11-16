
import React from 'react';
import { OverlaySettings, ImageData } from '../types';

interface OverlaySettingsEditorProps {
    settings: OverlaySettings;
    onChange: (settings: OverlaySettings) => void;
}

const fileToImageData = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64Data = dataUrl.split(',')[1];
            resolve({ id: crypto.randomUUID(), mimeType: file.type, data: base64Data });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const LabeledControl: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-700 whitespace-nowrap">{label}</label>
        {children}
    </div>
);

const OverlayPreview: React.FC<{ settings: OverlaySettings }> = ({ settings }) => {
  const { position, barHeightRatio, bgColor, textColor, logo, name } = settings;

  const barStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: `${barHeightRatio * 100}%`,
    backgroundColor: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8%',
    padding: '0 10%',
    transition: 'all 0.2s ease-in-out',
  };

  if (position === 'top') {
    barStyle.top = 0;
  } else {
    barStyle.bottom = 0;
  }

  return (
    <div className="col-span-2 mb-2">
      <div className="w-full aspect-video rounded-md relative overflow-hidden neu-card-inset p-1">
        <div className="w-full h-full bg-[var(--neu-bg)] rounded-md absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        </div>
        <div style={barStyle}>
          {logo && <div style={{ height: '60%', aspectRatio: '1/1', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '50%' }} />}
          {name && <div style={{ height: '25%', width: '40%', backgroundColor: textColor, borderRadius: '2px' }} />}
        </div>
      </div>
    </div>
  );
};

export const OverlaySettingsEditor: React.FC<OverlaySettingsEditorProps> = ({ settings, onChange }) => {
    const handleToggle = () => {
        onChange({ ...settings, enabled: !settings.enabled });
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageData = await fileToImageData(file);
            onChange({ ...settings, logo: imageData });
        }
    };

    const handleClearLogo = () => {
        onChange({ ...settings, logo: null });
    };

    return (
        <div className="mt-4 pt-4 border-t border-teal-200/50">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-800">로고/이름 오버레이</h4>
                <label className="neu-switch">
                    <input type="checkbox" className="neu-switch-input" checked={settings.enabled} onChange={handleToggle} />
                    <span className="neu-switch-slider"></span>
                </label>
            </div>

            {settings.enabled && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <OverlayPreview settings={settings} />

                    {/* Logo */}
                    <div className="col-span-1">
                         <label className="text-xs font-medium text-slate-700 block mb-1">로고 이미지</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="logo-upload"
                                className="hidden"
                                accept="image/png, image/jpeg"
                                onChange={handleLogoChange}
                            />
                            <label htmlFor="logo-upload" className="neu-button neu-button-sm flex-grow text-center truncate cursor-pointer">
                                {settings.logo ? "파일 변경" : "파일 선택"}
                            </label>
                            {settings.logo && (
                                <button onClick={handleClearLogo} className="neu-button neu-button-icon-sm w-6 h-6 flex-shrink-0 text-red-700">X</button>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="col-span-1">
                        <label htmlFor="clinic-name" className="text-xs font-medium text-slate-700 block mb-1">한의원 이름</label>
                        <input
                            id="clinic-name"
                            type="text"
                            value={settings.name}
                            onChange={(e) => onChange({ ...settings, name: e.target.value })}
                            className="neu-input !p-1 text-xs"
                        />
                    </div>
                    
                    {/* Position */}
                    <div className="col-span-1">
                        <LabeledControl label="위치">
                            <div className="grid grid-cols-2 gap-1 w-full p-1 rounded-md neu-card-inset">
                                <button onClick={() => onChange({ ...settings, position: 'top'})} className={`neu-button neu-button-sm !p-0.5 ${settings.position === 'top' ? 'neu-button-active neu-button-primary' : ''}`}>상단</button>
                                <button onClick={() => onChange({ ...settings, position: 'bottom'})} className={`neu-button neu-button-sm !p-0.5 ${settings.position === 'bottom' ? 'neu-button-active neu-button-primary' : ''}`}>하단</button>
                            </div>
                        </LabeledControl>
                    </div>

                    {/* Bar Height */}
                    <div className="col-span-1">
                         <LabeledControl label="배경 바 높이">
                            <input
                                type="range"
                                min="0.04" max="0.15" step="0.01"
                                value={settings.barHeightRatio}
                                onChange={(e) => onChange({...settings, barHeightRatio: parseFloat(e.target.value)})}
                                className="neu-range"
                            />
                        </LabeledControl>
                    </div>

                    {/* Bg Color */}
                    <div className="col-span-1">
                        <LabeledControl label="배경색">
                            <input type="color" value={settings.bgColor} onChange={(e) => onChange({ ...settings, bgColor: e.target.value })} className="w-full h-6 p-0 border-none bg-transparent" />
                        </LabeledControl>
                    </div>

                    {/* Text Color */}
                    <div className="col-span-1">
                        <LabeledControl label="글자색">
                            <input type="color" value={settings.textColor} onChange={(e) => onChange({ ...settings, textColor: e.target.value })} className="w-full h-6 p-0 border-none bg-transparent" />
                        </LabeledControl>
                    </div>
                </div>
            )}
        </div>
    );
};