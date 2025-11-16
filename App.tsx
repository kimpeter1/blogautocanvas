import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GeneratedPart, ImageData, OverlaySettings } from './types';
import { editImage, suggestCompositionPrompt, suggestOriginalImagePrompt, generateImage, ImageCategory, translateToEnglish, visualizeAcupoint, suggestAcupointPrompt, visualizeBones, suggestBonePrompt, visualizeOrgans, suggestOrganPrompt, generateTextAndImages, suggestBlogImagePrompts, generateImagesFromPrompts, BlogImageStyle, getTopicKeyword, beautifyImage, removeBackground, inpaintImage } from './services/geminiService';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { ImageEditor } from './components/ImageEditor';
import { YouTubeIcon, QuestionMarkCircleIcon, PhotoIcon, SpeechBubbleIcon, AcupointIcon, BoneIcon, OrganIcon, SparklesIcon, MosaicIcon, ColorfulDocumentIcon, ColorfulPhotoIcon, ColorfulPaletteIcon, ColorfulWandIcon, ColorfulLayersIcon, ColorfulTrophyIcon, ColorfulResultsIcon, HairIcon } from './components/Icons';
import { ManualModal } from './components/ManualModal';
import { FrameTextEditor, drawFrameAndTextOnCanvas, FrameTextSettings } from './components/FrameTextEditor';
import { SpeechBubbleEditor } from './components/SpeechBubbleEditor';
import { AcupointEditor } from './components/AcupointEditor';
import { BoneEditor } from './components/BoneEditor';
import { OrganEditor } from './components/OrganEditor';
import { OverlaySettingsEditor } from './components/OverlaySettingsEditor';
import { applyLogoAndTextOverlay } from './utils/canvasUtils';
import { MosaicEditor } from './components/MosaicEditor';
import { BeautyEditor } from './components/BeautyEditor';
import { HairEditor } from './components/HairEditor';


const applyMaskToImage = (original: ImageData, mask: ImageData): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const originalImg = new Image();
        const maskImg = new Image();
        
        let loadedCount = 0;
        const onBothLoaded = () => {
            if (++loadedCount < 2) return;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            const width = originalImg.naturalWidth;
            const height = originalImg.naturalHeight;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(originalImg, 0, 0);
            const originalData = ctx.getImageData(0, 0, width, height);
            
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(maskImg, 0, 0, width, height);
            const maskData = ctx.getImageData(0, 0, width, height);

            const resultData = ctx.createImageData(width, height);

            for (let i = 0; i < originalData.data.length; i += 4) {
                // The mask from ImageEditor is WHITE (value 255) where the user wants to erase,
                // and BLACK (value 0) for the parts to keep.
                // For inpainting, the area to be erased must be TRANSPARENT (alpha = 0).
                // Therefore, we must invert the mask value for the alpha channel.
                const maskValue = maskData.data[i]; // R channel of the mask (R=G=B for grayscale)
                const alpha = 255 - maskValue;      // Invert: White (255) becomes 0, Black (0) becomes 255.

                resultData.data[i] = originalData.data[i];
                resultData.data[i + 1] = originalData.data[i + 1];
                resultData.data[i + 2] = originalData.data[i + 2];
                resultData.data[i + 3] = alpha;
            }

            ctx.putImageData(resultData, 0, 0);
            
            const finalDataUrl = canvas.toDataURL('image/png');
            const finalBase64 = finalDataUrl.split(',')[1];
            
            resolve({
                id: crypto.randomUUID(),
                mimeType: 'image/png',
                data: finalBase64,
            });
        };

        originalImg.onload = onBothLoaded;
        maskImg.onload = onBothLoaded;
        originalImg.onerror = () => reject(new Error('Failed to load original image for masking.'));
        maskImg.onerror = () => reject(new Error('Failed to load mask image for masking.'));

        originalImg.src = `data:${original.mimeType};base64,${original.data}`;
        maskImg.src = `data:${mask.mimeType};base64,${mask.data}`;
    });
};

const isBackgroundEffectivelyEmpty = (image: ImageData): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const checkWidth = Math.min(img.naturalWidth, 100);
            const checkHeight = Math.min(img.naturalHeight, 100);
            canvas.width = checkWidth;
            canvas.height = checkHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                return resolve(false);
            }

            ctx.drawImage(img, 0, 0, checkWidth, checkHeight);
            
            try {
                const imageData = ctx.getImageData(0, 0, checkWidth, checkHeight).data;
                
                for (let i = 3; i < imageData.length; i += 4) {
                    if (imageData[i] < 255) {
                        return resolve(true);
                    }
                }

                const firstPixelR = imageData[0];
                const firstPixelG = imageData[1];
                const firstPixelB = imageData[2];
                const tolerance = 5;

                for (let i = 4; i < imageData.length; i += 4) {
                    if (
                        Math.abs(imageData[i] - firstPixelR) > tolerance ||
                        Math.abs(imageData[i + 1] - firstPixelG) > tolerance ||
                        Math.abs(imageData[i + 2] - firstPixelB) > tolerance
                    ) {
                        return resolve(false);
                    }
                }
                
                return resolve(true);
            } catch (e) {
                console.error("Background check failed:", e);
                resolve(false);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image for background check.'));
        img.src = `data:${image.mimeType};base64,${image.data}`;
    });
};

const defaultOverlaySettings: OverlaySettings = {
    enabled: false,
    logo: null,
    name: '',
    position: 'bottom',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    barHeightRatio: 0.08,
};


export default function App() {
    // --- Global State ---
    const [isLoading, setIsLoading] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [viewerImageSrc, setViewerImageSrc] = useState('');

    // --- Left Column: Blog Post Image Generation ---
    const [blogText, setBlogText] = useState('');
    const [blogImageCount, setBlogImageCount] = useState<1 | 2>(1);
    const [blogImageAspectRatio, setBlogImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
    const [blogImageStyle, setBlogImageStyle] = useState<BlogImageStyle>('realistic');
    const [blogImageResults, setBlogImageResults] = useState<GeneratedPart[] | null>(null);
    const [blogImageError, setBlogImageError] = useState<string | null>(null);
    const [selectedBlogImageIds, setSelectedBlogImageIds] = useState<Set<string>>(new Set());
    const [isBatchEditing, setIsBatchEditing] = useState(false);
    const [batchEditTarget, setBatchEditTarget] = useState<{ image: ImageData, settings: FrameTextSettings} | null>(null);
    const [blogOverlaySettings, setBlogOverlaySettings] = useState<OverlaySettings>(defaultOverlaySettings);
    const [blogImageTopic, setBlogImageTopic] = useState('image');
    const [blogImagePrompts, setBlogImagePrompts] = useState('');
    const [isSuggestingBlogPrompts, setIsSuggestingBlogPrompts] = useState(false);


    // --- Right Column: Main Image Editing ---
    const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
    const [synthesisImages, setSynthesisImages] = useState<(ImageData | null)[]>([null, null]);
    const [resultParts, setResultParts] = useState<GeneratedPart[] | null>(null);
    const [resultError, setResultError] = useState<string | null>(null);
    const [stagedRemainingParts, setStagedRemainingParts] = useState<GeneratedPart[]>([]);
    const [newImageOverlaySettings, setNewImageOverlaySettings] = useState<OverlaySettings>(defaultOverlaySettings);
    const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
    const [editResultTopic, setEditResultTopic] = useState('image');


    // --- Right Column: Modal States & Handlers ---
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
    const [isFrameTextModalOpen, setIsFrameTextModalOpen] = useState(false);
    const [isSpeechBubbleModalOpen, setIsSpeechBubbleModalOpen] = useState(false);
    const [isAcupointModalOpen, setIsAcupointModalOpen] = useState(false);
    const [isBoneModalOpen, setIsBoneModalOpen] = useState(false);
    const [isOrganModalOpen, setIsOrganModalOpen] = useState(false);
    const [isMosaicModalOpen, setIsMosaicModalOpen] = useState(false);
    const [isBeautyModalOpen, setIsBeautyModalOpen] = useState(false);
    const [isHairEditorOpen, setIsHairEditorOpen] = useState(false);
    
    // --- Right Column: Generation/Composition Prompt State ---
    const [compositionPrompt, setCompositionPrompt] = useState('');
    const [isSuggestingComposition, setIsSuggestingComposition] = useState(false);
    const [compositionAspectRatio, setCompositionAspectRatio] = useState<'original' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('original');

    const [originalImageIdea, setOriginalImageIdea] = useState('');
    const [originalImageCategory, setOriginalImageCategory] = useState<ImageCategory>('default');
    const [originalImagePrompt, setOriginalImagePrompt] = useState('');
    const [isSuggestingOriginal, setIsSuggestingOriginal] = useState(false);
    const [originalImageAspectRatio, setOriginalImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');

    const originalImageRef = useRef<HTMLDivElement>(null);


    // --- Generic Handlers ---
    const handleImageClick = (src: string) => {
        setViewerImageSrc(src);
        setIsImageViewerOpen(true);
    };

    const runAI = useCallback(async (
        aiFunction: () => Promise<GeneratedPart[] | ImageData[]>,
        setResults: (parts: GeneratedPart[] | null) => void,
        setError: (error: string | null) => void,
        overlaySettings?: OverlaySettings
    ) => {
        setIsLoading(true);
        setError(null);
        setResults(null);
        try {
            const result = await aiFunction();
            let images: ImageData[] = [];
            
            if (Array.isArray(result) && result.length > 0 && 'mimeType' in result[0]) {
                images = result as ImageData[];
            } else {
                images = (result as GeneratedPart[]).filter(p => p.inlineData).map(p => p.inlineData!);
            }

            if (overlaySettings?.enabled) {
                const processedImages = await Promise.all(
                    images.map(img => applyLogoAndTextOverlay(img, overlaySettings))
                );
                setResults(processedImages.map(img => ({ inlineData: img })));
            } else {
                setResults(images.map(img => ({ inlineData: img })));
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- Left Column Handlers ---
    const handleSuggestBlogPrompts = useCallback(async () => {
        if (!blogText.trim()) return;
        setIsSuggestingBlogPrompts(true);
        try {
            const suggestion = await suggestBlogImagePrompts(blogText, blogImageCount, blogImageStyle);
            setBlogImagePrompts(suggestion);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Suggestion failed');
        } finally {
            setIsSuggestingBlogPrompts(false);
        }
    }, [blogText, blogImageCount, blogImageStyle]);

    const handleGenerateImageFromBlog = useCallback(() => {
        if (!blogImagePrompts.trim()) return;

        (async () => {
            const topic = await getTopicKeyword(blogText || blogImagePrompts);
            setBlogImageTopic(topic);
        })();
        
        const prompts = blogImagePrompts.split('|||').map(p => p.trim()).filter(p => p);

        runAI(
            () => generateImagesFromPrompts(prompts, blogImageAspectRatio),
            setBlogImageResults,
            setBlogImageError,
            blogOverlaySettings
        );
        setSelectedBlogImageIds(new Set());
    }, [blogImagePrompts, blogText, blogImageAspectRatio, blogOverlaySettings, runAI]);

    const handlePromoteBlogImageToOriginal = (imageData: ImageData) => {
        setOriginalImage(imageData);
        setEditResultTopic(blogImageTopic);
        setTimeout(() => {
            originalImageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            originalImageRef.current?.classList.add('animate-pulse', 'ring-4', 'ring-offset-2', 'ring-green-500');
            setTimeout(() => {
                originalImageRef.current?.classList.remove('animate-pulse', 'ring-4', 'ring-offset-2', 'ring-green-500');
            }, 2000);
        }, 100);
    };

     const handleToggleBlogImageSelection = (id: string) => {
        setSelectedBlogImageIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleApplyBatchFrame = useCallback(async (settings: FrameTextSettings) => {
        const selectedImages = (blogImageResults || [])
            .filter(p => p.inlineData && selectedBlogImageIds.has(p.inlineData.id))
            .map(p => p.inlineData!);
        
        if (selectedImages.length === 0) return;

        setIsLoading(true);
        setBlogImageError(null);

        try {
            const promises = selectedImages.map(image => 
                new Promise<ImageData>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = `data:${image.mimeType};base64,${image.data}`;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return reject(new Error("Could not get context"));
                        
                        drawFrameAndTextOnCanvas(ctx, img, settings);

                        const dataUrl = canvas.toDataURL('image/png');
                        const base64Data = dataUrl.split(',')[1];
                        resolve({ ...image, data: base64Data }); // Keep original ID
                    };
                    img.onerror = () => reject(new Error("Image failed to load for batch edit"));
                })
            );

            const updatedImages = await Promise.all(promises);

            setBlogImageResults(prevResults => {
                const newResults = [...(prevResults || [])];
                updatedImages.forEach(updatedImage => {
                    const index = newResults.findIndex(p => p.inlineData?.id === updatedImage.id);
                    if (index !== -1) {
                        newResults[index] = { inlineData: updatedImage };
                    }
                });
                return newResults;
            });
            setSelectedBlogImageIds(new Set());

        } catch (e) {
            setBlogImageError(e instanceof Error ? e.message : "Batch edit failed");
        } finally {
            setIsLoading(false);
            setBatchEditTarget(null);
            setIsBatchEditing(false);
        }
    }, [blogImageResults, selectedBlogImageIds]);

     const handleInitiateBatchFrameEdit = () => {
        const firstSelectedId = Array.from(selectedBlogImageIds)[0];
        const firstSelectedImage = (blogImageResults || []).find(p => p.inlineData?.id === firstSelectedId)?.inlineData;
        if (firstSelectedImage) {
            setBatchEditTarget({ image: firstSelectedImage, settings: {} as any });
            setIsFrameTextModalOpen(true);
            setIsBatchEditing(true);
        }
    };


    // --- Right Column Handlers ---
    const handleOriginalImageChange = (imageData: ImageData | null) => {
        setOriginalImage(imageData);
        setEditResultTopic('image'); // Reset topic on manual upload
    };

    const handleSynthesisImageChange = (index: number, imageData: ImageData | null) => {
        setSynthesisImages(prev => {
            const newImages = [...prev];
            newImages[index] = imageData;
            return newImages;
        });
    };
    
     const handlePromoteToOriginal = (imageData: ImageData) => {
        const remaining = (resultParts || []).filter(p => p.inlineData?.id !== imageData.id);
        const newResultParts = [...remaining];
        
        if (remaining.length > 0) {
            const textPart: GeneratedPart = {
                text: `선택한 이미지를 제외하고 ${remaining.length}개의 결과가 남았습니다.`
            };
            newResultParts.unshift(textPart);
        }
    
        setResultParts(newResultParts.length > 0 ? newResultParts : null);
        setStagedRemainingParts(remaining);
        setOriginalImage(imageData);
        setSelectedImageIds(new Set());
    };
    
    const handleSuggestComposition = useCallback(async () => {
        if (!originalImage) return;
        setIsSuggestingComposition(true);
        const activeSynthesisImages = synthesisImages.filter(img => img !== null) as ImageData[];
        try {
            const isEmpty = await isBackgroundEffectivelyEmpty(originalImage);
            const suggestion = await suggestCompositionPrompt(originalImage, activeSynthesisImages, isEmpty, compositionAspectRatio);
            setCompositionPrompt(suggestion);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Suggestion failed');
        } finally {
            setIsSuggestingComposition(false);
        }
    }, [originalImage, synthesisImages, compositionAspectRatio]);

    const handleExecuteComposition = useCallback(() => {
        if (!originalImage || !compositionPrompt) return;
        
        (async () => {
            const topic = await getTopicKeyword(compositionPrompt);
            setEditResultTopic(topic);
        })();

        const activeSynthesisImages = synthesisImages.filter(img => img !== null) as ImageData[];
        runAI(
            async () => {
                const englishPrompt = await translateToEnglish(compositionPrompt);
                return editImage(originalImage, englishPrompt, activeSynthesisImages);
            },
            (parts) => {
                setResultParts(prev => [...stagedRemainingParts, ...(parts || [])]);
                setStagedRemainingParts([]);
            },
            setResultError
        );
    }, [originalImage, compositionPrompt, synthesisImages, runAI, stagedRemainingParts]);
    
    const handleSuggestOriginalImage = useCallback(async () => {
        if (!originalImageIdea) return;
        setIsSuggestingOriginal(true);
        try {
            const suggestion = await suggestOriginalImagePrompt(originalImageIdea, originalImageCategory);
            setOriginalImagePrompt(suggestion);
        } catch(e) {
            alert(e instanceof Error ? e.message : 'Suggestion failed');
        } finally {
            setIsSuggestingOriginal(false);
        }
    }, [originalImageIdea, originalImageCategory]);

    const handleGenerateOriginalImage = useCallback(() => {
        if (!originalImagePrompt) return;

        (async () => {
            const topic = await getTopicKeyword(originalImageIdea || originalImagePrompt);
            setEditResultTopic(topic);
        })();

        runAI(
            () => generateImage(originalImagePrompt, originalImageAspectRatio, 1),
            (parts) => {
                 setResultParts(prev => [...stagedRemainingParts, ...(parts || [])]);
                 setStagedRemainingParts([]);
                 const newImage = parts?.find(p => p.inlineData)?.inlineData;
                 if (newImage) {
                    setOriginalImage(newImage);
                 }
            },
            setResultError,
            newImageOverlaySettings
        );
    }, [originalImagePrompt, originalImageIdea, originalImageAspectRatio, newImageOverlaySettings, runAI, stagedRemainingParts]);

    const handleQuickAction = useCallback(async (action: string, options?: any) => {
        if (!originalImage) return;

        let aiFunc: (() => Promise<GeneratedPart[] | ImageData[]>) | null = null;
        let topicText: string | null = null;

        switch (action) {
            case 'remove-bg':
                aiFunc = () => removeBackground(originalImage);
                break;
            case 'edit-part':
                topicText = options.prompt;
                aiFunc = async () => {
                    const maskedImage = await applyMaskToImage(originalImage, options.mask);
                    return inpaintImage(maskedImage, options.prompt);
                };
                setIsImageEditorOpen(false); // Close editor on apply
                break;
            case 'add-mosaic':
                setIsMosaicModalOpen(false);
                aiFunc = () => new Promise(async (resolve, reject) => {
                    try {
                        const originalImg = new Image();
                        originalImg.crossOrigin = "anonymous";
            
                        const maskImg = new Image();
                        maskImg.crossOrigin = "anonymous";
                        
                        let loaded = 0;
                        const onLoaded = () => {
                            loaded++;
                            if (loaded < 2) return;
            
                            const w = originalImg.naturalWidth;
                            const h = originalImg.naturalHeight;
            
                            const canvas = document.createElement('canvas');
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d', { willReadFrequently: true });
                            if (!ctx) return reject('No context');
            
                            ctx.drawImage(originalImg, 0, 0);
                            const originalData = ctx.getImageData(0, 0, w, h);
            
                            const tempMaskCanvas = document.createElement('canvas');
                            tempMaskCanvas.width = w;
                            tempMaskCanvas.height = h;
                            const tempMaskCtx = tempMaskCanvas.getContext('2d', { willReadFrequently: true });
                            if (!tempMaskCtx) return reject('No mask context');
            
                            tempMaskCtx.drawImage(maskImg, 0, 0);
                            const maskData = tempMaskCtx.getImageData(0, 0, w, h).data;
                            
                            const blockSize = Math.max(10, Math.floor(w / 50));
            
                            for (let y = 0; y < h; y += blockSize) {
                                for (let x = 0; x < w; x += blockSize) {
                                    const checkX = Math.min(x + blockSize / 2, w - 1);
                                    const checkY = Math.min(y + blockSize / 2, h - 1);
                                    const maskIndex = (Math.floor(checkY) * w + Math.floor(checkX)) * 4;
            
                                    if (maskData[maskIndex] > 128) {
                                        let r = 0, g = 0, b = 0, count = 0;
                                        for (let by = y; by < y + blockSize && by < h; by++) {
                                            for (let bx = x; bx < x + blockSize && bx < w; bx++) {
                                                const pixelIndex = (by * w + bx) * 4;
                                                r += originalData.data[pixelIndex];
                                                g += originalData.data[pixelIndex + 1];
                                                b += originalData.data[pixelIndex + 2];
                                                count++;
                                            }
                                        }
                                        if (count > 0) {
                                            const avgR = r / count;
                                            const avgG = g / count;
                                            const avgB = b / count;
                                            
                                            ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
                                            ctx.fillRect(x, y, Math.min(blockSize, w-x), Math.min(blockSize, h-y));
                                        }
                                    }
                                }
                            }
                            
                            const dataUrl = canvas.toDataURL("image/png");
                            const base64 = dataUrl.split(',')[1];
                            resolve([{ inlineData: { id: crypto.randomUUID(), mimeType: 'image/png', data: base64 } }]);
                        };
                        
                        originalImg.onload = onLoaded;
                        maskImg.onload = onLoaded;
                        originalImg.onerror = reject;
                        maskImg.onerror = reject;
            
                        originalImg.src = `data:${originalImage.mimeType};base64,${originalImage.data}`;
                        maskImg.src = `data:${options.mask.mimeType};base64,${options.mask.data}`;
            
                    } catch(e) {
                        reject(e);
                    }
                });
                break;
            case 'add-frame-text':
                 aiFunc = () => new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = `data:${originalImage.mimeType};base64,${originalImage.data}`;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        drawFrameAndTextOnCanvas(ctx, img, options.settings);
                        const dataUrl = canvas.toDataURL("image/png");
                        const base64 = dataUrl.split(',')[1];
                        resolve([{ inlineData: { id: crypto.randomUUID(), mimeType: 'image/png', data: base64 } }]);
                    };
                });
                break;
            case 'add-speech-bubble':
                topicText = options.text;
                aiFunc = () => new Promise((resolve) => {
                     const resultImage: GeneratedPart[] = [{ inlineData: options.imageData }];
                     resolve(resultImage);
                });
                break;
            case 'visualize-acupoint':
                topicText = options.prompt;
                aiFunc = () => visualizeAcupoint(originalImage, options.prompt);
                break;
             case 'visualize-bones':
                topicText = options.prompt;
                aiFunc = () => visualizeBones(originalImage, options.prompt);
                break;
            case 'visualize-organs':
                topicText = options.prompt;
                aiFunc = () => visualizeOrgans(originalImage, options.prompt);
                break;
            case 'beautify':
                topicText = options.prompt;
                aiFunc = () => beautifyImage(originalImage, options.prompt);
                setIsBeautyModalOpen(false);
                setIsHairEditorOpen(false);
                break;
        }

        if (topicText) {
            const topic = await getTopicKeyword(topicText);
            setEditResultTopic(topic);
        }

        if (aiFunc) {
            runAI(aiFunc, (parts) => {
                 setResultParts(prev => {
                    const newParts = parts || [];
                    const combined = [...stagedRemainingParts, ...newParts];
                    // If staging was used, filter out the placeholder text
                    return combined.filter(p => !(p.text && p.text.includes("결과가 남았습니다")));
                 });
                 setStagedRemainingParts([]);
            }, setResultError);
        }
    }, [originalImage, runAI, stagedRemainingParts]);
    
    const handleToggleImageSelection = (id: string) => {
        setSelectedImageIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const cardClasses = "neu-card p-6 flex flex-col";

    return (
        <>
            <div className="min-h-screen flex flex-col p-4 md:p-6">
                <header className="relative flex justify-center items-center mb-6 py-2">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-teal-500 to-cyan-600 text-transparent bg-clip-text">
                            BLOG AUTO CANVAS
                        </h1>
                        <p className="text-base text-slate-700 mt-2">한의사를 위한 김강식아카데미 이미지 생성기</p>
                    </div>
                    <button
                        onClick={() => setIsManualOpen(true)}
                        className="neu-button neu-button-primary rounded-full absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-2 px-4 py-2 text-sm"
                    >
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                        <span>사용법 보기</span>
                    </button>
                </header>
                
                <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="flex flex-col gap-6">
                        {/* Blog Post Image Generation */}
                        <div className={cardClasses}>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <ColorfulDocumentIcon className="w-7 h-7" />
                                <span>제목 또는 본문으로 이미지 만들기</span>
                            </h3>
                            <textarea
                                value={blogText}
                                onChange={(e) => setBlogText(e.target.value)}
                                placeholder="이곳에 블로그 제목이나 본문을 붙여넣으면 내용에 맞는 이미지를 생성합니다."
                                className="neu-textarea h-32 text-sm"
                            />
                            <div className="flex flex-wrap items-center gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                     <label className="text-sm font-medium text-slate-700">생성 이미지 수:</label>
                                     {[1, 2].map(num => (
                                        <button key={num} onClick={() => setBlogImageCount(num as 1|2)} className={`neu-button neu-button-icon-sm !rounded-full text-sm font-semibold ${blogImageCount === num ? 'neu-button-active neu-button-primary' : ''}`}>
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                 <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-slate-700">이미지 스타일:</label>
                                    <select value={blogImageStyle} onChange={(e) => setBlogImageStyle(e.target.value as any)} className="neu-select text-sm">
                                        <option value="realistic">사진 (실사)</option>
                                        <option value="watercolor">수채화</option>
                                        <option value="illustration">일러스트</option>
                                        <option value="webtoon">웹툰</option>
                                    </select>
                                </div>
                            </div>
                            <textarea
                                value={blogImagePrompts}
                                onChange={(e) => setBlogImagePrompts(e.target.value)}
                                placeholder="AI가 생성한 이미지 프롬프트가 여기에 표시됩니다. 직접 수정할 수 있습니다."
                                rows={4}
                                className="neu-textarea mt-3 text-sm"
                            />
                            <button
                                onClick={handleSuggestBlogPrompts}
                                disabled={!blogText.trim() || isSuggestingBlogPrompts}
                                className="neu-button neu-button-secondary w-full mt-2"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                {isSuggestingBlogPrompts ? '제안 중...' : '프롬프트 제안'}
                            </button>
                            <div className="flex items-center gap-2 mt-3">
                                <label className="text-sm font-medium text-slate-700">이미지 종횡비:</label>
                                <select value={blogImageAspectRatio} onChange={(e) => setBlogImageAspectRatio(e.target.value as any)} className="neu-select flex-grow text-sm">
                                    <option value="1:1">1:1 (정방형)</option>
                                    <option value="16:9">16:9 (가로)</option>
                                    <option value="9:16">9:16 (세로)</option>
                                    <option value="4:3">4:3 (가로)</option>
                                    <option value="3:4">3:4 (세로)</option>
                                </select>
                            </div>
                            <OverlaySettingsEditor settings={blogOverlaySettings} onChange={setBlogOverlaySettings} />
                            <button
                                onClick={handleGenerateImageFromBlog}
                                disabled={!blogImagePrompts.trim() || isLoading}
                                className="neu-button neu-button-primary mt-4 w-full"
                            >
                                {isLoading ? '생성 중...' : '이미지 생성 실행'}
                            </button>
                        </div>
                        
                        {/* Blog Image Results */}
                        <ResultDisplay
                            title={
                                <span className="flex items-center gap-2">
                                    <ColorfulResultsIcon className="w-7 h-7" />
                                    <span>본문 이미지 결과</span>
                                </span>
                            }
                            isLoading={isLoading && !resultParts}
                            error={blogImageError}
                            parts={blogImageResults}
                            topic={blogImageTopic}
                            onImageClick={handleImageClick}
                            onPromoteToOriginal={handlePromoteBlogImageToOriginal}
                            selectedImageIds={selectedBlogImageIds}
                            onToggleImageSelection={handleToggleBlogImageSelection}
                            onClearSelection={() => setSelectedBlogImageIds(new Set())}
                            onInitiateBatchFrameEdit={handleInitiateBatchFrameEdit}
                        />
                    </div>


                    {/* Right Column */}
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* New Image Generation */}
                             <div className={cardClasses}>
                                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <ColorfulPaletteIcon className="w-7 h-7" />
                                    <span>새 이미지 생성</span>
                                </h3>
                                <input
                                    type="text"
                                    value={originalImageIdea}
                                    onChange={(e) => setOriginalImageIdea(e.target.value)}
                                    placeholder="간단한 아이디어 입력 (예: 허리 통증 남성)"
                                    className="neu-input text-sm"
                                />
                                <div className="flex flex-wrap gap-2 my-3">
                                    {(['default', 'realistic', 'food', 'watercolor', 'vector', 'minimalist', 'webtoon', 'sumi-e'] as ImageCategory[]).map(cat => (
                                        <button key={cat} onClick={() => setOriginalImageCategory(cat)} className={`neu-button neu-button-sm !rounded-full ${originalImageCategory === cat ? 'neu-button-active neu-button-primary' : ''}`}>
                                            {{'default': '일반', 'realistic': '실사', 'food': '음식', 'watercolor': '수채화', 'vector': '벡터', 'minimalist': '미니멀', 'webtoon': '웹툰', 'sumi-e': '수묵화'}[cat]}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={originalImagePrompt}
                                    onChange={(e) => setOriginalImagePrompt(e.target.value)}
                                    placeholder="AI가 생성한 상세 프롬프트가 여기에 표시됩니다."
                                    rows={4}
                                    className="neu-textarea text-sm"
                                />
                                <button
                                    onClick={handleSuggestOriginalImage}
                                    disabled={!originalImageIdea || isSuggestingOriginal}
                                    className="neu-button neu-button-secondary w-full mt-2"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    {isSuggestingOriginal ? '제안 중...' : '프롬프트 제안'}
                                </button>
                                 <div className="flex items-center gap-2 mt-3">
                                    <label className="text-sm font-medium text-slate-700">종횡비:</label>
                                    <select value={originalImageAspectRatio} onChange={(e) => setOriginalImageAspectRatio(e.target.value as any)} className="neu-select flex-grow text-sm">
                                        <option value="1:1">1:1</option> <option value="16:9">16:9</option> <option value="9:16">9:16</option> <option value="4:3">4:3</option> <option value="3:4">3:4</option>
                                    </select>
                                </div>
                                <OverlaySettingsEditor settings={newImageOverlaySettings} onChange={setNewImageOverlaySettings} />
                                <button
                                    onClick={handleGenerateOriginalImage}
                                    disabled={!originalImagePrompt || isLoading}
                                    className="neu-button neu-button-primary mt-2 w-full"
                                >
                                    생성 실행
                                </button>
                            </div>

                            {/* Original Image */}
                            <div ref={originalImageRef} className={cardClasses}>
                                <ImageUploader 
                                    title={
                                        <span className="flex items-center gap-2">
                                            <ColorfulPhotoIcon className="w-7 h-7" />
                                            <span>원본 이미지</span>
                                        </span>
                                    } 
                                    onImageChange={handleOriginalImageChange} 
                                    isDisabled={isLoading} 
                                    value={originalImage} 
                                    onImageClick={handleImageClick} />
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className={cardClasses}>
                            <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <ColorfulWandIcon className="w-7 h-7" />
                                <span>빠른 작업</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                 <button onClick={() => originalImage && handleQuickAction('remove-bg')} disabled={!originalImage || isLoading} className="neu-button text-sm"><span>✂️</span> 배경 제거</button>
                                 <button onClick={() => originalImage && setIsImageEditorOpen(true)} disabled={!originalImage || isLoading} className="neu-button text-sm"><span>✏️</span> 부분 삭제</button>
                                 <button onClick={() => originalImage && setIsMosaicModalOpen(true)} disabled={!originalImage || isLoading} className="neu-button text-sm"><MosaicIcon/> 모자이크</button>
                                 <button onClick={() => originalImage && setIsFrameTextModalOpen(true)} disabled={!originalImage || isLoading} className="neu-button text-sm"><PhotoIcon/> 액자/텍스트</button>
                                 <button onClick={() => originalImage && setIsSpeechBubbleModalOpen(true)} disabled={!originalImage || isLoading} className="neu-button text-sm"><SpeechBubbleIcon/> 말풍선</button>
                                 <button onClick={() => originalImage && setIsBeautyModalOpen(true)} disabled={!originalImage || isLoading} className="neu-button text-sm"><SparklesIcon/> 뽀샵 처리</button>
                                 <button onClick={() => originalImage && setIsHairEditorOpen(true)} disabled={!originalImage || isLoading} className="neu-button text-sm"><HairIcon/> 머리카락 보정</button>
                                 <button onClick={() => originalImage && setIsAcupointModalOpen(true)} disabled={!originalImage || isLoading} className="neu-button text-sm"><AcupointIcon/> 경혈/경락</button>
                                 <button onClick={() => originalImage && setIsBoneModalOpen(true)} disabled={!originalImage || isLoading} className="neu-button text-sm"><BoneIcon/> 뼈 구조</button>
                                 <button onClick={() => originalImage && setIsOrganModalOpen(true)} disabled={!originalImage || isLoading} className="neu-button text-sm"><OrganIcon/> 내부 장기</button>
                            </div>
                        </div>


                        {/* Image Composition */}
                        <div className={cardClasses}>
                             <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <ColorfulLayersIcon className="w-7 h-7" />
                                <span>이미지 합성</span>
                            </h3>
                             <div className="grid grid-cols-2 gap-4">
                                <ImageUploader title="소스 이미지 1" onImageChange={(img) => handleSynthesisImageChange(0, img)} isDisabled={isLoading} value={synthesisImages[0]} onImageClick={handleImageClick} />
                                <ImageUploader title="소스 이미지 2" onImageChange={(img) => handleSynthesisImageChange(1, img)} isDisabled={isLoading} value={synthesisImages[1]} onImageClick={handleImageClick} />
                             </div>
                             <textarea
                                value={compositionPrompt}
                                onChange={(e) => setCompositionPrompt(e.target.value)}
                                placeholder="합성 방법을 적어주세요 (예: 소스1의 인물에게 소스2의 선글라스를 씌우고 배경을 해변으로 바꿔줘)"
                                rows={3}
                                className="neu-textarea mt-4 text-sm"
                            />
                             <div className="flex items-center gap-2 mt-3">
                                <label className="text-sm font-medium text-slate-700">종횡비 변경:</label>
                                <select value={compositionAspectRatio} onChange={(e) => setCompositionAspectRatio(e.target.value as any)} className="neu-select flex-grow text-sm">
                                    <option value="original">원본 유지</option>
                                    <option value="1:1">1:1</option> <option value="16:9">16:9</option> <option value="9:16">9:16</option> <option value="4:3">4:3</option> <option value="3:4">3:4</option>
                                </select>
                             </div>
                            <div className="flex gap-2 mt-3">
                                 <button
                                    onClick={handleSuggestComposition}
                                    disabled={!originalImage || isSuggestingComposition}
                                    className="neu-button neu-button-secondary w-1/2"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    {isSuggestingComposition ? '제안 중...' : '프롬프트 제안'}
                                </button>
                                <button
                                    onClick={handleExecuteComposition}
                                    disabled={!originalImage || !compositionPrompt || isLoading}
                                    className="neu-button neu-button-primary w-1/2"
                                >
                                    합성 실행
                                </button>
                            </div>
                        </div>

                        {/* Result Display */}
                        <ResultDisplay
                            title={
                                <span className="flex items-center gap-2">
                                    <ColorfulTrophyIcon className="w-7 h-7" />
                                    <span>최종 편집 결과</span>
                                </span>
                            }
                            isLoading={isLoading && !!originalImage}
                            error={resultError}
                            parts={resultParts}
                            topic={editResultTopic}
                            onImageClick={handleImageClick}
                            onPromoteToOriginal={handlePromoteToOriginal}
                            selectedImageIds={selectedImageIds}
                            onToggleImageSelection={handleToggleImageSelection}
                            onClearSelection={() => setSelectedImageIds(new Set())}
                            onInitiateBatchFrameEdit={() => {}}
                        />

                    </div>

                </main>
            </div>

            {isImageViewerOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsImageViewerOpen(false)}
                >
                    <img src={viewerImageSrc} alt="Viewer" className="max-w-full max-h-full object-contain" />
                    <button
                        onClick={() => setIsImageViewerOpen(false)}
                        className="absolute top-4 right-4 text-white text-3xl font-bold"
                        aria-label="Close image viewer"
                    >
                        &times;
                    </button>
                </div>
            )}
            
             {isImageEditorOpen && originalImage && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setIsImageEditorOpen(false)}>
                    <div className="neu-card p-6" onClick={(e) => e.stopPropagation()}>
                        <ImageEditor 
                            image={originalImage}
                            onCancel={() => setIsImageEditorOpen(false)}
                            onApply={(mask, prompt) => {
                                handleQuickAction('edit-part', { mask, prompt });
                            }}
                            isDisabled={isLoading}
                        />
                    </div>
                </div>
            )}

            {isMosaicModalOpen && originalImage && (
                <MosaicEditor 
                    image={originalImage}
                    onCancel={() => setIsMosaicModalOpen(false)}
                    onApply={(mask) => handleQuickAction('add-mosaic', { mask })}
                    isDisabled={isLoading}
                />
            )}
            
            <FrameTextEditor 
                 isOpen={isFrameTextModalOpen}
                 onClose={() => {
                    setIsFrameTextModalOpen(false);
                    setIsBatchEditing(false);
                    setBatchEditTarget(null);
                 }}
                 image={isBatchEditing ? batchEditTarget?.image ?? null : originalImage}
                 onApply={(_, settings) => {
                    if (isBatchEditing) {
                        handleApplyBatchFrame(settings);
                    } else {
                        handleQuickAction('add-frame-text', { settings });
                    }
                 }}
            />

            <SpeechBubbleEditor
                isOpen={isSpeechBubbleModalOpen}
                onClose={() => setIsSpeechBubbleModalOpen(false)}
                image={originalImage}
                onApply={(imageData, text) => handleQuickAction('add-speech-bubble', {imageData, text})}
            />

            <AcupointEditor
                isOpen={isAcupointModalOpen}
                onClose={() => setIsAcupointModalOpen(false)}
                image={originalImage}
                onApply={(prompt) => handleQuickAction('visualize-acupoint', {prompt})}
            />

            <BoneEditor
                isOpen={isBoneModalOpen}
                onClose={() => setIsBoneModalOpen(false)}
                image={originalImage}
                onApply={(prompt) => handleQuickAction('visualize-bones', {prompt})}
            />
            
            <OrganEditor
                isOpen={isOrganModalOpen}
                onClose={() => setIsOrganModalOpen(false)}
                image={originalImage}
                onApply={(prompt) => handleQuickAction('visualize-organs', {prompt})}
            />

            <BeautyEditor
                isOpen={isBeautyModalOpen}
                onClose={() => setIsBeautyModalOpen(false)}
                image={originalImage}
                onApply={(prompt) => handleQuickAction('beautify', {prompt})}
            />

            <HairEditor
                isOpen={isHairEditorOpen}
                onClose={() => setIsHairEditorOpen(false)}
                image={originalImage}
                onApply={(prompt) => handleQuickAction('beautify', {prompt})}
            />

            <ManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
        </>
    );
}