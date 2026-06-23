import { predictScore, svdScore, SVDModel } from '../services/svd';

function createMockModel(overrides?: Partial<SVDModel>): SVDModel {
  return {
    userFactors: new Map([
      ['user1', [0.5, -0.3, 0.2]],
      ['user2', [-0.1, 0.4, 0.6]],
    ]),
    itemFactors: new Map([
      ['track1', [0.3, 0.2, -0.1]],
      ['track2', [-0.2, 0.5, 0.3]],
    ]),
    userIndex: new Map([['user1', 0], ['user2', 1]]),
    itemIndex: new Map([['track1', 0], ['track2', 1]]),
    k: 3,
    globalMean: 2.5,
    ...overrides,
  };
}

describe('SVD', () => {
  describe('predictScore', () => {
    it('should predict score for known user and track', () => {
      const model = createMockModel();
      const score = predictScore(model, 'user1', 'track1');

      // globalMean + user1[0]*track1[0] + user1[1]*track1[1] + user1[2]*track1[2]
      // 2.5 + 0.5*0.3 + (-0.3)*0.2 + 0.2*(-0.1) = 2.5 + 0.15 - 0.06 - 0.02 = 2.57
      expect(score).toBeCloseTo(2.57, 2);
    });

    it('should predict different scores for different user-track pairs', () => {
      const model = createMockModel();
      const score1 = predictScore(model, 'user1', 'track1');
      const score2 = predictScore(model, 'user1', 'track2');
      const score3 = predictScore(model, 'user2', 'track1');

      expect(score1).not.toBe(score2);
      expect(score1).not.toBe(score3);
      expect(score2).not.toBe(score3);
    });

    it('should return globalMean for unknown user', () => {
      const model = createMockModel();
      const score = predictScore(model, 'unknown_user', 'track1');
      expect(score).toBe(model.globalMean);
    });

    it('should return globalMean for unknown track', () => {
      const model = createMockModel();
      const score = predictScore(model, 'user1', 'unknown_track');
      expect(score).toBe(model.globalMean);
    });

    it('should return globalMean for both unknown user and track', () => {
      const model = createMockModel();
      const score = predictScore(model, 'unknown_user', 'unknown_track');
      expect(score).toBe(model.globalMean);
    });

    it('should clamp negative scores to 0', () => {
      const model = createMockModel({
        globalMean: 0,
        userFactors: new Map([['user1', [-10, -10, -10]]]),
        itemFactors: new Map([['track1', [10, 10, 10]]]),
        k: 3,
      });
      const score = predictScore(model, 'user1', 'track1');
      expect(score).toBe(0);
    });

    it('should handle single-factor model', () => {
      const model = createMockModel({
        userFactors: new Map([['user1', [2.0]]]),
        itemFactors: new Map([['track1', [1.5]]]),
        k: 1,
        globalMean: 1.0,
      });
      const score = predictScore(model, 'user1', 'track1');
      // 1.0 + 2.0 * 1.5 = 4.0
      expect(score).toBeCloseTo(4.0, 2);
    });
  });

  describe('svdScore', () => {
    it('should return 0 for null model', () => {
      const score = svdScore(null, 'user1', 'track1');
      expect(score).toBe(0);
    });

    it('should delegate to predictScore for non-null model', () => {
      const model = createMockModel();
      const score = svdScore(model, 'user1', 'track1');
      const expected = predictScore(model, 'user1', 'track1');
      expect(score).toBe(expected);
    });

    it('should return globalMean for unknown entities', () => {
      const model = createMockModel({ globalMean: 3.0 });
      expect(svdScore(model, 'unknown', 'unknown')).toBe(3.0);
    });
  });
});
