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

let svdBuildPromise: Promise<SVDModel | null> | null = null;

export function resetSVDModelCache(): void {
  cachedSVDModel = null;
  svdModelTimestamp = 0;
  svdBuildPromise = null;
}

export async function getSVDModel(): Promise<SVDModel | null> {
  const now = Date.now();
  if (now - svdModelTimestamp < SVD_CACHE_TTL && svdModelTimestamp > 0) {
    return cachedSVDModel;
  }

  if (svdBuildPromise) {
    return svdBuildPromise;
  }

  svdBuildPromise = buildSVDModel()
    .then((model) => {
      if (model) {
        cachedSVDModel = model;
      }
      svdModelTimestamp = Date.now();
      return model;
    })
    .catch(() => {
      svdModelTimestamp = Date.now();
      return null;
    })
    .finally(() => {
      svdBuildPromise = null;
    });

  return svdBuildPromise;
}

export async function buildUserProfile(userId: string): Promise<UserProfile> {
  const likes = await Like.findAll({
    where: { userId },
    include: [{ model: Track, as: 'Track', attributes: ['id', 'genreId', 'artistId', 'energy', 'valence', 'danceability', 'acousticness', 'tempo'] }],
  });

  const history = await PlayHistory.findAll({
    where: { userId },
    include: [{ model: Track, as: 'Track', attributes: ['id', 'genreId', 'artistId', 'energy', 'valence', 'danceability', 'acousticness', 'tempo'] }],
    order: [['playedAt', 'DESC']],
    limit: 100,
  });

  const genrePreferences = new Map<string, number>();
  const artistPreferences = new Map<string, number>();
  let totalEnergy = 0, totalValence = 0, totalDanceability = 0, totalAcousticness = 0, totalTempo = 0;
  let energyCount = 0, valenceCount = 0, danceabilityCount = 0, acousticnessCount = 0, tempoCount = 0;
  const likedTrackIds = new Set<string>();
  const recentlyPlayedIds = new Set<string>();

  const accumulateFeatures = (track: any) => {
    if (track.energy != null) { totalEnergy += track.energy; energyCount++; }
    if (track.valence != null) { totalValence += track.valence; valenceCount++; }
    if (track.danceability != null) { totalDanceability += track.danceability; danceabilityCount++; }
    if (track.acousticness != null) { totalAcousticness += track.acousticness; acousticnessCount++; }
    if (track.tempo != null) { totalTempo += track.tempo; tempoCount++; }
  };

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
      accumulateFeatures(track);
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
      accumulateFeatures(track);
    }
  });

  return {
    genrePreferences,
    artistPreferences,
    avgEnergy: energyCount > 0 ? totalEnergy / energyCount : 0,
    avgValence: valenceCount > 0 ? totalValence / valenceCount : 0,
    avgDanceability: danceabilityCount > 0 ? totalDanceability / danceabilityCount : 0,
    avgAcousticness: acousticnessCount > 0 ? totalAcousticness / acousticnessCount : 0,
    avgTempo: tempoCount > 0 ? totalTempo / tempoCount : 0,
    likedTrackIds,
    recentlyPlayedIds,
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

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

  return score;
}

async function batchCollaborativeScores(
  trackIds: string[],
  userId: string
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  trackIds.forEach((id) => scores.set(id, 0));

  if (trackIds.length === 0) return scores;

  const allPlayHistory = await PlayHistory.findAll({
    where: {
      trackId: { [Op.in]: trackIds },
      userId: { [Op.ne]: userId },
    },
  });

  if (allPlayHistory.length === 0) return scores;

  const userIds = [...new Set(allPlayHistory.map((p: any) => p.userId))];

  const crossPlayCounts = new Map<string, number>();
  allPlayHistory.forEach((p: any) => {
    crossPlayCounts.set(p.trackId, (crossPlayCounts.get(p.trackId) || 0) + 1);
  });

  const allLikes = await Like.findAll({
    where: {
      userId: { [Op.in]: userIds },
      trackId: { [Op.in]: trackIds },
    },
  });

  const likeCounts = new Map<string, number>();
  allLikes.forEach((l: any) => {
    likeCounts.set(l.trackId, (likeCounts.get(l.trackId) || 0) + 1);
  });

  const trackUserCounts = new Map<string, Set<string>>();
  allPlayHistory.forEach((p: any) => {
    if (!trackUserCounts.has(p.trackId)) trackUserCounts.set(p.trackId, new Set());
    trackUserCounts.get(p.trackId)!.add(p.userId);
  });

  for (const trackId of trackIds) {
    let score = 0;
    score += Math.log1p(crossPlayCounts.get(trackId) || 0) * 2;
    score += (likeCounts.get(trackId) || 0) * 1.5;
    score += ((trackUserCounts.get(trackId)?.size || 0) / 20) * 3;
    scores.set(trackId, score);
  }

  return scores;
}

const COLD_START_THRESHOLD = 5;
const MAX_PER_GENRE = 3;
const MAX_PER_ARTIST = 2;
const CONTENT_SCORE_CAP = 30;
const COLLAB_SCORE_CAP = 5;
const SVD_SCORE_CAP = 5;

async function isColdStartUser(userId: string): Promise<boolean> {
  const likeCount = await Like.count({ where: { userId } });
  const historyCount = await PlayHistory.count({ where: { userId } });
  return likeCount === 0 && historyCount < COLD_START_THRESHOLD;
}

async function buildGlobalProfile(): Promise<UserProfile> {
  const allLikes = await Like.findAll({
    include: [{
      model: Track, as: 'Track',
      attributes: ['id', 'genreId', 'artistId', 'energy', 'valence', 'danceability', 'acousticness', 'tempo'],
    }],
    limit: 1000,
  });

  const allHistory = await PlayHistory.findAll({
    include: [{
      model: Track, as: 'Track',
      attributes: ['id', 'genreId', 'artistId', 'energy', 'valence', 'danceability', 'acousticness', 'tempo'],
    }],
    order: [['playedAt', 'DESC']],
    limit: 1000,
  });

  const genrePreferences = new Map<string, number>();
  const artistPreferences = new Map<string, number>();
  let totalEnergy = 0, totalValence = 0, totalDanceability = 0, totalAcousticness = 0, totalTempo = 0;
  let energyCount = 0, valenceCount = 0, danceabilityCount = 0, acousticnessCount = 0, tempoCount = 0;

  const accumulate = (track: any) => {
    if (track.energy != null) { totalEnergy += track.energy; energyCount++; }
    if (track.valence != null) { totalValence += track.valence; valenceCount++; }
    if (track.danceability != null) { totalDanceability += track.danceability; danceabilityCount++; }
    if (track.acousticness != null) { totalAcousticness += track.acousticness; acousticnessCount++; }
    if (track.tempo != null) { totalTempo += track.tempo; tempoCount++; }
  };

  allLikes.forEach((like: any) => {
    const track = like.Track;
    if (track) {
      if (track.genreId) genrePreferences.set(track.genreId, (genrePreferences.get(track.genreId) || 0) + 3);
      if (track.artistId) artistPreferences.set(track.artistId, (artistPreferences.get(track.artistId) || 0) + 3);
      accumulate(track);
    }
  });

  allHistory.forEach((play: any) => {
    const track = play.Track;
    if (track) {
      if (track.genreId) genrePreferences.set(track.genreId, (genrePreferences.get(track.genreId) || 0) + 1);
      if (track.artistId) artistPreferences.set(track.artistId, (artistPreferences.get(track.artistId) || 0) + 1);
      accumulate(track);
    }
  });

  return {
    genrePreferences,
    artistPreferences,
    avgEnergy: energyCount > 0 ? totalEnergy / energyCount : 0,
    avgValence: valenceCount > 0 ? totalValence / valenceCount : 0,
    avgDanceability: danceabilityCount > 0 ? totalDanceability / danceabilityCount : 0,
    avgAcousticness: acousticnessCount > 0 ? totalAcousticness / acousticnessCount : 0,
    avgTempo: tempoCount > 0 ? totalTempo / tempoCount : 0,
    likedTrackIds: new Set(),
    recentlyPlayedIds: new Set(),
  };
}

async function getColdStartRecommendations(
  userId: string,
  profile: UserProfile,
  limit: number
): Promise<any[]> {
  const playedHistory = await PlayHistory.findAll({
    where: { userId },
    attributes: ['trackId'],
  });
  const playedTrackIds = new Set(playedHistory.map((h: any) => h.trackId));

  const allTracks = await Track.findAll({
    include: [
      { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
      { model: Genre, as: 'Genre', attributes: ['id', 'name', 'slug'] },
    ],
    where: {
      id: { [Op.notIn]: [...playedTrackIds] },
    },
    order: [['plays', 'DESC']],
    limit: 100,
  });

  const scoredTracks = allTracks.map((track) => {
    const contentScore = contentBasedScore(track, profile);
    const popularityScore = Math.log1p(track.plays) * 0.5 + Math.log1p(track.likes) * 0.3;
    const score = contentScore * 0.3 + popularityScore * 0.7;
    return { track, score };
  });

  scoredTracks.sort((a, b) => b.score - a.score);

  const genreCounts = new Map<string, number>();
  const artistCounts = new Map<string, number>();
  const diversified: typeof scoredTracks = [];

  for (const item of scoredTracks) {
    const genreId = item.track.genreId || '__none__';
    const artistId = item.track.artistId || '__none__';

    const gCount = genreCounts.get(genreId) || 0;
    const aCount = artistCounts.get(artistId) || 0;

    if (gCount < MAX_PER_GENRE && aCount < MAX_PER_ARTIST) {
      diversified.push(item);
      genreCounts.set(genreId, gCount + 1);
      artistCounts.set(artistId, aCount + 1);
      if (diversified.length >= limit) break;
    }
  }

  if (diversified.length < limit) {
    const selected = new Set(diversified.map((d) => d.track.id));
    for (const item of scoredTracks) {
      if (selected.has(item.track.id)) continue;
      diversified.push(item);
      if (diversified.length >= limit) break;
    }
  }

  return diversified.map((st) => ({
    ...st.track.toJSON(),
    recommendationScore: st.score,
  }));
}

export async function getHybridRecommendations(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  const coldStart = await isColdStartUser(userId);

  if (coldStart) {
    const globalProfile = await buildGlobalProfile();
    return getColdStartRecommendations(userId, globalProfile, limit);
  }

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

  const trackIds = allTracks.map((t: any) => t.id);
  const collabScores = await batchCollaborativeScores(trackIds, userId);

  const scoredTracks = allTracks.map((track) => {
    const contentScore = contentBasedScore(track, profile);
    const collabScore = collabScores.get(track.id) || 0;
    const svdPrediction = svdScore(svdModel, userId, track.id);

    const normalizedContent = Math.min(contentScore / CONTENT_SCORE_CAP, 1);
    const normalizedCollab = Math.min(collabScore / COLLAB_SCORE_CAP, 1);
    const normalizedSvd = Math.min(svdPrediction / SVD_SCORE_CAP, 1);

    const hybridScore =
      normalizedContent * 0.4 +
      normalizedCollab * 0.2 +
      normalizedSvd * 0.4;

    return {
      track,
      score: hybridScore,
      contentScore,
      collabScore,
      svdPrediction,
    };
  });

  scoredTracks.sort((a, b) => b.score - a.score);

  const genreCounts = new Map<string, number>();
  const artistCounts = new Map<string, number>();
  const diversified: typeof scoredTracks = [];

  for (const item of scoredTracks) {
    const genreId = item.track.genreId || '__none__';
    const artistId = item.track.artistId || '__none__';

    const gCount = genreCounts.get(genreId) || 0;
    const aCount = artistCounts.get(artistId) || 0;

    if (gCount < MAX_PER_GENRE && aCount < MAX_PER_ARTIST) {
      diversified.push(item);
      genreCounts.set(genreId, gCount + 1);
      artistCounts.set(artistId, aCount + 1);
      if (diversified.length >= limit) break;
    }
  }

  if (diversified.length < limit) {
    const selected = new Set(diversified.map((d) => d.track.id));
    for (const item of scoredTracks) {
      if (selected.has(item.track.id)) continue;
      diversified.push(item);
      if (diversified.length >= limit) break;
    }
  }

  return diversified.map((st) => ({
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

  const orConditions: any[] = [];
  if (targetTrack.artistId) {
    orConditions.push({ artistId: targetTrack.artistId });
  }
  if (targetTrack.genreId) {
    orConditions.push({ genreId: targetTrack.genreId });
  }

  const candidates = await Track.findAll({
    where: {
      id: { [Op.ne]: trackId },
      ...(orConditions.length > 0 ? { [Op.or]: orConditions } : {}),
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
