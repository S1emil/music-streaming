import api from './api';
import { User, Track, Playlist, SearchResults, AuthResponse, UserStats } from '../types';

export const auth = {
  register: (data: { username: string; email: string; password: string; displayName: string; role?: 'user' | 'artist' }) =>
    api.post<AuthResponse>('/api/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),
  me: () => api.get<User>('/api/auth/me').then((r) => r.data),
  updateProfile: (data: { displayName?: string; bio?: string }) =>
    api.put<User>('/api/auth/me', data).then((r) => r.data),
};

export const tracks = {
  list: (params?: { genre?: string; artist?: string; sort?: string; order?: string; limit?: number; offset?: number }) =>
    api.get<Track[]>('/api/tracks', { params }).then((r) => r.data),
  popular: () => api.get<Track[]>('/api/tracks/popular').then((r) => r.data),
  recent: () => api.get<Track[]>('/api/tracks/recent').then((r) => r.data),
  get: (id: string) => api.get<Track>(`/api/tracks/${id}`).then((r) => r.data),
  upload: (formData: FormData) =>
    api.post<Track>('/api/tracks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
  play: (id: string, progress?: number) => api.post(`/api/tracks/${id}/play`, progress != null ? { progress } : undefined).then((r) => r.data),
  like: (id: string) => api.post(`/api/tracks/${id}/like`).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/tracks/${id}`).then((r) => r.data),
  update: (id: string, data: { title?: string; lyrics?: string; coverUrl?: string; genreId?: string; genreIds?: string; explicit?: boolean }) =>
    api.put<Track>(`/api/tracks/${id}`, data).then((r) => r.data),
  updateFeatures: (id: string, features: { energy: number; valence: number; danceability: number; acousticness: number; tempo: number }) =>
    api.put(`/api/tracks/${id}/features`, features).then((r) => r.data),
  getLyrics: (id: string) => api.get<{ lyrics: string | null }>(`/api/tracks/${id}/lyrics`).then((r) => r.data),
  saveLyrics: (id: string, lyrics: string) =>
    api.post<{ lyrics: string }>(`/api/tracks/${id}/lyrics`, { lyrics }).then((r) => r.data),
  fetchLyrics: (id: string) =>
    api.get<{ lyrics: string; source: string }>(`/api/tracks/${id}/lyrics/fetch`).then((r) => r.data),
  fetchLyricsBySearch: (title: string, artist: string) =>
    api.get<{ lyrics: string; source: string }>('/api/tracks/search/lyrics', { params: { title, artist } }).then((r) => r.data),
};

export const playlists = {
  my: () => api.get<Playlist[]>('/api/playlists').then((r) => r.data),
  public: () => api.get<Playlist[]>('/api/playlists/public').then((r) => r.data),
  get: (id: string) => api.get<Playlist>(`/api/playlists/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    api.post<Playlist>('/api/playlists', data).then((r) => r.data),
  update: (id: string, data: { name?: string; description?: string; isPublic?: boolean }) =>
    api.put<Playlist>(`/api/playlists/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/playlists/${id}`).then((r) => r.data),
  addTrack: (id: string, trackId: string) =>
    api.post(`/api/playlists/${id}/tracks`, { trackId }).then((r) => r.data),
  removeTrack: (id: string, trackId: string) =>
    api.delete(`/api/playlists/${id}/tracks/${trackId}`).then((r) => r.data),
  generate: (data: { mood?: string; genreId?: string; limit?: number }) =>
    api.post<{ tracks: Track[]; suggestedName: string; suggestedDescription: string; mood: string | null }>(
      '/api/playlists/generate', data
    ).then((r) => r.data),
  saveGenerated: (data: { name: string; description?: string; trackIds: string[] }) =>
    api.post<Playlist>('/api/playlists/generate/save', data).then((r) => r.data),
};

export const search = {
  search: (q: string, type?: string) =>
    api.get<SearchResults>('/api/search', { params: { q, type } }).then((r) => r.data),
  genres: () => api.get('/api/search/genres').then((r) => r.data),
  recommendations: () => api.get<Track[]>('/api/search/recommendations').then((r) => r.data),
  similar: (trackId: string) => api.get<Track[]>(`/api/search/similar/${trackId}`).then((r) => r.data),
  semantic: (q: string) => api.get<Track[]>('/api/search/semantic', { params: { q } }).then((r) => r.data),
  svdStats: () => api.get<{
    users: number;
    tracks: number;
    interactions: number;
    matrixSparsity: string;
    latentFactors: number;
    userEmbeddings: number;
    itemEmbeddings: number;
    globalMean: string;
  }>('/api/search/svd-stats').then((r) => r.data),
};

export const artists = {
  list: () => api.get('/api/artists').then((r) => r.data),
  get: (id: string) => api.get(`/api/artists/${id}`).then((r) => r.data),
};

export const users = {
  me: () => api.get('/api/users/me').then((r) => r.data),
  get: (id: string) => api.get(`/api/users/${id}`).then((r) => r.data),
  stats: () => api.get<UserStats>('/api/users/me/stats').then((r) => r.data),
};
