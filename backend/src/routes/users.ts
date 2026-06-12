import { Router, Response } from 'express';
import { AuthRequest, authenticate, optionalAuth } from '../middleware/auth';
import { Track, User, Artist, Playlist } from '../models';
import Like from '../models/Like';
import PlayHistory from '../models/PlayHistory';
import { getUserStats } from '../services/stats';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'username', 'email', 'displayName', 'role', 'avatar', 'bio', 'createdAt'],
    });

    const likedTracks = await Track.findAll({
      include: [
        { model: Artist, as: 'Artist', attributes: ['id', 'name'] },
        { model: User, as: 'Likers', where: { id: req.user!.id }, attributes: [] },
      ],
    });

    const playlists = await Playlist.findAll({
      where: { userId: req.user!.id },
      order: [['createdAt', 'DESC']],
    });

    const history = await PlayHistory.findAll({
      where: { userId: req.user!.id },
      include: [
        { model: Track, as: 'Track', include: [{ model: Artist, as: 'Artist', attributes: ['id', 'name'] }] },
      ],
      order: [['playedAt', 'DESC']],
      limit: 50,
    });

    res.json({
      user,
      likedTracks,
      playlists,
      history,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getUserStats(req.user!.id);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'displayName', 'avatar', 'bio', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const playlists = await Playlist.findAll({
      where: { userId: user.id, isPublic: true },
      order: [['createdAt', 'DESC']],
    });

    res.json({ user, playlists });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
