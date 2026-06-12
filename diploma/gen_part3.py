# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

part3 = """
## ГЛАВА 2. ПРОЕКТИРОВАНИЕ ИНФОРМАЦИОННОЙ СИСТЕМЫ

### 2.1. Архитектурное проектирование системы

Разрабатываемая информационная система построена по клиент-серверной архитектуре с разделением ответственности между фронтенд-приложением и серверной частью. Такой подход обеспечивает независимую разработку и масштабирование компонентов, а также позволяет в будущем заменить клиентское приложение или серверную логику без влияния на другой компонент.

Серверная часть реализована с использованием фреймворка Express.js — минимально настроенного веб-фреймворка для Node.js, предоставляющего набор основных функций веб-приложений. Express выбран благодаря его простоте, обширной экосистеме middleware и высокой производительности при обработке запросов ввода-вывода. Архитектура сервера организована по принципу разделения ответственности: маршруты (routes) обрабатывают HTTP-запросы, сервисы (services) реализуют бизнес-логику, модели (models) определяют структуру данных.

Клиентская часть построена на базе библиотеки React — декларативного JavaScript-фреймворка для построения пользовательских интерфейсов. React обеспечивает компонентный подход к разработке, виртуальный DOM для оптимизации рендеринга и эффективную систему управления состоянием через хуки.

Основные компоненты системы: слой маршрутизации (обработка HTTP-запросов), слой аутентификации (JWT-токены), слой бизнес-логики (рекомендации, анализ), слой доступа к данным (Sequelize ORM), клиентский слой (React UI).

### 2.2. Проектирование структуры базы данных

Структура базы данных включает 11 взаимосвязанных таблиц. Таблица пользователей (users) хранит учётные данные: id (UUID), username, email, password (bcrypt hash), displayName, role (user/admin/artist), avatar, bio.

Таблица треков (tracks) — центральная сущность с расширенным набором аудиохарактеристик: id, title, artistId, genreId, duration, filePath, coverUrl, lyrics, mood (sad/happy/aggressive/romantic/calm/energetic), themes (JSON), tags (JSON), tempo, energy, valence, danceability, acousticness, plays, likes, explicit, uploadedBy.

Таблицы истории (play_history) и лайков (likes) образуют матрицу взаимодействий для SVD. Связь many-to-many между треками и жанрами реализована через промежуточную таблицу track_genres.

### 2.3. Проектирование пользовательского интерфейса

UI выполнен в тёмной цветовой гамме с акцентным зелёным цветом (#1db954). CSS-переменные обеспечивают консистентность: --bg-dark: #0a0a0a; --bg-card: #181818; --primary: #1db954; --text-primary: #ffffff; --text-secondary: #b3b3b3.

Основные экраны: домашняя страница (рекомендации, недавние), поиск, библиотека (плейлисты), генератор плейлистов (мood/genre), статистика (графики), полноэкранный плеер (очередь, аудио-фичи), загрузка треков.

### 2.4. Моделирование бизнес-процессов

Загрузка трека: пользователь выбирает файл → заполняет метаданные → система анализирует текст (темы, настроение) → сохраняет файл и метаданные → связывает с жанрами. Генерация рекомендаций: загрузка профиля → обучение SVD → предсказание оценок → сортировка → возврат топ-N. Анализ аудио: fetch файла → декодирование Web Audio API → вычисление特征 → сохранение на сервере → обновление UI.

### 2.5. Проектирование REST API

API спроектировано по принципам RESTful архитектуры: /api/auth (register, login, me), /api/tracks (CRUD, features, upload-cover), /api/playlists (CRUD, tracks), /api/search (recommendations, similar, svd-stats, semantic). Ответы в JSON. Ошибки с HTTP-кодами (400, 401, 403, 404, 409, 500). SVD-модель кэшируется 5 минут.

---

## ГЛАВА 3. РЕАЛИЗАЦИЯ ИНФОРМАЦИОННОЙ СИСТЕМЫ

### 3.1. Технологический стек и обоснование выбора

Серверная часть: Node.js 20 LTS (неблокирующий I/O, единый язык TypeScript с клиентом), Express 4.x (минималистичный веб-фреймворк), Sequelize 6.x (ORM для кроссплатформенной работы с БД), SQLite (простота для прототипа), jsonwebtoken (stateless аутентификация), Multer (загрузка файлов).

Клиентская часть: React 18 (компонентный подход, виртуальный DOM), Vite 5 (быстрая сборка), React Router 6 (маршрутизация), Axios (HTTP-клиент), Recharts (визуализация графиков), react-icons (иконки), react-hot-toast (уведомления).

Выбор Node.js обусловлен унификацией языка TypeScript для сервера и клиента, неблокирующим I/O для работы с файлами и БД, обширной экосистемой npm.

### 3.2. Реализация серверной части

Точка входа инициализирует Express-приложение, создаёт директории для загрузки файлов, регистрирует маршруты и подключает обработчик ошибок:

```typescript
// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import sequelize from './db/connection';
import { errorHandler } from './middleware/errorHandler';
import './models';

dotenv.config();

// Автоматическое создание директорий для загрузки файлов
const uploadsDir = path.join(__dirname, '../uploads');
['music', 'covers', 'avatars'].forEach((dir) => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

const start = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: false });
  app.listen(PORT, () => console.log(`Server on port ${PORT}`));
};
start();
```

Данный код демонстрирует несколько важных архитектурных решений. Блок автоматического создания директорий обеспечивает готовность системы при первом запуске. Middleware CORS позволяет фронтенду и бэкенду работать на разных портах. Централизованная обработка ошибок через errorHandler обеспечивает единообразный формат ответов.

### 3.3. Реализация клиентской части

Корневой компонент формирует иерархию провайдеров контекста:

```tsx
// frontend/src/App.tsx
const App: React.FC = () => (
  <AuthProvider>
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  </AuthProvider>
);
```

AuthContext оборачивает PlayerContext, что позволяет плееру получать доступ к данным аутентификации. ProtectedRoute проверяет наличие авторизации перед доступом к защищённым маршрутам.

### 3.4. Реализация системы аутентификации

JWT middleware проверяет токен в заголовке Authorization, декодирует его и загружает данные пользователя:

```typescript
// backend/src/middleware/auth.ts
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
  const user = await User.findByPk(decoded.id, {
    attributes: ['id', 'username', 'email', 'role'],
  });

  if (!user) return res.status(401).json({ error: 'User not found' });
  req.user = { id: user.id, username: user.username, email: user.email, role: user.role };
  next();
};
```

На клиенте управление состоянием через AuthContext с проверкой токена при загрузке и функциями login/logout.

### 3.5. Реализация модуля загрузки аудиоданных

Multer обрабатывает multipart/form-data с UUID-именами файлов для предотвращения коллизий:

```typescript
// backend/src/middleware/upload.ts
const storage = (subfolder: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../uploads', subfolder));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });

export const uploadMusic = multer({
  storage: storage('music'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: fileFilter(['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg']),
});
```

### 3.6. Реализация рекомендательной системы на основе матричной факторизации

Алгоритм SVD обучается на данных о прослушиваниях и лайках:

```typescript
// backend/src/services/svd.ts
function trainSVD(matrix: number[][], k: number, lr: number,
  lambda: number, iterations: number): { P: number[][]; Q: number[][] } {

  const m = matrix.length, n = matrix[0].length;

  // Глобальное среднее
  let totalSum = 0, count = 0;
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      if (matrix[i][j] > 0) { totalSum += matrix[i][j]; count++; }
  const globalMean = count > 0 ? totalSum / count : 0;

  const P = initializeFactors(m, k);
  const Q = initializeFactors(n, k);

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] <= 0) continue;
        let prediction = globalMean;
        for (let f = 0; f < k; f++) prediction += P[i][f] * Q[j][f];
        const error = matrix[i][j] - prediction;
        for (let f = 0; f < k; f++) {
          P[i][f] += lr * (error * Q[j][f] - lambda * P[i][f]);
          Q[j][f] += lr * (error * P[i][f] - lambda * Q[j][f]);
        }
      }
    }
  }
  return { P, Q };
}
```

Формирование оценок: прослушивание = 1 (повторное +0.5, макс. 5), лайк = 3 (с прослушиванием до 5). Гибридный score: 0.4 × content + 0.2 × collab + 4 × svd.

### 3.7. Реализация модуля анализа аудиохарактеристик

Web Audio API анализирует аудиофайл на клиенте:

```typescript
// frontend/src/services/audioAnalyzer.ts
export async function analyzeAudio(url: string): Promise<AudioFeatures> {
  const ctx = getAudioContext();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const rawData = audioBuffer.getChannelData(0);
  const factor = Math.max(1, Math.floor(audioBuffer.sampleRate / 8000));
  const data = downsample(rawData, factor);

  return {
    energy: calculateEnergy(data),
    valence: calculateValence(data, audioBuffer.sampleRate / factor),
    danceability: calculateDanceability(data, audioBuffer.sampleRate / factor),
    acousticness: calculateAcousticness(data, audioBuffer.sampleRate / factor),
    tempo: calculateTempo(data, audioBuffer.sampleRate / factor),
  };
}
```

Energy = RMS × 3.5. Valence = ZCR × 2 + spectralCentroid/4000 × 0.7. Danceability = onsetRate × 3 + rms × 0.5. Acousticness = lowRatio × 0.6 + (1-rms) × 0.3. Tempo = автокорреляция энергетической огибающей.

### 3.8. Реализация системы семантического поиска

Ключевые слова для 18 тем и 6 настроений, русский стемминг, синонимическое расширение:

```typescript
// backend/src/services/themes.ts
const THEME_KEYWORDS: Record<string, string[]> = {
  'love': ['любовь', 'люблю', 'heart', 'love', 'kiss', 'adore'],
  'sadness': ['грустно', 'грусть', 'печаль', 'sad', 'sorrow', 'blue'],
  'joy': ['радость', 'счастье', 'happy', 'joy', 'celebrate'],
  // ... другие темы
};

function stemWord(word: string): string {
  return word.replace(/(ость|ovi|ений|ение|ый|ий|ой|ая|ое|ые|ие|ов|ев|ей|ть|ся|ь)$/, '');
}

function buildSearchVector(query: string): string[] {
  const words = normalizeText(query).split(' ').filter(w => w.length > 2);
  const expanded = new Set(words);
  for (const word of words) {
    for (const [group, synonyms] of Object.entries(SYNONYM_GROUPS)) {
      if (group === word || synonyms.includes(word)) {
        expanded.add(group);
        synonyms.forEach(s => expanded.add(s));
      }
    }
  }
  return [...expanded];
}
```

### 3.9. Реализация генератора плейлистов

Фильтрация по mood и audio-фичам с обратной совместимостью:

```typescript
const MOOD_AUDIO_RANGES: Record<string, MoodAudioRange> = {
  sad:       { energy: [0.0, 0.4], valence: [0.0, 0.35], danceability: [0.0, 0.5], acousticness: [0.3, 1.0] },
  happy:     { energy: [0.4, 0.85], valence: [0.6, 1.0], danceability: [0.4, 1.0], acousticness: [0.0, 0.6] },
  aggressive:{ energy: [0.7, 1.0], valence: [0.0, 0.6], danceability: [0.3, 0.9], acousticness: [0.0, 0.3] },
  romantic:  { energy: [0.1, 0.6], valence: [0.3, 0.8], danceability: [0.2, 0.7], acousticness: [0.3, 1.0] },
  calm:      { energy: [0.0, 0.45], valence: [0.2, 0.7], danceability: [0.0, 0.5], acousticness: [0.4, 1.0] },
  energetic: { energy: [0.65, 1.0], valence: [0.4, 1.0], danceability: [0.5, 1.0], acousticness: [0.0, 0.4] },
};
```

### 3.10. Реализация аудиоплеера

PlayerContext: play (с analyzeTrack), pause, resume, next, previous, seek, addToQueue (дедупликация), playFromQueue, clearQueue. FullScreenPlayer: обложка, инфо, прогресс-бар, управление, теги (mood badge), подробнее (audio-фичи bars, похожие треки), очередь.

### 3.11. Удаление треков с очисткой файлов

DELETE /:id удаляет аудиофайл (fs.unlinkSync), обложку, связи в БД (Like, PlayHistory, TrackGenre).

### 3.12. Анализ аудио в фоновом режиме

analyzeTrack: проверка сервера → analyzeAudio → updateFeatures → setCurrentTrack + setQueue. setTimeout(500ms) для неблокирования воспроизведения.

### 3.13. Полноэкранный плеер с информацией о треке

Секции: обложка, информация, прогресс-бар, управление, действия (лайк, очередь, подробнее), теги (mood badge, themes), подробнее (audio-фичи bars, похожие треки), очередь (с обложками, play/pause overlay).

### 3.14. Поиск похожих треков

cosineSimilarity по audio-фичам + бонусы артисту (+5) и жанру (+2) + популярность (log plays).

### 3.15. Статистика с графиками

Recharts: BarChart (жанры), PieChart (настроения), AreaChart (часовая активность). SVD-статистика: users, tracks, interactions, sparsity, k, embeddings.
"""

with open(r'C:\Users\USER\music-streaming\diploma\thesis_part3.txt', 'w', encoding='utf-8') as f:
    f.write(part3)

print(f"Part 3: {len(part3)} chars, {len(part3.split())} words")
