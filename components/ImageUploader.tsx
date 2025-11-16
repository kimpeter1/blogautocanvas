import React, { useState, useRef, useEffect } from 'react';
import { ImageData } from '../types';
import { ClearIcon, PlusCircleIcon } from './Icons';

interface ImageUploaderProps {
    title: React.ReactNode;
    onImageChange: (imageData: ImageData | null) => void;
    isDisabled: boolean;
    value?: ImageData | null;
    onImageClick?: (src: string) => void;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageChange, isDisabled, value = null, onImageClick }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (value) {
            const dataUrl = `data:${value.mimeType};base64,${value.data}`;
            if (dataUrl !== imagePreview) {
                setImagePreview(dataUrl);
            }
        } else {
            if (imagePreview !== null) {
                setImagePreview(null);
            }
        }
    }, [value, imagePreview]);


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const dataUrl = await fileToDataUrl(file);
            const base64Data = dataUrl.split(',')[1];
            setImagePreview(dataUrl);
            onImageChange({ id: crypto.randomUUID(), mimeType: file.type, data: base64Data });
        }
    };

    const handleClearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImagePreview(null);
        onImageChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleContainerClick = () => {
        if (isDisabled) return;

        if (imagePreview && onImageClick) {
            onImageClick(imagePreview);
        } else if (!imagePreview) {
            // Only trigger file input if no image is present
            fileInputRef.current?.click();
        }
    };

    const getDynamicClasses = () => {
        if (isDisabled) {
            return 'cursor-not-allowed opacity-60';
        }
        if (imagePreview) {
            return 'cursor-zoom-in';
        }
        return 'cursor-pointer';
    };

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <div
                onClick={handleContainerClick}
                className={`neu-card-inset relative aspect-square w-full p-1 flex items-center justify-center transition-all duration-300 ease-in-out group ${getDynamicClasses()}`}
            >
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isDisabled}
                />
                {imagePreview ? (
                    <>
                        <img src={imagePreview} alt="Preview" className="object-contain w-full h-full rounded-lg" />
                        <button
                            onClick={handleClearImage}
                            disabled={isDisabled}
                            className="neu-button neu-button-icon-sm absolute top-2 right-2"
                            aria-label="Clear image"
                        >
                            <ClearIcon className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="text-center text-slate-500 transition-colors">
                        <PlusCircleIcon className="w-12 h-12 text-slate-400 transition-colors mx-auto" />
                        <p className="mt-2 text-sm font-medium">클릭하여 업로드</p>
                    </div>
                )}
            </div>
        </div>
    );
};
