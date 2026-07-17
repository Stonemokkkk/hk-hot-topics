// components/ResultsPanel.tsx

'use client';

import TopicList from './TopicList';
import ToolPreview from './ToolPreview';
import type { Topic, ScrapeJob } from '@/lib/types';

interface ResultsPanelProps {
  job: ScrapeJob | null;
  topics: Topic[];
  toolHtml: string | null;
}

export default function ResultsPanel({ job, topics, toolHtml }: ResultsPanelProps) {
  const getStatusDisplay = () => {
    if (!job) return { icon: '⏳', text: 'Ready to scrape', color: 'text-gray-500' };

    switch (job.status) {
      case 'running':
        return { icon: '🔄', text: `Scraping... ${job.progress}%`, color: 'text-blue-500' };
      case 'complete':
        return { icon: '✅', text: `Scraping complete - ${topics.length} topics found`, color: 'text-green-500' };
      case 'error':
        return { icon: '❌', text: `Error: ${job.error}`, color: 'text-red-500' };
      default:
        return { icon: '⏳', text: 'Unknown status', color: 'text-gray-500' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        📊 Results
      </h2>

      {/* Status */}
      <div className={`mb-6 flex items-center gap-2 ${status.color}`}>
        <span className="text-2xl">{status.icon}</span>
        <span className="font-medium">{status.text}</span>
      </div>

      {/* Topics List */}
      {topics.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Hot Topics</h3>
          <TopicList topics={topics} />
        </div>
      )}

      {/* Tool Preview */}
      {toolHtml && (
        <div>
          <h3 className="font-semibold mb-3 text-gray-700">Generated Tool</h3>
          <ToolPreview html={toolHtml} />
        </div>
      )}

      {/* Empty State */}
      {!job && topics.length === 0 && !toolHtml && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-4">🇭🇰</p>
          <p>Click &quot;Scrape Topics&quot; to start</p>
        </div>
      )}
    </div>
  );
}
