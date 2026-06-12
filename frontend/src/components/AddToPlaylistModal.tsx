import React from 'react';
import { playlists as playlistsApi } from '../services';
import { Playlist } from '../types';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiCheck } from 'react-icons/fi';

interface AddToPlaylistModalProps {
  trackId: string;
  onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ trackId, onClose }) => {
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState<string | null>(null);
  const [added, setAdded] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    playlistsApi.my()
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (playlistId: string) => {
    setAdding(playlistId);
    try {
      await playlistsApi.addTrack(playlistId, trackId);
      setAdded((prev) => new Set(prev).add(playlistId));
      toast.success('Трек добавлен в плейлист');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось добавить');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Добавить в плейлист</h3>
          <button className="modal-close" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : playlists.length === 0 ? (
            <p className="no-data">У вас пока нет плейлистов</p>
          ) : (
            <div className="playlist-select-list">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  className={`playlist-select-item ${added.has(pl.id) ? 'added' : ''}`}
                  onClick={() => !added.has(pl.id) && handleAdd(pl.id)}
                  disabled={adding === pl.id}
                >
                  <div className="playlist-select-info">
                    <span className="playlist-select-name">{pl.name}</span>
                    <span className="playlist-select-count">{pl.Tracks?.length || 0} треков</span>
                  </div>
                  {added.has(pl.id) ? (
                    <FiCheck size={18} className="check-icon" />
                  ) : adding === pl.id ? (
                    <span className="adding-spinner" />
                  ) : (
                    <FiPlus size={18} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
