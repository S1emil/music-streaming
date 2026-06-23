import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import sequelize from './db/connection';
import Genre from './models/Genre';
import { errorHandler } from './middleware/errorHandler';
import './models';

import authRoutes from './routes/auth';
import trackRoutes from './routes/tracks';
import playlistRoutes from './routes/playlists';
import searchRoutes from './routes/search';
import artistRoutes from './routes/artists';
import userRoutes from './routes/users';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const uploadsDir = path.join(__dirname, '../uploads');
['music', 'covers', 'avatars'].forEach((dir) => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ force: false });
    console.log('Models synchronized');

    const defaultGenres = [
      'Поп', 'Рок', 'Хип-хоп', 'R&B', 'Электроника', 'Джаз', 'Классика',
      'Регги', 'Кантри', 'Метал', 'Панк', 'Инди', 'Фолк', 'Блюз',
      'Латино', 'K-Pop', 'Рэп', 'Диско', 'Фанк', 'Соул',
    ];
    for (const name of defaultGenres) {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      await Genre.findOrCreate({ where: { name }, defaults: { name, slug } });
    }
    console.log('Default genres seeded');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
