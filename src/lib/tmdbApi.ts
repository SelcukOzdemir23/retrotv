// ─── TMDB API Client ───────────────────────────────────────────────
// Uses v3 API. User provides their own API key via localStorage.

import type {
  TMDBSearchResult,
  TMDBMovieDetail,
  TMDBTVDetail,
  TMDBMediaItem,
  TMDBGenre,
} from './types';

const TMDB_BASE = 'https://api.themoviedb.org/3';

let apiKey: string | null = null;

export function setApiKey(key: string) {
  apiKey = key;
}

function getKey(): string | null {
  if (apiKey) return apiKey;
  if (typeof import.meta.env !== 'undefined' && import.meta.env.PUBLIC_TMDB_API_KEY) {
    return import.meta.env.PUBLIC_TMDB_API_KEY;
  }
  return null;
}

// Detect if key is v3 (API key) or v4 (Bearer token)
// v3 keys are 32 hex chars, v4 tokens are longer and often start with eyJ
function isV4Token(key: string): boolean {
  return key.startsWith('eyJ') || key.length > 40;
}

function buildUrl(endpoint: string, params: Record<string, string> = {}): string {
  const key = getKey();
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  // v3 auth: append api_key as query param
  if (!isV4Token(key)) {
    url.searchParams.set('api_key', key);
  }
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

function headers(): HeadersInit {
  const key = getKey();
  if (isV4Token(key)) {
    return {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }
  return { 'Content-Type': 'application/json' };
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const key = getKey();
  if (!key) throw new Error('TMDB API key not set');

  const url = buildUrl(endpoint, params);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status}`);
  }
  return res.json();
}

// ─── Trending ──────────────────────────────────────────────────────

export async function getTrending(
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'week'
): Promise<TMDBMediaItem[]> {
  const data = await tmdbFetch<TMDBSearchResult>(`/trending/${mediaType}/${timeWindow}`);
  return data.results.map((item) => ({
    ...item,
    media_type: item.media_type || (mediaType === 'movie' ? 'movie' : 'tv'),
  }));
}

// ─── Search ────────────────────────────────────────────────────────

export async function searchMedia(
  query: string,
  page: number = 1
): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>('/search/multi', {
    query,
    page: String(page),
    include_adult: 'false',
  });
}

// ─── Movie Details ─────────────────────────────────────────────────

export async function getMovieDetail(id: number): Promise<TMDBMovieDetail> {
  return tmdbFetch<TMDBMovieDetail>(`/movie/${id}`);
}

// ─── TV Details ────────────────────────────────────────────────────

export async function getTVDetail(id: number): Promise<TMDBTVDetail> {
  return tmdbFetch<TMDBTVDetail>(`/tv/${id}`);
}

// ─── TV Season Details ─────────────────────────────────────────────

export async function getTVSeasonDetail(
  tvId: number,
  seasonNumber: number
): Promise<{
  season_number: number;
  name: string;
  overview: string;
  episodes: {
    id: number;
    name: string;
    episode_number: number;
    overview: string;
    still_path: string | null;
    air_date: string;
    vote_average: number;
  }[];
}> {
  return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
}

// ─── Discover ──────────────────────────────────────────────────────

export async function discoverMovies(
  params: Record<string, string> = {}
): Promise<TMDBSearchResult> {
  const data = await tmdbFetch<TMDBSearchResult>('/discover/movie', {
    sort_by: 'popularity.desc',
    include_adult: 'false',
    ...params,
  });
  return {
    ...data,
    results: data.results.map((item) => ({ ...item, media_type: 'movie' as const })),
  };
}

export async function discoverTV(
  params: Record<string, string> = {}
): Promise<TMDBSearchResult> {
  const data = await tmdbFetch<TMDBSearchResult>('/discover/tv', {
    sort_by: 'popularity.desc',
    ...params,
  });
  return {
    ...data,
    results: data.results.map((item) => ({ ...item, media_type: 'tv' as const })),
  };
}

// ─── Genres ────────────────────────────────────────────────────────

export async function getMovieGenres(): Promise<TMDBGenre[]> {
  const data = await tmdbFetch<{ genres: TMDBGenre[] }>('/genre/movie/list');
  return data.genres;
}

export async function getTVGenres(): Promise<TMDBGenre[]> {
  const data = await tmdbFetch<{ genres: TMDBGenre[] }>('/genre/tv/list');
  return data.genres;
}

// ─── Popular ───────────────────────────────────────────────────────

export async function getPopularMovies(page: number = 1): Promise<TMDBSearchResult> {
  const data = await tmdbFetch<TMDBSearchResult>('/movie/popular', { page: String(page) });
  return {
    ...data,
    results: data.results.map((item) => ({ ...item, media_type: 'movie' as const })),
  };
}

export async function getPopularTV(page: number = 1): Promise<TMDBSearchResult> {
  const data = await tmdbFetch<TMDBSearchResult>('/tv/popular', { page: String(page) });
  return {
    ...data,
    results: data.results.map((item) => ({ ...item, media_type: 'tv' as const })),
  };
}

// ─── Top Rated ─────────────────────────────────────────────────────

export async function getTopRatedMovies(page: number = 1): Promise<TMDBSearchResult> {
  const data = await tmdbFetch<TMDBSearchResult>('/movie/top_rated', { page: String(page) });
  return {
    ...data,
    results: data.results.map((item) => ({ ...item, media_type: 'movie' as const })),
  };
}

// ─── Now Playing ───────────────────────────────────────────────────

export async function getNowPlayingMovies(page: number = 1): Promise<TMDBSearchResult> {
  const data = await tmdbFetch<TMDBSearchResult>('/movie/now_playing', { page: String(page) });
  return {
    ...data,
    results: data.results.map((item) => ({ ...item, media_type: 'movie' as const })),
  };
}
