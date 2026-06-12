import React, { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { Track } from '../types';
import { tracks } from '../services';
import { analyzeAudio } from '../services/audioAnalyzer';

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  repeat: 'off' | 'one' | 'once';
  shuffle: boolean;
  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
  analyserNode: AnalyserNode | null;
  showVisualizer: boolean;
  toggleVisualizer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceConnectedRef = useRef(false);
  const analyzedTracksRef = useRef(new Set<string>());
  const MAX_ANALYZED_CACHE = 200;

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'once'>('off');
  const [shuffle, setShuffle] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);

  const currentIndexRef = useRef(0);

  const ensureAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return null;

    if (analyserRef.current && sourceConnectedRef.current) {
      return analyserRef.current;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
      }

      if (!sourceConnectedRef.current) {
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
        sourceConnectedRef.current = true;
      }

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      return analyserRef.current;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const analyzeTrack = useCallback((track: Track) => {
    if (track.energy != null || track.valence != null) return;

    if (analyzedTracksRef.current.size > MAX_ANALYZED_CACHE) {
      analyzedTracksRef.current.clear();
    }

    tracks.get(track.id).then((fresh) => {
      if (fresh.energy != null || fresh.valence != null) {
        const features = { energy: fresh.energy, valence: fresh.valence, danceability: fresh.danceability, acousticness: fresh.acousticness, tempo: fresh.tempo };
        const update = (t: Track) => t.id === track.id ? { ...t, ...features } : t;
        setCurrentTrack((prev) => prev?.id === track.id ? { ...prev, ...features } : prev);
        setQueue((prev) => prev.map(update));
        analyzedTracksRef.current.add(track.id);
        return;
      }

      if (analyzedTracksRef.current.has(track.id)) return;
      analyzedTracksRef.current.add(track.id);

      analyzeAudio(track.filePath).then((features) => {
        tracks.updateFeatures(track.id, features).catch(() => {});
        const update = (t: Track) => t.id === track.id ? { ...t, ...features } : t;
        setCurrentTrack((prev) => prev?.id === track.id ? { ...prev, ...features } : prev);
        setQueue((prev) => prev.map(update));
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  const play = useCallback((track: Track, newQueue?: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (newQueue) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      currentIndexRef.current = idx;
      setCurrentIndex(idx);
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    tracks.play(track.id).catch(() => {});
    audio.src = track.filePath;
    audio.load();
    audio.play().catch(() => {});
    analyzeTrack(track);
  }, [analyzeTrack]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    setIsPlaying(true);
    audioRef.current?.play().catch(() => {});
  }, []);

  const next = useCallback(() => {
    const q = queue;
    if (q.length === 0) return;

    let idx: number;
    if (shuffle) {
      if (q.length === 1) {
        idx = 0;
      } else {
        do {
          idx = Math.floor(Math.random() * q.length);
        } while (idx === currentIndexRef.current);
      }
    } else {
      idx = currentIndexRef.current + 1;
      if (idx >= q.length) {
        idx = 0;
      }
    }
    currentIndexRef.current = idx;
    setCurrentIndex(idx);
    const audio = audioRef.current;
    setCurrentTrack(q[idx]);
    setIsPlaying(true);
    if (audio) {
      audio.src = q[idx].filePath;
      audio.load();
      audio.play().catch(() => {});
    }
    analyzeTrack(q[idx]);
  }, [queue, shuffle, analyzeTrack]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const q = queue;
    if (q.length === 0) return;
    let idx: number;
    if (shuffle) {
      if (q.length === 1) {
        idx = 0;
      } else {
        do {
          idx = Math.floor(Math.random() * q.length);
        } while (idx === currentIndexRef.current);
      }
    } else {
      idx = currentIndexRef.current - 1;
      if (idx < 0) idx = q.length - 1;
    }
    currentIndexRef.current = idx;
    setCurrentIndex(idx);
    setCurrentTrack(q[idx]);
    setIsPlaying(true);
    if (audio) {
      audio.src = q[idx].filePath;
      audio.load();
      audio.play().catch(() => {});
    }
    analyzeTrack(q[idx]);
  }, [queue, shuffle, analyzeTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setProgress(time);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => (prev === 'off' ? 'one' : prev === 'one' ? 'once' : 'off'));
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => !prev);
  }, []);

  const toggleVisualizer = useCallback(() => {
    setShowVisualizer((prev) => {
      const next = !prev;
      if (next) {
        ensureAnalyser();
      }
      return next;
    });
  }, [ensureAnalyser]);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => {
      if (prev.some((t) => t.id === track.id)) return prev;
      return [...prev, track];
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const playFromQueue = useCallback((index: number) => {
    const q = queue;
    if (index < 0 || index >= q.length) return;
    const audio = audioRef.current;
    currentIndexRef.current = index;
    setCurrentIndex(index);
    setCurrentTrack(q[index]);
    setIsPlaying(true);
    tracks.play(q[index].id).catch(() => {});
    if (audio) {
      audio.src = q[index].filePath;
      audio.load();
      audio.play().catch(() => {});
    }
    analyzeTrack(q[index]);
  }, [queue, analyzeTrack]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    currentIndexRef.current = 0;
    setCurrentIndex(0);
  }, []);

  // timeupdate
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handler = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener('timeupdate', handler);
    return () => audio.removeEventListener('timeupdate', handler);
  }, []);

  // ended — переприкрепляется при смене repeat/shuffle, чтобы читать актуальные значения
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        setIsPlaying(true);
        audio.play().catch(() => {});
        return;
      }

      if (repeat === 'once') {
        setRepeat('off');
        audio.currentTime = 0;
        setIsPlaying(true);
        audio.play().catch(() => {});
        return;
      }

      if (queue.length === 0) {
        setIsPlaying(false);
        return;
      }

      let nextIndex = currentIndexRef.current + 1;

      if (shuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else if (nextIndex >= queue.length) {
        setIsPlaying(false);
        return;
      }

      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      const track = queue[nextIndex];
      setCurrentTrack(track);
      setIsPlaying(true);
      audio.src = track.filePath;
      audio.load();
      audio.play().catch(() => {});
      analyzeTrack(track);
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [repeat, shuffle, queue, analyzeTrack]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, queue, currentIndex, isPlaying, progress, duration, volume,
        repeat, shuffle, play, pause, resume, next, previous,
        seek, setVolume, toggleRepeat, toggleShuffle,
        addToQueue, removeFromQueue, playFromQueue, clearQueue,
        analyserNode: analyserRef.current, showVisualizer, toggleVisualizer,
      }}
    >
      {children}
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};
