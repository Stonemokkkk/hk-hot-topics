// app/api/scrape/route.ts — Synchronous scraping (returns results directly)
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ScrapeSource } from '@/lib/types';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const { sources } = await request.json() as { sources?: ScrapeSource[] };

  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Sources array required' },
      { status: 400 }
    );
  }

  const sourceArgs = sources.join(' ');

  try {
    const { stdout } = await execAsync(
      `python3 -m scraper.scraper --json ${sourceArgs}`,
      {
        timeout: 4 * 60 * 1000, // 4 minutes
        maxBuffer: 10 * 1024 * 1024, // 10MB
      }
    );

    const result = JSON.parse(stdout);

    return NextResponse.json({
      success: true,
      data: {
        date: result.date,
        topics: result.trends,
        errors: result.errors,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Scraping failed';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
