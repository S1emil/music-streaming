import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tracks as tracksApi, artists as artistsApi, search as searchApi } from '../services';
import { Track } from '../types';
import toast from 'react-hot-toast';
import { FiUpload, FiMusic, FiSearch, FiLoader, FiImage, FiX, FiTag } from 'react-icons/fi';

const UploadTrack: React.FC = () => {
  const { } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState('');
  const [artistId, setArtistId] = React.useState('');
  const [customArtistName, setCustomArtistName] = React.useState('');
  const [useCustomArtist, setUseCustomArtist] = React.useState(false);
  const [hasFeat, setHasFeat] = React.useState(false);
  const [featArtistId, setFeatArtistId] = React.useState('');
  const [featCustomName, setFeatCustomName] = React.useState('');
  const [useCustomFeat, setUseCustomFeat] = React.useState(false);
  const [genreIds, setGenreIds] = React.useState<string[]>([]);
  const [duration, setDuration] = React.useState(0);
  const [explicit, setExplicit] = React.useState(false);
  const [lyrics, setLyrics] = React.useState('');
  const [coverUrl, setCoverUrl] = React.useState('');
  const [coverPreview, setCoverPreview] = React.useState('');
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [fetchingLyrics, setFetchingLyrics] = React.useState(false);
  const [fetchingCover, setFetchingCover] = React.useState(false);
  const [artists, setArtists] = React.useState<any[]>([]);
  const [genres, setGenres] = React.useState<any[]>([]);
  const [customGenreName, setCustomGenreName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [uploadedTrackId, setUploadedTrackId] = React.useState<string | null>(null);
  const [uploadedTrack, setUploadedTrack] = React.useState<Track | null>(null);

  React.useEffect(() => {
    Promise.all([artistsApi.list(), searchApi.genres()])
      .then(([a, g]) => { setArtists(a); setGenres(g); })
      .catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const audio = new Audio(URL.createObjectURL(f));
      audio.onloadedmetadata = () => setDuration(Math.floor(audio.duration));
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const url = URL.createObjectURL(f);
      setCoverPreview(url);
      setCoverUrl('');
      setCoverFile(f);
    }
  };

  const handleFetchCover = async () => {
    if (!title.trim()) {
      toast.error('Сначала введите название трека');
      return;
    }
    setFetchingCover(true);
    try {
      const artistName = useCustomArtist ? customArtistName : (artists.find(a => a.id === artistId)?.name || '');
      const resp = await fetch(`/api/tracks/search/cover?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artistName)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.coverUrl) {
          setCoverUrl(data.coverUrl);
          setCoverPreview('');
          toast.success('Обложка найдена');
        } else {
          toast.error('Обложка не найдена');
        }
      } else {
        toast.error('Не удалось найти обложку');
      }
    } catch {
      toast.error('Ошибка поиска обложки');
    } finally {
      setFetchingCover(false);
    }
  };

  const handleToggleGenre = (id: string) => {
    setGenreIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const handleAddCustomGenre = async () => {
    if (!customGenreName.trim()) return;
    try {
      const newGenre = await searchApi.createGenre(customGenreName.trim());
      if (!genres.find((g) => g.id === newGenre.id)) {
        setGenres((prev) => [...prev, newGenre]);
      }
      if (!genreIds.includes(newGenre.id)) {
        setGenreIds((prev) => [...prev, newGenre.id]);
      }
      setCustomGenreName('');
    } catch {
      toast.error('Не удалось создать жанр');
    }
  };

  const handleFetchLyrics = async () => {
    if (!title.trim()) { toast.error('Сначала введите название трека'); return; }
    setFetchingLyrics(true);
    try {
      const result = await tracksApi.fetchLyricsBySearch(title, customArtistName || '');
      setLyrics(result.lyrics);
      toast.success('Текст получен с Genius');
    } catch (error: any) {
      toast.error(error.message || 'Не удалось найти текст');
    } finally {
      setFetchingLyrics(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) { toast.error('Заполните все обязательные поля'); return; }

    let finalArtistId = artistId;
    if (useCustomArtist && customArtistName.trim()) {
      try {
        const resp = await fetch('/api/artists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ name: customArtistName }),
        });
        const newArtist = await resp.json();
        finalArtistId = newArtist.id;
      } catch { toast.error('Не удалось создать артиста'); return; }
    }
    if (!finalArtistId) { toast.error('Выберите или создайте артиста'); return; }

    let finalTitle = title;
    if (hasFeat) {
      let featName = '';
      if (useCustomFeat && featCustomName.trim()) {
        try {
          const resp = await fetch('/api/artists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ name: featCustomName }),
          });
          const newArtist = await resp.json();
          featName = newArtist.name;
        } catch { toast.error('Не удалось создать фит-артиста'); return; }
      } else if (featArtistId) {
        const featArtist = artists.find((a) => a.id === featArtistId);
        featName = featArtist?.name || '';
      }
      if (!featName) { toast.error('Выберите или создайте фит-артиста'); return; }
      finalTitle = `${title} (feat. ${featName})`;
    }

    setLoading(true);
    try {
      let finalCoverUrl = coverUrl;

      if (coverFile) {
        const coverFormData = new FormData();
        coverFormData.append('cover', coverFile);
        const coverResp = await fetch('/api/tracks/upload-cover', {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: coverFormData,
        });
        if (coverResp.ok) {
          const coverData = await coverResp.json();
          finalCoverUrl = coverData.coverUrl;
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', finalTitle);
      formData.append('artistId', finalArtistId);
      formData.append('duration', duration.toString());
      formData.append('explicit', explicit.toString());
      if (genreIds.length > 0) { formData.append('genreIds', genreIds.join(',')); formData.append('genreId', genreIds[0]); }
      if (lyrics) formData.append('lyrics', lyrics);
      if (finalCoverUrl) formData.append('coverUrl', finalCoverUrl);

      const result = await tracksApi.upload(formData);
      setUploadedTrackId(result.id);
      setUploadedTrack(result);
      toast.success('Трек загружен!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка загрузки');
    } finally { setLoading(false); }
  };

  if (uploadedTrackId) {
    return (
      <div className="upload-success">
        <FiMusic size={48} />
        <h2>Трек загружен!</h2>
        <p>Ваш трек теперь доступен.</p>

        {uploadedTrack && uploadedTrack.themes && uploadedTrack.themes.length > 0 && (
          <div className="detected-themes">
            <div className="themes-header">
              <FiTag size={16} />
              <span>Определённые темы:</span>
            </div>
            <div className="themes-list">
              {uploadedTrack.themes.map((theme, i) => (
                <span key={i} className="theme-badge">{theme}</span>
              ))}
              {uploadedTrack.mood && (
                <span className="theme-badge mood">{uploadedTrack.mood}</span>
              )}
            </div>
          </div>
        )}

        <div className="upload-actions">
          <button className="btn btn-primary" onClick={() => navigate(`/track/${uploadedTrackId}`)}>Посмотреть трек</button>
          <button className="btn btn-outline" onClick={() => { setUploadedTrackId(null); setUploadedTrack(null); setFile(null); setTitle(''); setLyrics(''); setArtistId(''); setGenreIds([]); setCoverUrl(''); setCoverPreview(''); setCoverFile(null); }}>Загрузить ещё</button>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <h1>Загрузка трека</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-section">
          <h3>Аудио файл</h3>
          <div className="file-upload">
            <input type="file" accept="audio/*" onChange={handleFileChange} id="file-input" hidden />
            <label htmlFor="file-input" className={`file-label ${file ? 'has-file' : ''}`}>
              <FiUpload size={24} />
              <span>{file ? file.name : 'Выберите аудио файл'}</span>
              {duration > 0 && <span className="duration">Длительность: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>}
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Обложка трека</h3>
          <div className="cover-upload-row">
            <div className="cover-preview-box">
              {coverPreview ? (
                <div className="cover-preview">
                  <img src={coverPreview} alt="Preview" />
                  <button type="button" className="cover-remove" onClick={() => setCoverPreview('')}><FiX size={14} /></button>
                </div>
              ) : coverUrl ? (
                <div className="cover-preview">
                  <img src={coverUrl} alt="Cover" />
                  <button type="button" className="cover-remove" onClick={() => setCoverUrl('')}><FiX size={14} /></button>
                </div>
              ) : (
                <div className="cover-placeholder-box"><FiImage size={32} /></div>
              )}
            </div>
            <div className="cover-actions">
              <input type="file" accept="image/*" onChange={handleCoverFileChange} id="cover-input" hidden />
              <label htmlFor="cover-input" className="btn btn-outline btn-sm"><FiImage size={14} /> Загрузить обложку</label>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleFetchCover} disabled={fetchingCover}>
                {fetchingCover ? <><FiLoader size={14} className="spin" /> Поиск...</> : <><FiSearch size={14} /> Найти на Genius</>}
              </button>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Информация о треке</h3>
          <div className="form-group">
            <label>Название *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Введите название трека" required />
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input type="checkbox" checked={useCustomArtist} onChange={e => setUseCustomArtist(e.target.checked)} />
              <span className="toggle-switch"></span>
              Ввести имя артиста вручную
            </label>
          </div>

          {useCustomArtist ? (
            <div className="form-group">
              <label>Имя артиста *</label>
              <input type="text" value={customArtistName} onChange={e => setCustomArtistName(e.target.value)} placeholder="Введите имя артиста" />
            </div>
          ) : (
            <div className="form-group">
              <label>Артист *</label>
              <div className="select-wrapper">
                <select value={artistId} onChange={e => setArtistId(e.target.value)}>
                  <option value="">Выберите артиста</option>
                  {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="toggle-label">
              <input type="checkbox" checked={hasFeat} onChange={e => setHasFeat(e.target.checked)} />
              <span className="toggle-switch"></span>
              Есть фит (Feat.)
            </label>
          </div>

          {hasFeat && (
            <>
              <div className="form-group">
                <label className="toggle-label">
                  <input type="checkbox" checked={useCustomFeat} onChange={e => setUseCustomFeat(e.target.checked)} />
                  <span className="toggle-switch"></span>
                  Ввести имя фит-артиста вручную
                </label>
              </div>
              {useCustomFeat ? (
                <div className="form-group">
                  <label>Имя фит-артиста *</label>
                  <input type="text" value={featCustomName} onChange={e => setFeatCustomName(e.target.value)} placeholder="Введите имя фит-артиста" />
                </div>
              ) : (
                <div className="form-group">
                  <label>Фит-артист *</label>
                  <div className="select-wrapper">
                    <select value={featArtistId} onChange={e => setFeatArtistId(e.target.value)}>
                      <option value="">Выберите фит-артиста</option>
                      {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Жанры (можно выбрать несколько)</label>
            <div className="genre-chips">
              {genres.map(g => (
                <button key={g.id} type="button" className={`genre-chip ${genreIds.includes(g.id) ? 'active' : ''}`} onClick={() => handleToggleGenre(g.id)}>{g.name}</button>
              ))}
            </div>
            <div className="custom-genre-row">
              <input
                type="text"
                value={customGenreName}
                onChange={e => setCustomGenreName(e.target.value)}
                placeholder="Свой жанр..."
                className="custom-genre-input"
              />
              <button type="button" className="btn btn-outline btn-sm" onClick={handleAddCustomGenre} disabled={!customGenreName.trim()}>
                Добавить
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input type="checkbox" checked={explicit} onChange={e => setExplicit(e.target.checked)} />
              <span className="toggle-switch"></span>
              Содержит нецензурную лексику
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="lyrics-section-header">
            <h3>Текст песни</h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleFetchLyrics} disabled={fetchingLyrics}>
              {fetchingLyrics ? <><FiLoader size={14} className="spin" /> Поиск...</> : <><FiSearch size={14} /> Получить с Genius</>}
            </button>
          </div>
          <textarea className="lyrics-input" value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder="Введите текст песни или нажмите «Получить с Genius»" rows={10} />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading || !file || !title}>
          <FiUpload size={18} /> {loading ? 'Загрузка...' : 'Загрузить трек'}
        </button>
      </form>
    </div>
  );
};

export default UploadTrack;
