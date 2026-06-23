import React from 'react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { FiPlay, FiPause, FiHeart, FiList } from 'react-icons/fi';
import { tracks as tracksApi } from '../services';
import { useAuth } from '../context/AuthContext';
import AddToPlaylistModal from './AddToPlaylistModal';

interface TrackCardProps {
  track: Track;
  tracks?: Track[];
  showIndex?: boolean;
  index?: number;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, tracks, showIndex, index }) => {
  const { currentTrack, isPlaying, play, pause, resume } = usePlayer();
  const { user } = useAuth();
  const [liked, setLiked] = React.useState(track.isLiked || false);
  const [likeCount, setLikeCount] = React.useState(track.likes);
  const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);

  React.useEffect(() => {
    setLiked(track.isLiked || false);
    setLikeCount(track.likes);
  }, [track.id, track.isLiked, track.likes]);

  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isCurrentTrack) {
      isPlaying ? pause() : resume();
    } else {
      play(track, tracks);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const result = await tracksApi.like(track.id);
      setLiked(result.liked);
      setLikeCount(result.likes);
    } catch {}
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setShowPlaylistModal(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className={`track-card ${isCurrentTrack ? 'active' : ''}`} onClick={handlePlay}>
        {showIndex && (
          <div className="track-index">
            {isCurrentTrack && isPlaying ? (
              <div className="playing-indicator">
                <span></span><span></span><span></span>
              </div>
            ) : (
              <span>{index !== undefined ? index + 1 : '-'}</span>
            )}
          </div>
        )}

        <div className="track-cover">
          {track.coverUrl ? (
            <img src={track.coverUrl} alt={track.title} />
          ) : (
            <div className="cover-placeholder">♪</div>
          )}
          <div className="play-overlay">
            {isCurrentTrack && isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
          </div>
        </div>

        <div className="track-info">
          <div className={`track-title ${isCurrentTrack ? 'active' : ''}`}>{track.title}</div>
          <div className="track-artist">{track.Artist?.name || 'Неизвестный артист'}</div>
        </div>

        {track.Genre && <div className="track-genre">{track.Genre.name}</div>}

        <div className="track-stats">
          <span>{formatDuration(track.duration)}</span>
          <span>{track.plays.toLocaleString()} прослуш.</span>
        </div>

        <div className="track-actions">
          {user && (
            <>
              <button className={`action-btn like-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
                <FiHeart size={16} fill={liked ? 'currentColor' : 'none'} />
                <span>{likeCount}</span>
              </button>
              <button className="action-btn" onClick={handleAddToPlaylist} title="Добавить в плейлист">
                <FiList size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {showPlaylistModal && (
        <AddToPlaylistModal trackId={track.id} onClose={() => setShowPlaylistModal(false)} />
      )}
    </>
  );
};

export default TrackCard;
