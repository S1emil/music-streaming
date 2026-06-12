# ПОЛНОЕ ОПИСАНИЕ ПРОЕКТА MusicStream

## ДИПЛОМНАЯ РАБОТА: РАЗРАБОТКА ИНФОРМАЦИОННОЙ СИСТЕМЫ ДЛЯ АУДИОДАННЫХ

---

## 1. ОБЩАЯ ИНФОРМАЦИЯ

**Название проекта:** MusicStream
**Тип:** Прототип музыкального стримингового сервиса
**Цель:** Разработка полнофункциональной информационной системы для каталогизации, прослушивания и рекомендации музыкального контента

**Функциональные возможности:**
1. Потоковое воспроизведение аудиотреков
2. Управление плейлистами (создание, редактирование, добавление/удаление треков)
3. Поиск по трекам, артистам, альбомам, плейлистам
4. Система пользователей (регистрация, вход, профили с JWT-аутентификацией)
5. Лайки треков
6. История прослушиваний
7. Персонализированные рекомендации (гибридный алгоритм: матричная SVD + контентная фильтрация + коллаборативная фильтрация)
8. Ролевая модель: пользователь (user), артист (artist), администратор (admin)
9. Клиентский анализ аудиохарактеристик через Web Audio API (energy, valence, danceability, acousticness, tempo)
10. Семантический поиск по тематике текстов песен (19 тем, 6 настроений)
11. Генератор плейлистов по настроению и жанру
12. Аудиовизуализатор (частотный спектр на Canvas)
13. Статистика пользователя (жанры, артисты, настроения, темы, активность по часам/дням)
14. Загрузка треков с обложками (для ролей artist/admin)
15. Получение текстов песен через Genius API
16. Поиск обложек через Genius API

---

## 2. ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Backend (серверная часть)
- **Node.js** — среда выполнения JavaScript
- **Express** — веб-фреймворк для маршрутизации HTTP-запросов
- **TypeScript** — язык с строгой типизацией (компилируется в JavaScript)
- **Sequelize** — ORM для взаимодействия с реляционной БД (абстракция над SQL)
- **SQLite** — файловая реляционная БД (не требует сервера, хранится в одном файле data/music.db)
- **bcryptjs** — хеширование паролей (алгоритм Blowfish, 10 раундов salt)
- **jsonwebtoken** — создание и верификация JWT-токенов (срок жизни 7 дней)
- **multer** — обработка multipart/form-data для загрузки файлов
- **uuid** — генерация UUID v4 для идентификаторов
- **axios** — HTTP-клиент для запросов к Genius API
- **cheerio** — парсинг HTML (извлечение текстов песен со страниц Genius)
- **dotenv** — загрузка переменных окружения из .env файла
- **ts-node-dev** — горячая перезагрузка при разработке

### Frontend (клиентская часть)
- **React 18** — библиотека для построения UI
- **TypeScript** — строгая типизация
- **Vite** — сборщик проектов (dev server + продакшн-сборка)
- **React Router v6** — маршрутизация между страницами
- **Axios** — HTTP-клиент с перехватчиками (автоматическая передача JWT, обработка 401)
- **React Icons** — библиотека иконок (Feather Icons: FiPlay, FiPause и т.д.)
- **React Hot Toast** — уведомления (toast notifications)
- **Recharts** — библиотека графиков на React + D3 (BarChart, PieChart, AreaChart)
- **Web Audio API** — нативный интерфейс браузера для анализа аудио

### Инструменты
- **npm** — менеджер пакетов
- **concurrently** — параллельный запуск сервера и клиента (скрипт start.js)

---

## 3. СТРУКТУРА ПРОЕКТА

```
music-streaming/
├── package.json              # Корневой конфиг (скрипты dev, backend, frontend)
├── start.js                  # Скрипт одновременного запуска backend + frontend
├── backend/
│   ├── .env                  # Переменные окружения (JWT_SECRET, DB_PATH, GENIUS_TOKEN)
│   ├── .env.example          # Шаблон .env
│   ├── package.json          # Зависимости backend
│   ├── tsconfig.json         # Конфигурация TypeScript
│   ├── data/                 # Директория SQLite (music.db)
│   ├── uploads/              # Загруженные файлы
│   │   ├── music/            # Аудиофайлы (.mp3, .wav, .flac, .ogg, .aac)
│   │   ├── covers/           # Обложки треков (.jpg, .png, .webp)
│   │   └── avatars/          # Аватары пользователей
│   └── src/
│       ├── index.ts          # ТОЧКА ВХОДА: Express-приложение, middleware, маршруты, запуск сервера
│       ├── db/
│       │   ├── connection.ts # Подключение Sequelize к SQLite
│       │   ├── seed.ts       # Начальное заполнение БД (жанры, артисты, admin)
│       │   └── clear-stubs.ts# Утилита очистки
│       ├── models/           # Модели данных (Sequelize ORM)
│       │   ├── index.ts      # Определение ВСЕХ связей между моделями
│       │   ├── User.ts       # Пользователь
│       │   ├── Artist.ts     # Артист
│       │   ├── Genre.ts      # Жанр
│       │   ├── Album.ts      # Альбом
│       │   ├── Track.ts      # Трек (центральная модель)
│       │   ├── Playlist.ts   # Плейлист
│       │   ├── PlaylistTrack.ts # Связь плейлист-трек (M:N)
│       │   ├── Like.ts       # Лайк (связь пользователь-трек M:N)
│       │   ├── PlayHistory.ts# История прослушиваний
│       │   └── TrackGenre.ts # Связь трек-жанр (M:N)
│       ├── routes/           # API маршруты
│       │   ├── auth.ts       # Аутентификация (register, login, me, updateProfile)
│       │   ├── tracks.ts     # CRUD треков + play + like + features + lyrics
│       │   ├── playlists.ts  # CRUD плейлистов + generate + save
│       │   ├── search.ts     # Поиск + рекомендации + similar + semantic + radio + svd-stats
│       │   ├── artists.ts    # CRUD артистов
│       │   └── users.ts      # Профили + статистика
│       ├── middleware/
│       │   ├── auth.ts       # JWT middleware (authenticate, optionalAuth, requireRole)
│       │   ├── upload.ts     # Multer конфигурация (music, covers, avatars)
│       │   └── errorHandler.ts # Глобальный обработчик ошибок
│       └── services/         # Бизнес-логика
│           ├── recommendations.ts  # ГИБРИДНАЯ РЕКОМЕНДАТЕЛЬНАЯ СИСТЕМА
│           ├── svd.ts              # SVD-АЛГОРИТМ (матричная因子изация)
│           ├── playlistGenerator.ts# ГЕНЕРАТОР ПЛЕЙЛИСТОВ по настроению/жанру
│           ├── themes.ts           # АНАЛИЗ ТЕМАТИКИ ТЕКСТОВ + СЕМАНТИЧЕСКИЙ ПОИСК
│           ├── lyrics.ts           # Получение текстов через Genius API
│           └── stats.ts            # СТАТИСТИКА ПОЛЬЗОВАТЕЛЯ
└── frontend/
    ├── index.html            # HTML-шаблон
    ├── package.json          # Зависимости frontend
    ├── tsconfig.json         # Конфигурация TypeScript
    ├── vite.config.ts        # Конфигурация Vite
    └── src/
        ├── main.tsx          # Точка входа React
        ├── App.tsx           # КОРНЕВОЙ КОМПОНЕНТ: Router, Routes, Provider'ы
        ├── types/
        │   └── index.ts      # TypeScript интерфейсы (User, Track, Artist, Genre, Playlist, etc.)
        ├── context/
        │   ├── AuthContext.tsx   # КОНТЕКСТ АУТЕНТИФИКАЦИИ (user, login, register, logout)
        │   └── PlayerContext.tsx # КОНТЕКСТ АУДИОПЛЕЕРА (play, pause, queue, volume, repeat, shuffle)
        ├── services/
        │   ├── api.ts            # Axios экземпляр с интерцепторами
        │   ├── index.ts          # API-обёртки (auth, tracks, playlists, search, artists, users)
        │   └── audioAnalyzer.ts  # КЛИЕНТСКИЙ АНАЛИЗ АУДИО (Web Audio API)
        ├── components/
        │   ├── Header.tsx            # Навигационная панель
        │   ├── Player.tsx            # АУДИОПЛЕЕР (бар внизу экрана)
        │   ├── FullScreenPlayer.tsx   # Полноэкранный плеер
        │   ├── AudioVisualizer.tsx    # АУДИОВИЗУАЛИЗАТОР (Canvas + AnalyserNode)
        │   ├── TrackCard.tsx          # Карточка трека
        │   ├── PlaylistCard.tsx       # Карточка плейлиста
        │   ├── AddToPlaylistModal.tsx # Модальное окно добавления в плейлист
        │   ├── EditTrackModal.tsx     # Модальное окно редактирования трека
        │   ├── LyricsEditor.tsx       # Редактор текстов песен
        │   └── StatCard.tsx           # Карточка статистики
        ├── pages/
        │   ├── Home.tsx               # Главная (популярные + новые треки)
        │   ├── Login.tsx              # Вход
        │   ├── Register.tsx           # Регистрация
        │   ├── Search.tsx             # Поиск (обычный + семантический)
        │   ├── Library.tsx            # Библиотека (плейлисты + рекомендации)
        │   ├── AllTracks.tsx          # Все треки
        │   ├── TrackDetail.tsx        # Детали трека (текст, похожие)
        │   ├── PlaylistDetail.tsx     # Детали плейлиста
        │   ├── UploadTrack.tsx        # Загрузка трека (с поиском обложки/текста)
        │   ├── GeneratePlaylist.tsx   # Генератор плейлистов
        │   ├── Radio.tsx              # Жанровое радио
        │   ├── Stats.tsx              # СТАТИСТИКА (графики Recharts)
        │   ├── Admin.tsx              # Админ-панель
        │   └── Profile.tsx            # Профиль пользователя
        ├── hooks/
        │   └── useTracks.ts           # Хук загрузки списков треков
        └── styles/
            └── index.css              # Глобальные стили (CSS)
```

---

## 4. МОДЕЛИ ДАННЫХ (БАЗА ДАННЫХ)

### Таблица users
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID (PK) | Идентификатор пользователя |
| username | VARCHAR(50), UNIQUE | Имя пользователя (3-50 символов) |
| email | VARCHAR(255), UNIQUE | Электронная почта |
| password | VARCHAR(255) | Хеш пароля (bcrypt) |
| displayName | VARCHAR(100) | Отображаемое имя |
| avatar | VARCHAR(500), nullable | Путь к файлу аватара |
| role | ENUM('user','admin','artist') | Роль |
| bio | TEXT, nullable | Описание профиля |
| createdAt | DATETIME | Дата создания |
| updatedAt | DATETIME | Дата обновления |

### Таблица artists
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID (PK) | Идентификатор артиста |
| name | VARCHAR(200) | Имя артиста |
| bio | TEXT, nullable | Биография |
| image | VARCHAR(500), nullable | Путь к изображению |
| verified | BOOLEAN (default: false) | Верифицирован |
| createdAt/updatedAt | DATETIME | Метки времени |

### Таблица genres
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID (PK) | Идентификатор жанра |
| name | VARCHAR(100) | Название жанра |
| slug | VARCHAR(100), UNIQUE | URL-идентификатор (pop, rock и т.д.) |
| image | VARCHAR(500), nullable | Изображение |

### Таблица albums
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID (PK) | Идентификатор альбома |
| title | VARCHAR(300) | Название |
| artistId | UUID (FK → artists) | Артист |
| coverUrl | VARCHAR(500), nullable | Обложка |
| year | INTEGER, nullable | Год |
| type | ENUM('album','single','ep') | Тип |

### Таблица tracks (ЦЕНТРАЛЬНАЯ МОДЕЛЬ)
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID (PK) | Идентификатор трека |
| title | VARCHAR(300) | Название |
| artistId | UUID (FK → artists) | Артист |
| albumId | UUID (FK → albums), nullable | Альбом |
| genreId | UUID (FK → genres), nullable | Основной жанр |
| duration | INTEGER | Длительность (секунды) |
| filePath | VARCHAR(500) | Путь к аудиофайлу (/uploads/music/...) |
| coverUrl | VARCHAR(500), nullable | Путь к обложке |
| lyrics | TEXT, nullable | Текст песни |
| themes | TEXT (JSON array) | Тематические метки ['love','sadness'] |
| mood | VARCHAR(100), nullable | Настроение (sad, happy, aggressive, romantic, calm, energetic) |
| plays | INTEGER (default: 0) | Счётчик прослушиваний |
| likes | INTEGER (default: 0) | Счётчик лайков |
| uploadedBy | UUID (FK → users) | Кто загрузил |
| explicit | BOOLEAN (default: false) | Метка 18+ |
| tags | TEXT (JSON array) | Теги |
| tempo | FLOAT, nullable | Темп (BPM) |
| energy | FLOAT, nullable | Энергия (0-1) |
| valence | FLOAT, nullable | Валентность/эмоциональная тональность (0-1) |
| acousticness | FLOAT, nullable | Акустичность (0-1) |
| danceability | FLOAT, nullable | Танцевальность (0-1) |
| createdAt/updatedAt | DATETIME | Метки времени |

### Таблица playlists
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID (PK) | Идентификатор плейлиста |
| name | VARCHAR(200) | Название |
| description | TEXT, nullable | Описание |
| coverUrl | VARCHAR(500), nullable | Обложка |
| userId | UUID (FK → users) | Владелец |
| isPublic | BOOLEAN (default: true) | Публичный |
| isCollaborative | BOOLEAN (default: false) | Совместный |
| createdAt/updatedAt | DATETIME | Метки времени |

### Таблица playlist_tracks (промежуточная M:N)
| Поле | Тип | Описание |
|------|-----|----------|
| playlistId | UUID (FK → playlists) | Плейлист |
| trackId | UUID (FK → tracks) | Трек |
| position | INTEGER | Позиция в плейлисте |

### Таблица likes (промежуточная M:N)
| Поле | Тип | Описание |
|------|-----|----------|
| userId | UUID (FK → users) | Пользователь |
| trackId | UUID (FK → tracks) | Трек |

### Таблица play_history
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID (PK) | Идентификатор |
| userId | UUID (FK → users) | Пользователь |
| trackId | UUID (FK → tracks) | Трек |
| playedAt | DATETIME | Момент прослушивания |
| progress | INTEGER (default: 0) | Прогресс (секунды) |

### Таблица track_genres (промежуточная M:N)
| Поле | Тип | Описание |
|------|-----|----------|
| trackId | UUID (FK → tracks) | Трек |
| genreId | UUID (FK → genres) | Жанр |

### Связи моделей
- Artist → hasMany → Album, Track
- Genre → hasMany → Track (через TrackGenre M:N)
- Album → hasMany → Track
- User → hasMany → Playlist, PlayHistory, Track (uploadedBy)
- Playlist → belongsToMany → Track (через PlaylistTrack M:N)
- User → belongsToMany → Track (через Like M:N)
- Track → hasMany → PlayHistory
- Track → belongsTo → Artist, Genre, Album, User (Uploader)
- Playlist → belongsTo → User (Owner)
- Like → belongsTo → Track, User
- PlayHistory → belongsTo → Track, User

---

## 5. REST API

### Аутентификация (/api/auth)
| Метод | Маршрут | Описание | Авторизация |
|-------|---------|----------|-------------|
| POST | /api/auth/register | Регистрация (username, email, password, displayName, role) | Нет |
| POST | /api/auth/login | Вход (email, password) → user + JWT token | Нет |
| GET | /api/auth/me | Текущий пользователь | Требуется |
| PUT | /api/auth/me | Обновление профиля (displayName, bio) | Требуется |

### Треки (/api/tracks)
| Метод | Маршрут | Описание | Авторизация |
|-------|---------|----------|-------------|
| GET | /api/tracks | Список треков (genre, artist, sort, order, limit, offset) | Опционально |
| GET | /api/tracks/popular | Популярные (plays DESC, лимит 50) | Опционально |
| GET | /api/tracks/recent | Последние (createdAt DESC, лимит 50) | Опционально |
| GET | /api/tracks/:id | Детали трека (с Artist, Genre, Album, Uploader) + isLiked | Опционально |
| POST | /api/tracks | Загрузка трека (multipart: file, title, artistId, genreId, lyrics, coverUrl, etc.) | admin/artist |
| PUT | /api/tracks/:id | Обновление метаданных | Владелец/admin |
| DELETE | /api/tracks/:id | Удаление трека + файлов | admin |
| POST | /api/tracks/:id/play | Регистрация прослушивания (инкремент plays) | Опционально |
| POST | /api/tracks/:id/like | Toggle лайка | Требуется |
| PUT | /api/tracks/:id/features | Обновление аудиохарактеристик (energy, valence, danceability, acousticness, tempo) | Требуется |
| POST | /api/tracks/:id/lyrics | Сохранение текста песни | Требуется |
| GET | /api/tracks/:id/lyrics | Получение текста | Опционально |
| GET | /api/tracks/:id/lyrics/fetch | Получение текста с Genius API | Требуется |
| GET | /api/tracks/search/lyrics | Поиск текста по title + artist | Требуется |
| GET | /api/tracks/search/cover | Поиск обложки через Genius | Требуется |
| POST | /api/tracks/upload-cover | Загрузка обложки (multipart: cover) | Требуется |

### Плейлисты (/api/playlists)
| Метод | Маршрут | Описание | Авторизация |
|-------|---------|----------|-------------|
| GET | /api/playlists | Плейлисты текущего пользователя | Требуется |
| GET | /api/playlists/public | Публичные плейлисты | Опционально |
| GET | /api/playlists/:id | Детали плейлиста (с Tracks + Artist) | Опционально |
| POST | /api/playlists | Создание плейлиста (name, description, isPublic) | Требуется |
| PUT | /api/playlists/:id | Обновление плейлиста | Владелец |
| DELETE | /api/playlists/:id | Удаление плейлиста | Владелец |
| POST | /api/playlists/:id/tracks | Добавление трека (trackId) | Владелец |
| DELETE | /api/playlists/:id/tracks/:trackId | Удаление трека из плейлиста | Владелец |
| POST | /api/playlists/generate | Генерация плейлиста (mood, genreId, limit) | Требуется |
| POST | /api/playlists/generate/save | Сохранение сгенерированного (name, trackIds) | Требуется |

### Поиск (/api/search)
| Метод | Маршрут | Описание | Авторизация |
|-------|---------|----------|-------------|
| GET | /api/search?q=query&type=all | Полный поиск (tracks, artists, albums, playlists) | Опционально |
| GET | /api/search/recommendations?limit=20 | Персонализированные рекомендации | Требуется |
| GET | /api/search/similar/:trackId?limit=10 | Похожие треки | Опционально |
| GET | /api/search/semantic?q=query | Семантический поиск по тематике текстов | Опционально |
| GET | /api/search/radio?genre=id | Жанровое радио (случайные 50 треков) | Опционально |
| GET | /api/search/genres | Список всех жанров | Нет |
| GET | /api/search/svd-stats | Статистика SVD-модели | Требуется |

### Артисты (/api/artists)
| Метод | Маршрут | Описание | Авторизация |
|-------|---------|----------|-------------|
| GET | /api/artists | Список артистов | Нет |
| GET | /api/artists/:id | Детали артиста (альбомы + треки) | Опционально |
| POST | /api/artists | Создание артиста (name, bio) | Требуется |

### Пользователи (/api/users)
| Метод | Маршрут | Описание | Авторизация |
|-------|---------|----------|-------------|
| GET | /api/users/me | Текущий пользователь | Требуется |
| GET | /api/users/:id | Публичный профиль | Опционально |
| GET | /api/users/me/stats | Статистика прослушиваний | Требуется |

---

## 6. АЛГОРИТМЫ РЕКОМЕНДАТЕЛЬНОЙ СИСТЕМЫ

### 6.1. Гибридная рекомендация (getHybridRecommendations)

**Формула:**
```
hybrid_score = content_score × 0.4 + collab_score × 0.2 + svd_score × 4
```

**Алгоритм:**
1. Параллельно строится профиль пользователя (buildUserProfile) и загружается SVD-модель (с кэшированием TTL 5 минут)
2. Из каталога исключаются лайкнутые и недавно прослушанные треки
3. Загружаются до 200 кандидатов со связанными данными (Artist, Genre)
4. Для каждого кандидата вычисляются 3 оценки: contentScore, collabScore, svdPrediction
5. Формируется hybridScore
6. Результаты сортируются по убыванию hybridScore, возвращаются top-N

### 6.2. Профиль пользователя (buildUserProfile)

Строится на основе лайков и истории прослушиваний:

```typescript
interface UserProfile {
  genrePreferences: Map<string, number>;  // genreId → вес (сумма)
  artistPreferences: Map<string, number>; // artistId → вес (сумма)
  avgEnergy: number;
  avgValence: number;
  avgDanceability: number;
  avgAcousticness: number;
  avgTempo: number;
  likedTrackIds: Set<string>;
  recentlyPlayedIds: Set<string>;
}
```

**Веса:** Лайки ×3 (сильная обратная связь), прослушивания ×1 (умеренная обратная связь).
**Данные:** Загружаются последние 100 записей из play_history + все лайки.

### 6.3. Контентная фильтрация (contentBasedScore)

```
contentScore = genreScore × 2 + artistScore × 3 + featureSimilarity × 5 + log1p(plays) × 0.5 + log1p(likes) × 0.3
```

- **genreScore:** Вес жанра из genrePreferences (если есть)
- **artistScore:** Вес артиста из artistPreferences (если есть)
- **featureSimilarity:** Косинусное сходство 5-мерных векторов:

```
trackVector = [energy, valence, danceability, acousticness, tempo/200]
userVector  = [avgEnergy, avgValence, avgDanceability, avgAcousticness, avgTempo/200]

cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)
```

### 6.4. Коллаборативная фильтрация (collaborativeScore)

1. Найти пользователей, прослушивавших данный трек (не целевого)
2. Проанализировать их взаимодействия (max 200 записей)
3. Вычислить:
```
collabScore = log1p(trackPlayCount) × 2 + similarUserLikes × 1.5 + (userIds.length / 20) × 3
```

### 6.5. SVD-модель (svd.ts)

**Формирование матрицы оценок:**
- Каждое прослушивание = 1 балл
- Повторные прослушивания: +0.5 (макс 5)
- Лайк = 3 балла
- Лайк + прослушивание: суммируется (макс 5)
- Минимум 5 взаимодействий для обучения

**Параметры SVD:**
- k = 20 (скрытые факторы)
- learning_rate = 0.005
- regularization = 0.02
- iterations = 50

**Алгоритм trainSVD (градиентный спуск):**
```
Инициализация: P[m][k], Q[n][k] случайными [-0.05, 0.05]
globalMean = среднее всех оценок

Для каждой итерации:
  Для каждого (i, j) где matrix[i][j] > 0:
    prediction = globalMean + Σ(P[i][f] × Q[j][f]) для f от 0 до k
    error = matrix[i][j] - prediction
    Для каждого f:
      P[i][f] += lr × (error × Q[j][f] - λ × P[i][f])
      Q[j][f] += lr × (error × P[i][f] - λ × Q[j][f])
```

**Прогноз (predictScore):**
```
r̂_ui = globalMean + Σ(userVec[f] × itemVec[f]) для f от 0 до k
```

**Кэширование:** TTL 5 минут, хранится в глобальных переменных.

### 6.6. Похожие треки (getSimilarTracks)

1. Загрузить целевой трек (с Artist, Genre)
2. Найти кандидатов с тем же genreId ИЛИ artistId (max 100)
3. Для каждого: cosine similarity аудиохарактеристик
4. Бонусы: +5 за совпадение артиста, +2 за жанр
5. + log1p(plays) × 0.3

---

## 7. АНАЛИЗ АУДИОХАРАКТЕРИСТИК (Web Audio API)

### Клиентский модуль: audioAnalyzer.ts

**Поток данных:**
1. fetch(url) → ArrayBuffer
2. AudioContext.decodeAudioData() → AudioBuffer
3. getChannelData(0) → Float32Array (PCM данные)
4. Даунсэмплирование до 8000 Гц
5. Вычисление 5 характеристик

### Характеристики:

**energy (энергия):**
```
RMS = sqrt(Σ(x_i²) / N)
energy = min(1, RMS × 3.5)
```

**valence (эмоциональная тональность):**
```
spectralCentroid = взвешенное среднее ZCR × sampleRate / 2 с весами RMS
brightness = min(1, spectralCentroid / 4000)
zcr = count(смен знака) / N
valence = min(1, max(0, brightness × 0.7 + zcr × 2))
```

**danceability (танцевальность):**
```
Блоки по 50мс, RMS для каждого
onset = RMS[i] - RMS[i-1] > 0.015
onsetRate = count(onset) / count(blocks)
danceability = min(1, max(0, onsetRate × 3 + rms × 0.5))
```

**acousticness (акустичность):**
```
Блоки по 20мс: чётные = lowEnergy, нечётные = highEnergy
lowRatio = lowEnergy / (lowEnergy + highEnergy)
flatness = abs(zcr - 0.5) × 2
acousticness = min(1, max(0, lowRatio × 0.6 + (1 - rms) × 0.3 + flatness × 0.1))
```

**tempo (BPM):**
```
Окна по 2с с шагом window/4 → огибающая RMS
diff = max(0, envelope[i+1] - envelope[i])
Автокорреляция diff для лагов 60-200 BPM
bestLag = argmax(корреляция)
tempo = 60 / (bestLag × hopSize / sampleRate)
```

### Интеграция с плеером (PlayerContext):
- При воспроизведении трека: check energy != null → если нет → analyzeAudio(filePath)
- Результат → PUT /api/tracks/:id/features
- Кэширование в analyzedTracksRef (Set, макс 200)

---

## 8. СЕМАНТИЧЕСКИЙ ПОИСК И АНАЛИЗ ТЕМАТИКИ (themes.ts)

### 19 тематических категорий:
love, breakup, friendship, sadness, joy, life, freedom, city, nature, nostalgia, melancholy, hope, anxiety, loneliness, passion, protest, self_discovery, secret, time

Каждая категория содержит 10-30 ключевых слов на русском и английском языках.

### 6 категорий настроения:
sad, happy, aggressive, romantic, calm, energetic

Каждая категория содержит 15-25 ключевых слов.

### Алгоритм анализа (analyzeThemes):
1. Нормализация текста (нижний регистр, удаление пунктуации)
2. Для каждой темы: подсчёт совпадений с ключевыми словами
3. Темы с score ≥ 2 → входят в список тем трека (max 5)
4. Настроение = категория с максимальным score

### Стемминг:
Удаление русских окончаний: ость, ение, ание, ый, ий, ой, ая, ое, ые, ие, ов, ев, ей, ть, ся, сь, ться, тся

### Синонимические группы (12 групп):
sadness, joy, love, loneliness, freedom, life, hope, anxiety, secret, time и др.
Расширяют поисковый запрос: «тоска» → [тоска, грусть, печаль, уныние, sad, sorrow...]

### Семантическое сходство (semanticScore):
```
score = Σ(совпадение темы × 4-5) + Σ(совпадение настроения × 3-4) + Σ(совпадение синонимов × 2-3) + Σ(совпадение ключевых слов × 1)
```

---

## 9. ГЕНЕРАТОР ПЛЕЙЛИСТОВ (playlistGenerator.ts)

### Маппинг времени суток → настроение:
- 5-8: calm
- 9-11: energetic
- 12-16: happy
- 17-20: romantic
- 21-4: sad

### Диапазоны аудиохарактеристик для настроений:
| Настроение | energy | valence | danceability | acousticness |
|------------|--------|---------|--------------|--------------|
| sad | 0.0-0.4 | 0.0-0.35 | 0.0-0.5 | 0.3-1.0 |
| happy | 0.4-0.85 | 0.6-1.0 | 0.4-1.0 | 0.0-0.6 |
| aggressive | 0.7-1.0 | 0.0-0.6 | 0.3-0.9 | 0.0-0.3 |
| romantic | 0.1-0.6 | 0.3-0.8 | 0.2-0.7 | 0.3-1.0 |
| calm | 0.0-0.45 | 0.2-0.7 | 0.0-0.5 | 0.4-1.0 |
| energetic | 0.65-1.0 | 0.4-1.0 | 0.5-1.0 | 0.0-0.4 |

### Алгоритм:
1. Определить настроение (из параметров или по времени суток)
2. Построить SQL WHERE с Op.and для всех 4 диапазонов
3. Запросить треки с RANDOM() сортировкой (лимит 50)
4. Если 0 результатов → повтор без фильтра аудиохарактеристик
5. Сформировать suggestedName + suggestedDescription

### Русские алиасы:
Грустное, Весёлое, Агрессивное, Романтичное, Спокойное, Энергичное

---

## 10. СТАТИСТИКА (stats.ts)

### getUserStats(userId):
- totalTracksPlayed: COUNT(play_history)
- totalListeningTime: SUM(progress)
- topGenres: GROUP BY genreId, COUNT, SORT DESC, LIMIT 10 (с процентами)
- topArtists: GROUP BY artistId, COUNT, SORT DESC, LIMIT 10
- moodDistribution: GROUP BY mood, COUNT
- themeDistribution: GROUP BY themes (JSON parse), COUNT, LIMIT 15
- hourlyActivity: GROUP BY HOUR(playedAt), COUNT (24 значения)
- weeklyActivity: GROUP BY DAYOFWEEK(playedAt), COUNT (7 значений)
- recentlyPlayed: TOP 10 по playedAt DESC
- mostLiked: TOP 10 из likes

---

## 11. АУТЕНТИФИКАЦИЯ (auth.ts middleware)

### authenticate:
1. Извлечь токен из заголовка Authorization: "Bearer <token>"
2. jwt.verify(token, JWT_SECRET)
3. Найти пользователя по id из токена
4. Прикрепить req.user = { id, username, email, role }

### optionalAuth:
То же, но при отсутствии токена — продолжить без req.user

### requireRole(...roles):
Проверить req.user.role входит в roles → 403 если нет

### JWT payload:
{ id, username, email, role } — срок 7 дней

---

## 12. ЗАГРУЗКА ФАЙЛОВ (upload.ts)

### uploadMusic:
- Директория: uploads/music/
- Лимит: 50 МБ
- MIME: audio/mpeg, audio/wav, audio/flac, audio/ogg, audio/aac
- Имя: UUID v4 + оригинальное расширение

### uploadCover:
- Директория: uploads/covers/
- Лимит: 5 МБ
- MIME: image/jpeg, image/png, image/webp

### uploadAvatar:
- Директория: uploads/avatars/
- Лимит: 2 МБ
- MIME: image/jpeg, image/png, image/webp

---

## 13. КЛИЕНТСКАЯ АРХИТЕКТУРА

### Провайдеры:
- AuthContext: user, loading, login(), register(), logout(), updateUser()
- PlayerContext: currentTrack, queue, isPlaying, progress, duration, volume, repeat, shuffle, play(), pause(), next(), previous(), seek(), setVolume(), toggleRepeat(), toggleShuffle(), addToQueue(), removeFromQueue()

### Защищённые маршруты (ProtectedRoute):
library, upload, admin, generate-playlist, stats

### Страницы (14):
1. Home (/) — популярные + новые треки
2. Login (/login) — форма входа
3. Register (/register) — форма регистрации
4. Search (/search) — обычный + семантический поиск
5. Library (/library) — плейлисты + рекомендации
6. AllTracks (/tracks) — все треки
7. TrackDetail (/track/:id) — детали + текст + похожие
8. PlaylistDetail (/playlist/:id) — содержимое плейлиста
9. UploadTrack (/upload) — загрузка с Genius-интеграцией
10. GeneratePlaylist (/generate-playlist) — генерация по настроению
11. Radio (/radio) — жанровое радио
12. Stats (/stats) — графики (BarChart, PieChart, AreaChart)
13. Admin (/admin) — управление
14. Profile (/profile) — профиль пользователя

---

## 14. ТЕСТИРОВАНИЕ

### Результаты (52 тестовых сценария):
| Модуль | Тестов | Успешно |
|--------|--------|---------|
| Аутентификация | 8 | 8 |
| Управление треками | 12 | 12 |
| Управление плейлистами | 10 | 10 |
| Рекомендации | 6 | 6 |
| Семантический поиск | 5 | 5 |
| Аудиоанализ | 4 | 4 |
| Генератор плейлистов | 4 | 4 |
| Статистика | 3 | 3 |

### Производительность:
| Маршрут | Время |
|---------|-------|
| GET /api/tracks | < 50 мс |
| GET /api/tracks/:id | < 30 мс |
| POST /api/tracks/:id/play | < 20 мс |
| GET /api/search | < 100 мс |
| GET /api/search/semantic | < 200 мс |
| GET /api/search/recommendations | < 500 мс |
| POST /api/playlists/generate | < 100 мс |
| Обучение SVD (10 users, 50 tracks) | < 100 мс |
| Обучение SVD (100 users, 500 tracks) | < 2 сек |

---

## 15. СРАВНЕНИЕ С КОММЕРЧЕСКИМИ СЕРВИСАМИ

| Параметр | Spotify | Apple Music | Яндекс.Музыка | MusicStream |
|----------|---------|-------------|---------------|-------------|
| Рекомендации | CF+контент | Поведение | Нейросети | SVD+CF+контент |
| Web Audio анализ | ✗ | ✗ | ✗ | ✓ |
| Семантический поиск | ✗ | ✗ | ✗ | ✓ |
| Определение настроения по тексту | ✗ | ✗ | частично | ✓ |
| Загрузка контента | ✗ | ✗ | ✗ | ✓ |
| Генерация плейлистов по аудио | ✓ | ✓ | ✓ | ✓ (динамическая) |
| Статистика | Wrapped | Базовая | ✓ | Детальная + графики |

---

## 16. ОГРАНИЧЕНИЯ

1. SQLite — не масштабируется на viele User (нужен PostgreSQL)
2. Нет CDN — аудио раздаётся из файловой системы
3. Нет нейросетей — SVD + классические методы
4. Нет тестов — только ручное тестирование
5. JWT в localStorage — уязвимость к XSS (рекомендация: httpOnly cookie)
6. Нет HTTPS
7. Web Audio API — ограничена поддержка форматов в разных браузерах
