import { analyzeThemes, extractTags, buildSearchVector, semanticScore } from '../services/themes';

describe('themes', () => {
  describe('analyzeThemes', () => {
    it('should detect love theme from Russian lyrics', () => {
      const lyrics = 'Я люблю тебя так сильно, обнимаю тебя каждый день, ты любимая моя';
      const result = analyzeThemes(lyrics);
      expect(result.themes).toContain('love');
    });

    it('should detect sadness theme', () => {
      const lyrics = 'грустно и тоска, печаль в сердце моём, одиноко без тебя';
      const result = analyzeThemes(lyrics);
      expect(result.themes).toContain('sadness');
    });

    it('should detect joy theme', () => {
      const lyrics = 'весело и радость, счастье улыбка, праздник каждый день happy';
      const result = analyzeThemes(lyrics);
      expect(result.themes).toContain('joy');
    });

    it('should detect English themes', () => {
      const lyrics = 'love love love kiss embrace heart adore devoted kiss love';
      const result = analyzeThemes(lyrics);
      expect(result.themes).toContain('love');
    });

    it('should return neutral mood for ambiguous text', () => {
      const lyrics = 'абракадabra тест проверка кварц фенек мангуст';
      const result = analyzeThemes(lyrics);
      expect(result.mood).toBe('нейтральное');
    });

    it('should detect sad mood', () => {
      const lyrics = 'грустно слёзы боль тоска одиноко холод дождь';
      const result = analyzeThemes(lyrics);
      expect(result.mood).toBe('sad');
    });

    it('should detect happy mood', () => {
      const lyrics = 'весело смех смеяться улыбка улыбнуться праздник танцевать happy';
      const result = analyzeThemes(lyrics);
      expect(result.mood).toBe('happy');
    });

    it('should detect energetic mood', () => {
      const lyrics = 'энергия мощный быстрый драйв energy powerful intense dynamic';
      const result = analyzeThemes(lyrics);
      expect(result.mood).toBe('energetic');
    });

    it('should return fallback theme when no themes detected', () => {
      const lyrics = 'кварц фенек мангуст пеликан алмаз';
      const result = analyzeThemes(lyrics);
      expect(result.themes).toContain('неопределённая тема');
    });

    it('should limit themes to 5', () => {
      const lyrics = `
        любовь люблю любишь любимый обнимаю обнять поцелуй
        грустно грусть печаль тоска тоскую одинок одиноко
        радость счастье счастлив весело веселье улыбка
        жизнь жить смысл судьба бытие existence
        свобода свободен полёт крылья лететь freedom free
      `;
      const result = analyzeThemes(lyrics);
      expect(result.themes.length).toBeLessThanOrEqual(5);
    });

    it('should calculate energy level', () => {
      const lyrics = 'power energy fire strong drive beat energy power';
      const result = analyzeThemes(lyrics);
      expect(result.energy).toBeGreaterThan(0);
      expect(result.energy).toBeLessThanOrEqual(1);
    });

    it('should handle empty lyrics', () => {
      const result = analyzeThemes('');
      expect(result.themes).toBeDefined();
      expect(result.mood).toBeDefined();
      expect(result.energy).toBeGreaterThanOrEqual(0);
    });

    it('should detect nature theme', () => {
      const lyrics = 'море океан река гора лес поле цветок ветер небо звезда луна';
      const result = analyzeThemes(lyrics);
      expect(result.themes).toContain('nature');
    });

    it('should detect friendship theme', () => {
      const lyrics = 'друг друзья дружба дружим брат команда friend friends friendship together';
      const result = analyzeThemes(lyrics);
      expect(result.themes).toContain('friendship');
    });

    // === Полный обход всех тем ===

    it.each([
      ['breakup', 'расставание прощай уходи goodbye leave gone broken'],
      ['city', 'город улица улицы проспект переулок city urban street'],
      ['freedom', 'свобода свободен полёт крылья лететь freedom free liberty fly wings'],
      ['life', 'жизнь жить смысл судьба бытие existence meaning life living destiny'],
      ['nostalgia', 'ностальгия вспоминаю воспоминания детство прошлое nostalgia remember memories childhood'],
      ['melancholy', 'туман серый пустота одинок одиноко забыть fog grey empty alone lonely silence'],
      ['hope', 'надежда надежды верю надеюсь завтра будущее рассвет hope believe tomorrow dawn morning'],
      ['anxiety', 'тревога тревожно страх страшно паника беспокойство anxiety fear afraid worried panic dread'],
      ['loneliness', 'один одинокий одинокая одиноко одиночество alone lonely solitary by myself nobody'],
      ['passion', 'страсть страсти жар гореть пламя огонь пыл passion desire burn fire flame hot intense'],
      ['protest', 'борьба против восстание бунт голос правда воля революция fight rebel rebellion protest revolution voice resist'],
      ['self_discovery', 'себя сам сама познать понять себя внутри self myself who am i within inside discover'],
      ['secret', 'секрет тайна скрытый спрятал secret mystery hidden conceal mysterious'],
      ['time', 'время времени минута секунда час день год время moment second minute hour day year season'],
    ])('should detect %s theme', (theme, lyrics) => {
      const result = analyzeThemes(lyrics);
      expect(result.themes).toContain(theme);
    });

    // === Полный обход всех настроений ===

    it.each([
      ['sad', 'грустно грусть печаль слёзы слезы боль тоска тоскую одинок одиноко холод холодный дождь дождик sad tears pain cry'],
      ['happy', 'весело веселье смех смеяться улыбка улыбнуться праздник танц танцевать happy laugh smile party dance celebrate'],
      ['aggressive', 'ярость гнев крик кричать орать огонь взрыв разруш сломать rage angry scream shout fire destroy break fury'],
      ['romantic', 'романтика романтно нежность нежный нежная страсть страстный обнять обнимаю moonlight romance tender passion intimate sweet'],
      ['calm', 'спокойно спокойный тишина тихий тихая умиротвор расслабь расслаблен calm peace peaceful quiet serene relax gentle'],
      ['energetic', 'энергия энергичный драйв драйвовый быстрый быстрая мощный мощная energy energetic powerful fast intense dynamic drive'],
    ])('should detect %s mood', (mood, lyrics) => {
      const result = analyzeThemes(lyrics);
      expect(result.mood).toBe(mood);
    });

    // === Граничные случаи нормализации ===

    it('should normalize uppercase to lowercase', () => {
      const result = analyzeThemes('LOVE LOVE LOVE LOVE LOVE KISS KISS');
      expect(result.themes).toContain('love');
    });

    it('should strip punctuation', () => {
      const result = analyzeThemes('любовь! люблю... обнимаю, обнять? поцелуй;');
      expect(result.themes).toContain('love');
    });

    it('should handle mixed Russian and English', () => {
      const result = analyzeThemes('я люблю love и обнимаю embrace сердце heart');
      expect(result.themes).toContain('love');
    });

    it('should handle lyrics with newlines and extra spaces', () => {
      const result = analyzeThemes('  любовь   люблю    любимый  \n\n обнимаю  ');
      expect(result.themes).toContain('love');
    });

    // === Стемминг ===

    it('should match stemmed Russian words', () => {
      // "любимый" stems to "любим" — should match "любимый" keyword
      const result = analyzeThemes('ты мой любимый человек любимый всегда');
      expect(result.themes).toContain('love');
    });

    it('should match word starting with keyword stem', () => {
      // "грустный" starts with stem of "грустно" → "грустн"
      const result = analyzeThemes('грустный грустный день');
      expect(result.mood).toBe('sad');
    });

    // === Порядок тем (сортировка по убыванию.score) ===

    it('should sort themes by score descending', () => {
      const lyrics = `
        любовь люблю любишь любимый обнимаю обнять поцелуй обниму heart love kiss
        грустно грусть печаль тоска тоскую одинок
      `;
      const result = analyzeThemes(lyrics);
      // love has more keywords matched than sadness
      const loveIdx = result.themes.indexOf('love');
      const sadnessIdx = result.themes.indexOf('sadness');
      if (loveIdx >= 0 && sadnessIdx >= 0) {
        expect(loveIdx).toBeLessThan(sadnessIdx);
      }
    });

    // === Энергия: граничные случаи ===

    it('should return energy 0 for lyrics without energy words', () => {
      const result = analyzeThemes('абракадabra тест проверка кварц фенек');
      expect(result.energy).toBe(0);
    });

    it('should calculate energy proportionally to word density', () => {
      const shortLyrics = 'power energy fire strong drive beat';
      const longLyrics = 'power energy fire strong drive beat ' + Array(100).fill('абракадabra').join(' ');
      const shortResult = analyzeThemes(shortLyrics);
      const longResult = analyzeThemes(longLyrics);
      expect(shortResult.energy).toBeGreaterThanOrEqual(longResult.energy);
    });

    // === Multi-theme detection ===

    it('should detect multiple themes simultaneously', () => {
      const lyrics = `
        любовь люблю любимый обнимаю обнять поцелуй heart love kiss
        море океан река гора лес поле цветок ветер небо звезда луна
        город улица улицы проспект переулок city urban street
      `;
      const result = analyzeThemes(lyrics);
      expect(result.themes.length).toBeGreaterThanOrEqual(3);
      expect(result.themes).toContain('love');
      expect(result.themes).toContain('nature');
      expect(result.themes).toContain('city');
    });

    // === Одинокое слово не детектит тему (score < 2) ===

    it('should not detect theme from insufficient keyword matches', () => {
      // Only one unique love keyword — score should be 1 (< 2 threshold)
      const result = analyzeThemes('обнимаю обнимаю обнимаю обнимаю обнимаю');
      // "обнимаю" matches once (countMatches breaks after first match per keyword)
      expect(result.themes).not.toContain('love');
    });

    // === Многоключевые фразы ===

    it('should match multi-word keywords', () => {
      // "смысл жизни" is a multi-word keyword in life theme
      const result = analyzeThemes('смысл жизни это любовь и смысл жизни');
      expect(result.themes).toContain('life');
    });

    it('should match "без тебя" in loneliness theme', () => {
      const result = analyzeThemes('без тебя один без тебя одиночество без тебя');
      expect(result.themes).toContain('loneliness');
    });

    it('should match "walk away" in breakup theme', () => {
      const result = analyzeThemes('walk away goodbye leave gone broken walk away');
      expect(result.themes).toContain('breakup');
    });

    // === Регистр ключевых слов ===

    it('should match keywords case-insensitively', () => {
      const result = analyzeThemes('Love LOVE love lOvE kiss Kiss KISS');
      expect(result.themes).toContain('love');
    });

    // === Кириллица и латиница вперемешку ===

    it('should handle lyrics with only punctuation and spaces', () => {
      const result = analyzeThemes('!@#$%^&*()_+-={}[]|;:,.<>?/~`');
      expect(result.themes).toBeDefined();
      expect(result.mood).toBeDefined();
      expect(result.energy).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long lyrics', () => {
      const lyrics = Array(1000).fill('любовь люблю любимый обнимаю heart love kiss').join(' ');
      const result = analyzeThemes(lyrics);
      expect(result.themes).toContain('love');
      expect(result.energy).toBeGreaterThanOrEqual(0);
    });

    // === Тема "неопределённая тема" ===

    it('should not add fallback when at least one theme detected', () => {
      const lyrics = 'море океан река гора лес поле цветок ветер небо звезда луна';
      const result = analyzeThemes(lyrics);
      expect(result.themes).not.toContain('неопределённая тема');
    });

    it('should return exactly one theme in fallback case', () => {
      const lyrics = 'кварц фенек мангуст пеликан алмаз';
      const result = analyzeThemes(lyrics);
      expect(result.themes).toEqual(['неопределённая тема']);
    });
  });

  describe('extractTags', () => {
    it('should return themes and mood as tags', () => {
      const lyrics = 'любовь люблю любимый обнимаю обнять сердце heart love kiss';
      const tags = extractTags(lyrics);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags).toContain('love');
    });

    it('should always include mood in tags', () => {
      const lyrics = 'грустно грусть печаль тоска тоскую одинок cold rain sad tears pain cry';
      const tags = extractTags(lyrics);
      expect(tags).toContain('sad');
    });
  });

  describe('buildSearchVector', () => {
    it('should expand query with synonyms', () => {
      const words = buildSearchVector('грустно');
      expect(words).toContain('sadness');
      expect(words).toContain('печаль');
      expect(words).toContain('тоска');
    });

    it('should expand English words with synonyms', () => {
      const words = buildSearchVector('happy');
      expect(words).toContain('joy');
      expect(words).toContain('веселье');
    });

    it('should filter short words', () => {
      const words = buildSearchVector('ab cd ef');
      expect(words.length).toBe(0);
    });

    it('should handle empty query', () => {
      const words = buildSearchVector('');
      expect(words).toEqual([]);
    });

    it('should expand love synonyms', () => {
      const words = buildSearchVector('love');
      expect(words).toContain('love');
      expect(words).toContain('романтика');
      expect(words).toContain('нежность');
    });
  });

  describe('semanticScore', () => {
    it('should give high score for matching themes', () => {
      const score = semanticScore(['love', 'romance'], 'romantic', ['love', 'romantic']);
      expect(score).toBeGreaterThan(0);
    });

    it('should give higher score for exact theme match', () => {
      const exactScore = semanticScore(['love'], 'romantic', ['love']);
      const partialScore = semanticScore(['love'], 'romantic', ['romantic']);
      expect(exactScore).toBeGreaterThan(partialScore);
    });

    it('should give 0 for completely unrelated search', () => {
      const score = semanticScore(['love'], 'romantic', ['protest', 'rebellion']);
      expect(score).toBe(0);
    });

    it('should give bonus for mood match', () => {
      const withMood = semanticScore(['love'], 'happy', ['happy']);
      const withoutMood = semanticScore(['love'], 'happy', ['sadness']);
      expect(withMood).toBeGreaterThan(withoutMood);
    });

    it('should handle empty themes', () => {
      const score = semanticScore([], '', ['love']);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty search words', () => {
      const score = semanticScore(['love', 'romance'], 'romantic', []);
      expect(score).toBe(0);
    });

    it('should match synonyms in search', () => {
      const score = semanticScore(['sadness'], 'sad', ['печаль']);
      expect(score).toBeGreaterThan(0);
    });
  });
});
