import React from 'react';
import { search as searchApi } from '../services';
import { Track, Genre } from '../types';
import TrackCard from '../components/TrackCard';
import { FiRadio, FiRefreshCw } from 'react-icons/fi';

const Radio: React.FC = () => {
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = React.useState<string | null>(null);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    searchApi.genres().then(setGenres).catch(console.error);
    loadRadio();
  }, []);

  const loadRadio = async (genreId?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (genreId) params.genre = genreId;
      const result = await fetch(`/api/search/radio${genreId ? `?genre=${genreId}` : ''}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (!result.ok) throw new Error('Failed to load radio');
      const data = await result.json();
      setTracks(Array.isArray(data) ? data : []);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreClick = (genreId: string | null) => {
    setSelectedGenre(genreId);
    loadRadio(genreId || undefined);
  };

  return (
    <div className="radio-page">
      <div className="radio-header">
        <div className="radio-title">
          <FiRadio size={32} />
          <div>
            <h1>Радио</h1>
            <p>Автоматические подборки по вашим предпочтениям</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={() => loadRadio(selectedGenre || undefined)}>
          <FiRefreshCw size={16} /> Обновить
        </button>
      </div>

      <div className="radio-genres">
        <button
          className={`genre-pill ${selectedGenre === null ? 'active' : ''}`}
          onClick={() => handleGenreClick(null)}
        >
          Все жанры
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            className={`genre-pill ${selectedGenre === g.id ? 'active' : ''}`}
            onClick={() => handleGenreClick(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="radio-content">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : tracks.length > 0 ? (
          <div className="tracks-grid">
            {tracks.map((track, i) => (
              <TrackCard key={track.id} track={track} tracks={tracks} showIndex index={i} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiRadio size={48} />
            <p>Загрузите треки, чтобы начать слушать радио</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Radio;
