// Script to scrape KenPom ratings table as JSON for testing purposes.


import { test, expect } from '@playwright/test';
import { chromium, Browser } from 'playwright';
// wait page.locator('#data-area').click();
export type ScrapedTable = {
  url: string;
  scrapedAt: string;
  headers: string[];
  rows: Array<Record<string, string>>;
};

function normalizeHeader(h: string) {
  return h
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s%()./-]/g, '');
}

async function withBrowser<T>(fn: (browser: Browser) => Promise<T>) {
  const browser = await chromium.launch({ headless: true });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

/**
 * Scrape the first matching HTML <table> into JSON.
 * Note: Provide a specific selector you validated via `playwright codegen`.
 */
export async function scrapeTableAsJson(params: {
  url: string;
  tableSelector: string;
  timeoutMs?: number;
}): Promise<ScrapedTable> {
  const { url, tableSelector, timeoutMs = 30_000 } = params;

  return withBrowser(async (browser) => {
    const page = await browser.newPage({
      // A real UA is fine; don't spoof to evade blocks.
      userAgent: 'Playwright scraper',
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

    const table = page.locator("#ratings-table");
    await table.waitFor({ state: 'visible', timeout: timeoutMs });

    // Try to read headers from <thead>, fallback to first row cells.
    const headers = await table.evaluate((t) => {
      const theadHeaders = Array.from(t.querySelectorAll('thead th')).map((th) =>
        (th.textContent ?? '').trim(),
      );
      if (theadHeaders.some(Boolean)) return theadHeaders;

   

    await page.close();

    return {
      url,
      scrapedAt: new Date().toISOString(),
      headers: normHeaders,
      rows: asObjects,
    };
  });
}

 // await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

    // const table = page.locator(tableSelector).first();
    // await table.waitFor({ state: 'visible', timeout: timeoutMs });

    // // Try to read headers from <thead>, fallback to first row cells.
    // const headers = await table.evaluate((t) => {
    //   const theadHeaders = Array.from(t.querySelectorAll('thead th')).map((th) =>
    //     (th.textContent ?? '').trim(),
    //   );
    //   if (theadHeaders.some(Boolean)) return theadHeaders;

    //   const firstRow = t.querySelector('tbody tr') ?? t.querySelector('tr');
    //   if (!firstRow) return [];
    //   return Array.from(firstRow.querySelectorAll('th,td')).map((cell) =>
    //     (cell.textContent ?? '').trim(),
    //   );
    // });

    // const normHeaders = headers.map((h, i) => normalizeHeader(h) || `col_${i + 1}`);

    // // Get all body rows (skip empty)
    // const rows = await table.evaluate((t) => {
    //   const trs = Array.from(t.querySelectorAll('tbody tr'));
    //   return trs.map((tr) =>
    //     Array.from(tr.querySelectorAll('th,td')).map((cell) => (cell.textContent ?? '').trim()),
    //   );
    // });

    // const asObjects = rows
    //   .filter((cells) => cells.some((c) => c && c.trim().length > 0))
    //   .map((cells) => {
    //     const obj: Record<string, string> = {};
    //     for (let i = 0; i < normHeaders.length; i++) {
    //       obj[normHeaders[i]] = (cells[i] ?? '').trim();
    //     }
    //     return obj;
    //   });