import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { playlists, search } from '../services';
import { usePlayer } from '../context/PlayerContext';
import { Track, Genre } from '../types';
import { FiPlay, FiPause, FiPlus, FiZap } from 'react-icons/fi';

const MOODS = [
  { key: 'sad', emoji: '😢', label: 'Грустное' },
  { key: 'happy', emoji: '🎉', label: 'Весёлое' },
  { key: 'aggressive', emoji: '🔥', label: 'Агрессивное' },
  { key: 'romantic', emoji: '💕', label: 'Романтичное' },
  { key: 'calm', emoji: '☮️', label: 'Спокойное' },
  { key: 'energetic', emoji: '⚡', label: 'Энергичное' },
];

const GeneratePlaylist: React.FC = () => {
  const navigate = useNavigate();
  const { play, currentTrack, isPlaying } = usePlayer();
  const [selectedMood, setSelectedMood] = React.useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = React.useState<string>('');
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [suggestedName, setSuggestedName] = React.useState('');
  const [suggestedDescription, setSuggestedDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showSave, setShowSave] = React.useState(false);
  const [playlistName, setPlaylistName] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    search.genres().then(setGenres).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await playlists.generate({
        mood: selectedMood || undefined,
        genreId: selectedGenre || undefined,
        limit: 30,
      });
      setTracks(result.tracks);
      setSuggestedName(result.suggestedName);
      setSuggestedDescription(result.suggestedDescription);
      setPlaylistName(result.suggestedName);
      setShowSave(false);
    } catch {
      toast.error('Ошибка при генерации плейлиста');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!playlistName.trim()) {
      toast.error('Введите название плейлиста');
      return;
    }
    setSaving(true);
    try {
      const playlist = await playlists.saveGenerated({
        name: playlistName,
        description: suggestedDescription,
        trackIds: tracks.map((t) => t.id),
      });
      toast.success('Плейлист сохранён!');
      navigate(`/playlist/${playlist.id}`);
    } catch {
      toast.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handlePlay = (track: Track) => {
    play(track, tracks);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="generate-page">
      <div className="generate-header">
        <h1><FiZap size={28} /> Генератор плейлистов</h1>
        <p>Подберём музыку под ваше настроение</p>
      </div>

      <div className="generate-section">
        <h3>Настроение</h3>
        <div className="mood-grid">
          {MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`mood-card ${selectedMood === m.key ? 'selected' : ''}`}
              onClick={() => setSelectedMood(selectedMood === m.key ? null : m.key)}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="generate-section">
        <h3>Жанр (необязательно)</h3>
        <div className="genre-chips">
          <button
            type="button"
            className={`genre-chip ${!selectedGenre ? 'active' : ''}`}
            onClick={() => setSelectedGenre('')}
          >
            Все
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`genre-chip ${selectedGenre === g.id ? 'active' : ''}`}
              onClick={() => setSelectedGenre(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block generate-btn"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Генерация...' : 'Сгенерировать плейлист'}
      </button>

      {tracks.length > 0 && (
        <div className="generate-results">
          <div className="generate-results-header">
            <div>
              <h2>{suggestedName}</h2>
              <p className="generate-results-meta">{tracks.length} треков</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowSave(!showSave)}
            >
              <FiPlus size={16} /> Сохранить как плейлист
            </button>
          </div>

          {showSave && (
            <div className="save-form">
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Название плейлиста"
                className="save-input"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          )}

          <div className="tracks-list">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className={`track-list-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                onClick={() => handlePlay(track)}
              >
                <span className="track-index">{i + 1}</span>
                <div className="track-cover">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={track.title} />
                  ) : (
                    <div className="cover-placeholder">♪</div>
                  )}
                  <div className="play-overlay">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <FiPause size={16} color="white" />
                    ) : (
                      <FiPlay size={16} color="white" />
                    )}
                  </div>
                </div>
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.Artist?.name || 'Неизвестный артист'}</div>
                </div>
                <span className="track-duration">{formatTime(track.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tracks.length === 0 && !loading && (
        <div className="empty-state">
          <FiZap size={48} />
          <p>Выберите настроение или жанр и нажмите «Сгенерировать»</p>
        </div>
      )}
    </div>
  );
};

export default GeneratePlaylist;
