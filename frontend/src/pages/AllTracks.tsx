import React from 'react';
import { useTracks } from '../hooks/useTracks';
import TrackCard from '../components/TrackCard';

const AllTracks: React.FC = () => {
  const { data: tracks, loading } = useTracks('list', { limit: 100 });

  return (
    <div className="all-tracks-page">
      <h1>Все треки</h1>
      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="tracks-grid">
          {tracks.map((track, index) => (
            <TrackCard key={track.id} track={track} tracks={tracks} showIndex index={index} />
          ))}
          {tracks.length === 0 && <p className="no-data">Треков пока нет</p>}
        </div>
      )}
    </div>
  );
};

export default AllTracks;
