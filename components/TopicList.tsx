// components/TopicList.tsx

'use client';

import type { Topic } from '@/lib/types';

const SOURCE_COLORS: Record<string, string> = {
  baby_kingdom: 'bg-pink-100 text-pink-800',
  google_news: 'bg-blue-100 text-blue-800',
  google_trends: 'bg-green-100 text-green-800',
  backup: 'bg-gray-100 text-gray-800',
};

interface TopicListProps {
  topics: Topic[];
}

export default function TopicList({ topics }: TopicListProps) {
  return (
    <div className="max-h-64 overflow-y-auto space-y-2">
      {topics.map((topic, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="text-gray-400 font-mono text-sm mt-0.5">
            {index + 1}.
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {topic.keyword}
            </p>
            {topic.url && (
              <a
                href={topic.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline truncate block"
              >
                {topic.url}
              </a>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${SOURCE_COLORS[topic.source] || SOURCE_COLORS.backup}`}>
            {topic.source}
          </span>
        </div>
      ))}
    </div>
  );
}
