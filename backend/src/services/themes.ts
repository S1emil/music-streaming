interface ThemeResult {
  themes: string[];
  mood: string;
  energy: number;
}

const THEME_KEYWORDS: Record<string, string[]> = {
  'love': ['любовь', 'люблю', 'любишь', 'влюблён', 'влюблена', 'любимый', 'любимая', 'обнимаю', 'обнять', 'поцелуй', 'обниму', 'heart', 'love', 'kiss', 'embrace', 'adore', 'devoted'],
  'breakup': ['расставание', 'прощай', 'прощай', 'уходишь', 'уходи', 'уходила', 'уходил', 'рассталась', 'расстался', 'broken', 'goodbye', 'leave', 'left', 'gone', 'walk away'],
  'friendship': ['друг', 'друзья', 'дружба', 'дружим', 'побратим', 'команда', 'брат', 'братан', 'братишка', 'bro', 'friend', 'friends', 'friendship', 'together', 'buddy', 'pal'],
  'sadness': ['грустно', 'грусть', 'печаль', 'печально', 'тоскую', 'тоска', 'печалит', 'грустный', 'грустная', 'sad', 'sorrow', 'sorrowful', 'unhappy', 'melancholy', 'blue'],
  'joy': ['радость', 'счастье', 'счастлив', 'счастлива', 'весело', 'веселье', 'улыбка', 'улыбнись', 'праздник', 'happy', 'joy', 'joyful', 'smile', 'celebrate', 'cheerful'],
  'life': ['жизнь', 'жить', 'смысл', 'смысл жизни', 'путь', 'судьба', 'бытие', 'existence', 'meaning', 'life', 'living', 'destiny', 'fate', 'purpose'],
  'freedom': ['свобода', 'свободен', 'свободна', 'свободная', 'полёт', 'крылья', 'лететь', '自由', 'freedom', 'free', 'liberty', 'fly', 'wings', 'unbound'],
  'city': ['город', 'улица', 'улицы', 'проспект', 'переулок', 'метрополитен', 'city', 'urban', 'street', 'downtown', 'avenue', 'boulevard'],
  'nature': ['море', 'океан', 'река', 'гора', 'горы', 'лес', 'поле', 'цветок', 'ветер', 'небо', 'звезда', 'луна', 'рассвет', 'закат', 'sea', 'ocean', 'mountain', 'forest', 'river', 'sunset', 'sunrise', 'moon', 'stars', 'wind'],
  'nostalgia': ['ностальгия', 'вспоминаю', 'воспоминание', 'воспоминания', 'детство', 'прошлое', 'когда-то', 'бывало', 'было', 'nostalgia', 'remember', 'memories', 'past', 'childhood', '回忆'],
  'melancholy': ['туман', 'туманный', 'серый', 'серость', 'пустота', 'пустой', 'одинок', 'одиноко', 'одинокий', 'одинокая', 'забыть', 'забыл', 'забыла', 'fog', 'grey', 'gray', 'empty', 'alone', 'lonely', 'silence', 'silent'],
  'hope': ['надежда', 'надежды', 'верю', 'поверю', 'надеюсь', 'завтра', 'будущее', 'рассвет', 'рассвет', 'утро', 'hope', 'believe', 'believe', 'tomorrow', 'dawn', 'morning', 'promising'],
  'anxiety': ['тревога', 'тревожно', 'страх', 'страшно', 'паника', 'беспокойство', 'тревожит', 'anxiety', 'fear', 'afraid', 'worried', 'panic', 'dread'],
  'loneliness': ['один', 'одна', 'одинокий', 'одинокая', 'одиноко', 'одиночество', 'без тебя', 'без него', 'без неё', 'alone', 'lonely', 'solitary', 'by myself', 'nobody'],
  'passion': ['страсть', 'страсти', 'жар', 'гореть', 'пламя', 'огонь', 'пыл', 'passion', 'desire', 'burn', 'fire', 'flame', 'hot', 'intense'],
  'protest': ['борьба', 'против', 'восстание', 'бунт', 'голос', 'правда', 'воля', 'революция', 'fight', 'rebel', 'rebellion', 'protest', 'revolution', 'voice', 'resist'],
  'self_discovery': ['я', 'себя', 'сам', 'сама', 'кто я', 'познать', 'понять себя', 'внутри', 'self', 'myself', 'who am i', 'within', 'inside', 'discover'],
  'secret': ['секрет', 'тайна', 'скрытый', 'спрятал', 'спрятала', '隐藏', 'secret', 'mystery', 'hidden', 'conceal', 'mysterious'],
  'time': ['время', 'времени', 'минута', 'секунда', 'час', 'день', 'год', 'лето', 'зима', 'осень', 'весна', 'time', 'moment', 'second', 'minute', 'hour', 'day', 'year', 'season'],
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  'sad': ['грустно', 'грусть', 'печаль', 'слёзы', 'слезы', 'боль', 'тоска', 'тоскую', 'одинок', 'одиноко', 'холод', 'холодный', 'дождь', 'дождик', 'autumn', 'rain', 'tears', 'pain', 'sad', 'cry', 'crying'],
  'happy': ['весело', 'веселье', 'смех', 'смеяться', 'улыбка', 'улыбнуться', 'праздник', 'танц', 'танцевать', 'fun', 'laugh', 'smile', 'happy', 'party', 'dance', 'celebrate'],
  'aggressive': ['ярость', 'гнев', 'крик', 'кричать', 'орать', 'огонь', 'взрыв', 'разруш', 'сломать', 'rage', 'angry', 'scream', 'shout', 'fire', 'destroy', 'break', 'fury'],
  'romantic': ['романтика', 'романтично', 'нежность', 'нежный', 'нежная', 'страсть', 'страстный', 'обнять', 'обнимаю', 'moonlight', 'romance', 'tender', 'passion', 'intimate', 'sweet'],
  'calm': ['спокойно', 'спокойный', 'тишина', 'тихий', 'тихая', 'умиротвор', 'расслабь', 'расслаблен', 'calm', 'peace', 'peaceful', 'quiet', 'serene', 'relax', 'gentle'],
  'energetic': ['энергия', 'энергичный', 'драйв', 'драйвовый', 'быстрый', 'быстрая', 'мощный', 'мощная', 'energy', 'energetic', 'powerful', 'fast', 'intense', 'dynamic', 'drive'],
};

const SYNONYM_GROUPS: Record<string, string[]> = {
  'sadness': ['печаль', 'тоска', 'уныние', 'меланхолия', 'печаль', 'горе', 'слёзы', 'грустно', 'грустный', 'печальный', 'тоскливый', 'унылый', 'sad', 'sorrow', 'melancholy', 'grief', 'unhappy', 'blue'],
  'joy': ['счастье', 'веселье', 'весело', 'ликование', 'восторг', 'улыбка', 'смех', 'весёлый', 'радостный', 'счастливый', 'happy', 'joy', 'cheerful', 'delight', 'pleasure', 'fun'],
  'love': ['влюблённость', 'романтика', 'нежность', 'страсть', 'обожание', 'привязанность', ' сердце', 'love', 'romance', 'passion', 'affection', 'devotion', 'crush'],
  'loneliness': ['уединение', 'изоляция', 'одинокий', 'покинутость', 'заброшенность', 'одиночество', 'один', 'одна', 'alone', 'lonely', 'solitary', 'isolated', 'abandoned'],
  'freedom': ['свободный', 'независимость', 'вольный', 'раскрепощённый', 'свобода', 'freedom', 'free', 'liberty', 'independent', 'unbound', 'liberated'],
  'life': ['существование', 'бытие', 'жизнь', 'жить', 'смысл жизни', 'life', 'existence', 'living', 'being', 'purpose'],
  'hope': ['вера', 'упование', 'ожидание', 'надежда', 'надеяться', 'hope', 'faith', 'trust', 'belief', 'optimism'],
  'anxiety': ['страх', 'беспокойство', 'паника', 'опасение', 'тревога', 'тревожно', 'fear', 'anxiety', 'worry', 'panic', 'dread', 'concern'],
  'secret': ['тайна', 'загадка', 'секрет', 'мистика', 'secret', 'mystery', 'enigma', 'hidden'],
  'time': ['минута', 'секунда', 'час', 'мгновение', 'момент', 'прошлое', 'будущее', 'time', 'moment', 'instant', 'second', 'minute', 'hour'],
};

function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemWord(word: string): string {
  return word
    .replace(/(ость|ости|ений|ение|ания|ание|тельно|емый|имый|ый|ий|ой|ая|ое|ые|ие|ов|ев|ов|ей|ий|ий|ть|ся|сь)$/, '')
    .replace(/(ться|тся)$/, '');
}

function countMatches(text: string, keywords: string[]): number {
  const words = text.split(' ');
  const stems = words.map(stemWord);
  let count = 0;
  for (const keyword of keywords) {
    const kw = keyword.toLowerCase().trim();
    if (!kw) continue;
    if (kw.includes(' ') || kw.includes('_')) {
      if (text.includes(kw.replace('_', ''))) count += 3;
    } else {
      const kwStem = stemWord(kw);
      for (let i = 0; i < words.length; i++) {
        if (words[i] === kw || stems[i] === kwStem || words[i].startsWith(kwStem) || kwStem.startsWith(stems[i])) {
          count++;
          break;
        }
      }
    }
  }
  return count;
}

export function analyzeThemes(lyrics: string): ThemeResult {
  const normalized = normalizeText(lyrics);
  const words = normalized.split(' ');
  const totalWords = words.length || 1;

  const themeScores: Record<string, number> = {};

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    const score = countMatches(normalized, keywords);
    if (score >= 2) {
      themeScores[theme] = score;
    }
  }

  const sortedThemes = Object.entries(themeScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([theme]) => theme);

  let mood = 'нейтральное';
  let maxMoodScore = 0;
  for (const [moodName, keywords] of Object.entries(MOOD_KEYWORDS)) {
    const score = countMatches(normalized, keywords);
    if (score > maxMoodScore) {
      maxMoodScore = score;
      mood = moodName;
    }
  }

  const energyWords = ['power', 'energy', 'fire', 'strong', 'drive', 'beat', 'ритм', 'сила', 'энергия', 'прыгай', 'кричи', 'быстрый', 'мощный', 'jump', 'scream', 'fast', 'loud'];
  const energyScore = countMatches(normalized, energyWords);
  const energy = Math.min(1, Math.round((energyScore / Math.max(totalWords * 0.03, 1)) * 100) / 100);

  if (sortedThemes.length === 0) {
    sortedThemes.push('неопределённая тема');
  }

  return {
    themes: sortedThemes,
    mood,
    energy,
  };
}

export function extractTags(text: string): string[] {
  const result = analyzeThemes(text);
  return [...result.themes, result.mood];
}

function expandWithSynonyms(words: string[]): string[] {
  const expanded = new Set(words);
  for (const word of words) {
    for (const [synonymGroup, synonyms] of Object.entries(SYNONYM_GROUPS)) {
      if (synonymGroup === word || synonyms.includes(word)) {
        expanded.add(synonymGroup);
        synonyms.forEach((s) => expanded.add(s));
      }
    }
  }
  return [...expanded];
}

export function buildSearchVector(query: string): string[] {
  const normalized = normalizeText(query);
  const words = normalized.split(' ').filter((w) => w.length > 2);
  return expandWithSynonyms(words);
}

export function semanticScore(trackThemes: string[], trackMood: string, searchWords: string[]): number {
  let score = 0;
  const searchSet = new Set(searchWords);

  for (const word of searchWords) {
    for (const theme of trackThemes) {
      if (theme.includes(word) || word.includes(theme)) {
        score += 4;
      }
    }
    if (trackMood.includes(word) || word.includes(trackMood)) {
      score += 3;
    }
  }

  for (const theme of trackThemes) {
    if (searchSet.has(theme)) {
      score += 5;
    }
    for (const syn of (SYNONYM_GROUPS[theme] || [])) {
      if (searchSet.has(syn)) {
        score += 3;
      }
    }
  }

  if (trackMood && searchSet.has(trackMood)) {
    score += 4;
  }
  for (const syn of (SYNONYM_GROUPS[trackMood] || [])) {
    if (searchSet.has(syn)) {
      score += 2;
    }
  }

  for (const [themeName, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (trackThemes.includes(themeName)) {
      for (const kw of keywords) {
        if (searchSet.has(kw) || searchWords.some((sw) => sw.includes(kw) || kw.includes(sw))) {
          score += 1;
        }
      }
    }
  }

  return score;
}
