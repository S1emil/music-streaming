import { useState, useEffect } from 'react';
import { tracks as tracksApi } from '../services';
import { Track } from '../types';

export const useTracks = (type: 'popular' | 'recent' | 'list', params?: any) => {
  const [data, setData] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        let result: Track[];

        switch (type) {
          case 'popular':
            result = await tracksApi.popular();
            break;
          case 'recent':
            result = await tracksApi.recent();
            break;
          default:
            result = await tracksApi.list(params);
        }

        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tracks');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [type, JSON.stringify(params)]);

  return { data, loading, error };
};
