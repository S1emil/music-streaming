# Frontend

React frontend for MusicStream.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The server runs on http://localhost:3000 and proxies API requests to http://localhost:3001.

## Structure

- `src/components/` - Reusable UI components (Header, Player, TrackCard, etc.)
- `src/pages/` - Route components (Home, Search, Library, Profile, etc.)
- `src/context/` - React contexts (AuthProvider, PlayerProvider)
- `src/hooks/` - Custom hooks (useTracks, usePlaylists)
- `src/services/` - API client and service functions
- `src/types/` - TypeScript interfaces
- `src/styles/` - CSS styles
