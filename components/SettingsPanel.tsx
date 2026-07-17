// components/SettingsPanel.tsx

'use client';

import { useState } from 'react';
import type { ScrapeSource } from '@/lib/types';

const AVAILABLE_MODELS = [
  { id: 'xiaomi/mimo-v2.5', name: 'Xiaomi MiMo v2.5' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
];

const AVAILABLE_SOURCES: { id: ScrapeSource; name: string; icon: string }[] = [
  { id: 'baby_kingdom', name: 'Baby Kingdom', icon: '👶' },
  { id: 'google_news', name: 'Google News', icon: '📰' },
  { id: 'google_trends', name: 'Google Trends', icon: '📈' },
];

interface SettingsPanelProps {
  onScrape: (sources: ScrapeSource[]) => void;
  onGenerate: (apiKey: string, model: string) => void;
  onDownload: () => void;
  isScraping: boolean;
  isGenerating: boolean;
  hasTool: boolean;
}

export default function SettingsPanel({
  onScrape,
  onGenerate,
  onDownload,
  isScraping,
  isGenerating,
  hasTool,
}: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('xiaomi/mimo-v2.5');
  const [sources, setSources] = useState<ScrapeSource[]>(['baby_kingdom', 'google_news', 'google_trends']);

  const toggleSource = (source: ScrapeSource) => {
    setSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        🔧 Settings
      </h2>

      {/* API Key Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OpenRouter API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-or-v1-..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Your key is never stored on our servers
        </p>
      </div>

      {/* Model Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Source Checkboxes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data Sources
        </label>
        <div className="space-y-2">
          {AVAILABLE_SOURCES.map(source => (
            <label key={source.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sources.includes(source.id)}
                onChange={() => toggleSource(source.id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>{source.icon} {source.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => onScrape(sources)}
          disabled={isScraping || sources.length === 0}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isScraping ? '⏳ Scraping...' : '🚀 Scrape Topics'}
        </button>

        <button
          onClick={() => onGenerate(apiKey, model)}
          disabled={isGenerating || !apiKey}
          className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isGenerating ? '⏳ Generating...' : '🤖 Generate Tool'}
        </button>

        <button
          onClick={onDownload}
          disabled={!hasTool}
          className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          📥 Download HTML
        </button>
      </div>
    </div>
  );
}
