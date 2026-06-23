import sequelize from '../db/connection';
import { Track, Artist, Genre, Like } from '../models';
import PlayHistory from '../models/PlayHistory';

export async function getUserStats(userId: string) {
  const totalTracksPlayed = await PlayHistory.count({ where: { userId } });

  const allHistory = await PlayHistory.findAll({
    where: { userId },
    include: [{ model: Track, as: 'Track', attributes: ['id', 'genreId', 'artistId', 'mood', 'themes', 'duration'] }],
  });

  let totalListeningTime = 0;
  const genreCounts: Record<string, number> = {};
  const artistCounts: Record<string, number> = {};
  const moodCounts: Record<string, number> = {};
  const themeCounts: Record<string, number> = {};

  for (const entry of allHistory) {
    const track = (entry as any).Track;
    if (!track) continue;

    totalListeningTime += entry.progress || 0;

    if (track.genreId) {
      genreCounts[track.genreId] = (genreCounts[track.genreId] || 0) + 1;
    }
    if (track.artistId) {
      artistCounts[track.artistId] = (artistCounts[track.artistId] || 0) + 1;
    }
    if (track.mood) {
      moodCounts[track.mood] = (moodCounts[track.mood] || 0) + 1;
    }
    if (track.themes) {
      try {
        const themes = typeof track.themes === 'string' ? JSON.parse(track.themes) : track.themes;
        if (Array.isArray(themes)) {
          for (const theme of themes) {
            themeCounts[theme] = (themeCounts[theme] || 0) + 1;
          }
        }
      } catch {
        // themes is not valid JSON, skip
      }
    }
  }

  const totalGenrePlays = Object.values(genreCounts).reduce((a, b) => a + b, 0);
  const genreIds = Object.keys(genreCounts);
  const topGenresData = genreIds.length > 0 ? await Genre.findAll({ where: { id: genreIds } }) : [];
  const topGenres = topGenresData.map((g: any) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    playCount: genreCounts[g.id] || 0,
    percentage: totalGenrePlays > 0 ? Math.round(((genreCounts[g.id] || 0) / totalGenrePlays) * 100) : 0,
  })).sort((a, b) => b.playCount - a.playCount).slice(0, 10);

  const artistIds = Object.keys(artistCounts);
  const topArtistsData = artistIds.length > 0 ? await Artist.findAll({ where: { id: artistIds } }) : [];
  const topArtists = topArtistsData.map((a: any) => ({
    id: a.id,
    name: a.name,
    image: a.image,
    verified: a.verified,
    playCount: artistCounts[a.id] || 0,
  })).sort((a, b) => b.playCount - a.playCount).slice(0, 10);

  const moodDistribution = Object.entries(moodCounts)
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);

  const themeDistribution = Object.entries(themeCounts)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const hourlyMap: Record<number, number> = {};
  for (const entry of allHistory) {
    const hour = new Date(entry.playedAt).getHours();
    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
  }
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourlyMap[i] || 0,
  }));

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const weeklyMap: Record<number, number> = {};
  for (const entry of allHistory) {
    const day = new Date(entry.playedAt).getDay();
    weeklyMap[day] = (weeklyMap[day] || 0) + 1;
  }
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    name: dayNames[i],
    count: weeklyMap[i] || 0,
  }));

  const recentlyPlayedRows = await PlayHistory.findAll({
    where: { userId },
    include: [
      { model: Track, as: 'Track', include: [{ model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] }] },
    ],
    order: [['playedAt', 'DESC']],
    limit: 10,
  });
  const recentlyPlayed = recentlyPlayedRows.map((h: any) => h.Track).filter(Boolean);

  const mostLikedRows = await Like.findAll({
    where: { userId },
    include: [
      { model: Track, as: 'Track', include: [{ model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] }] },
    ],
    limit: 10,
  });
  const mostLiked = mostLikedRows.map((l: any) => l.Track).filter(Boolean);

  return {
    totalTracksPlayed,
    totalListeningTime,
    topGenres,
    topArtists,
    moodDistribution,
    themeDistribution,
    hourlyActivity,
    weeklyActivity,
    recentlyPlayed,
    mostLiked,
  };
}
