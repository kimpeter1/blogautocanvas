
import { ImageData, OverlaySettings } from '../types';

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

export const applyLogoAndTextOverlay = async (
    baseImage: ImageData,
    settings: OverlaySettings
): Promise<ImageData> => {
    try {
        const baseImg = await loadImage(`data:${baseImage.mimeType};base64,${baseImage.data}`);
        let logoImg: HTMLImageElement | null = null;
        if (settings.logo) {
            logoImg = await loadImage(`data:${settings.logo.mimeType};base64,${settings.logo.data}`);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        const { naturalWidth: w, naturalHeight: h } = baseImg;
        canvas.width = w;
        canvas.height = h;

        // 1. Draw the base image
        ctx.drawImage(baseImg, 0, 0);

        // 2. Define bar geometry
        const barHeight = h * settings.barHeightRatio;
        const barY = settings.position === 'top' ? 0 : h - barHeight;

        // 3. Draw the background bar
        ctx.fillStyle = settings.bgColor;
        ctx.fillRect(0, barY, w, barHeight);

        // 4. Prepare text and logo properties
        const padding = barHeight * 0.15;
        const contentHeight = barHeight - padding * 2;
        
        ctx.fillStyle = settings.textColor;
        ctx.font = `bold ${contentHeight * 0.7}px sans-serif`;
        ctx.textBaseline = 'middle';
        const textMetrics = ctx.measureText(settings.name);
        const textWidth = textMetrics.width;

        let logoWidth = 0;
        let logoHeight = contentHeight;
        if (logoImg) {
            logoWidth = (logoImg.naturalWidth / logoImg.naturalHeight) * logoHeight;
        }
        
        const spacing = logoImg && settings.name ? contentHeight * 0.5 : 0;
        const totalContentWidth = logoWidth + spacing + textWidth;

        // 5. Draw logo and text
        let currentX = (w - totalContentWidth) / 2;

        if (logoImg) {
            ctx.drawImage(logoImg, currentX, barY + padding, logoWidth, logoHeight);
            currentX += logoWidth + spacing;
        }

        if (settings.name) {
            ctx.textAlign = 'left';
            ctx.fillText(settings.name, currentX, barY + barHeight / 2);
        }

        // 6. Return new image data
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        
        return {
            ...baseImage, // Keep original ID if needed, or generate new one
            id: crypto.randomUUID(),
            mimeType: 'image/png',
            data: base64,
        };
    } catch (error) {
        console.error("Error applying overlay:", error);
        // Return original image if overlay fails
        return baseImage;
    }
};
