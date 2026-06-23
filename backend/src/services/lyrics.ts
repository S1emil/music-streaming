import axios from 'axios';
import * as cheerio from 'cheerio';

const GENIUS_API_URL = 'https://api.genius.com';
const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN || '';

interface GeniusSearchResult {
  id: number;
  title: string;
  artist_name: string;
  url: string;
  thumbnail_url: string;
}

interface GeniusLyricsResult {
  lyrics: string;
  source: 'genius';
}

export async function searchGenius(query: string): Promise<GeniusSearchResult[]> {
  if (!GENIUS_ACCESS_TOKEN) {
    throw new Error('Genius API token not configured');
  }

  try {
    const response = await axios.get(`${GENIUS_API_URL}/search`, {
      headers: {
        Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
      },
      params: { q: query },
    });

    const hits = response.data?.response?.hits || [];
    return hits.map((hit: any) => ({
      id: hit.result.id,
      title: hit.result.title,
      artist_name: hit.result.primary_artist.name,
      url: hit.result.url,
      thumbnail_url: hit.result.song_art_image_thumbnail_url,
    }));
  } catch (error) {
    console.error('Genius search error:', error);
    throw error;
  }
}

export async function fetchLyricsFromGenius(songUrl: string): Promise<string> {
  try {
    const response = await axios.get(songUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    let lyrics = '';

    $('[data-lyrics-container="true"]').each((_, element) => {
      const html = $(element).html() || '';
      const text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

      lyrics += text + '\n';
    });

    if (!lyrics) {
      const container = $('.Lyrics__Container-sc-1ynbvzw-1');
      lyrics = container.text().trim();
    }

    if (!lyrics) {
      throw new Error('Lyrics not found on page');
    }

    return lyrics.trim();
  } catch (error) {
    console.error('Error fetching lyrics from Genius:', error);
    throw error;
  }
}

export async function fetchLyricsBySearch(artist: string, title: string): Promise<GeniusLyricsResult> {
  try {
    const response = await axios.get('https://lrclib.net/api/search', {
      params: { artist_name: artist, track_name: title },
    });

    const results = response.data || [];
    if (results.length === 0) {
      throw new Error('Текст песни не найден');
    }

    const bestMatch = results.find((r: any) => r.syncedLyrics) || results[0];
    let lyrics = bestMatch.syncedLyrics || bestMatch.plainLyrics;

    if (!lyrics) {
      throw new Error('Текст песни не найден');
    }

    if (bestMatch.syncedLyrics) {
      lyrics = lyrics.replace(/\[\d{2}:\d{2}[.:]\d{2,3}\]\s?/g, '');
    }

    return { lyrics, source: 'genius' };
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Текст песни не найден');
    }
    throw error;
  }
}

export function generateKeywords(text: string): string[] {
  if (!text) return [];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'shall', 'i', 'you', 'he',
    'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my',
    'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
    'am', 'not', 'no', 'if', 'then', 'else', 'when', 'up', 'out', 'so',
    'just', 'also', 'than', 'too', 'very', 'how', 'all', 'any', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .reduce((acc: string[], word: string) => {
      if (!acc.includes(word)) acc.push(word);
      return acc;
    }, []);
}
