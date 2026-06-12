import { Router, Response } from 'express';
import { AuthRequest, authenticate, optionalAuth } from '../middleware/auth';
import { Track, Artist, Genre, Album, User, Playlist, PlayHistory, TrackGenre, Like } from '../models';
import { Op, literal } from 'sequelize';
import { getHybridRecommendations, getSimilarTracks } from '../services/recommendations';
import { buildSearchVector, semanticScore } from '../services/themes';
import { buildSVDModel } from '../services/svd';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = `%${q}%`;
    const results: any = {};

    if (type === 'all' || type === 'tracks') {
      const matchingArtists = await Artist.findAll({
        where: { name: { [Op.like]: searchTerm } },
        attributes: ['id'],
      });
      const artistIds = matchingArtists.map((a: any) => a.id);

      const trackWhere: any = { [Op.or]: [{ title: { [Op.like]: searchTerm } }] };
      if (artistIds.length > 0) {
        trackWhere[Op.or].push({ artistId: { [Op.in]: artistIds } });
      }

      results.tracks = await Track.findAll({
        where: trackWhere,
        include: [
          { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
        ],
        limit: 20,
      });
    }

    if (type === 'all' || type === 'artists') {
      results.artists = await Artist.findAll({
        where: { name: { [Op.like]: searchTerm } },
        limit: 10,
      });
    }

    if (type === 'all' || type === 'albums') {
      results.albums = await Album.findAll({
        where: { title: { [Op.like]: searchTerm } },
        include: [
          { model: Artist, as: 'Artist', attributes: ['id', 'name'] },
        ],
        limit: 10,
      });
    }

    if (type === 'all' || type === 'playlists') {
      results.playlists = await Playlist.findAll({
        where: {
          isPublic: true,
          name: { [Op.like]: searchTerm },
        },
        include: [
          { model: User, as: 'Owner', attributes: ['id', 'username', 'displayName'] },
        ],
        limit: 10,
      });
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/genres', async (req: AuthRequest, res: Response) => {
  try {
    const genres = await Genre.findAll({
      order: [['name', 'ASC']],
    });
    res.json(genres);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recommendations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20 } = req.query;
    const recommendations = await getHybridRecommendations(req.user!.id, parseInt(limit as string));
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/similar/:trackId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const similar = await getSimilarTracks(req.params.trackId, parseInt(limit as string));
    res.json(similar);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/radio', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { genre } = req.query;
    const where: any = {};

    if (genre) {
      const trackGenreEntries = await TrackGenre.findAll({ where: { genreId: genre } });
      const trackIds = trackGenreEntries.map((tg: any) => tg.trackId);
      if (trackIds.length > 0) {
        where.id = { [Op.in]: trackIds };
      } else {
        where.genreId = genre;
      }
    }

    const radioTracks = await Track.findAll({
      where,
      include: [
        { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
      ],
      order: [literal('RANDOM()')],
      limit: 50,
    });

    res.json(radioTracks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/semantic', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const searchWords = buildSearchVector(q as string);

    const allTracks = await Track.findAll({
      where: {
        themes: { [Op.ne]: '[]' },
      },
      include: [
        { model: Artist, as: 'Artist', attributes: ['id', 'name', 'image'] },
        { model: Genre, as: 'Genre', attributes: ['id', 'name', 'slug'] },
      ],
      limit: 200,
    });

    const scoredTracks = allTracks.map((track: any) => {
      const trackThemes = track.themes || [];
      const trackMood = track.mood || '';
      const score = semanticScore(trackThemes, trackMood, searchWords);
      return { track: track.toJSON(), score };
    });

    scoredTracks.sort((a, b) => b.score - a.score);

    const results = scoredTracks
      .filter(s => s.score > 0)
      .slice(0, 30)
      .map(s => ({ ...s.track, semanticScore: s.score }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/svd-stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userCount = await User.count();
    const trackCount = await Track.count();
    const historyCount = await PlayHistory.count();
    const likeCount = await Like.count();

    const model = await buildSVDModel();

    res.json({
      users: userCount,
      tracks: trackCount,
      interactions: historyCount + likeCount,
      matrixSparsity: model
        ? `${((1 - (historyCount + likeCount) / (userCount * trackCount)) * 100).toFixed(1)}%`
        : 'N/A',
      latentFactors: model?.k || 0,
      userEmbeddings: model?.userFactors.size || 0,
      itemEmbeddings: model?.itemFactors.size || 0,
      globalMean: model?.globalMean?.toFixed(2) || 'N/A',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
