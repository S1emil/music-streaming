import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, authenticate } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';
import User from '../models/User';
import Playlist from '../models/Playlist';

const router = Router();

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const role = req.body.role === 'artist' ? 'artist' : 'user';
    const user = await User.create({ username, email, password, displayName, role });

    await Playlist.create({
      name: 'Понравившиеся',
      userId: user.id,
      isPublic: false,
      isSystem: true,
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'username', 'email', 'displayName', 'role', 'avatar', 'bio', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, bio } = req.body;
    const user = await User.findByPk(req.user!.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (displayName) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    await user.save();

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/me/avatar', authenticate, uploadAvatar.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
      await user.save();
    }

    res.json({ avatar: user.avatar });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
