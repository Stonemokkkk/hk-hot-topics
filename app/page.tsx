// app/page.tsx

'use client';

import { useState } from 'react';
import SettingsPanel from '@/components/SettingsPanel';
import ResultsPanel from '@/components/ResultsPanel';
import type { Topic, ScrapeSource } from '@/lib/types';

export default function Home() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [toolHtml, setToolHtml] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Handle scrape (synchronous — waits for full response)
  const handleScrape = async (sources: ScrapeSource[]) => {
    setIsScraping(true);
    setToolHtml(null);
    setScrapeStatus('running');
    setScrapeError(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setTopics(data.data.topics);
        setScrapeStatus('complete');
      } else {
        setScrapeError(data.error || 'Scraping failed');
        setScrapeStatus('error');
      }
    } catch {
      setScrapeError('Network error — please try again');
      setScrapeStatus('error');
    } finally {
      setIsScraping(false);
    }
  };

  // Handle generate
  const handleGenerate = async (apiKey: string, model: string) => {
    if (topics.length === 0) {
      alert('Please scrape topics first');
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model, topics }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setToolHtml(data.data.html);
      } else {
        alert(data.error || 'Failed to generate tool');
      }
    } catch {
      alert('Network error — please try again');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!toolHtml) return;

    const blob = new Blob([toolHtml], { type: 'text/html' });
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
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          🇭🇰 HK Hot Topics Dashboard
        </h1>
        <p className="text-white/80">
          输入你嘅 API key，即時 scraping 同生成互動小工具
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Settings */}
        <div className="lg:col-span-1">
          <SettingsPanel
            onScrape={handleScrape}
            onGenerate={handleGenerate}
            onDownload={handleDownload}
            isScraping={isScraping}
            isGenerating={isGenerating}
            hasTool={!!toolHtml}
          />
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-2">
          <ResultsPanel
            scrapeStatus={scrapeStatus}
            scrapeError={scrapeError}
            topics={topics}
            toolHtml={toolHtml}
          />
        </div>
      </div>
    </main>
  );
}
