import sequelize from '../db/connection';
import '../models';
import Genre from '../models/Genre';
import Artist from '../models/Artist';
import User from '../models/User';
import Track from '../models/Track';

const genres = [
  { name: 'Поп', slug: 'pop' },
  { name: 'Рок', slug: 'rock' },
  { name: 'Хип-хоп', slug: 'hip-hop' },
  { name: 'R&B', slug: 'rnb' },
  { name: 'Электроника', slug: 'electronic' },
  { name: 'Джаз', slug: 'jazz' },
  { name: 'Классика', slug: 'classical' },
  { name: 'Кантри', slug: 'country' },
  { name: 'Регги', slug: 'reggae' },
  { name: 'Метал', slug: 'metal' },
  { name: 'Инди', slug: 'indie' },
  { name: 'Фолк', slug: 'folk' },
  { name: 'Блюз', slug: 'blues' },
  { name: 'Латино', slug: 'latin' },
  { name: 'Диско', slug: 'disco' },
  { name: 'Панк', slug: 'punk' },
  { name: 'Соул', slug: 'soul' },
  { name: 'Фанк', slug: 'funk' },
  { name: 'Эмбиент', slug: 'ambient' },
  { name: 'Гранж', slug: 'grunge' },
];

const sampleArtists = [
  { name: 'The Echo', bio: 'Альтернативная рок-группа' },
  { name: 'Luna Wave', bio: 'Электронный дуэт' },
  { name: 'MC Byte', bio: 'Рэпер из Москвы' },
  { name: 'Jazz Cats', bio: 'Джазовый квартет' },
  { name: 'Солнечный Звук', bio: 'Поп-исполнитель' },
  { name: 'Тёмная Ночь', bio: 'Инди-группа' },
  { name: 'Beat Masters', bio: 'Хип-хоп продюсеры' },
  { name: 'Neon Lights', bio: 'Синт-поп проект' },
];

const sampleTracks = [
  { title: 'Вечерний Бриз', artistIdx: 0, genreSlug: 'rock', duration: 234 },
  { title: 'Танцуй Со Мной', artistIdx: 4, genreSlug: 'pop', duration: 198 },
  { title: 'Ночной Город', artistIdx: 2, genreSlug: 'hip-hop', duration: 267 },
  { title: 'Дождь за Окном', artistIdx: 1, genreSlug: 'electronic', duration: 312 },
  { title: 'Джаз в Полночь', artistIdx: 3, genreSlug: 'jazz', duration: 345 },
  { title: 'Звёзды', artistIdx: 5, genreSlug: 'indie', duration: 223 },
  { title: 'Бит Контролёр', artistIdx: 6, genreSlug: 'hip-hop', duration: 189 },
  { title: 'Неоновые Мечты', artistIdx: 7, genreSlug: 'electronic', duration: 256 },
  { title: 'Свобода', artistIdx: 0, genreSlug: 'rock', duration: 278 },
  { title: 'Лунная Соната', artistIdx: 3, genreSlug: 'jazz', duration: 290 },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ force: true });
    console.log('Models synchronized');

    const admin = await User.create({
      username: 'admin',
      email: 'admin@musicstream.com',
      password: 'admin123',
      displayName: 'Администратор',
      role: 'admin',
    });
    console.log('Created admin user');

    const createdGenres = await Genre.bulkCreate(genres);
    console.log(`Created ${createdGenres.length} genres`);

    const createdArtists = await Artist.bulkCreate(sampleArtists);
    console.log(`Created ${createdArtists.length} artists`);

    console.log('\nSeed completed!');
    console.log('Admin login: admin@musicstream.com / admin123');
    process.exit(0);
  } catch (error: any) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
