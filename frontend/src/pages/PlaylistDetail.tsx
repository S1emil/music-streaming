import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playlists as playlistsApi, tracks as tracksApi } from '../services';
import { Playlist } from '../types';
import TrackCard from '../components/TrackCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlay, FiTrash2, FiEdit2 } from 'react-icons/fi';

const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = React.useState<Playlist | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (id) {
      playlistsApi
        .get(id)
        .then((data) => {
          setPlaylist(data);
          setName(data.name);
          setDescription(data.description || '');
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const isOwner = user && playlist && user.id === playlist.userId;

  const handlePlayAll = () => {
    if (playlist?.Tracks && playlist.Tracks.length > 0) {
      tracksApi.play(playlist.Tracks[0].id);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const updated = await playlistsApi.update(id, { name, description });
      setPlaylist({ ...playlist!, ...updated });
      setEditing(false);
      toast.success('Плейлист обновлён');
    } catch (error) {
      toast.error('Не удалось обновить плейлист');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Удалить этот плейлист?')) return;

    try {
      await playlistsApi.delete(id);
      toast.success('Плейлист удалён');
      navigate('/library');
    } catch (error) {
      toast.error('Не удалось удалить плейлист');
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!id) return;

    try {
      await playlistsApi.removeTrack(id, trackId);
      setPlaylist({
        ...playlist!,
        Tracks: playlist!.Tracks!.filter((t) => t.id !== trackId),
      });
      toast.success('Трек удалён из плейлиста');
    } catch (error) {
      toast.error('Не удалось удалить трек');
    }
  };

  if (loading) return <div className="loading">Загрузка плейлиста...</div>;
  if (!playlist) return <div className="error">Плейлист не найден</div>;

  return (
    <div className="playlist-detail-page">
      <div className="playlist-header">
        <div className="playlist-cover-large">
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} />
          ) : (
            <div className="cover-placeholder large">♫</div>
          )}
        </div>

        <div className="playlist-header-info">
          {editing ? (
            <div className="edit-form">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название плейлиста"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание"
              />
              <div className="edit-actions">
                <button className="btn btn-primary" onClick={handleSave}>
                  Сохранить
                </button>
                <button className="btn btn-outline" onClick={() => setEditing(false)}>
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1>{playlist.name}</h1>
              {playlist.description && <p>{playlist.description}</p>}
              <p className="playlist-meta">
                {playlist.Owner?.displayName} • {playlist.Tracks?.length || 0} треков
              </p>
            </>
          )}
        </div>
      </div>

      <div className="playlist-actions">
        <button className="btn btn-primary" onClick={handlePlayAll}>
          <FiPlay size={18} /> Воспроизвести все
        </button>
        {isOwner && (
          <>
            <button className="btn btn-outline" onClick={() => setEditing(true)}>
              <FiEdit2 size={18} /> Редактировать
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <FiTrash2 size={18} /> Удалить
            </button>
          </>
        )}
      </div>

      <div className="playlist-tracks">
        {playlist.Tracks && playlist.Tracks.length > 0 ? (
          playlist.Tracks.map((track, index) => (
            <div key={track.id} className="playlist-track-item">
              <TrackCard track={track} showIndex index={index} />
              {isOwner && (
                <button
                  className="btn btn-icon"
                  onClick={() => handleRemoveTrack(track.id)}
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>В плейлисте пока нет треков</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;
