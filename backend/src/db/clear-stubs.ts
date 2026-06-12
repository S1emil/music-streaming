import sequelize from '../db/connection';
import '../models';
import Track from '../models/Track';

async function clearStubs() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const deleted = await Track.destroy({
      where: {
        filePath: '/uploads/music/sample.mp3',
      },
    });

    console.log(`Deleted ${deleted} stub tracks`);
    process.exit(0);
  } catch (error: any) {
    console.error('Failed to clear stubs:', error.message);
    process.exit(1);
  }
}

clearStubs();
