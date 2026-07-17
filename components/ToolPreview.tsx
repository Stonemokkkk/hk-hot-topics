// components/ToolPreview.tsx

'use client';

import { useRef } from 'react';

interface ToolPreviewProps {
  html: string;
}

export default function ToolPreview({ html }: ToolPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hk-tool-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Preview Header */}
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Preview</span>
        <button
          onClick={handleDownload}
          className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          📥 Download
        </button>
      </div>

      {/* iframe Preview */}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="w-full h-80 border-0"
        title="Generated Tool Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
}
