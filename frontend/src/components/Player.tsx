import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiRepeat, FiShuffle, FiVolume2, FiVolumeX, FiActivity,
} from 'react-icons/fi';
import AudioVisualizer from './AudioVisualizer';

interface PlayerBarProps {
  onExpand: () => void;
}

const Player: React.FC<PlayerBarProps> = ({ onExpand }) => {
  const {
    currentTrack, isPlaying, progress, duration, volume,
    repeat, shuffle, pause, resume, next, previous,
    seek, setVolume, toggleRepeat, toggleShuffle,
    analyserNode, showVisualizer, toggleVisualizer,
  } = usePlayer();

  const [isMuted, setIsMuted] = React.useState(false);
  const prevVolumeRef = React.useRef(0.7);

  if (!currentTrack) return null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="player">
      <div className="player-track" onClick={onExpand} style={{ cursor: 'pointer' }}>
        <div className="player-cover">
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt={currentTrack.title} />
          ) : (
            <div className="cover-placeholder">♪</div>
          )}
        </div>
        <div className="player-info">
          <div className="player-title">{currentTrack.title}</div>
          <div className="player-artist">{currentTrack.Artist?.name || 'Неизвестный артист'}</div>
        </div>
      </div>

      <div className="player-controls">
        {showVisualizer && (
          <AudioVisualizer
            analyserNode={analyserNode}
            isPlaying={isPlaying}
            height={40}
            barCount={48}
            className="audio-visualizer-mini"
          />
        )}
        <div className="control-buttons">
          <button
            type="button"
            className={`player-btn ${shuffle ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
            aria-label="Перемешать"
          >
            <FiShuffle size={18} />
          </button>
          <button type="button" className="player-btn" onClick={(e) => { e.stopPropagation(); previous(); }} aria-label="Предыдущий">
            <FiSkipBack size={20} />
          </button>
          <button
            type="button"
            className="player-btn play-btn-main"
            onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
            aria-label={isPlaying ? 'Пауза' : 'Играть'}
          >
            {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
          </button>
          <button type="button" className="player-btn" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Следующий">
            <FiSkipForward size={20} />
          </button>
          <button
            type="button"
            className={`player-btn ${repeat !== 'off' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
            aria-label={`Повтор: ${repeat}`}
          >
            <FiRepeat size={18} />
            {repeat === 'one' && <span className="repeat-one-indicator">1</span>}
          </button>
          <button
            type="button"
            className={`player-btn ${showVisualizer ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleVisualizer(); }}
            aria-label="Визуализатор"
          >
            <FiActivity size={18} />
          </button>
        </div>

        {!showVisualizer && (
        <div className="progress-bar">
          <span className="time">{formatTime(progress)}</span>
          <div className="progress-track-mini" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            seek((x / rect.width) * duration);
          }}>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="time">{formatTime(duration)}</span>
        </div>
        )}
      </div>

      <div className="player-volume">
        <button type="button" className="player-btn" onClick={() => {
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
          className="slider volume-slider"
        />
      </div>
    </div>
  );
};

export default Player;
