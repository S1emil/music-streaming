import { Router, Response } from 'express';
import { AuthRequest, authenticate, optionalAuth, requireRole } from '../middleware/auth';
import { uploadMusic, uploadCover } from '../middleware/upload';
import { Track, Artist, Genre, Album, Like, PlayHistory, User, TrackGenre, Playlist, PlaylistTrack } from '../models';
import { Op } from 'sequelize';
import sequelize from '../db/connection';
import { fetchLyricsBySearch } from '../services/lyrics';
import { analyzeThemes, extractTags, buildSearchVector, semanticScore } from '../services/themes';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/upload-cover', authenticate, uploadCover.single('cover'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Cover file is required' });
    }
    res.json({ coverUrl: `/uploads/covers/${req.file.filename}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { genre, artist, sort = 'createdAt', order = 'DESC', limit = '20', offset = '0' } = req.query;

    const allowedSortFields = ['createdAt', 'title', 'plays', 'likes', 'duration', 'updatedAt'];
    const allowedOrders = ['ASC', 'DESC'];
    const safeSort = allowedSortFields.includes(sort as string) ? sort as string : 'createdAt';
    const safeOrder = allowedOrders.includes((order as string)?.toUpperCase()) ? (order as string).toUpperCase() : 'DESC';

    const where: any = {};
    if (genre) where.genreId = genre;
    if (artist) where.artistId = artist;

    const tracks = await Track.findAll({
      where,
      include: [
        { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
        { model: Genre, as: 'Genre', attributes: ['id', 'name', 'slug'] },
      ],
      order: [[safeSort, safeOrder]],
      limit: Math.min(Math.max(parseInt(limit as string) || 20, 1), 100),
      offset: Math.max(parseInt(offset as string) || 0, 0),
    });

    if (req.user) {
      const trackIds = tracks.map((t) => t.id);
      const userLikes = await Like.findAll({
        where: { userId: req.user.id, trackId: { [Op.in]: trackIds } },
        attributes: ['trackId'],
      });
      const likedIds = new Set(userLikes.map((l) => l.trackId));
      tracks.forEach((t: any) => { t.isLiked = likedIds.has(t.id); });
    }

    res.json(tracks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/popular', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tracks = await Track.findAll({
      include: [
        { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
        { model: Genre, as: 'Genre', attributes: ['id', 'name', 'slug'] },
      ],
      order: [['plays', 'DESC']],
      limit: 50,
    });

    if (req.user) {
      const trackIds = tracks.map((t) => t.id);
      const userLikes = await Like.findAll({
        where: { userId: req.user.id, trackId: { [Op.in]: trackIds } },
        attributes: ['trackId'],
      });
      const likedIds = new Set(userLikes.map((l) => l.trackId));
      tracks.forEach((t: any) => { t.isLiked = likedIds.has(t.id); });
    }

    res.json(tracks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recent', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tracks = await Track.findAll({
      include: [
        { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
        { model: Genre, as: 'Genre', attributes: ['id', 'name', 'slug'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    if (req.user) {
      const trackIds = tracks.map((t) => t.id);
      const userLikes = await Like.findAll({
        where: { userId: req.user.id, trackId: { [Op.in]: trackIds } },
        attributes: ['trackId'],
      });
      const likedIds = new Set(userLikes.map((l) => l.trackId));
      tracks.forEach((t: any) => { t.isLiked = likedIds.has(t.id); });
    }

    res.json(tracks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search/lyrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, artist } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const result = await fetchLyricsBySearch(artist as string || '', title as string);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search/cover', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, artist } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const searchQuery = `${artist || ''} ${title}`.trim();
    const resp = await axios.get(`https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`, {
      headers: { Authorization: `Bearer ${process.env.GENIUS_ACCESS_TOKEN || ''}` },
    });
    const hits = resp.data?.response?.hits || [];
    if (hits.length > 0) {
      const songArt = hits[0].result?.song_art_image_thumbnail_url || hits[0].result?.header_image_thumbnail_url;
      res.json({ coverUrl: songArt || null });
    } else {
      res.json({ coverUrl: null });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/lyrics/fetch', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const track = await Track.findByPk(req.params.id, {
      include: [{ model: Artist, as: 'Artist', attributes: ['name'] }],
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const artistName = (track as any).Artist?.name || '';
    const result = await fetchLyricsBySearch(artistName, track.title);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/lyrics', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const track = await Track.findByPk(req.params.id, {
      attributes: ['id', 'lyrics'],
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json({ lyrics: track.lyrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const track = await Track.findByPk(req.params.id, {
      include: [
        { model: Artist, as: 'Artist' },
        { model: Genre, as: 'Genre' },
        { model: Genre, as: 'Genres', attributes: ['id', 'name', 'slug'] },
        { model: Album, as: 'Album' },
        { model: User, as: 'Uploader', attributes: ['id', 'username', 'displayName'] },
      ],
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    let isLiked = false;
    if (req.user) {
      const like = await Like.findOne({
        where: { userId: req.user.id, trackId: track.id },
      });
      isLiked = !!like;
    }

    res.json({ ...track.toJSON(), isLiked });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, requireRole('admin', 'artist'), uploadMusic.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, artistId, albumId, genreId, genreIds, duration, explicit, lyrics, coverUrl, tags, tempo, energy, valence, acousticness, danceability } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    if (!title || !artistId) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    const existingTrack = await Track.findOne({
      where: {
        title,
        artistId,
        lyrics: lyrics || null,
      },
    });

    if (existingTrack) {
      return res.status(409).json({ error: 'Такой трек уже существует' });
    }

    let themes: string[] = [];
    let mood: string | null = null;

    if (lyrics) {
      const analysis = analyzeThemes(lyrics);
      themes = analysis.themes;
      mood = analysis.mood;
    }

    const track = await Track.create({
      title,
      artistId,
      albumId: albumId || null,
      genreId: genreId || null,
      duration: parseInt(duration) || 0,
      filePath: `/uploads/music/${req.file.filename}`,
      coverUrl: coverUrl || null,
      uploadedBy: req.user!.id,
      explicit: explicit === 'true' || explicit === true,
      lyrics: lyrics || null,
      themes,
      mood,
      tags: (() => { try { return tags ? JSON.parse(tags) : []; } catch { return []; } })(),
      tempo: tempo ? parseFloat(tempo) : null,
      energy: energy ? parseFloat(energy) : null,
      valence: valence ? parseFloat(valence) : null,
      acousticness: acousticness ? parseFloat(acousticness) : null,
      danceability: danceability ? parseFloat(danceability) : null,
    });

    const allGenreIds: string[] = [];
    if (genreId) allGenreIds.push(genreId);
    if (genreIds) {
      const ids = genreIds.split(',').map((id: string) => id.trim()).filter(Boolean);
      for (const id of ids) {
        if (!allGenreIds.includes(id)) allGenreIds.push(id);
      }
    }
    for (const gid of allGenreIds) {
      await TrackGenre.findOrCreate({ where: { trackId: track.id, genreId: gid } });
    }

    const fullTrack = await Track.findByPk(track.id, {
      include: [
        { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
        { model: Genre, as: 'Genre', attributes: ['id', 'name', 'slug'] },
        { model: Genre, as: 'Genres', attributes: ['id', 'name', 'slug'] },
      ],
    });

    res.status(201).json(fullTrack);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/play', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const { progress } = req.body;

    await track.increment('plays');
    await track.reload();

    if (req.user) {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      const recentPlay = await PlayHistory.findOne({
        where: {
          userId: req.user.id,
          trackId: track.id,
          playedAt: { [Op.gte]: thirtySecondsAgo },
        },
        order: [['playedAt', 'DESC']],
      });

      if (!recentPlay) {
        await PlayHistory.create({
          userId: req.user.id,
          trackId: track.id,
          progress: progress != null ? parseInt(progress) || 0 : 0,
        });
      }
    }

    res.json({ plays: track.plays });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const result = await sequelize.transaction(async (t) => {
      const existingLike = await Like.findOne({
        where: { userId: req.user!.id, trackId: track.id },
        transaction: t,
      });

      let likedPlaylist: Playlist | null = null;
      try {
        likedPlaylist = await Playlist.findOne({
          where: { userId: req.user!.id, isSystem: true },
          transaction: t,
        });
      } catch {}

      if (existingLike) {
        await existingLike.destroy({ transaction: t });
        await Track.decrement('likes', { where: { id: track.id }, transaction: t });
        if (likedPlaylist) {
          await PlaylistTrack.destroy({
            where: { playlistId: likedPlaylist.id, trackId: track.id },
            transaction: t,
          });
        }
        await track.reload({ transaction: t });
        return { liked: false, likes: track.likes };
      } else {
        await Like.create({ userId: req.user!.id, trackId: track.id }, { transaction: t });
        await Track.increment('likes', { where: { id: track.id }, transaction: t });
        if (likedPlaylist) {
          const existing = await PlaylistTrack.findOne({
            where: { playlistId: likedPlaylist.id, trackId: track.id },
            transaction: t,
          });
          if (!existing) {
            await PlaylistTrack.create({
              playlistId: likedPlaylist.id,
              trackId: track.id,
            }, { transaction: t });
          }
        }
        await track.reload({ transaction: t });
        return { liked: true, likes: track.likes };
      }
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (track.uploadedBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, lyrics, coverUrl, genreId, genreIds, explicit } = req.body;

    if (title) track.title = title;
    if (lyrics !== undefined) {
      track.lyrics = lyrics || null;
      if (lyrics) {
        const analysis = analyzeThemes(lyrics);
        track.themes = analysis.themes;
        track.mood = analysis.mood;
      } else {
        track.themes = [];
        track.mood = null;
      }
    }
    if (coverUrl !== undefined) track.coverUrl = coverUrl || null;
    if (genreId !== undefined) track.genreId = genreId || null;
    if (explicit !== undefined) track.explicit = explicit === 'true' || explicit === true;

    await track.save();

    if (genreIds) {
      await TrackGenre.destroy({ where: { trackId: track.id } });
      const ids = genreIds.split(',').map((id: string) => id.trim()).filter(Boolean);
      for (const gid of ids) {
        await TrackGenre.findOrCreate({ where: { trackId: track.id, genreId: gid } });
      }
    }

    const fullTrack = await Track.findByPk(track.id, {
      include: [
        { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
        { model: Genre, as: 'Genre', attributes: ['id', 'name', 'slug'] },
        { model: Genre, as: 'Genres', attributes: ['id', 'name', 'slug'] },
      ],
    });

    res.json(fullTrack);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const track = await Track.findByPk(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (req.user!.role !== 'admin' && track.uploadedBy !== req.user!.id) {
      return res.status(403).json({ error: 'You can only delete your own tracks' });
    }

    if (track.filePath) {
      const audioPath = path.resolve(__dirname, '..', '..', track.filePath);
      const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
      if (audioPath.startsWith(uploadsDir) && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    }
    if (track.coverUrl && track.coverUrl.startsWith('/uploads/')) {
      const coverPath = path.resolve(__dirname, '..', '..', track.coverUrl);
      const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
      if (coverPath.startsWith(uploadsDir) && fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }

    await Like.destroy({ where: { trackId: track.id } });
    await PlayHistory.destroy({ where: { trackId: track.id } });
    await TrackGenre.destroy({ where: { trackId: track.id } });
    await track.destroy();

    res.json({ message: 'Track deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/features', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { energy, valence, danceability, acousticness, tempo } = req.body;
    const track = await Track.findByPk(req.params.id);

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (track.uploadedBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (energy != null) track.energy = parseFloat(energy);
    if (valence != null) track.valence = parseFloat(valence);
    if (danceability != null) track.danceability = parseFloat(danceability);
    if (acousticness != null) track.acousticness = parseFloat(acousticness);
    if (tempo != null) track.tempo = parseFloat(tempo);

    await track.save();

    res.json({
      energy: track.energy,
      valence: track.valence,
      danceability: track.danceability,
      acousticness: track.acousticness,
      tempo: track.tempo,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/lyrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { lyrics } = req.body;
    const track = await Track.findByPk(req.params.id);

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (track.uploadedBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    track.lyrics = lyrics;
    if (lyrics) {
      const analysis = analyzeThemes(lyrics);
      track.themes = analysis.themes;
      track.mood = analysis.mood;
    } else {
      track.themes = [];
      track.mood = null;
    }
    await track.save();

    res.json({ lyrics: track.lyrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
