import React from 'react';

export const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15H6a3 3 0 00-3 3v.25M15 9h3a3 3 0 013 3v.25" />
    </svg>
);

export const ClearIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.75 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.25 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

export const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const ScissorsIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 11.25l1.5 1.5m-1.5-1.5L6 12m1.5-0.75L6 9.75m1.5 1.5l1.5-1.5m-1.5 1.5l-1.5 1.5m6-3l1.5 1.5m-1.5-1.5L12 12m1.5-0.75L12 9.75m1.5 1.5l1.5-1.5m-1.5 1.5l-1.5 1.5M9 6.75l2.25 2.25 2.25-2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18.75l2.25-2.25L6 14.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.75l-2.25-2.25L18 14.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 01-7.5 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6a3.75 3.75 0 00-7.5 0" />
    </svg>
);

export const LayersIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

export const IdIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

export const IsometricIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9.75L9 2.25" />
    </svg>
);

export const ComicIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388M21 12c0-4.556-4.03-8.25-9-8.25-4.43 0-8.125 2.873-8.845 6.787M3 12a9.76 9.76 0 012.53-.388" />
    </svg>
);

export const SpeechBubbleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.056 3 12c0 2.224.904 4.245 2.385 5.698l-1.33 3.865 3.96-1.32C9.44 20.03 10.69 20.25 12 20.25z" />
    </svg>
);

export const YouTubeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
);

export const QuestionMarkCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
);

export const PhotoIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const ContrastIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
        <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" fill="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 019 9h-9V3z" />
    </svg>
);

export const AcupointIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      <circle cx="14.5" cy="11.5" r="1.5" fill="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 11.5l-3 4.5" />
    </svg>
);

export const BoneIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 4.5C12.75 3.04 11.96 2 11 2s-1.75 1.04-1.75 2.5c0 1.23.6 2.89 1.5 3.93.9-1.04 1.5-2.7 1.5-3.93zM10 8.58c-1.35-1.42-3-3.03-3-4.08 0-1.46.79-2.5 1.75-2.5S10.5 3.04 10.5 4.5c0 .76-.4 2.05-1.22 3.42-.14.24-.28.47-.43.68zM14 8.58c1.35-1.42 3-3.03 3-4.08 0-1.46-.79-2.5-1.75-2.5S13.5 3.04 13.5 4.5c0 .76.4 2.05 1.22 3.42.14.24.28.47.43.68zM12 21.75c-2.31 0-4.25-1.63-4.75-3.75h9.5c-.5 2.12-2.44 3.75-4.75 3.75zM8.5 16.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5v1.75h-7V16.5z" />
        <path d="M0 0h24v24H0z" fill="none"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.34,11.09c-1.12-0.41-2.22-0.4-3.34,0.01c-1.13,0.41-2.13,1.13-3,2.09c-0.58,0.64-1.09,1.36-1.5,2.15 c-0.14,0.27-0.27,0.55-0.39,0.83c-0.25,0.57-0.45,1.17-0.56,1.78c-0.07,0.4-0.1,0.81-0.1,1.22c0,1.5,0.56,2.87,1.5,4 c0.94,1.13,2.25,1.84,3.75,2.02c1.5,0.18,3,0,4.25-0.75c1.25-0.75,2.25-1.94,2.75-3.25c0.5-1.31,0.5-2.75,0-4 c-0.25-0.63-0.58-1.22-0.97-1.75c-0.4-0.53-0.85-1.01-1.36-1.43C17.38,12.16,16.42,11.48,15.34,11.09z" stroke="none" fill="currentColor"/>
    </svg>
);

export const OrganIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 21.57a3.75 3.75 0 00-2.84-6.07c-1.55-.38-3.23.2-4.13 1.45-1.02 1.42-.8 3.4.52 4.42 1.32 1.02 3.3 1.2 4.72.6 1.42-.6 2.37-2 2.73-3.4z" />
        <path stroke="none" fill="currentColor" d="M10.25 15.25a3.5 3.5 0 10-1.5 6.5 3.5 3.5 0 001.5-6.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.58 2.43a3.75 3.75 0 015.66 4.23l-7.5 13.5-2.25-1.25 7.5-13.5.59-2.98z" />
    </svg>
);

export const DocumentTextIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const ColorfulDocumentIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dd0e1" />
                <stop offset="100%" stopColor="#00796B" />
            </linearGradient>
        </defs>
        <path fill="url(#docGradient)" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z" />
        <path fill="#FFF" fillOpacity="0.7" d="M13 9V3.5L18.5 9H13z" />
        <path fill="#FFF" d="M16 17H8v-2h8v2zm-8-4h8v-2H8v2z" />
    </svg>
);

export const PlusCircleIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const MosaicIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);

export const ColorfulPhotoIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="photoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dd0e1" />
                <stop offset="100%" stopColor="#00796B" />
            </linearGradient>
        </defs>
        <path fill="url(#photoGradient)" d="M21,19V5c0-1.1-0.9-2-2-2H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14C20.1,21,21,20.1,21,19z M8.5,13.5l2.5,3.01L14.5,12l4.5,6H5L8.5,13.5z"/>
    </svg>
);

export const ColorfulPaletteIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="paletteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dd0e1" />
                <stop offset="100%" stopColor="#00796B" />
            </linearGradient>
        </defs>
        <path fill="url(#paletteGradient)" d="M17.75,7.46L15.54,5.25L14.5,6.29L17.71,9.5L18.75,8.46C19.14,8.07 19.14,7.44 18.75,7.05L18.46,6.76C18.26,6.56 18.01,6.46 17.75,6.46C17.49,6.46 17.24,6.56 17.04,6.76L15,8.8L12.96,6.76L11,8.72L12.04,9.76L10.25,11.54L9.21,10.5L7.25,12.46L8.29,13.5L6.5,15.29L5.21,14C5.21,14 4.21,15.29 4.21,15.29C4.21,15.29 5.5,16.29 5.5,16.29L6.79,15L8.58,16.79L7.54,17.83L9.5,19.79L10.54,18.75L12.33,20.54L14.29,18.58L13.25,17.54L15.04,15.75L16.08,16.79L18.04,14.83L17,13.79L18.79,12L17.75,10.96L19.54,9.21L21.25,11V6L17.75,7.46M7.5,2.5A2,2 0 0,0 5.5,4.5A2,2 0 0,0 7.5,6.5A2,2 0 0,0 9.5,4.5A2,2 0 0,0 7.5,2.5M4.5,5.5A1,1 0 0,0 3.5,6.5A1,1 0 0,0 4.5,7.5A1,1 0 0,0 5.5,6.5A1,1 0 0,0 4.5,5.5M10.5,3.5A1,1 0 0,0 9.5,4.5A1,1 0 0,0 10.5,5.5A1,1 0 0,0 11.5,4.5A1,1 0 0,0 10.5,3.5M6.5,8.5A1,1 0 0,0 5.5,9.5A1,1 0 0,0 6.5,10.5A1,1 0 0,0 7.5,9.5A1,1 0 0,0 6.5,8.5Z"/>
    </svg>
);

export const ColorfulWandIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="wandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dd0e1" />
                <stop offset="100%" stopColor="#00796B" />
            </linearGradient>
        </defs>
        <path fill="url(#wandGradient)" d="M13.5,2A1,1 0 0,0 12.5,3L7,8.5L2,4L3.5,2.5L7,6L11,2L12.5,3.5L7,9V14.5L9,16.5L10.5,15L16,20.5L21.5,15L20,13.5L18,15.5L12.5,10L13.5,9L19,14.5L20.5,13L15,7.5L21,2L19.5,0.5L14,6L13.5,2Z"/>
    </svg>
);

export const ColorfulLayersIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="layersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dd0e1" />
                <stop offset="100%" stopColor="#00796B" />
            </linearGradient>
        </defs>
        <path fill="url(#layersGradient)" d="M12,18.54L19.37,14.14L21,15.07L12,21.07L3,15.07L4.63,14.14L12,18.54M12,16L3,10L12,4L21,10L12,16Z"/>
    </svg>
);

export const ColorfulTrophyIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dd0e1" />
                <stop offset="100%" stopColor="#00796B" />
            </linearGradient>
        </defs>
        <path fill="url(#trophyGradient)" d="M12,2A9,9 0 0,0 3,11C3,14.04 4.5,16.81 6.75,18.5L5.25,20H18.75L17.25,18.5C19.5,16.81 21,14.04 21,11A9,9 0 0,0 12,2Z"/>
    </svg>
);

export const ColorfulResultsIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="resultsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dd0e1" />
                <stop offset="100%" stopColor="#00796B" />
            </linearGradient>
        </defs>
        <path fill="url(#resultsGradient)" d="M14,10H2V12H14V10M14,6H2V8H14V6M2,16H10V14H2V16M21.5,11.5L23,13L16,20L11.5,15.5L13,14L16,17L21.5,11.5Z"/>
    </svg>
);

export const HairIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9s.75-5.25 6-5.25S18 9 18 9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 9s.75-4.5 4.5-4.5S16.5 9 16.5 9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9s.75-3.75 3-3.75S15 9 15 9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9v10.5a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0018 19.5V9" />
    </svg>
);