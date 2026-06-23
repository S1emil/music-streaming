jest.mock('../models', () => {
  const mockFindAll = jest.fn();
  const mockFindOne = jest.fn();
  const mockFindByPk = jest.fn();
  const mockCount = jest.fn();
  const mockCreate = jest.fn();

  return {
    Track: {
      findAll: mockFindAll,
      findOne: mockFindOne,
      findByPk: mockFindByPk,
      increment: jest.fn(),
      decrement: jest.fn(),
    },
    Artist: { findAll: mockFindAll, findByPk: mockFindByPk },
    Genre: { findAll: mockFindAll, findByPk: mockFindByPk },
    Like: {
      findAll: mockFindAll,
      findOne: mockFindOne,
      count: mockCount,
      create: mockCreate,
    },
    PlayHistory: {
      findAll: mockFindAll,
      count: mockCount,
      create: mockCreate,
    },
    User: { findAll: mockFindAll, findByPk: mockFindByPk },
  };
});

jest.mock('../services/svd', () => ({
  buildSVDModel: jest.fn(),
  svdScore: jest.fn(),
  predictScore: jest.fn(),
}));

import { Like, PlayHistory, Track } from '../models';
import { buildSVDModel, svdScore } from '../services/svd';

const mockLike = Like as jest.Mocked<typeof Like>;
const mockPlayHistory = PlayHistory as jest.Mocked<typeof PlayHistory>;
const mockTrack = Track as jest.Mocked<typeof Track>;
const mockBuildSVDModel = buildSVDModel as jest.MockedFunction<typeof buildSVDModel>;
const mockSvdScore = svdScore as jest.MockedFunction<typeof svdScore>;

import {
  getHybridRecommendations,
  getSimilarTracks,
  buildUserProfile,
  getSVDModel,
  resetSVDModelCache,
} from '../services/recommendations';

beforeEach(() => {
  jest.clearAllMocks();
  resetSVDModelCache();
});

describe('recommendations', () => {
  describe('buildUserProfile', () => {
    it('should build profile from likes and history', async () => {
      const likes = [
        {
          Track: {
            id: 't1',
            genreId: 'g1',
            artistId: 'a1',
            energy: 0.8,
            valence: 0.6,
            danceability: 0.7,
            acousticness: 0.2,
            tempo: 120,
          },
        },
        {
          Track: {
            id: 't2',
            genreId: 'g1',
            artistId: 'a2',
            energy: 0.5,
            valence: 0.4,
            danceability: 0.5,
            acousticness: 0.6,
            tempo: 90,
          },
        },
      ];

      const history = [
        {
          Track: {
            id: 't3',
            genreId: 'g2',
            artistId: 'a1',
            energy: 0.9,
            valence: 0.7,
            danceability: 0.8,
            acousticness: 0.1,
            tempo: 140,
          },
        },
      ];

      mockLike.findAll.mockImplementationOnce(() => Promise.resolve(likes as any));
      mockPlayHistory.findAll.mockImplementationOnce(() => Promise.resolve(history as any));

      const profile = await buildUserProfile('user1');

      expect(profile.likedTrackIds.has('t1')).toBe(true);
      expect(profile.likedTrackIds.has('t2')).toBe(true);
      expect(profile.recentlyPlayedIds.has('t3')).toBe(true);

      expect(profile.genrePreferences.get('g1')).toBe(6);
      expect(profile.genrePreferences.get('g2')).toBe(1);
      expect(profile.artistPreferences.get('a1')).toBe(4);
      expect(profile.artistPreferences.get('a2')).toBe(3);

      expect(profile.avgEnergy).toBeGreaterThan(0);
      expect(profile.avgValence).toBeGreaterThan(0);
    });

    it('should handle empty likes and history', async () => {
      mockLike.findAll.mockImplementationOnce(() => Promise.resolve([]));
      mockPlayHistory.findAll.mockImplementationOnce(() => Promise.resolve([]));

      const profile = await buildUserProfile('new_user');

      expect(profile.likedTrackIds.size).toBe(0);
      expect(profile.recentlyPlayedIds.size).toBe(0);
      expect(profile.genrePreferences.size).toBe(0);
      expect(profile.artistPreferences.size).toBe(0);
      expect(profile.avgEnergy).toBe(0);
    });

    it('should handle tracks with null features', async () => {
      mockLike.findAll.mockImplementationOnce(() =>
        Promise.resolve([
          {
            Track: {
              id: 't1',
              genreId: 'g1',
              artistId: 'a1',
              energy: null,
              valence: null,
              danceability: null,
              acousticness: null,
              tempo: null,
            },
          },
        ] as any)
      );
      mockPlayHistory.findAll.mockImplementationOnce(() => Promise.resolve([]));

      const profile = await buildUserProfile('user1');

      expect(profile.likedTrackIds.has('t1')).toBe(true);
      expect(profile.avgEnergy).toBe(0);
      expect(profile.avgValence).toBe(0);
    });

    it('should handle likes without Track association', async () => {
      mockLike.findAll.mockImplementationOnce(() =>
        Promise.resolve([
          { Track: null },
          {
            Track: {
              id: 't1',
              genreId: 'g1',
              artistId: 'a1',
              energy: 0.5,
              valence: 0.5,
              danceability: 0.5,
              acousticness: 0.5,
              tempo: 100,
            },
          },
        ] as any)
      );
      mockPlayHistory.findAll.mockImplementationOnce(() => Promise.resolve([]));

      const profile = await buildUserProfile('user1');

      expect(profile.likedTrackIds.size).toBe(1);
      expect(profile.likedTrackIds.has('t1')).toBe(true);
    });
  });

  describe('getHybridRecommendations', () => {
    it('should return recommendations for active user', async () => {
      mockLike.count.mockImplementation(() => Promise.resolve(10));
      mockPlayHistory.count.mockImplementation(() => Promise.resolve(20));

      const userLikes = [
        {
          Track: {
            id: 't1',
            genreId: 'g1',
            artistId: 'a1',
            energy: 0.8,
            valence: 0.6,
            danceability: 0.7,
            acousticness: 0.2,
            tempo: 120,
          },
        },
      ];

      const userHistory = [
        {
          Track: {
            id: 't2',
            genreId: 'g1',
            artistId: 'a1',
            energy: 0.7,
            valence: 0.5,
            danceability: 0.6,
            acousticness: 0.3,
            tempo: 110,
          },
        },
      ];

      let likeCallNum = 0;
      mockLike.findAll.mockImplementation(() => {
        likeCallNum++;
        if (likeCallNum === 1) return Promise.resolve(userLikes as any);
        return Promise.resolve([]);
      });

      let histCallNum = 0;
      mockPlayHistory.findAll.mockImplementation(() => {
        histCallNum++;
        if (histCallNum <= 1) return Promise.resolve(userHistory as any);
        return Promise.resolve([]);
      });

      mockBuildSVDModel.mockImplementation(() => Promise.resolve(null));

      mockTrack.findAll.mockImplementation(() =>
        Promise.resolve([
          {
            id: 't3',
            title: 'Track 3',
            genreId: 'g2',
            artistId: 'a2',
            energy: 0.6,
            valence: 0.4,
            danceability: 0.5,
            acousticness: 0.4,
            tempo: 100,
            plays: 100,
            likes: 10,
            toJSON() {
              return { ...this };
            },
          },
        ] as any)
      );

      mockSvdScore.mockReturnValue(0.5);

      const recommendations = await getHybridRecommendations('user1', 10);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('recommendationScore');
    });

    it('should use cold start for new user', async () => {
      mockLike.count.mockImplementation(() => Promise.resolve(0));
      mockPlayHistory.count.mockImplementation(() => Promise.resolve(2));

      mockLike.findAll.mockImplementation(() => Promise.resolve([]));
      mockPlayHistory.findAll.mockImplementation(() => Promise.resolve([]));

      mockTrack.findAll.mockImplementation(() =>
        Promise.resolve([
          {
            id: 't1',
            title: 'Popular Track',
            genreId: 'g1',
            artistId: 'a1',
            energy: 0.8,
            valence: 0.6,
            danceability: 0.7,
            acousticness: 0.2,
            tempo: 120,
            plays: 1000,
            likes: 100,
            Artist: { id: 'a1', name: 'Artist 1' },
            Genre: { id: 'g1', name: 'Rock' },
            toJSON() {
              return { ...this };
            },
          },
          {
            id: 't2',
            title: 'Another Track',
            genreId: 'g2',
            artistId: 'a2',
            energy: 0.5,
            valence: 0.4,
            danceability: 0.5,
            acousticness: 0.6,
            tempo: 90,
            plays: 500,
            likes: 50,
            Artist: { id: 'a2', name: 'Artist 2' },
            Genre: { id: 'g2', name: 'Jazz' },
            toJSON() {
              return { ...this };
            },
          },
        ] as any)
      );

      const recommendations = await getHybridRecommendations('new_user', 10);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('recommendationScore');
    });

    it('should respect limit parameter', async () => {
      mockLike.count.mockImplementation(() => Promise.resolve(0));
      mockPlayHistory.count.mockImplementation(() => Promise.resolve(0));

      mockLike.findAll.mockImplementation(() => Promise.resolve([]));
      mockPlayHistory.findAll.mockImplementation(() => Promise.resolve([]));

      const tracks = Array.from({ length: 20 }, (_, i) => ({
        id: `t${i}`,
        title: `Track ${i}`,
        genreId: 'g1',
        artistId: `a${i}`,
        energy: 0.5,
        valence: 0.5,
        danceability: 0.5,
        acousticness: 0.5,
        tempo: 100,
        plays: 100 + i * 10,
        likes: 10 + i,
        Artist: { id: `a${i}`, name: `Artist ${i}` },
        Genre: { id: 'g1', name: 'Rock' },
        toJSON() {
          return { ...this };
        },
      }));

      mockTrack.findAll.mockImplementation(() => Promise.resolve(tracks as any));

      const recommendations = await getHybridRecommendations('user1', 5);

      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should exclude liked and recently played tracks', async () => {
      mockLike.count.mockImplementation(() => Promise.resolve(5));
      mockPlayHistory.count.mockImplementation(() => Promise.resolve(10));

      const userLikes = [
        { Track: { id: 't1', genreId: 'g1', artistId: 'a1', energy: 0.5, valence: 0.5, danceability: 0.5, acousticness: 0.5, tempo: 100 } },
        { Track: { id: 't2', genreId: 'g1', artistId: 'a1', energy: 0.5, valence: 0.5, danceability: 0.5, acousticness: 0.5, tempo: 100 } },
      ];

      const userHistory = [
        { Track: { id: 't3', genreId: 'g1', artistId: 'a1', energy: 0.5, valence: 0.5, danceability: 0.5, acousticness: 0.5, tempo: 100 } },
      ];

      let likeCallNum = 0;
      mockLike.findAll.mockImplementation(() => {
        likeCallNum++;
        if (likeCallNum === 1) return Promise.resolve(userLikes as any);
        return Promise.resolve([]);
      });

      let histCallNum = 0;
      mockPlayHistory.findAll.mockImplementation(() => {
        histCallNum++;
        if (histCallNum === 1) return Promise.resolve(userHistory as any);
        return Promise.resolve([]);
      });

      mockBuildSVDModel.mockImplementation(() => Promise.resolve(null));

      // Track t4 should be returned (not excluded)
      mockTrack.findAll.mockImplementation(() =>
        Promise.resolve([
          {
            id: 't4',
            title: 'Track 4',
            genreId: 'g1',
            artistId: 'a1',
            energy: 0.5,
            valence: 0.5,
            danceability: 0.5,
            acousticness: 0.5,
            tempo: 100,
            plays: 100,
            likes: 10,
            toJSON() { return { ...this }; },
          },
        ] as any)
      );

      mockSvdScore.mockReturnValue(0);

      const result = await getHybridRecommendations('user1', 10);

      // Should return recommendations and not include excluded tracks
      expect(result.length).toBeGreaterThan(0);
      const resultIds = result.map((r: any) => r.id);
      expect(resultIds).not.toContain('t1');
      expect(resultIds).not.toContain('t2');
      expect(resultIds).not.toContain('t3');
      expect(resultIds).toContain('t4');
    });
  });

  describe('getSimilarTracks', () => {
    it('should return empty array for non-existent track', async () => {
      mockTrack.findByPk.mockImplementation(() => Promise.resolve(null));

      const result = await getSimilarTracks('nonexistent');
      expect(result).toEqual([]);
    });

    it('should return similar tracks by genre and artist', async () => {
      mockTrack.findByPk.mockImplementation(() =>
        Promise.resolve({
          id: 't1',
          genreId: 'g1',
          artistId: 'a1',
          energy: 0.8,
          valence: 0.6,
          danceability: 0.7,
          acousticness: 0.2,
          tempo: 120,
        } as any)
      );

      mockTrack.findAll.mockImplementation(() =>
        Promise.resolve([
          {
            id: 't2',
            title: 'Similar Track',
            genreId: 'g1',
            artistId: 'a1',
            energy: 0.7,
            valence: 0.5,
            danceability: 0.6,
            acousticness: 0.3,
            tempo: 115,
            plays: 200,
            Artist: { id: 'a1', name: 'Artist 1' },
            Genre: { id: 'g1', name: 'Rock' },
            toJSON() { return { ...this }; },
          },
          {
            id: 't3',
            title: 'Different Track',
            genreId: 'g2',
            artistId: 'a2',
            energy: 0.3,
            valence: 0.2,
            danceability: 0.3,
            acousticness: 0.8,
            tempo: 70,
            plays: 50,
            Artist: { id: 'a2', name: 'Artist 2' },
            Genre: { id: 'g2', name: 'Jazz' },
            toJSON() { return { ...this }; },
          },
        ] as any)
      );

      const result = await getSimilarTracks('t1', 5);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('similarityScore');

      const t2Index = result.findIndex((r: any) => r.id === 't2');
      const t3Index = result.findIndex((r: any) => r.id === 't3');
      expect(t2Index).toBeLessThan(t3Index);
    });

    it('should respect limit parameter', async () => {
      mockTrack.findByPk.mockImplementation(() =>
        Promise.resolve({
          id: 't1',
          genreId: 'g1',
          artistId: 'a1',
          energy: 0.5,
          valence: 0.5,
          danceability: 0.5,
          acousticness: 0.5,
          tempo: 100,
        } as any)
      );

      const candidates = Array.from({ length: 30 }, (_, i) => ({
        id: `t${i + 2}`,
        title: `Track ${i + 2}`,
        genreId: 'g1',
        artistId: 'a1',
        energy: 0.5,
        valence: 0.5,
        danceability: 0.5,
        acousticness: 0.5,
        tempo: 100,
        plays: 100,
        Artist: { id: 'a1', name: 'Artist 1' },
        Genre: { id: 'g1', name: 'Rock' },
        toJSON() { return { ...this }; },
      }));

      mockTrack.findAll.mockImplementation(() => Promise.resolve(candidates as any));

      const result = await getSimilarTracks('t1', 5);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should give higher score to same artist tracks', async () => {
      mockTrack.findByPk.mockImplementation(() =>
        Promise.resolve({
          id: 't1',
          genreId: 'g1',
          artistId: 'a1',
          energy: 0.5,
          valence: 0.5,
          danceability: 0.5,
          acousticness: 0.5,
          tempo: 100,
        } as any)
      );

      mockTrack.findAll.mockImplementation(() =>
        Promise.resolve([
          {
            id: 't2',
            title: 'Same Artist',
            genreId: 'g1',
            artistId: 'a1',
            energy: 0.5,
            valence: 0.5,
            danceability: 0.5,
            acousticness: 0.5,
            tempo: 100,
            plays: 100,
            Artist: { id: 'a1', name: 'Artist 1' },
            Genre: { id: 'g1', name: 'Rock' },
            toJSON() { return { ...this }; },
          },
          {
            id: 't3',
            title: 'Same Genre Different Artist',
            genreId: 'g1',
            artistId: 'a2',
            energy: 0.5,
            valence: 0.5,
            danceability: 0.5,
            acousticness: 0.5,
            tempo: 100,
            plays: 100,
            Artist: { id: 'a2', name: 'Artist 2' },
            Genre: { id: 'g1', name: 'Rock' },
            toJSON() { return { ...this }; },
          },
        ] as any)
      );

      const result = await getSimilarTracks('t1', 10);

      const sameArtist = result.find((r: any) => r.id === 't2');
      const sameGenre = result.find((r: any) => r.id === 't3');

      expect(sameArtist!.similarityScore).toBeGreaterThan(sameGenre!.similarityScore);
    });
  });

  describe('getSVDModel', () => {
    it('should cache SVD model', async () => {
      const mockModel = {
        userFactors: new Map(),
        itemFactors: new Map(),
        userIndex: new Map(),
        itemIndex: new Map(),
        k: 5,
        globalMean: 2.5,
      };

      mockBuildSVDModel.mockImplementation(() => Promise.resolve(mockModel));

      const result1 = await getSVDModel();
      const result2 = await getSVDModel();

      expect(result1).toBe(result2);
      expect(mockBuildSVDModel).toHaveBeenCalledTimes(1);
    });

    it('should return cached model even when buildSVDModel returns null on subsequent calls', async () => {
      const mockModel = {
        userFactors: new Map(),
        itemFactors: new Map(),
        userIndex: new Map(),
        itemIndex: new Map(),
        k: 5,
        globalMean: 2.5,
      };

      mockBuildSVDModel.mockImplementation(() => Promise.resolve(mockModel));

      const result1 = await getSVDModel();
      expect(result1).toEqual(mockModel);

      // Even if we change the mock, the cached model should be returned
      mockBuildSVDModel.mockImplementation(() => Promise.resolve(null));
      const result2 = await getSVDModel();
      expect(result2).toEqual(mockModel);
    });
  });
});
