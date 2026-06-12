import React from 'react';
import { useParams } from 'react-router-dom';
import { tracks as tracksApi, search as searchApi } from '../services';
import { Track } from '../types';
import TrackCard from '../components/TrackCard';
import LyricsEditor from '../components/LyricsEditor';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import EditTrackModal from '../components/EditTrackModal';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { FiPlay, FiPause, FiHeart, FiList, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TrackDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { currentTrack, isPlaying, play, pause, resume } = usePlayer();
  const [track, setTrack] = React.useState<Track | null>(null);
  const [similarTracks, setSimilarTracks] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(0);
  const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);

  const isCurrentTrack = currentTrack?.id === id;

  React.useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        tracksApi.get(id),
        searchApi.similar(id).catch(() => []),
      ])
        .then(([trackData, similar]) => {
          setTrack(trackData);
          setLiked(trackData.isLiked || false);
          setLikeCount(trackData.likes);
          setSimilarTracks(similar);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePlay = () => {
    if (track) {
      if (isCurrentTrack) {
        isPlaying ? pause() : resume();
      } else {
        play(track, [track, ...similarTracks]);
      }
    }
  };

  const handleLike = async () => {
    if (!user || !track) return;

    try {
      const result = await tracksApi.like(track.id);
      setLiked(result.liked);
      setLikeCount(result.likes);
    } catch (error) {
      toast.error('Не удалось поставить лайк');
    }
  };

  const handleLyricsSave = (lyrics: string) => {
    if (track) {
      setTrack({ ...track, lyrics });
    }
  };

  if (loading) return <div className="loading">Загрузка трека...</div>;
  if (!track) return <div className="error">Трек не найден</div>;

  return (
    <div className="track-detail-page">
      <div className="track-detail-header">
        <div className="track-detail-cover">
          {track.coverUrl ? (
            <img src={track.coverUrl} alt={track.title} />
          ) : (
            <div className="cover-placeholder large">♪</div>
          )}
        </div>

        <div className="track-detail-info">
          <span className="track-type">Трек</span>
          <h1>{track.title}</h1>
          <p className="track-artist-name">{track.Artist?.name || 'Неизвестный артист'}</p>
          <div className="track-meta">
            {track.Genre && <span className="genre-tag">{track.Genre.name}</span>}
            <span>{track.plays.toLocaleString()} прослушиваний</span>
            <span>{likeCount.toLocaleString()} лайков</span>
            {track.explicit && <span className="explicit-tag">18+</span>}
          </div>
        </div>
      </div>

      <div className="track-detail-actions">
        <button className="play-btn-large" onClick={handlePlay}>
          {isCurrentTrack && isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
        </button>
        {user && (
          <>
            <button className={`like-btn-large ${liked ? 'active' : ''}`} onClick={handleLike}>
              <FiHeart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button className="like-btn-large" onClick={() => setShowPlaylistModal(true)} title="Добавить в плейлист">
              <FiList size={20} />
            </button>
            {(user.id === track.uploadedBy || user.role === 'admin') && (
              <button className="like-btn-large" onClick={() => setShowEditModal(true)} title="Редактировать трек">
                <FiEdit2 size={20} />
              </button>
            )}
          </>
        )}
      </div>

      {track.lyrics && (
        <div className="track-lyrics-section">
          <LyricsEditor
            trackId={track.id}
            initialLyrics={track.lyrics}
            onSave={handleLyricsSave}
            readonly={!user || (user.id !== track.uploadedBy && user.role !== 'admin')}
          />
        </div>
      )}

      {user && (user.id === track.uploadedBy || user.role === 'admin') && !track.lyrics && (
        <div className="track-lyrics-section">
          <LyricsEditor
            trackId={track.id}
            initialLyrics={null}
            onSave={handleLyricsSave}
          />
        </div>
      )}

      {similarTracks.length > 0 && (
        <div className="similar-tracks-section">
          <h2>Похожие треки</h2>
          <div className="tracks-grid">
            {similarTracks.map((t, index) => (
              <TrackCard key={t.id} track={t} tracks={similarTracks} showIndex index={index} />
            ))}
          </div>
        </div>
      )}

      {showPlaylistModal && track && (
        <AddToPlaylistModal trackId={track.id} onClose={() => setShowPlaylistModal(false)} />
      )}

      {showEditModal && track && (
        <EditTrackModal
          track={track}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => setTrack(updated)}
        />
      )}
    </div>
  );
};

export default TrackDetail;
