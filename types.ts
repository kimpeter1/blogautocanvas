
export interface ImageData {
  id: string;
  mimeType: string;
  data: string;
}

export interface GeneratedPart {
  text?: string;
  inlineData?: ImageData;
}

export interface OverlaySettings {
  enabled: boolean;
  logo: ImageData | null;
  name: string;
  position: 'top' | 'bottom';
  bgColor: string;
  textColor: string;
  barHeightRatio: number; // e.g., 0.08 for 8% of image height
}
