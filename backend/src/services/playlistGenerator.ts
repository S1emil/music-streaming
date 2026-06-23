import { Op } from 'sequelize';
import sequelize from '../db/connection';
import { Track, Artist, Genre } from '../models';
import TrackGenre from '../models/TrackGenre';

interface GenerateOptions {
  mood?: string;
  genreId?: string;
  limit?: number;
}

const MOOD_BY_HOUR: Record<number, string> = {
  5: 'calm', 6: 'calm', 7: 'calm', 8: 'calm',
  9: 'energetic', 10: 'energetic', 11: 'energetic',
  12: 'happy', 13: 'happy', 14: 'happy', 15: 'happy', 16: 'happy',
  17: 'romantic', 18: 'romantic', 19: 'romantic', 20: 'romantic',
  21: 'sad', 22: 'sad', 23: 'sad', 0: 'sad', 1: 'sad', 2: 'sad', 3: 'sad', 4: 'sad',
};

const MOOD_LABELS: Record<string, string> = {
  sad: 'Грустное',
  happy: 'Весёлое',
  aggressive: 'Агрессивное',
  romantic: 'Романтичное',
  calm: 'Спокойное',
  energetic: 'Энергичное',
};

const MOOD_ALIASES: Record<string, string[]> = {
  sad: ['грустное', 'грустная', 'грустный'],
  happy: ['весёлое', 'веселое', 'весёлая', 'веселая'],
  aggressive: ['агрессивное', 'агрессивная', 'агрессивный'],
  romantic: ['романтичное', 'романтичная', 'романтичный'],
  calm: ['спокойное', 'спокойная', 'спокойный'],
  energetic: ['энергичное', 'энергичная', 'энергичный'],
};

interface MoodAudioRange {
  energy: [number, number];
  valence: [number, number];
  danceability: [number, number];
  acousticness: [number, number];
}

const MOOD_AUDIO_RANGES: Record<string, MoodAudioRange> = {
  sad:        { energy: [0.0, 0.4], valence: [0.0, 0.35], danceability: [0.0, 0.5], acousticness: [0.3, 1.0] },
  happy:      { energy: [0.4, 0.85], valence: [0.6, 1.0], danceability: [0.4, 1.0], acousticness: [0.0, 0.6] },
  aggressive: { energy: [0.7, 1.0], valence: [0.0, 0.6], danceability: [0.3, 0.9], acousticness: [0.0, 0.3] },
  romantic:   { energy: [0.1, 0.6], valence: [0.3, 0.8], danceability: [0.2, 0.7], acousticness: [0.3, 1.0] },
  calm:       { energy: [0.0, 0.45], valence: [0.2, 0.7], danceability: [0.0, 0.5], acousticness: [0.4, 1.0] },
  energetic:  { energy: [0.65, 1.0], valence: [0.4, 1.0], danceability: [0.5, 1.0], acousticness: [0.0, 0.4] },
};

function buildMoodWhere(mood: string): any {
  const range = MOOD_AUDIO_RANGES[mood];
  const aliases = MOOD_ALIASES[mood] || [];
  const moodMatches = [mood, ...aliases];

  const moodCondition = moodMatches.length === 1
    ? { mood: moodMatches[0] }
    : { mood: { [Op.in]: moodMatches } };

  if (!range) return moodCondition;

  const hasAudioFeatures = range.energy[0] > 0 || range.valence[0] > 0;

  return {
    [Op.or]: [
      moodCondition,
      ...(hasAudioFeatures ? [{
        [Op.and]: [
          { energy: { [Op.between]: range.energy } },
          { valence: { [Op.between]: range.valence } },
          { danceability: { [Op.between]: range.danceability } },
          { acousticness: { [Op.between]: range.acousticness } },
        ],
      }] : []),
    ],
  };
}

export async function generatePlaylist(options: GenerateOptions) {
  const limit = Math.min(options.limit || 30, 50);

  let mood = options.mood;
  if (!mood && !options.genreId) {
    const hour = new Date().getHours();
    mood = MOOD_BY_HOUR[hour] || 'calm';
  }

  const include = [
    { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
  ];

  if (options.genreId) {
    const genreTracks = await TrackGenre.findAll({
      where: { genreId: options.genreId },
      attributes: ['trackId'],
    });
    const trackIds = genreTracks.map((gt: any) => gt.trackId);

    if (trackIds.length === 0) {
      return { tracks: [], suggestedName: '', suggestedDescription: '', mood: mood || null };
    }

    const genreWhere: any = { id: { [Op.in]: trackIds } };
    if (mood) {
      Object.assign(genreWhere, buildMoodWhere(mood));
    }

    let tracks = await Track.findAll({
      where: genreWhere,
      include,
      order: sequelize.literal('RANDOM()'),
      limit,
    });

    if (tracks.length === 0 && mood) {
      delete genreWhere[Op.or];
      tracks = await Track.findAll({
        where: genreWhere,
        include,
        order: sequelize.literal('RANDOM()'),
        limit,
      });
    }

    const genre = await Genre.findByPk(options.genreId);
    const suggestedName = mood
      ? `${MOOD_LABELS[mood] || mood} × ${genre?.name || 'Микс'}`
      : `${genre?.name || 'Жанр'} микс`;
    const suggestedDescription = mood
      ? `Автоматически подобранные треки в настроении «${MOOD_LABELS[mood] || mood}» жанра ${genre?.name || ''}`
      : `Лучшие треки жанра ${genre?.name || ''}`;

    return { tracks, suggestedName, suggestedDescription, mood: mood || null };
  }

  let where: any = {};
  if (mood) {
    Object.assign(where, buildMoodWhere(mood));
  }

  let tracks = await Track.findAll({
    where,
    include,
    order: sequelize.literal('RANDOM()'),
    limit,
  });

  if (tracks.length === 0 && mood) {
    delete where[Op.or];
    tracks = await Track.findAll({
      where,
      include,
      order: sequelize.literal('RANDOM()'),
      limit,
    });
  }

  const suggestedName = mood
    ? `${MOOD_LABELS[mood] || mood} микс`
    : 'Умный плейлист';
  const suggestedDescription = mood
    ? `Автоматически подобранные треки в настроении «${MOOD_LABELS[mood] || mood}»`
    : 'Подборка треков по времени суток';

  return { tracks, suggestedName, suggestedDescription, mood: mood || null };
}
