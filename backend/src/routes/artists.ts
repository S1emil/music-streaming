import { Router, Response } from 'express';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth';
import { uploadCover } from '../middleware/upload';
import { Artist, Track, Album } from '../models';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const artists = await Artist.findAll({
      order: [['name', 'ASC']],
    });
    res.json(artists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const artist = await Artist.findByPk(req.params.id, {
      include: [
        { model: Track, as: 'tracks', attributes: ['id', 'title', 'plays', 'coverUrl', 'duration'] },
        { model: Album, as: 'albums', attributes: ['id', 'title', 'coverUrl', 'year'] },
      ],
    });

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json(artist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, requireRole('admin', 'artist'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, bio } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    const artist = await Artist.create({ name, bio: bio || null });
    res.status(201).json(artist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const artist = await Artist.findByPk(req.params.id);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const { name, bio } = req.body;
    if (name) artist.name = name;
    if (bio !== undefined) artist.bio = bio;

    await artist.save();
    res.json(artist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
