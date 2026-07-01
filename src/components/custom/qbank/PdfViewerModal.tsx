'use client';

import React from 'react';
import { X, ExternalLink } from 'lucide-react';

export interface PdfViewerModalProps {
 isOpen: boolean;
 onClose: () => void;
 pdfUrl: string;
 title: string;
}

export default function PdfViewerModal({ isOpen, onClose, pdfUrl, title }: PdfViewerModalProps) {
 if (!isOpen || !pdfUrl) return null;

 const formatPdfEmbedUrl = (url: string) => {
 if (!url) return '';
 
 // Google Drive /view URLs conversion
 if (url.includes('drive.google.com') && url.includes('/view')) {
 return url.replace('/view', '/preview');
 }
 
 // OneDrive redir/view conversion
 if (url.includes('onedrive.live.com')) {
 if (url.includes('/redir')) {
 return url.replace('/redir', '/embed');
 }
 if (url.includes('/view.aspx')) {
 return url.replace('/view.aspx', '/embed');
 }
 }
 
 // Raw PDF toolbar display options
 if (!url.includes('drive.google.com') && !url.includes('onedrive.live.com') && !url.includes('#')) {
 return `${url}#toolbar=1`;
 }
 
 return url;
 };

 return (
 <div 
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
 onClick={onClose}
 >
 <div 
 className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-[32px] shadow-2xl w-full h-[90vh] max-w-5xl flex flex-col overflow-hidden animate-zoom-in"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-950/20">
 <div className="min-w-0 flex-1 mr-4">
 <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
 {title || 'View PDF'}
 </h3>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <a 
 href={pdfUrl} 
 target="_blank" 
 rel="noopener noreferrer" 
 className="p-2 text-gray-550 dark:text-gray-400 hover:text-blue-650 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
 title="Open in new tab"
 >
 <ExternalLink className="w-4 h-4" />
 </a>
 <button 
 onClick={onClose} 
 className="p-2 text-gray-550 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
 title="Close"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 min-h-0 bg-gray-100 dark:bg-slate-950/40 relative">
 <iframe
 src={formatPdfEmbedUrl(pdfUrl)}
 className="w-full h-full border-none"
 title="PDF Document Viewer"
 allow="autoplay"
 />
 </div>
 </div>
 </div>
 );
}
