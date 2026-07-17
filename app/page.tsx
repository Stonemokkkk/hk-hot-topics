// app/page.tsx

'use client';

import { useState, useCallback } from 'react';
import SettingsPanel from '@/components/SettingsPanel';
import ResultsPanel from '@/components/ResultsPanel';
import type { ScrapeJob, Topic, ScrapeSource } from '@/lib/types';

export default function Home() {
  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [toolHtml, setToolHtml] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    const res = await fetch(`/api/status?jobId=${jobId}`);
    const data = await res.json();

    if (data.success && data.data) {
      setJob(data.data.job);
      if (data.data.topics) {
        setTopics(data.data.topics);
      }

      // Continue polling if still running
      if (data.data.job.status === 'running') {
        setTimeout(() => pollJobStatus(jobId), 2000);
      } else {
        setIsScraping(false);
      }
    }
  }, []);

  // Handle scrape
  const handleScrape = async (sources: ScrapeSource[]) => {
    setIsScraping(true);
    setToolHtml(null);

    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources }),
    });

    const data = await res.json();

    if (data.success && data.data) {
      pollJobStatus(data.data.jobId);
    } else {
      setIsScraping(false);
      alert(data.error || 'Failed to start scraping');
    }
  };

  // Handle generate
  const handleGenerate = async (apiKey: string, model: string) => {
    if (topics.length === 0) {
      alert('Please scrape topics first');
      return;
    }

    setIsGenerating(true);

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model, topics }),
    });

    const data = await res.json();
    setIsGenerating(false);

    if (data.success && data.data) {
      setToolHtml(data.data.html);
    } else {
      alert(data.error || 'Failed to generate tool');
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
            job={job}
            topics={topics}
            toolHtml={toolHtml}
          />
        </div>
      </div>
    </main>
  );
}
