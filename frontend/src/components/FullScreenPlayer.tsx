import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { tracks as tracksApi, search } from '../services';
import { useAuth } from '../context/AuthContext';
import { Track } from '../types';
import toast from 'react-hot-toast';
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiRepeat, FiShuffle, FiHeart, FiVolume2, FiVolumeX,
  FiChevronDown, FiList, FiActivity, FiX, FiPlus,
  FiMusic, FiDisc, FiClock, FiHeadphones,
} from 'react-icons/fi';
import AudioVisualizer from './AudioVisualizer';

const MOOD_LABELS: Record<string, string> = {
  sad: 'Грустное',
  happy: 'Весёлое',
  aggressive: 'Агрессивное',
  romantic: 'Романтичное',
  calm: 'Спокойное',
  energetic: 'Энергичное',
};

const MOOD_EMOJI: Record<string, string> = {
  sad: '😢',
  happy: '🎉',
  aggressive: '🔥',
  romantic: '💕',
  calm: '☮️',
  energetic: '⚡',
};

const THEME_LABELS: Record<string, string> = {
  love: 'Любовь',
  breakup: 'Разлука',
  friendship: 'Дружба',
  sadness: 'Грусть',
  joy: 'Радость',
  life: 'Жизнь',
  freedom: 'Свобода',
  city: 'Город',
  nature: 'Природа',
  nostalgia: 'Ностальгия',
  melancholy: 'Меланхолия',
  hope: 'Надежда',
  anxiety: 'Тревога',
  loneliness: 'Одиночество',
  passion: 'Страсть',
  protest: 'Протест',
  self_discovery: 'Самопознание',
  secret: 'Тайна',
  time: 'Время',
};

const AudioFeatureBar: React.FC<{ label: string; value: number | null; icon: React.ReactNode }> = ({ label, value, icon }) => {
  if (value == null) {
    return (
      <div className="audio-feature-bar audio-feature-empty">
        <div className="audio-feature-header">
          <span className="audio-feature-icon">{icon}</span>
          <span className="audio-feature-label">{label}</span>
          <span className="audio-feature-no-data">Нет данных</span>
        </div>
      </div>
    );
  }
  const percent = Math.round(value * 100);
  return (
    <div className="audio-feature-bar">
      <div className="audio-feature-header">
        <span className="audio-feature-icon">{icon}</span>
        <span className="audio-feature-label">{label}</span>
        <span className="audio-feature-value">{percent}%</span>
      </div>
      <div className="audio-feature-track">
        <div className="audio-feature-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const FullScreenPlayer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    currentTrack, isPlaying, progress, duration, volume,
    repeat, shuffle, pause, resume, next, previous,
    seek, setVolume, toggleRepeat, toggleShuffle, queue,
    playFromQueue, currentIndex, addToQueue, play,
    analyserNode, showVisualizer, toggleVisualizer,
  } = usePlayer();
  const { user } = useAuth();
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(0);
  const [showQueue, setShowQueue] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const prevVolumeRef = React.useRef(0.7);
  const [similarTracks, setSimilarTracks] = React.useState<Track[]>([]);
  const [loadingSimilar, setLoadingSimilar] = React.useState(false);

  React.useEffect(() => {
    if (currentTrack) {
      setLikeCount(currentTrack.likes);
      setLiked(currentTrack.isLiked || false);
      setShowInfo(false);
      setSimilarTracks([]);
    }
  }, [currentTrack?.id]);

  React.useEffect(() => {
    if (showInfo && currentTrack && similarTracks.length === 0 && !loadingSimilar) {
      setLoadingSimilar(true);
      search.similar(currentTrack.id)
        .then((tracks) => setSimilarTracks(tracks.slice(0, 5)))
        .catch(() => {})
        .finally(() => setLoadingSimilar(false));
    }
  }, [showInfo, currentTrack?.id]);

  const handleLike = async () => {
    if (!user || !currentTrack) return;
    try {
      const result = await tracksApi.like(currentTrack.id);
      setLiked(result.liked);
      setLikeCount(result.likes);
    } catch {}
  };

  const handleAddToQueue = () => {
    if (!currentTrack) return;
    if (queue.some((t) => t.id === currentTrack.id)) {
      toast('Трек уже в очереди', { icon: 'ℹ️' });
      return;
    }
    addToQueue(currentTrack);
    toast.success('Добавлено в очередь');
  };

  if (!currentTrack) return null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fullscreen-player">
      <div className="fullscreen-bg" style={currentTrack.coverUrl ? { backgroundImage: `url(${currentTrack.coverUrl})` } : {}} />

      <div className="fullscreen-header">
        <button type="button" className="fullscreen-close" onClick={onClose}>
          <FiChevronDown size={28} />
        </button>
        <span className="fullscreen-from">Сейчас играет</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className={`fullscreen-queue-btn ${showVisualizer ? 'active' : ''}`} onClick={toggleVisualizer}>
            <FiActivity size={22} />
          </button>
          <button type="button" className="fullscreen-queue-btn" onClick={() => setShowQueue(!showQueue)}>
            <FiList size={22} />
          </button>
        </div>
      </div>

      <div className="fullscreen-content">
        <div className="fullscreen-cover">
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt={currentTrack.title} />
          ) : (
            <div className="cover-placeholder fullscreen-placeholder">♪</div>
          )}
        </div>

        {showVisualizer && (
          <div className="audio-visualizer-full">
            <AudioVisualizer
              analyserNode={analyserNode}
              isPlaying={isPlaying}
              height={120}
              barCount={64}
            />
          </div>
        )}

        <div className="fullscreen-info">
          <h2 className="fullscreen-title">{currentTrack.title}</h2>
          <p className="fullscreen-artist">{currentTrack.Artist?.name || 'Неизвестный артист'}</p>
        </div>

        {!showVisualizer && (
        <div className="fullscreen-progress">
          <div className="progress-track" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            seek((x / rect.width) * duration);
          }}>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            <div className="progress-thumb" style={{ left: `${progressPercent}%` }} />
          </div>
          <div className="progress-times">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        )}

        <div className="fullscreen-controls">
          <button
            type="button"
            className={`ctrl-btn ${shuffle ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
          >
            <FiShuffle size={22} />
          </button>
          <button type="button" className="ctrl-btn" onClick={(e) => { e.stopPropagation(); previous(); }}>
            <FiSkipBack size={26} />
          </button>
          <button type="button" className="ctrl-btn play-main" onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}>
            {isPlaying ? <FiPause size={28} /> : <FiPlay size={28} />}
          </button>
          <button type="button" className="ctrl-btn" onClick={(e) => { e.stopPropagation(); next(); }}>
            <FiSkipForward size={26} />
          </button>
          <button
            type="button"
            className={`ctrl-btn ${repeat !== 'off' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
          >
            <FiRepeat size={22} />
            {repeat === 'one' && <span className="repeat-one-badge">1</span>}
          </button>
        </div>

        <div className="fullscreen-volume">
          <button type="button" className="ctrl-btn-sm" onClick={() => {
            if (isMuted) {
              setVolume(prevVolumeRef.current);
            } else {
              prevVolumeRef.current = volume;
              setVolume(0);
            }
            setIsMuted(!isMuted);
          }}>
            {isMuted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
          </button>
          <input
            type="range" min="0" max="1" step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
            className="volume-slider-full"
          />
        </div>

        <div className="fullscreen-actions">
          {user && (
            <button type="button" className={`action-pill ${liked ? 'active' : ''}`} onClick={handleLike}>
              <FiHeart size={16} fill={liked ? 'currentColor' : 'none'} />
              <span>{likeCount}</span>
            </button>
          )}
          <button type="button" className="action-pill" onClick={handleAddToQueue} title="Добавить в очередь">
            <FiPlus size={16} />
            <span>Очередь</span>
          </button>
          <button
            type="button"
            className={`action-pill ${showInfo ? 'active' : ''}`}
            onClick={() => setShowInfo(!showInfo)}
          >
            <FiMusic size={16} />
            <span>Подробнее</span>
          </button>
        </div>

        {currentTrack.mood && (
          <div className="fullscreen-mood-badge">
            <span>{MOOD_EMOJI[currentTrack.mood] || '🎵'}</span>
            <span>{MOOD_LABELS[currentTrack.mood] || currentTrack.mood}</span>
          </div>
        )}

        {(currentTrack.tags?.length > 0 || currentTrack.themes?.length > 0) && (
          <div className="fullscreen-tags">
            {currentTrack.Genre && (
              <span className="tag tag-genre">{currentTrack.Genre.name}</span>
            )}
            {currentTrack.explicit && (
              <span className="tag tag-explicit">E</span>
            )}
            {currentTrack.mood && (
              <span className="tag tag-mood">{MOOD_LABELS[currentTrack.mood] || currentTrack.mood}</span>
            )}
            {currentTrack.themes?.map((theme) => (
              <span key={theme} className="tag tag-theme">{THEME_LABELS[theme] || theme}</span>
            ))}
            {currentTrack.tags?.map((tag) => (
              <span key={tag} className="tag tag-tag">{tag}</span>
            ))}
          </div>
        )}

        {showInfo && (
          <div className="fullscreen-track-info">
            <div className="track-info-stats">
              <div className="stat-item">
                <FiHeadphones size={14} />
                <span>{currentTrack.plays.toLocaleString()} прослушиваний</span>
              </div>
              <div className="stat-item">
                <FiHeart size={14} />
                <span>{currentTrack.likes.toLocaleString()} понравилось</span>
              </div>
              {currentTrack.duration > 0 && (
                <div className="stat-item">
                  <FiClock size={14} />
                  <span>{formatTime(currentTrack.duration)}</span>
                </div>
              )}
              {currentTrack.Album && (
                <div className="stat-item">
                  <FiDisc size={14} />
                  <span>{currentTrack.Album.title}</span>
                </div>
              )}
            </div>

            <div className="audio-features">
              <h4>Характеристики</h4>
              <AudioFeatureBar label="Энергия" value={currentTrack.energy} icon={<FiActivity size={12} />} />
              <AudioFeatureBar label="Настроение" value={currentTrack.valence} icon={<span>😊</span>} />
              <AudioFeatureBar label="Танцевальность" value={currentTrack.danceability} icon={<span>💃</span>} />
              <AudioFeatureBar label="Акустика" value={currentTrack.acousticness} icon={<FiMusic size={12} />} />
            </div>

            {similarTracks.length > 0 && (
              <div className="similar-tracks">
                <h4>Похожие треки</h4>
                <div className="similar-list">
                  {similarTracks.map((t) => (
                    <div
                      key={t.id}
                      className="similar-item"
                      onClick={() => {
                        const idx = queue.findIndex((q) => q.id === t.id);
                        if (idx !== -1) {
                          playFromQueue(idx);
                        } else {
                          play(t, [t, ...similarTracks.filter((s) => s.id !== t.id)]);
                        }
                      }}
                    >
                      <div className="similar-cover">
                        {t.coverUrl ? (
                          <img src={t.coverUrl} alt={t.title} />
                        ) : (
                          <div className="cover-placeholder similar-placeholder">♪</div>
                        )}
                      </div>
                      <div className="similar-info">
                        <span className="similar-title">{t.title}</span>
                        <span className="similar-artist">{t.Artist?.name || 'Неизвестный'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loadingSimilar && (
              <div className="similar-loading">Загрузка похожих треков...</div>
            )}
          </div>
        )}

        {currentTrack.lyrics && (
          <div className="fullscreen-lyrics">
            <h3>Текст песни</h3>
            <pre>{currentTrack.lyrics}</pre>
          </div>
        )}
      </div>

      {showQueue && (
        <div className="fullscreen-queue-panel">
          <div className="queue-header">
            <h3>Очередь</h3>
            <button type="button" className="queue-close-btn" onClick={() => setShowQueue(false)}>
              <FiX size={20} />
            </button>
          </div>
          <div className="queue-list">
            {queue.length === 0 ? (
              <div className="queue-empty">Очередь пуста</div>
            ) : (
              queue.map((t, i) => (
                <div
                  key={`${t.id}-${i}`}
                  className={`queue-item ${i === currentIndex ? 'active' : ''}`}
                  onClick={() => playFromQueue(i)}
                >
                  <div className="queue-item-cover">
                    {t.coverUrl ? (
                      <img src={t.coverUrl} alt={t.title} />
                    ) : (
                      <div className="cover-placeholder queue-placeholder">♪</div>
                    )}
                    <div className="queue-item-play">
                      {i === currentIndex && isPlaying ? (
                        <FiPause size={12} color="white" />
                      ) : (
                        <FiPlay size={12} color="white" />
                      )}
                    </div>
                  </div>
                  <div className="queue-item-info">
                    <span className="queue-title">{t.title}</span>
                    <span className="queue-artist">{t.Artist?.name || 'Неизвестный артист'}</span>
                  </div>
                  <span className="queue-item-number">{i + 1}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FullScreenPlayer;
