import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tracks as tracksApi } from '../services';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import EditTrackModal from '../components/EditTrackModal';
import { FiUser, FiEdit2, FiUpload, FiPlay, FiPause } from 'react-icons/fi';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, play, pause, resume } = usePlayer();
  const [myTracks, setMyTracks] = React.useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = React.useState(true);
  const [editingTrack, setEditingTrack] = React.useState<Track | null>(null);

  React.useEffect(() => {
    if (user) loadMyTracks();
  }, [user]);

  const loadMyTracks = async () => {
    setTracksLoading(true);
    try {
      const allTracks = await tracksApi.list({ limit: 100 });
      setMyTracks(allTracks.filter((t) => t.uploadedBy === user?.id));
    } catch {} finally {
      setTracksLoading(false);
    }
  };

  const handlePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      isPlaying ? pause() : resume();
    } else {
      play(track, myTracks);
    }
  };

  if (!user) return <div className="loading">Загрузка...</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.avatar ? <img src={user.avatar} alt={user.displayName} /> : <div className="avatar-placeholder large"><FiUser size={48} /></div>}
        </div>
        <div className="profile-info">
          <h1>{user.displayName}</h1>
          <p className="username">@{user.username}</p>
          {user.bio && <p className="bio">{user.bio}</p>}
          <p className="member-since">Участник с {new Date(user.createdAt).toLocaleDateString('ru-RU')}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat">
          <span className="stat-value">{user.role === 'artist' ? 'Артист' : user.role === 'admin' ? 'Админ' : 'Слушатель'}</span>
          <span className="stat-label">Роль</span>
        </div>
        <div className="stat">
          <span className="stat-value">{myTracks.length}</span>
          <span className="stat-label">Загружено треков</span>
        </div>
      </div>

      <section className="profile-section">
        <div className="section-header">
          <h2>Мои загрузки</h2>
          {(user.role === 'admin' || user.role === 'artist') && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
              <FiUpload size={14} /> Загрузить трек
            </button>
          )}
        </div>

        {tracksLoading ? (
          <div className="loading">Загрузка...</div>
        ) : myTracks.length > 0 ? (
          <div className="my-tracks-list">
            {myTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div key={track.id} className={`my-track-item ${isCurrent ? 'active' : ''}`}>
                  <button className="my-track-play" onClick={() => handlePlay(track)}>
                    {isCurrent && isPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
                  </button>
                  <div className="my-track-info" onClick={() => navigate(`/track/${track.id}`)}>
                    <span className="my-track-title">{track.title}</span>
                    <span className="my-track-artist">{track.Artist?.name || 'Неизвестный'}</span>
                  </div>
                  <span className="my-track-plays">{track.plays} прослуш.</span>
                  <button className="my-track-edit" onClick={() => setEditingTrack(track)} title="Редактировать">
                    <FiEdit2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Вы ещё не загрузили ни одного трека</p>
            {(user.role === 'admin' || user.role === 'artist') && (
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>Загрузить первый трек</button>
            )}
          </div>
        )}
      </section>

      {editingTrack && (
        <EditTrackModal
          track={editingTrack}
          onClose={() => setEditingTrack(null)}
          onSave={(updated) => {
            setMyTracks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
            setEditingTrack(null);
          }}
        />
      )}
    </div>
  );
};

export default Profile;
