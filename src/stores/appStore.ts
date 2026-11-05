// ─── App Store ─────────────────────────────────────────────────────
// Global state management using nanostores

import { map } from 'nanostores';
import { setApiKey as setTmdbApiKey } from '../lib/tmdbApi';
import type { TMDBMediaItem, TMDBMediaDetail, TMDBGenre, AppView } from '../lib/types';

// ─── Store Definition ───────────────────────────────────────────────

export interface AppStoreValue {
  // View state
  view: AppView;
  previousView: AppView;

  // API Key
  apiKey: string;
  apiKeyValid: boolean;

  // Media
  selectedMedia: TMDBMediaItem | null;
  mediaDetail: TMDBMediaDetail | null;
  mediaDetailLoading: boolean;

  // Trending / Home
  trendingItems: TMDBMediaItem[];
  trendingLoading: boolean;

  // Search
  searchQuery: string;
  searchResults: TMDBMediaItem[];
  searchLoading: boolean;
  searchPage: number;
  searchTotalPages: number;

  // Genres
  genres: TMDBGenre[];
  selectedGenre: number | null;
  genreItems: TMDBMediaItem[];
  genreLoading: boolean;

  // Playing
  isPlaying: boolean;

  // Browser
  browserOpen: boolean;
  browserTab: 'trending' | 'search' | 'genres';
}

export const appStore = map<AppStoreValue>({
  view: 'home',
  previousView: 'home',

  apiKey: '',
  apiKeyValid: false,

  selectedMedia: null,
  mediaDetail: null,
  mediaDetailLoading: false,

  trendingItems: [],
  trendingLoading: false,

  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  searchPage: 1,
  searchTotalPages: 0,

  genres: [],
  selectedGenre: null,
  genreItems: [],
  genreLoading: false,

  isPlaying: false,

  browserOpen: false,
  browserTab: 'trending',
});

// ─── Actions ────────────────────────────────────────────────────────

export function setView(view: AppView) {
  const prev = appStore.get().view;
  appStore.setKey('previousView', prev);
  appStore.setKey('view', view);
}

export function goBack() {
  const { previousView } = appStore.get();
  appStore.setKey('view', previousView);
  appStore.setKey('selectedMedia', null);
  appStore.setKey('mediaDetail', null);
  appStore.setKey('isPlaying', false);
}

export function setApiKey(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tmdb_api_key', key);
  }
  appStore.setKey('apiKey', key);
  appStore.setKey('apiKeyValid', true);
  setTmdbApiKey(key);
}

export function loadApiKey(): boolean {
  // Prefer environment variable, then localStorage, then require user input
  const envKey = typeof import.meta.env !== 'undefined' && import.meta.env.PUBLIC_TMDB_API_KEY
    ? import.meta.env.PUBLIC_TMDB_API_KEY
    : null;
  const storedKey = typeof localStorage !== 'undefined'
    ? localStorage.getItem('tmdb_api_key')
    : null;

  const key = envKey || storedKey;
  if (key) {
    appStore.setKey('apiKey', key);
    appStore.setKey('apiKeyValid', true);
    setTmdbApiKey(key);
    return true;
  }

  appStore.setKey('apiKey', '');
  appStore.setKey('apiKeyValid', false);
  return false;
}

export function selectMedia(media: TMDBMediaItem) {
  appStore.setKey('selectedMedia', media);
  appStore.setKey('mediaDetail', null);
  appStore.setKey('mediaDetailLoading', true);
  setView('detail');
}

export function setMediaDetail(detail: TMDBMediaDetail) {
  appStore.setKey('mediaDetail', detail);
  appStore.setKey('mediaDetailLoading', false);
}

export function setMediaDetailLoading(loading: boolean) {
  appStore.setKey('mediaDetailLoading', loading);
}

export function setTrending(items: TMDBMediaItem[]) {
  appStore.setKey('trendingItems', items);
  appStore.setKey('trendingLoading', false);
}

export function setTrendingLoading(loading: boolean) {
  appStore.setKey('trendingLoading', loading);
}

export function setSearchQuery(query: string) {
  appStore.setKey('searchQuery', query);
}

export function setSearchResults(
  results: TMDBMediaItem[],
  page: number,
  totalPages: number
) {
  appStore.setKey('searchResults', results);
  appStore.setKey('searchPage', page);
  appStore.setKey('searchTotalPages', totalPages);
  appStore.setKey('searchLoading', false);
}

export function setSearchLoading(loading: boolean) {
  appStore.setKey('searchLoading', loading);
}

export function setGenres(genres: TMDBGenre[]) {
  appStore.setKey('genres', genres);
}

export function setSelectedGenre(genreId: number | null) {
  appStore.setKey('selectedGenre', genreId);
}

export function setGenreItems(items: TMDBMediaItem[]) {
  appStore.setKey('genreItems', items);
  appStore.setKey('genreLoading', false);
}

export function setGenreLoading(loading: boolean) {
  appStore.setKey('genreLoading', loading);
}

export function startPlaying() {
  appStore.setKey('isPlaying', true);
}

export function stopPlaying() {
  appStore.setKey('isPlaying', false);
}

export function toggleBrowser() {
  const { browserOpen } = appStore.get();
  appStore.setKey('browserOpen', !browserOpen);
}

export function setBrowserOpen(open: boolean) {
  appStore.setKey('browserOpen', open);
}

export function setBrowserTab(tab: 'trending' | 'search' | 'genres') {
  appStore.setKey('browserTab', tab);
}
