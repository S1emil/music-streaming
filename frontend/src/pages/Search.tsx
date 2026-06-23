import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { search as searchApi } from '../services';
import { Track } from '../types';
import TrackCard from '../components/TrackCard';
import { FiCpu } from 'react-icons/fi';

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [semanticMode, setSemanticMode] = React.useState(false);
  const [results, setResults] = React.useState<any>({});
  const [semanticResults, setSemanticResults] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'tracks' | 'artists' | 'playlists'>('tracks');

  React.useEffect(() => {
    if (query) {
      setLoading(true);
      if (semanticMode) {
        searchApi.semantic(query)
          .then(setSemanticResults)
          .catch(() => setSemanticResults([]))
          .finally(() => setLoading(false));
      } else {
        searchApi.search(query)
          .then(setResults)
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
  }, [query, semanticMode]);

  if (!query) {
    return (
      <div className="search-page">
        <div className="search-empty">
          <h2>Поиск в Wavve</h2>
          <p>Найдите любимые треки, артистов и плейлисты</p>
          <p className="search-hint">Попробуйте: «грустная песня о любви», «дружба», «смысл жизни»</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>{semanticMode ? 'Поиск по смыслу' : 'Результаты поиска'}: «{query}»</h1>
        <div className="semantic-toggle">
          <button
            className={`toggle-btn ${semanticMode ? 'active' : ''}`}
            onClick={() => setSemanticMode(!semanticMode)}
            title="Поиск по смыслу текста песни"
          >
            <FiCpu size={16} />
            <span>Поиск по смыслу</span>
          </button>
        </div>
      </div>

      {semanticMode && (
        <div className="semantic-info">
          <FiCpu size={14} />
          <span>Анализ тематики: система ищет песни, текст которых соответствует вашему запросу по смыслу</span>
        </div>
      )}

      {!semanticMode && (
        <div className="search-tabs">
          <button className={`tab ${activeTab === 'tracks' ? 'active' : ''}`} onClick={() => setActiveTab('tracks')}>
            Треки ({results.tracks?.length || 0})
          </button>
          <button className={`tab ${activeTab === 'artists' ? 'active' : ''}`} onClick={() => setActiveTab('artists')}>
            Артисты ({results.artists?.length || 0})
          </button>
          <button className={`tab ${activeTab === 'playlists' ? 'active' : ''}`} onClick={() => setActiveTab('playlists')}>
            Плейлисты ({results.playlists?.length || 0})
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Поиск...</div>
      ) : semanticMode ? (
        <div className="tracks-grid">
          {semanticResults.length > 0 ? (
            semanticResults.map((track) => (
              <TrackCard key={track.id} track={track} tracks={semanticResults} />
            ))
          ) : (
            <p className="no-data">Ничего не найдено по этому запросу. Попробуйте другие ключевые слова.</p>
          )}
        </div>
      ) : (
        <div className="search-results">
          {activeTab === 'tracks' && (
            <div className="tracks-grid">
              {results.tracks?.map((track: Track) => (
                <TrackCard key={track.id} track={track} />
              ))}
              {results.tracks?.length === 0 && <p>Треки не найдены</p>}
            </div>
          )}
          {activeTab === 'artists' && (
            <div className="artists-grid">
              {results.artists?.map((artist: any) => (
                <Link to={`/artist/${artist.id}`} key={artist.id} className="artist-card">
                  <div className="artist-image">
                    {artist.image ? <img src={artist.image} alt={artist.name} /> : <div className="avatar-placeholder">♪</div>}
                  </div>
                  <div className="artist-name">{artist.name}</div>
                </Link>
              ))}
              {results.artists?.length === 0 && <p>Артисты не найдены</p>}
            </div>
          )}
          {activeTab === 'playlists' && (
            <div className="playlists-grid">
              {results.playlists?.map((pl: any) => (
                <Link to={`/playlist/${pl.id}`} key={pl.id} className="playlist-card">
                  <div className="playlist-cover"><div className="cover-placeholder">♫</div></div>
                  <div className="playlist-info">
                    <div className="playlist-name">{pl.name}</div>
                    <div className="playlist-meta">{pl.Owner?.displayName}</div>
                  </div>
                </Link>
              ))}
              {results.playlists?.length === 0 && <p>Плейлисты не найдены</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
