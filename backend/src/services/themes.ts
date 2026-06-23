interface ThemeResult {
  themes: string[];
  mood: string;
  energy: number;
}

const THEME_KEYWORDS: Record<string, string[]> = {
  'love': ['любовь', 'люблю', 'любишь', 'влюблён', 'влюблена', 'любимый', 'любимая', 'обнимаю', 'обнять', 'поцелуй', 'обниму', 'сердце', 'душ', 'душу', 'сердца', 'heart', 'love', 'kiss', 'embrace', 'adore', 'devoted', 'romantic', 'romance'],
  'breakup': ['расставание', 'прощай', 'уходишь', 'уходи', 'уходила', 'уходил', 'рассталась', 'расстался', 'развод', 'расстались', 'broken', 'goodbye', 'leave', 'left', 'gone', 'walk away', 'break up', 'separate'],
  'friendship': ['друг', 'друзья', 'дружба', 'дружим', 'побратим', 'команда', 'брат', 'братан', 'братишка', 'семья', 'родные', 'bro', 'friend', 'friends', 'friendship', 'together', 'buddy', 'pal', 'family'],
  'sadness': ['грустно', 'грусть', 'печаль', 'печально', 'тоскую', 'тоска', 'печалит', 'грустный', 'грустная', 'слёзы', 'слезы', 'плач', 'плачу', 'горе', 'боль', 'больно', 'уныл', 'тосклив', 'печальн', 'sad', 'sorrow', 'sorrowful', 'unhappy', 'melancholy', 'blue', 'cry', 'tears', 'pain', 'hurt'],
  'joy': ['радость', 'счастье', 'счастлив', 'счастлива', 'весело', 'веселье', 'улыбка', 'улыбнись', 'праздник', 'смех', 'смеяться', 'ликующ', 'весёл', 'радостн', 'happy', 'joy', 'joyful', 'smile', 'celebrate', 'cheerful', 'fun', 'laugh', 'party'],
  'life': ['жизнь', 'жить', 'смысл', 'смысл жизни', 'путь', 'судьба', 'бытие', 'существован', 'прожить', 'прожил', 'дожить', 'living', 'existence', 'meaning', 'life', 'destiny', 'fate', 'purpose', 'alive', 'survive'],
  'freedom': ['свобода', 'свободен', 'свободна', 'свободная', 'полёт', 'полет', 'крылья', 'крыльях', 'лететь', 'лети', 'улететь', 'раскрепощён', 'независим', 'вольн', 'freedom', 'free', 'liberty', 'fly', 'wings', 'unbound', 'liberated', 'independent'],
  'city': ['город', 'городе', 'улица', 'улицы', 'улицам', 'проспект', 'переулок', 'метро', 'метropolitan', 'квартал', 'район', 'district', 'city', 'urban', 'street', 'downtown', 'avenue', 'boulevard'],
  'nature': ['природ', 'море', 'океан', 'река', 'реки', 'гора', 'горы', 'горах', 'лес', 'леса', 'поле', 'поля', 'цветок', 'цветы', 'ветер', 'ветра', 'небо', 'неба', 'звезда', 'звезды', 'луна', 'луны', 'рассвет', 'рассвета', 'закат', 'заката', 'солнце', 'солнца', 'дождь', 'дождя', 'снег', 'снега', 'облак', 'трав', 'свет', 'sea', 'ocean', 'mountain', 'forest', 'river', 'sunset', 'sunrise', 'moon', 'stars', 'wind', 'rain', 'snow', 'sun', 'sky', 'cloud', 'flower', 'tree', 'garden', 'field'],
  'nostalgia': ['ностальгия', 'ностальгию', 'ностальги', 'вспоминаю', 'воспоминание', 'воспоминания', 'детство', 'прошлое', 'прошлом', 'когда-то', 'бывало', 'было', 'когда то', 'прежн', 'бывш', 'nostalgia', 'remember', 'memories', 'memories', 'past', 'childhood', 'remembering', 'reminisce'],
  'melancholy': ['туман', 'туманн', 'серый', 'серость', 'пустот', 'пустын', 'одинок', 'одиноко', 'одинокий', 'одинокая', 'мрачн', 'хмур', 'забыть', 'забыл', 'забыла', 'forgotten', 'forgotten', 'fog', 'grey', 'gray', 'empty', 'alone', 'lonely', 'silence', 'silent', 'dark', 'gloomy', 'desolate'],
  'hope': ['надежд', 'надеюсь', 'поверю', 'завтра', 'будущее', 'будущем', 'рассвет', 'рассвета', 'утро', 'утра', 'верю', 'стремл', 'мечта', 'мечтаю', 'hope', 'believe', 'tomorrow', 'dawn', 'morning', 'promising', 'dream', 'wish', 'believe'],
  'anxiety': ['тревог', 'тревожно', 'тревожит', 'страх', 'страшно', 'паник', 'беспокойств', 'боятся', 'боюсь', 'боишься', 'тревожн', 'anxiety', 'fear', 'afraid', 'worried', 'panic', 'dread', 'worried', 'nervous'],
  'loneliness': ['один', 'одна', 'одинокий', 'одинокая', 'одиноко', 'одиночеств', 'без тебя', 'без него', 'без неё', 'без вас', 'покинут', 'заброш', 'уединён', 'abandoned', 'alone', 'lonely', 'solitary', 'by myself', 'nobody', 'isolated', 'deserted'],
  'passion': ['страст', 'жар', 'горет', 'горишь', 'горим', 'пламя', 'пламени', 'огонь', 'огня', 'пыл', 'пыла', 'жгуч', 'обжига', 'burn', 'fire', 'flame', 'hot', 'intense', 'passion', 'desire', 'blaze'],
  'protest': ['борьба', 'бороться', 'против', 'восстани', 'бунт', 'бунту', 'голос', 'голоса', 'голосом', 'правда', 'правду', 'воля', 'волю', 'революци', 'изменить', 'fight', 'rebel', 'rebellion', 'protest', 'revolution', 'voice', 'resist', 'stand up'],
  'self_discovery': ['кто я', 'я сам', 'я сама', 'познать', 'понять себя', 'внутри', 'внутрь', 'осознан', 'пробужден', 'проснуть', 'self', 'myself', 'who am i', 'within', 'inside', 'discover', 'awakening', 'realize'],
  'secret': ['секрет', 'тайна', 'тайну', 'тайны', 'скрыт', 'спрятал', 'спрятала', 'загадк', 'мистик', 'неизвестн', 'загадочн', 'secret', 'mystery', 'hidden', 'conceal', 'mysterious', 'enigma', 'unknown'],
  'time': ['время', 'времени', 'минут', 'минуту', 'секунд', 'секунду', 'час', 'часа', 'день', 'дня', 'год', 'года', 'лето', 'лета', 'зиму', 'зимы', 'осень', 'осени', 'весна', 'весны', 'прошл', 'будущ', 'настоящ', 'time', 'moment', 'second', 'minute', 'hour', 'day', 'year', 'season', 'clock', 'eternity'],
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
  'sadness': ['печаль', 'тоска', 'уныние', 'меланхолия', 'горе', 'слёзы', 'грустно', 'грусть', 'грустный', 'печальный', 'тоскливый', 'унылый', 'плач', 'слезы', 'боль', 'больно', 'страдан', 'sad', 'sorrow', 'melancholy', 'grief', 'unhappy', 'blue', 'cry', 'tears', 'pain'],
  'joy': ['счастье', 'веселье', 'весело', 'ликование', 'восторг', 'улыбка', 'смех', 'весёлый', 'радостный', 'счастливый', 'праздник', 'радость', 'happy', 'joy', 'cheerful', 'delight', 'pleasure', 'fun', 'smile', 'laugh', 'party', 'celebrate'],
  'love': ['любовь', 'влюблённость', 'романтика', 'нежность', 'страсть', 'обожание', 'привязанность', 'сердце', 'обнимаю', 'обнять', 'поцелуй', 'люблю', 'любимый', 'любимая', 'влюблён', 'влюблена', 'love', 'romance', 'passion', 'affection', 'devotion', 'crush', 'kiss', 'embrace', 'heart'],
  'loneliness': ['уединение', 'изоляция', 'одинокий', 'одинокая', 'одиноко', 'покинутость', 'заброшенность', 'одиночество', 'один', 'одна', 'без тебя', 'без него', 'без неё', 'alone', 'lonely', 'solitary', 'isolated', 'abandoned', 'nobody'],
  'freedom': ['свобода', 'свободный', 'свободен', 'свободна', 'независимость', 'вольный', 'раскрепощённый', 'полёт', 'крылья', 'лететь', 'вольн', 'freedom', 'free', 'liberty', 'independent', 'unbound', 'liberated', 'fly', 'wings'],
  'life': ['жизнь', 'существование', 'бытие', 'жить', 'смысл жизни', 'судьба', 'путь', 'прожить', 'life', 'existence', 'living', 'being', 'purpose', 'destiny', 'fate', 'alive'],
  'hope': ['надежда', 'надежды', 'надеюсь', 'вера', 'упование', 'ожидание', 'надеяться', 'верю', 'завтра', 'будущее', 'рассвет', 'утро', 'мечта', 'hope', 'faith', 'trust', 'belief', 'optimism', 'tomorrow', 'dawn', 'believe', 'dream'],
  'anxiety': ['тревога', 'тревожно', 'тревожит', 'страх', 'страшно', 'паника', 'беспокойство', 'боятся', 'боюсь', 'тревожн', 'fear', 'anxiety', 'worry', 'panic', 'dread', 'concern', 'afraid', 'nervous'],
  'secret': ['тайна', 'тайну', 'тайны', 'загадка', 'секрет', 'мистика', 'скрытый', 'спрятал', 'спрятала', 'неизвестн', 'загадочн', 'secret', 'mystery', 'enigma', 'hidden', 'mysterious'],
  'time': ['время', 'времени', 'минута', 'минуту', 'секунда', 'секунду', 'час', 'часа', 'мгновение', 'момент', 'прошлое', 'будущее', 'день', 'дня', 'год', 'года', 'season', 'time', 'moment', 'instant', 'second', 'minute', 'hour', 'clock', 'eternity'],
  'nature': ['природа', 'природ', 'море', 'океан', 'река', 'реки', 'гора', 'горы', 'лес', 'леса', 'поле', 'поля', 'цветок', 'цветы', 'ветер', 'ветра', 'небо', 'неба', 'звезда', 'звезды', 'луна', 'луны', 'рассвет', 'закат', 'солнце', 'дождь', 'снег', 'облак', 'трав', 'свет', 'sea', 'ocean', 'mountain', 'forest', 'river', 'sunset', 'sunrise', 'moon', 'stars', 'wind', 'rain', 'snow', 'sun', 'sky', 'cloud', 'flower', 'tree', 'garden', 'field', 'nature'],
  'nostalgia': ['ностальгия', 'ностальги', 'вспоминаю', 'воспоминание', 'воспоминания', 'детство', 'прошлое', 'прошлом', 'когда-то', 'бывало', 'было', 'прежн', 'бывш', 'nostalgia', 'remember', 'memories', 'past', 'childhood', 'reminisce'],
  'melancholy': ['туман', 'туманн', 'серый', 'серость', 'пустот', 'пустын', 'одинок', 'мрачн', 'хмур', 'забыть', 'забыл', 'забыла', 'forgotten', 'fog', 'grey', 'gray', 'empty', 'dark', 'gloomy', 'desolate', 'silent'],
  'passion': ['страсть', 'страсти', 'жар', 'горет', 'горишь', 'пламя', 'огонь', 'огня', 'пыл', 'жгуч', 'burn', 'fire', 'flame', 'hot', 'intense', 'passion', 'desire', 'blaze'],
  'protest': ['борьба', 'бороться', 'против', 'восстание', 'бунт', 'голос', 'голосом', 'правда', 'правду', 'воля', 'волю', 'революци', 'изменить', 'fight', 'rebel', 'rebellion', 'protest', 'revolution', 'voice', 'resist'],
  'self_discovery': ['кто я', 'я сам', 'я сама', 'познать', 'понять себя', 'внутри', 'осознан', 'пробужден', 'self', 'myself', 'who am i', 'within', 'inside', 'discover', 'awakening'],
  'city': ['город', 'городе', 'улица', 'улицы', 'улицам', 'проспект', 'переулок', 'метро', 'квартал', 'район', 'city', 'urban', 'street', 'downtown', 'avenue', 'boulevard'],
  'friendship': ['друг', 'друзья', 'дружба', 'дружим', 'побратим', 'команда', 'брат', 'братан', 'семья', 'родные', 'bro', 'friend', 'friends', 'friendship', 'together', 'buddy', 'family'],
};

function normalizeText(text: string): string {
  if (!text) return '';
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
      if (!kwStem) continue;
      for (let i = 0; i < words.length; i++) {
        if (!stems[i]) continue;
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
    if (score >= 1) {
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
      for (const syn of synonyms) {
        if (syn.length > 5 && syn.startsWith(word) && word.length >= 5) {
          expanded.add(synonymGroup);
          synonyms.forEach((s) => expanded.add(s));
          break;
        }
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
    if (trackMood && (trackMood.includes(word) || word.includes(trackMood))) {
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
        if (searchSet.has(kw)) {
          score += 1;
        }
      }
    }
  }

  return score;
}
