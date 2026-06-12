import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { artists as artistsApi } from '../services';
import toast from 'react-hot-toast';
import { FiPlus, FiCheck, FiUpload } from 'react-icons/fi';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistName, setArtistName] = React.useState('');
  const [artistBio, setArtistBio] = React.useState('');
  const [artistsList, setArtistsList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'artist')) {
      navigate('/');
      return;
    }
    loadArtists();
  }, [user, navigate]);

  const loadArtists = async () => {
    try {
      const data = await artistsApi.list();
      setArtistsList(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName.trim()) {
      toast.error('Введите имя артиста');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: artistName, bio: artistBio }),
      });
      toast.success('Профиль артиста создан');
      setArtistName('');
      setArtistBio('');
      loadArtists();
    } catch (error) {
      toast.error('Не удалось создать артиста');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'artist')) {
    return null;
  }

  return (
    <div className="admin-page">
      <h1>{user.role === 'artist' ? 'Панель артиста' : 'Панель администратора'}</h1>

      {user.role === 'artist' && (
        <section className="admin-section welcome-section">
          <h2>Добро пожаловать, артист!</h2>
          <p>Создайте профиль артиста, затем загружайте свои треки.</p>
        </section>
      )}

      <section className="admin-section">
        <h2>Создать профиль артиста</h2>
        <form onSubmit={handleCreateArtist} className="admin-form">
          <div className="form-group">
            <label>Имя артиста</label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Введите имя артиста"
            />
          </div>
          <div className="form-group">
            <label>Описание (необязательно)</label>
            <textarea
              value={artistBio}
              onChange={(e) => setArtistBio(e.target.value)}
              placeholder="Расскажите о себе"
              rows={3}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <FiPlus size={16} /> {loading ? 'Создание...' : 'Создать профиль'}
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h2>Существующие артисты</h2>
        <div className="artists-list">
          {artistsList.length === 0 ? (
            <p className="no-data">Пока нет артистов. Создайте выше.</p>
          ) : (
            artistsList.map((artist) => (
              <div key={artist.id} className="artist-item">
                <div className="artist-info">
                  <span className="artist-name">{artist.name}</span>
                  {artist.verified && <FiCheck className="verified-icon" />}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="admin-section">
        <h2>Быстрые действия</h2>
        <div className="quick-links">
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            <FiUpload size={16} /> Загрузить трек
          </button>
        </div>
      </section>
    </div>
  );
};

export default Admin;
