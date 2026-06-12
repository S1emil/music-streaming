# Backend

Music streaming service backend built with Node.js, Express, TypeScript, and PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your database:
```bash
cp .env.example .env
```

3. Create PostgreSQL database:
```sql
CREATE DATABASE music_streaming;
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Tracks
- `GET /api/tracks` - List tracks
- `GET /api/tracks/popular` - Popular tracks
- `GET /api/tracks/recent` - Recent tracks
- `GET /api/tracks/:id` - Get track
- `POST /api/tracks` - Upload track (admin/artist)
- `POST /api/tracks/:id/play` - Record play
- `POST /api/tracks/:id/like` - Like/unlike track
- `DELETE /api/tracks/:id` - Delete track (admin)

### Playlists
- `GET /api/playlists` - User's playlists
- `GET /api/playlists/public` - Public playlists
- `GET /api/playlists/:id` - Get playlist
- `POST /api/playlists` - Create playlist
- `PUT /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/tracks` - Add track
- `DELETE /api/playlists/:id/tracks/:trackId` - Remove track

### Search
- `GET /api/search?q=query` - Search tracks, artists, albums, playlists
- `GET /api/search/genres` - List genres
- `GET /api/search/recommendations` - Get recommendations

### Artists
- `GET /api/artists` - List artists
- `GET /api/artists/:id` - Get artist with tracks/albums
- `POST /api/artists` - Create artist (admin)

### Users
- `GET /api/users/me` - Get user profile with history
- `GET /api/users/:id` - Get public user profile
