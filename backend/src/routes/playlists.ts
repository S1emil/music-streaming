import { Router, Response } from 'express';
import { AuthRequest, authenticate, optionalAuth } from '../middleware/auth';
import { uploadCover } from '../middleware/upload';
import { Playlist, Track, Artist, User } from '../models';
import PlaylistTrack from '../models/PlaylistTrack';
import { generatePlaylist } from '../services/playlistGenerator';
import sequelize from '../db/connection';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const playlists = await Playlist.findAll({
      where: { userId: req.user!.id },
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'username', 'displayName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(playlists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/public', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const playlists = await Playlist.findAll({
      where: { isPublic: true },
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'username', 'displayName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json(playlists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { mood, genreId, limit } = req.body;
    const result = await generatePlaylist({ mood, genreId, limit });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate/save', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, trackIds } = req.body;

    if (!name || !trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return res.status(400).json({ error: 'Name and trackIds are required' });
    }

    const playlist = await sequelize.transaction(async (t) => {
      const pl = await Playlist.create({
        name,
        description: description || null,
        userId: req.user!.id,
        isPublic: false,
      }, { transaction: t });

      for (let i = 0; i < trackIds.length; i++) {
        await PlaylistTrack.create({
          playlistId: pl.id,
          trackId: trackIds[i],
          position: i + 1,
        }, { transaction: t });
      }

      return pl;
    });

    const fullPlaylist = await Playlist.findByPk(playlist.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'username', 'displayName'] },
        {
          model: Track,
          as: 'Tracks',
          include: [{ model: Artist, as: 'Artist', attributes: ['id', 'name'] }],
        },
      ],
    });

    res.status(201).json(fullPlaylist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Owner', attributes: ['id', 'username', 'displayName'] },
        {
          model: Track,
          as: 'Tracks',
          include: [
            { model: Artist, as: 'Artist', attributes: ['id', 'name'] },
          ],
        },
      ],
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (!playlist.isPublic && playlist.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const playlist = await Playlist.create({
      name,
      description: description || null,
      userId: req.user!.id,
      isPublic: isPublic !== false,
    });

    res.status(201).json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, description, isPublic } = req.body;
    if (name) playlist.name = name;
    if (description !== undefined) playlist.description = description;
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    await playlist.save();
    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/cover', authenticate, uploadCover.single('cover'), async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.file) {
      playlist.coverUrl = `/uploads/covers/${req.file.filename}`;
      await playlist.save();
    }

    res.json({ coverUrl: playlist.coverUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.isSystem) {
      return res.status(403).json({ error: 'Cannot delete system playlist' });
    }

    if (playlist.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await PlaylistTrack.destroy({ where: { playlistId: playlist.id } });
    await playlist.destroy();

    res.json({ message: 'Playlist deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/tracks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { trackId } = req.body;
    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }

    const track = await Track.findByPk(trackId);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const existing = await PlaylistTrack.findOne({
      where: { playlistId: playlist.id, trackId },
    });
    if (existing) {
      return res.status(409).json({ error: 'Track already in playlist' });
    }

    const maxPosition = await PlaylistTrack.max('position', {
      where: { playlistId: playlist.id },
    });

    await PlaylistTrack.create({
      playlistId: playlist.id,
      trackId,
      position: ((maxPosition as number) || 0) + 1,
    });

    res.json({ message: 'Track added to playlist' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/tracks/:trackId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await PlaylistTrack.destroy({
      where: { playlistId: playlist.id, trackId: req.params.trackId },
    });

    res.json({ message: 'Track removed from playlist' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
