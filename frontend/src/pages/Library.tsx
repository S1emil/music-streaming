import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlaylists } from '../hooks/usePlaylists';
import PlaylistCard from '../components/PlaylistCard';
import { playlists as playlistsApi } from '../services';
import toast from 'react-hot-toast';
import { FiPlus, FiHeart, FiTrash2 } from 'react-icons/fi';

const Library: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: playlists, loading: playlistsLoading, refetch } = usePlaylists('my');

  const likedPlaylist = playlists.find((p: any) => p.isSystem);
  const userPlaylists = playlists.filter((p: any) => !p.isSystem);

  const handleCreatePlaylist = async () => {
    try {
      const playlist = await playlistsApi.create({
        name: 'Мой плейлист',
        isPublic: true,
      });
      toast.success('Плейлист создан');
      navigate(`/playlist/${playlist.id}`);
    } catch (error) {
      toast.error('Не удалось создать плейлист');
    }
  };

  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!confirm(`Удалить плейлист "${name}"?`)) return;
    try {
      await playlistsApi.delete(id);
      refetch();
      toast.success('Плейлист удалён');
    } catch {
      toast.error('Не удалось удалить плейлист');
    }
  };

  if (!user) {
    return (
      <div className="library-page">
        <div className="auth-required">
          <h2>Войдите, чтобы получить доступ к библиотеке</h2>
          <Link to="/login" className="btn btn-primary">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Ваша библиотека</h1>
        <button className="btn btn-primary" onClick={handleCreatePlaylist}>
          <FiPlus size={18} /> Новый плейлист
        </button>
      </div>

      {likedPlaylist && (
        <section className="library-section">
          <Link to={`/playlist/${likedPlaylist.id}`} className="liked-songs-card">
            <div className="liked-songs-icon">
              <FiHeart size={24} />
            </div>
            <div className="liked-songs-info">
              <div className="liked-songs-name">Понравившиеся</div>
              <div className="liked-songs-count">{likedPlaylist.Tracks?.length || 0} треков</div>
            </div>
          </Link>
        </section>
      )}

      <section className="library-section">
        <h2>Плейлисты</h2>
        {playlistsLoading ? (
          <div className="loading">Загрузка плейлистов...</div>
        ) : (
          <div className="playlists-grid">
            {userPlaylists.map((playlist) => (
              <div key={playlist.id} className="playlist-card-wrapper">
                <PlaylistCard playlist={playlist} />
                <button
                  className="playlist-delete-btn"
                  onClick={(e) => { e.preventDefault(); handleDeletePlaylist(playlist.id, playlist.name); }}
                  title="Удалить плейлист"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
            {userPlaylists.length === 0 && (
              <p className="no-data">Пока нет плейлистов. Создайте первый!</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Library;
