# MusicStream

A full-featured music streaming service built with React and Node.js.

## Features

- **Music Playback** - Stream tracks with a custom audio player
- **Playlists** - Create, edit, and share playlists
- **Search** - Find tracks, artists, albums, and playlists
- **User System** - Registration, login, profiles with JWT auth
- **Likes** - Like your favorite tracks
- **Play History** - Track your listening history
- **Recommendations** - Get personalized music suggestions
- **Role-based Access** - Admin, artist, and user roles

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Sequelize ORM
- JWT Authentication
- Multer for file uploads

### Frontend
- React 18
- TypeScript
- React Router
- Zustand for state management
- React Icons
- React Hot Toast

## Project Structure

```
music-streaming/
├── backend/
│   ├── src/
│   │   ├── db/          # Database connection
│   │   ├── models/      # Sequelize models
│   │   ├── routes/      # API routes
│   │   ├── middleware/   # Auth, upload, error handling
│   │   └── index.ts     # Server entry
│   └── uploads/         # Uploaded files
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── context/     # React contexts (Auth, Player)
    │   ├── hooks/       # Custom hooks
    │   ├── services/    # API services
    │   ├── types/       # TypeScript types
    │   └── styles/      # CSS styles
    └── public/          # Static files
```

## Setup

### Backend

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

3. Create database:
```sql
CREATE DATABASE music_streaming;
```

4. Start server:
```bash
npm run dev
```

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Tracks
- `GET /api/tracks` - List tracks
- `GET /api/tracks/popular` - Popular tracks
- `POST /api/tracks/:id/play` - Record play
- `POST /api/tracks/:id/like` - Like/unlike

### Playlists
- `GET /api/playlists` - User's playlists
- `POST /api/playlists` - Create playlist
- `POST /api/playlists/:id/tracks` - Add track

### Search
- `GET /api/search?q=query` - Search everything
- `GET /api/search/recommendations` - Get recommendations
