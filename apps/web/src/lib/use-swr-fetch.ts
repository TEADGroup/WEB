'use client';

import useSWR, { SWRConfiguration } from 'swr';

/**
 * Reusable SWR fetcher for admin pages.
 * Caches API responses so navigating back to a page is instant,
 * then revalidates in the background.
 */
const defaultFetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
};

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 30_000,      // don't re-fetch within 30s of last fetch
  errorRetryCount: 2,
};

export function useSwrFetch<T = unknown>(
  url: string | null,
  config?: SWRConfiguration,
) {
  return useSWR<T>(url, defaultFetcher, { ...defaultConfig, ...config });
}
