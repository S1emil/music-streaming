import PlayHistory from '../models/PlayHistory';
import Like from '../models/Like';

export interface SVDModel {
  userFactors: Map<string, number[]>;
  itemFactors: Map<string, number[]>;
  userIndex: Map<string, number>;
  itemIndex: Map<string, number>;
  k: number;
  globalMean: number;
}

interface Interaction {
  userId: string;
  trackId: string;
  rating: number;
}

const DEFAULT_K = 20;
const DEFAULT_LEARNING_RATE = 0.005;
const DEFAULT_REGULARIZATION = 0.02;
const DEFAULT_ITERATIONS = 50;

function buildRatingMatrix(interactions: Interaction[]): { matrix: number[][]; userIndex: Map<string, number>; itemIndex: Map<string, number>; users: string[]; items: string[] } {
  const userSet = new Set<string>();
  const itemSet = new Set<string>();

  interactions.forEach((inter) => {
    userSet.add(inter.userId);
    itemSet.add(inter.trackId);
  });

  const users = [...userSet];
  const items = [...itemSet];

  const userIndex = new Map<string, number>();
  const itemIndex = new Map<string, number>();

  users.forEach((u, i) => userIndex.set(u, i));
  items.forEach((t, i) => itemIndex.set(t, i));

  const matrix: number[][] = users.map(() => items.map(() => 0));

  interactions.forEach((inter) => {
    const ui = userIndex.get(inter.userId)!;
    const ii = itemIndex.get(inter.trackId)!;
    matrix[ui][ii] = inter.rating;
  });

  return { matrix, userIndex, itemIndex, users, items };
}

function initializeFactors(count: number, k: number): number[][] {
  const factors: number[][] = [];
  for (let i = 0; i < count; i++) {
    const row: number[] = [];
    for (let j = 0; j < k; j++) {
      row.push((Math.random() - 0.5) * 0.1);
    }
    factors.push(row);
  }
  return factors;
}

function trainSVD(
  matrix: number[][],
  k: number,
  lr: number,
  lambda: number,
  iterations: number
): { P: number[][]; Q: number[][]; globalMean: number } {
  const m = matrix.length;
  const n = matrix[0].length;

  let totalSum = 0;
  let count = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] > 0) {
        totalSum += matrix[i][j];
        count++;
      }
    }
  }
  const globalMean = count > 0 ? totalSum / count : 0;

  const P = initializeFactors(m, k);
  const Q = initializeFactors(n, k);

  for (let iter = 0; iter < iterations; iter++) {
    let totalError = 0;
    let totalSamples = 0;

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] <= 0) continue;

        let prediction = globalMean;
        for (let f = 0; f < k; f++) {
          prediction += P[i][f] * Q[j][f];
        }

        const error = matrix[i][j] - prediction;
        totalError += error * error;
        totalSamples++;

        for (let f = 0; f < k; f++) {
          const pOld = P[i][f];
          const qOld = Q[j][f];
          P[i][f] += lr * (error * qOld - lambda * pOld);
          Q[j][f] += lr * (error * pOld - lambda * qOld);
        }
      }
    }

    if (totalSamples > 0 && iter % 10 === 0) {
      const rmse = Math.sqrt(totalError / totalSamples);
      console.log(`[SVD] Iteration ${iter + 1}/${iterations}, RMSE: ${rmse.toFixed(4)}`);
    }
  }

  return { P, Q, globalMean };
}

export async function buildSVDModel(): Promise<SVDModel | null> {
  const allHistory = await PlayHistory.findAll({
    attributes: ['userId', 'trackId'],
    group: ['userId', 'trackId'],
  });

  const allLikes = await Like.findAll({
    attributes: ['userId', 'trackId'],
  });

  if (allHistory.length === 0 && allLikes.length === 0) {
    return null;
  }

  const interactionMap = new Map<string, Interaction>();

  allHistory.forEach((h: any) => {
    const key = `${h.userId}:${h.trackId}`;
    const existing = interactionMap.get(key);
    if (existing) {
      existing.rating = Math.min(5, existing.rating + 0.5);
    } else {
      interactionMap.set(key, { userId: h.userId, trackId: h.trackId, rating: 1 });
    }
  });

  allLikes.forEach((l: any) => {
    const key = `${l.userId}:${l.trackId}`;
    const existing = interactionMap.get(key);
    if (existing) {
      existing.rating = Math.min(5, existing.rating + 2);
    } else {
      interactionMap.set(key, { userId: l.userId, trackId: l.trackId, rating: 3 });
    }
  });

  const interactions = [...interactionMap.values()];

  if (interactions.length < 5) {
    return null;
  }

  const { matrix, userIndex, itemIndex, users, items } = buildRatingMatrix(interactions);

  const k = Math.min(DEFAULT_K, Math.min(users.length, items.length) - 1);
  if (k < 1) return null;

  const { P, Q, globalMean } = trainSVD(matrix, k, DEFAULT_LEARNING_RATE, DEFAULT_REGULARIZATION, DEFAULT_ITERATIONS);

  const userFactors = new Map<string, number[]>();
  const itemFactors = new Map<string, number[]>();

  users.forEach((u, i) => userFactors.set(u, P[i]));
  items.forEach((t, j) => itemFactors.set(t, Q[j]));

  return { userFactors, itemFactors, userIndex, itemIndex, k, globalMean };
}

export function predictScore(model: SVDModel, userId: string, trackId: string): number {
  const userVec = model.userFactors.get(userId);
  const itemVec = model.itemFactors.get(trackId);

  if (!userVec || !itemVec) {
    return model.globalMean;
  }

  let score = model.globalMean;
  for (let f = 0; f < model.k; f++) {
    score += userVec[f] * itemVec[f];
  }

  return Math.min(5, Math.max(0, score));
}

export function svdScore(model: SVDModel | null, userId: string, trackId: string): number {
  if (!model) return 0;
  return predictScore(model, userId, trackId);
}
