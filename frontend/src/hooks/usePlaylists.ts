import { useState, useEffect } from 'react';
import { playlists as playlistsApi } from '../services';
import { Playlist } from '../types';

export const usePlaylists = (type: 'my' | 'public' = 'my') => {
  const [data, setData] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const result = type === 'my' ? await playlistsApi.my() : await playlistsApi.public();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch playlists');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [type]);

  return { data, loading, error, refetch: () => setLoading(true) };
};
