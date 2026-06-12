import React from 'react';
import { tracks as tracksApi, search as searchApi } from '../services';
import { Track, Genre } from '../types';
import toast from 'react-hot-toast';
import { FiX, FiSave, FiLoader } from 'react-icons/fi';

interface EditTrackModalProps {
  track: Track;
  onClose: () => void;
  onSave: (updated: Track) => void;
}

const EditTrackModal: React.FC<EditTrackModalProps> = ({ track, onClose, onSave }) => {
  const [title, setTitle] = React.useState(track.title);
  const [lyrics, setLyrics] = React.useState(track.lyrics || '');
  const [coverUrl, setCoverUrl] = React.useState(track.coverUrl || '');
  const [genreIds, setGenreIds] = React.useState<string[]>([]);
  const [explicit, setExplicit] = React.useState(track.explicit);
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetchingLyrics, setFetchingLyrics] = React.useState(false);

  React.useEffect(() => {
    searchApi.genres().then(setGenres).catch(console.error);
    if (track.Genres && track.Genres.length > 0) {
      setGenreIds(track.Genres.map((g) => g.id));
    }
  }, [track]);

  const handleToggleGenre = (id: string) => {
    setGenreIds((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const handleFetchLyrics = async () => {
    setFetchingLyrics(true);
    try {
      const result = await tracksApi.fetchLyrics(track.id);
      setLyrics(result.lyrics);
      toast.success('Текст получен');
    } catch {
      toast.error('Не удалось получить текст');
    } finally {
      setFetchingLyrics(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await tracksApi.update(track.id, {
        title,
        lyrics,
        coverUrl,
        genreIds: genreIds.join(','),
        explicit,
      });
      onSave(updated);
      toast.success('Трек обновлён');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>Редактировать трек</h3>
          <button className="modal-close" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Название</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Обложка (URL)</label>
            <input type="text" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
            {coverUrl && <img src={coverUrl} alt="Cover" style={{ width: 80, height: 80, borderRadius: 8, marginTop: 8, objectFit: 'cover' }} />}
          </div>

          <div className="form-group">
            <label>Жанры</label>
            <div className="genre-chips">
              {genres.map((g) => (
                <button key={g.id} type="button" className={`genre-chip ${genreIds.includes(g.id) ? 'active' : ''}`} onClick={() => handleToggleGenre(g.id)}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)} />
              <span className="toggle-switch"></span>
              18+
            </label>
          </div>

          <div className="form-group">
            <div className="lyrics-section-header">
              <label style={{ margin: 0 }}>Текст песни</label>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleFetchLyrics} disabled={fetchingLyrics}>
                {fetchingLyrics ? <FiLoader size={14} className="spin" /> : 'Обновить с Genius'}
              </button>
            </div>
            <textarea className="lyrics-input" value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={8} style={{ marginTop: 8 }} />
          </div>

          <button className="btn btn-primary btn-block" onClick={handleSave} disabled={loading}>
            <FiSave size={16} /> {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTrackModal;
