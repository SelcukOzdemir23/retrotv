// ─── TMDB API Types ────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  media_type?: 'movie';
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  media_type?: 'tv';
}

export type TMDBMediaItem = (TMDBMovie | TMDBTVShow) & {
  media_type: 'movie' | 'tv';
};

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBSearchResult {
  page: number;
  results: TMDBMediaItem[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieDetail extends TMDBMovie {
  runtime: number;
  genres: TMDBGenre[];
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  production_companies: { id: number; name: string; logo_path: string | null }[];
  belongs_to_collection: { id: number; name: string; poster_path: string | null } | null;
}

export interface TMDBTVDetail extends TMDBTVShow {
  genres: TMDBGenre[];
  tagline: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    air_date: string;
    poster_path: string | null;
  }[];
}

export type TMDBMediaDetail = (TMDBMovieDetail | TMDBTVDetail) & {
  media_type: 'movie' | 'tv';
};

// ─── App Types ──────────────────────────────────────────────────────

export type AppView = 'home' | 'detail' | 'player' | 'search';

export interface AppState {
  view: AppView;
  selectedMedia: TMDBMediaItem | null;
  apiKey: string;
  browserOpen: boolean;
}

// ─── Image Helpers ──────────────────────────────────────────────────

export const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

export function posterUrl(path: string | null, size: 'w200' | 'w300' | 'w500' | 'original' = 'w500'): string {
  if (!path) return '';
  return `${TMDB_IMG_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return '';
  return `${TMDB_IMG_BASE}/${size}${path}`;
}

export function getMediaTitle(media: TMDBMediaItem | TMDBMediaDetail): string {
  return 'title' in media ? media.title : media.name;
}

export function getMediaDate(media: TMDBMediaItem | TMDBMediaDetail): string {
  return 'release_date' in media ? media.release_date : media.first_air_date;
}

export function getMediaYear(media: TMDBMediaItem | TMDBMediaDetail): string {
  const date = getMediaDate(media);
  return date ? date.substring(0, 4) : 'N/A';
}

export function getVidkingUrl(media: TMDBMediaItem, season?: number, episode?: number): string {
  const base = 'https://www.vidking.net/embed';
  if (media.media_type === 'tv' && season !== undefined && episode !== undefined) {
    return `${base}/tv/${media.id}/${season}/${episode}?color=00ff33&autoPlay=true&nextEpisode=true&episodeSelector=true`;
  }
  return `${base}/movie/${media.id}?color=00ff33&autoPlay=true`;
}
