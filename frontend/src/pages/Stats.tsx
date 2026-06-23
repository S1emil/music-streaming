import React from 'react';
import { users, search } from '../services';
import { UserStats } from '../types';
import { usePlayer } from '../context/PlayerContext';
import StatCard from '../components/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { FiMusic, FiClock, FiHeart, FiDisc, FiCpu } from 'react-icons/fi';

const MOOD_COLORS: Record<string, string> = {
  sad: '#5C6BC0',
  happy: '#FFB300',
  aggressive: '#E53935',
  romantic: '#EC407A',
  calm: '#66BB6A',
  energetic: '#FF7043',
};

const MOOD_LABELS: Record<string, string> = {
  sad: 'Грустное',
  happy: 'Весёлое',
  aggressive: 'Агрессивное',
  romantic: 'Романтичное',
  calm: 'Спокойное',
  energetic: 'Энергичное',
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

const Stats: React.FC = () => {
  const [stats, setStats] = React.useState<UserStats | null>(null);
  const [svdStats, setSvdStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const { play, currentTrack } = usePlayer();

  React.useEffect(() => {
    Promise.all([
      users.stats().catch(() => null),
      search.svdStats().catch(() => null),
    ])
      .then(([statsData, svdData]) => {
        setStats(statsData);
        setSvdStats(svdData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Загрузка статистики...</div>;
  if (!stats) return <div className="error">Не удалось загрузить статистику</div>;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} ч ${m} мин`;
    return `${m} мин`;
  };

  const handlePlay = (track: any, queue?: any[]) => {
    play(track, queue || stats.recentlyPlayed);
  };

  return (
    <div className="stats-page">
      <h1>Мои статистики</h1>

      <div className="stats-summary">
        <StatCard
          icon={<FiMusic size={24} />}
          value={stats.totalTracksPlayed}
          label="Прослушано треков"
        />
        <StatCard
          icon={<FiClock size={24} />}
          value={formatTime(stats.totalListeningTime)}
          label="Время прослушивания"
        />
        <StatCard
          icon={<FiHeart size={24} />}
          value={stats.mostLiked.length}
          label="Понравившихся"
        />
        <StatCard
          icon={<FiDisc size={24} />}
          value={stats.moodDistribution.length}
          label="Настроений"
        />
      </div>

      {svdStats && (
        <div className="stats-section">
          <h2><FiCpu size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />Рекомендательная система (SVD)</h2>
          <div className="svd-info">
            <div className="svd-grid">
              <div className="svd-item">
                <span className="svd-label">Пользователей</span>
                <span className="svd-value">{svdStats.users}</span>
              </div>
              <div className="svd-item">
                <span className="svd-label">Треков</span>
                <span className="svd-value">{svdStats.tracks}</span>
              </div>
              <div className="svd-item">
                <span className="svd-label">Взаимодействий</span>
                <span className="svd-value">{svdStats.interactions}</span>
              </div>
              <div className="svd-item">
                <span className="svd-label">Разреженность матрицы</span>
                <span className="svd-value">{svdStats.matrixSparsity}</span>
              </div>
              <div className="svd-item">
                <span className="svd-label">Скрытых факторов (k)</span>
                <span className="svd-value">{svdStats.latentFactors}</span>
              </div>
              <div className="svd-item">
                <span className="svd-label">Эмбеддинги пользователей</span>
                <span className="svd-value">{svdStats.userEmbeddings}</span>
              </div>
              <div className="svd-item">
                <span className="svd-label">Эмбеддинги треков</span>
                <span className="svd-value">{svdStats.itemEmbeddings}</span>
              </div>
              <div className="svd-item">
                <span className="svd-label">Средняя оценка</span>
                <span className="svd-value">{svdStats.globalMean}</span>
              </div>
            </div>
            <div className="svd-description">
              <p>Матричная факторизация SVD (Singular Value Decomposition) decomposes the user-item interaction matrix into latent factors, enabling personalized recommendations by predicting user preferences for unlistened tracks.</p>
              <p>Формула: <code>r̂<sub>ui</sub> = μ + p<sub>u</sub> · q<sub>i</sub><sup>T</sup></code>, где μ — средняя оценка, p<sub>u</sub> — вектор пользователя, q<sub>i</sub> — вектор трека.</p>
            </div>
          </div>
        </div>
      )}

      {stats.topGenres.length > 0 && (
        <div className="stats-section">
          <h2>Популярные жанры</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topGenres} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: '#b3b3b3', fontSize: 13 }}
                />
                <Tooltip
                  contentStyle={{ background: '#333', border: 'none', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`${value} прослушиваний`, '']}
                />
                <Bar dataKey="playCount" fill="#1db954" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats.topArtists.length > 0 && (
        <div className="stats-section">
          <h2>Популярные артисты</h2>
          <div className="stats-artists">
            {stats.topArtists.map((artist, i) => (
              <div key={artist.id} className="stats-artist-card">
                <span className="stats-artist-rank">#{i + 1}</span>
                <div className="stats-artist-avatar">
                  {artist.image ? (
                    <img src={artist.image} alt={artist.name} />
                  ) : (
                    <div className="avatar-placeholder">{artist.name[0]}</div>
                  )}
                </div>
                <div className="stats-artist-info">
                  <span className="stats-artist-name">{artist.name}</span>
                  <span className="stats-artist-plays">{artist.playCount} прослушиваний</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.moodDistribution.length > 0 && (
        <div className="stats-section">
          <h2>Распределение настроений</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.moodDistribution}
                  dataKey="count"
                  nameKey="mood"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ mood, percent }: any) =>
                    `${MOOD_LABELS[mood] || mood} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {stats.moodDistribution.map((entry) => (
                    <Cell
                      key={entry.mood}
                      fill={MOOD_COLORS[entry.mood] || '#888'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#333', border: 'none', borderRadius: 8 }}
                  formatter={(value: any, name: any) => [value, MOOD_LABELS[name] || name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats.themeDistribution.length > 0 && (
        <div className="stats-section">
          <h2>Популярные темы</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={Math.max(200, stats.themeDistribution.length * 32)}>
              <BarChart data={stats.themeDistribution} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="theme"
                  width={120}
                  tick={{ fill: '#b3b3b3', fontSize: 12 }}
                  tickFormatter={(v) => THEME_LABELS[v] || v}
                />
                <Tooltip
                  contentStyle={{ background: '#333', border: 'none', borderRadius: 8 }}
                  formatter={(value: any, _name: any, props: any) => [
                    `${value}`,
                    THEME_LABELS[props.payload.theme] || props.payload.theme,
                  ]}
                />
                <Bar dataKey="count" fill="#1db954" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats.hourlyActivity.some((h) => h.count > 0) && (
        <div className="stats-section">
          <h2>Активность по часам</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.hourlyActivity}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1db954" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1db954" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="hour"
                  tick={{ fill: '#b3b3b3', fontSize: 11 }}
                  tickFormatter={(h) => `${h}:00`}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#333', border: 'none', borderRadius: 8 }}
                  labelFormatter={(h) => `${h}:00`}
                  formatter={(value: any) => [`${value} прослушиваний`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#1db954"
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats.weeklyActivity.some((d) => d.count > 0) && (
        <div className="stats-section">
          <h2>Активность по дням недели</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.weeklyActivity}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#b3b3b3', fontSize: 13 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#333', border: 'none', borderRadius: 8 }}
                  formatter={(value: any) => [`${value} прослушиваний`, '']}
                />
                <Bar dataKey="count" fill="#1db954" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats.recentlyPlayed.length > 0 && (
        <div className="stats-section">
          <h2>Недавно прослушанные</h2>
          <div className="tracks-list">
            {stats.recentlyPlayed.map((track) => (
              <div
                key={track.id}
                className={`track-list-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                onClick={() => handlePlay(track)}
              >
                <div className="track-cover">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={track.title} />
                  ) : (
                    <div className="cover-placeholder">♪</div>
                  )}
                </div>
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.Artist?.name || 'Неизвестный артист'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.mostLiked.length > 0 && (
        <div className="stats-section">
          <h2>Понравившиеся треки</h2>
          <div className="tracks-list">
            {stats.mostLiked.map((track) => (
              <div
                key={track.id}
                className={`track-list-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                onClick={() => handlePlay(track, stats.mostLiked)}
              >
                <div className="track-cover">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={track.title} />
                  ) : (
                    <div className="cover-placeholder">♪</div>
                  )}
                </div>
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.Artist?.name || 'Неизвестный артист'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
