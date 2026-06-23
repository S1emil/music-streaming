import React from 'react';
import { useTracks } from '../hooks/useTracks';
import TrackCard from '../components/TrackCard';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { data: popularTracks, loading: popularLoading } = useTracks('popular');
  const { data: recentTracks, loading: recentLoading } = useTracks('recent');

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Добро пожаловать в Wavve</h1>
          <p>Слушайте миллионы треков. Наслаждайтесь музыкой где угодно.</p>
          {user ? (
            <Link to="/library" className="btn btn-primary btn-lg">
              Перейти в библиотеку
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-lg">
              Начать слушать
            </Link>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Популярные треки</h2>
          <Link to="/tracks" className="see-all">
            Смотреть все <FiArrowRight />
          </Link>
        </div>
        <div className="tracks-grid">
          {popularLoading ? (
            <div className="loading">Загрузка...</div>
          ) : (
            popularTracks.slice(0, 8).map((track, index) => (
              <TrackCard
                key={track.id}
                track={track}
                tracks={popularTracks}
                showIndex
                index={index}
              />
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Недавно добавленные</h2>
        </div>
        <div className="tracks-grid">
          {recentLoading ? (
            <div className="loading">Загрузка...</div>
          ) : (
            recentTracks.slice(0, 8).map((track, index) => (
              <TrackCard
                key={track.id}
                track={track}
                tracks={recentTracks}
                showIndex
                index={index}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
