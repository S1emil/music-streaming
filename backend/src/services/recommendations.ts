import { Op } from 'sequelize';
import { Track, Artist, Genre, Like, PlayHistory, User } from '../models';
import { buildSVDModel, svdScore, SVDModel } from './svd';

interface UserProfile {
  genrePreferences: Map<string, number>;
  artistPreferences: Map<string, number>;
  avgEnergy: number;
  avgValence: number;
  avgDanceability: number;
  avgAcousticness: number;
  avgTempo: number;
  likedTrackIds: Set<string>;
  recentlyPlayedIds: Set<string>;
}

let cachedSVDModel: SVDModel | null = null;
let svdModelTimestamp = 0;
const SVD_CACHE_TTL = 5 * 60 * 1000;

async function getSVDModel(): Promise<SVDModel | null> {
  const now = Date.now();
  if (cachedSVDModel && now - svdModelTimestamp < SVD_CACHE_TTL) {
    return cachedSVDModel;
  }
  cachedSVDModel = await buildSVDModel();
  svdModelTimestamp = now;
  return cachedSVDModel;
}

export async function buildUserProfile(userId: string): Promise<UserProfile> {
  const likes = await Like.findAll({
    where: { userId },
    include: [{ model: Track, as: 'Track', attributes: ['genreId', 'artistId', 'energy', 'valence', 'danceability', 'acousticness', 'tempo'] }],
  });

  const history = await PlayHistory.findAll({
    where: { userId },
    include: [{ model: Track, as: 'Track', attributes: ['genreId', 'artistId', 'energy', 'valence', 'danceability', 'acousticness', 'tempo'] }],
    order: [['playedAt', 'DESC']],
    limit: 100,
  });

  const genrePreferences = new Map<string, number>();
  const artistPreferences = new Map<string, number>();
  let totalEnergy = 0, totalValence = 0, totalDanceability = 0, totalAcousticness = 0, totalTempo = 0;
  let audioFeatureCount = 0;
  const likedTrackIds = new Set<string>();
  const recentlyPlayedIds = new Set<string>();

  likes.forEach((like: any) => {
    const track = like.Track;
    if (track) {
      likedTrackIds.add(track.id);
      if (track.genreId) {
        genrePreferences.set(track.genreId, (genrePreferences.get(track.genreId) || 0) + 3);
      }
      if (track.artistId) {
        artistPreferences.set(track.artistId, (artistPreferences.get(track.artistId) || 0) + 3);
      }
      if (track.energy != null) { totalEnergy += track.energy; audioFeatureCount++; }
      if (track.valence != null) totalValence += track.valence;
      if (track.danceability != null) totalDanceability += track.danceability;
      if (track.acousticness != null) totalAcousticness += track.acousticness;
      if (track.tempo != null) totalTempo += track.tempo;
    }
  });

  history.forEach((play: any) => {
    const track = play.Track;
    if (track) {
      recentlyPlayedIds.add(track.id);
      if (track.genreId) {
        genrePreferences.set(track.genreId, (genrePreferences.get(track.genreId) || 0) + 1);
      }
      if (track.artistId) {
        artistPreferences.set(track.artistId, (artistPreferences.get(track.artistId) || 0) + 1);
      }
      if (track.energy != null) { totalEnergy += track.energy; audioFeatureCount++; }
      if (track.valence != null) totalValence += track.valence;
      if (track.danceability != null) totalDanceability += track.danceability;
      if (track.acousticness != null) totalAcousticness += track.acousticness;
      if (track.tempo != null) totalTempo += track.tempo;
    }
  });

  const count = audioFeatureCount || 1;

  return {
    genrePreferences,
    artistPreferences,
    avgEnergy: totalEnergy / count,
    avgValence: totalValence / count,
    avgDanceability: totalDanceability / count,
    avgAcousticness: totalAcousticness / count,
    avgTempo: totalTempo / count,
    likedTrackIds,
    recentlyPlayedIds,
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function calculateAudioFeatureVector(track: any): number[] {
  return [
    track.energy || 0,
    track.valence || 0,
    track.danceability || 0,
    track.acousticness || 0,
    (track.tempo || 120) / 200,
  ];
}

function contentBasedScore(track: any, profile: UserProfile): number {
  let score = 0;

  if (track.genreId && profile.genrePreferences.has(track.genreId)) {
    score += profile.genrePreferences.get(track.genreId)! * 2;
  }

  if (track.artistId && profile.artistPreferences.has(track.artistId)) {
    score += profile.artistPreferences.get(track.artistId)! * 3;
  }

  const trackFeatures = calculateAudioFeatureVector(track);
  const userProfileFeatures = [
    profile.avgEnergy,
    profile.avgValence,
    profile.avgDanceability,
    profile.avgAcousticness,
    profile.avgTempo / 200,
  ];

  const featureSimilarity = cosineSimilarity(trackFeatures, userProfileFeatures);
  score += featureSimilarity * 5;

  score += Math.log1p(track.plays) * 0.5;
  score += Math.log1p(track.likes) * 0.3;

  return score;
}

async function collaborativeScore(track: any, userId: string): Promise<number> {
  const playHistory = await PlayHistory.findAll({
    where: {
      trackId: track.id,
      userId: { [Op.ne]: userId },
    },
    limit: 50,
  });

  if (playHistory.length === 0) return 0;

  const userIds = [...new Set(playHistory.map((p: any) => p.userId))];

  const userInteractions = await PlayHistory.findAll({
    where: {
      userId: { [Op.in]: userIds },
    },
    limit: 200,
  });

  const trackPlayCounts = new Map<string, number>();
  userInteractions.forEach((interaction: any) => {
    trackPlayCounts.set(interaction.trackId, (trackPlayCounts.get(interaction.trackId) || 0) + 1);
  });

  const trackPopularity = trackPlayCounts.get(track.id) || 0;

  let collaborativeScore = 0;

  collaborativeScore += Math.log1p(trackPopularity) * 2;

  const similarUserLikes = await Like.findAll({
    where: {
      userId: { [Op.in]: userIds },
      trackId: track.id,
    },
  });

  collaborativeScore += similarUserLikes.length * 1.5;

  collaborativeScore += (userIds.length / 20) * 3;

  return collaborativeScore;
}

export async function getHybridRecommendations(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  const [profile, svdModel] = await Promise.all([
    buildUserProfile(userId),
    getSVDModel(),
  ]);

  const excludeIds = [...profile.likedTrackIds, ...profile.recentlyPlayedIds];
  const whereCondition: any = {};

  if (excludeIds.length > 0) {
    whereCondition.id = { [Op.notIn]: excludeIds };
  }

  const allTracks = await Track.findAll({
    include: [
      { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
      { model: Genre, as: 'Genre', attributes: ['id', 'name', 'slug'] },
    ],
    where: whereCondition,
    limit: 200,
  });

  const scoredTracks = await Promise.all(
    allTracks.map(async (track) => {
      const contentScore = contentBasedScore(track, profile);
      const collabScore = await collaborativeScore(track, userId);
      const svdPrediction = svdScore(svdModel, userId, track.id);

      const hybridScore =
        contentScore * 0.4 +
        collabScore * 0.2 +
        svdPrediction * 4;

      return {
        track,
        score: hybridScore,
        contentScore,
        collabScore,
        svdPrediction,
      };
    })
  );

  scoredTracks.sort((a, b) => b.score - a.score);

  return scoredTracks.slice(0, limit).map((st) => ({
    ...st.track.toJSON(),
    recommendationScore: st.score,
  }));
}

export async function getSimilarTracks(trackId: string, limit: number = 10): Promise<any[]> {
  const targetTrack = await Track.findByPk(trackId, {
    include: [
      { model: Artist, as: 'Artist' },
      { model: Genre, as: 'Genre' },
    ],
  });

  if (!targetTrack) return [];

  const targetFeatures = calculateAudioFeatureVector(targetTrack);

  const candidates = await Track.findAll({
    where: {
      id: { [Op.ne]: trackId },
      [Op.or]: [
        { genreId: targetTrack.genreId },
        { artistId: targetTrack.artistId },
      ],
    },
    include: [
      { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
      { model: Genre, as: 'Genre', attributes: ['id', 'name', 'slug'] },
    ],
    limit: 100,
  });

  const scored = candidates.map((candidate) => {
    const candidateFeatures = calculateAudioFeatureVector(candidate);
    const similarity = cosineSimilarity(targetFeatures, candidateFeatures);

    let score = similarity * 5;

    if (candidate.artistId === targetTrack.artistId) score += 5;
    if (candidate.genreId === targetTrack.genreId) score += 2;

    score += Math.log1p(candidate.plays) * 0.3;

    return { ...candidate.toJSON(), similarityScore: score };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);

  return scored.slice(0, limit);
}
