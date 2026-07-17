// lib/types.ts

export type ScrapeSource = 'baby_kingdom' | 'google_news' | 'google_trends';

export interface Topic {
  keyword: string;
  source: ScrapeSource;
  url: string;
  timestamp: string;
  extra: Record<string, unknown>;
}

export interface ScrapeJob {
  jobId: string;
  status: 'running' | 'complete' | 'error';
  progress: number;
  sources: ScrapeSource[];
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface ScrapeResult {
  date: string;
  topics: Topic[];
}

export interface GeneratedTool {
  toolId: string;
  date: string;
  model: string;
  html: string;
  createdAt: string;
}

export interface ScrapeRequest {
  sources: ScrapeSource[];
}

export interface GenerateRequest {
  apiKey: string;
  model: string;
  topics: Topic[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
