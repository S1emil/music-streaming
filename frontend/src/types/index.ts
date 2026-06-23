export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin' | 'artist';
  avatar: string | null;
  bio: string | null;
  createdAt: string;
}

export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  image: string | null;
  verified: boolean;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  albumId: string | null;
  genreId: string | null;
  duration: number;
  filePath: string;
  coverUrl: string | null;
  lyrics: string | null;
  plays: number;
  likes: number;
  uploadedBy: string;
  explicit: boolean;
  tags: string[];
  themes: string[];
  mood: string | null;
  tempo: number | null;
  energy: number | null;
  valence: number | null;
  acousticness: number | null;
  danceability: number | null;
  createdAt: string;
  Artist?: Artist;
  Genre?: Genre;
  Genres?: Genre[];
  Album?: { id: string; title: string; coverUrl: string | null };
  isLiked?: boolean;
  recommendationScore?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  userId: string;
  isPublic: boolean;
  isCollaborative: boolean;
  isSystem: boolean;
  createdAt: string;
  Owner?: { id: string; username: string; displayName: string };
  Tracks?: Track[];
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  coverUrl: string | null;
  year: number | null;
  type: 'album' | 'single' | 'ep';
  Artist?: Artist;
  tracks?: Track[];
}

export interface SearchResults {
  tracks?: Track[];
  artists?: Artist[];
  albums?: Album[];
  playlists?: Playlist[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserStats {
  totalTracksPlayed: number;
  totalListeningTime: number;
  topGenres: { id: string; name: string; slug: string; playCount: number; percentage: number }[];
  topArtists: { id: string; name: string; image: string | null; verified: boolean; playCount: number }[];
  moodDistribution: { mood: string; count: number }[];
  themeDistribution: { theme: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
  weeklyActivity: { day: number; name: string; count: number }[];
  recentlyPlayed: Track[];
  mostLiked: Track[];
}
