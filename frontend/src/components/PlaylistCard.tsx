import React from 'react';
import { Link } from 'react-router-dom';
import { Playlist } from '../types';

interface PlaylistCardProps {
  playlist: Playlist;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  return (
    <Link to={`/playlist/${playlist.id}`} className="playlist-card">
      <div className="playlist-cover">
        {playlist.coverUrl ? (
          <img src={playlist.coverUrl} alt={playlist.name} />
        ) : (
          <div className="cover-placeholder">♫</div>
        )}
      </div>
      <div className="playlist-info">
        <div className="playlist-name">{playlist.name}</div>
        <div className="playlist-meta">
          {playlist.Owner?.displayName || 'Неизвестный'}
          {playlist.isPublic ? ' • Публичный' : ' • Приватный'}
        </div>
      </div>
    </Link>
  );
};

export default PlaylistCard;
