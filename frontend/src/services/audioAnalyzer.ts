interface AudioFeatures {
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  tempo: number;
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function downsample(data: Float32Array, factor: number): Float32Array {
  const outLen = Math.ceil(data.length / factor);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    let sum = 0;
    const start = i * factor;
    const end = Math.min(start + factor, data.length);
    for (let j = start; j < end; j++) {
      sum += data[j];
    }
    out[i] = sum / (end - start);
  }
  return out;
}

function calcRMS(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

function calcZeroCrossings(data: Float32Array): number {
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0) !== (data[i - 1] >= 0)) count++;
  }
  return count / data.length;
}

function calcSpectralSpread(data: Float32Array, sampleRate: number): number {
  const blockSize = 1024;
  const blocks = Math.floor(data.length / blockSize);
  if (blocks === 0) return 0.5;

  let weightedSum = 0;
  let totalWeight = 0;

  for (let b = 0; b < Math.min(blocks, 20); b++) {
    const offset = b * blockSize;
    let sumSq = 0;
    for (let i = 0; i < blockSize; i++) {
      sumSq += data[offset + i] * data[offset + i];
    }
    const rms = Math.sqrt(sumSq / blockSize);
    const zcr = (() => {
      let c = 0;
      for (let i = 1; i < blockSize; i++) {
        if ((data[offset + i] >= 0) !== (data[offset + i - 1] >= 0)) c++;
      }
      return c / blockSize;
    })();

    const centroid = zcr * sampleRate * 0.5;
    weightedSum += centroid * rms;
    totalWeight += rms;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export async function analyzeAudio(url: string): Promise<AudioFeatures> {
  const ctx = getAudioContext();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const rawData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  const factor = Math.max(1, Math.floor(sampleRate / 8000));
  const data = downsample(rawData, factor);
  const dsRate = sampleRate / factor;
  const length = data.length;

  const rms = calcRMS(data);
  const energy = Math.min(1, rms * 3.5);

  const zcr = calcZeroCrossings(data);
  const spectralCentroid = calcSpectralSpread(data, dsRate);
  const brightness = Math.min(1, spectralCentroid / 4000);
  const valence = Math.min(1, Math.max(0, brightness * 0.7 + zcr * 2));

  const blockSize = Math.floor(dsRate * 0.05);
  let onsetCount = 0;
  let prevE = 0;
  const blockCount = Math.floor(length / blockSize);
  for (let b = 1; b < Math.min(blockCount, 2000); b++) {
    let e = 0;
    const off = b * blockSize;
    const end = Math.min(off + blockSize, length);
    for (let i = off; i < end; i++) {
      e += data[i] * data[i];
    }
    e = Math.sqrt(e / (end - off));
    if (e - prevE > 0.015) onsetCount++;
    prevE = e;
  }
  const onsetRate = blockCount > 1 ? onsetCount / (blockCount - 1) : 0;
  const danceability = Math.min(1, Math.max(0, onsetRate * 3 + rms * 0.5));

  const lowBlock = Math.floor(dsRate * 0.02);
  let lowEnergy = 0;
  let highEnergy = 0;
  for (let i = 0; i < Math.min(length, dsRate * 2); i++) {
    const chunk = Math.floor(i / lowBlock);
    if (chunk % 2 === 0) lowEnergy += data[i] * data[i];
    else highEnergy += data[i] * data[i];
  }
  const lowRatio = (lowEnergy + highEnergy) > 0 ? lowEnergy / (lowEnergy + highEnergy) : 0.5;
  const flatness = Math.abs(zcr - 0.5) * 2;
  const acousticness = Math.min(1, Math.max(0, lowRatio * 0.6 + (1 - rms) * 0.3 + flatness * 0.1));

  const windowSize = Math.floor(dsRate * 2);
  const hopSize = Math.floor(windowSize / 4);
  const envLen = Math.floor((length - windowSize) / hopSize);
  if (envLen < 4) {
    return { energy, valence, danceability, acousticness, tempo: 120 };
  }
  const envelope = new Float32Array(envLen);
  for (let i = 0; i < envLen; i++) {
    let e = 0;
    const off = i * hopSize;
    for (let j = 0; j < windowSize; j++) {
      e += data[off + j] * data[off + j];
    }
    envelope[i] = Math.sqrt(e / windowSize);
  }

  const diff = new Float32Array(envLen - 1);
  for (let i = 0; i < diff.length; i++) {
    diff[i] = Math.max(0, envelope[i + 1] - envelope[i]);
  }

  const minBPM = 60;
  const maxBPM = 200;
  const minLag = Math.floor((60 / maxBPM) * (dsRate / hopSize));
  const maxLag = Math.floor((60 / minBPM) * (dsRate / hopSize));

  let maxCorr = 0;
  let bestLag = 0;
  for (let lag = minLag; lag <= Math.min(maxLag, diff.length - 1); lag++) {
    let corr = 0;
    for (let i = 0; i < diff.length - lag; i++) {
      corr += diff[i] * diff[i + lag];
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }

  const tempo = bestLag > 0
    ? Math.round(Math.min(200, Math.max(60, 60 / (bestLag * hopSize / dsRate))))
    : 120;

  return {
    energy: Math.round(energy * 100) / 100,
    valence: Math.round(valence * 100) / 100,
    danceability: Math.round(danceability * 100) / 100,
    acousticness: Math.round(acousticness * 100) / 100,
    tempo,
  };
}
