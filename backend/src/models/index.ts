import User from './User';
import Artist from './Artist';
import Genre from './Genre';
import Album from './Album';
import Track from './Track';
import Playlist from './Playlist';
import PlaylistTrack from './PlaylistTrack';
import Like from './Like';
import PlayHistory from './PlayHistory';
import TrackGenre from './TrackGenre';

// Artist <-> Album
Artist.hasMany(Album, { foreignKey: 'artistId', as: 'albums' });
Album.belongsTo(Artist, { foreignKey: 'artistId', as: 'Artist' });

// Artist <-> Track
Artist.hasMany(Track, { foreignKey: 'artistId', as: 'tracks' });
Track.belongsTo(Artist, { foreignKey: 'artistId', as: 'Artist' });

// Genre <-> Track
Genre.hasMany(Track, { foreignKey: 'genreId', as: 'tracks' });
Track.belongsTo(Genre, { foreignKey: 'genreId', as: 'Genre' });

// Album <-> Track
Album.hasMany(Track, { foreignKey: 'albumId', as: 'tracks' });
Track.belongsTo(Album, { foreignKey: 'albumId', as: 'Album' });

// User <-> Track (uploader)
User.hasMany(Track, { foreignKey: 'uploadedBy', as: 'uploadedTracks' });
Track.belongsTo(User, { foreignKey: 'uploadedBy', as: 'Uploader' });

// User <-> Playlist
User.hasMany(Playlist, { foreignKey: 'userId', as: 'playlists' });
Playlist.belongsTo(User, { foreignKey: 'userId', as: 'Owner' });

// Playlist <-> Track (many-to-many)
Playlist.belongsToMany(Track, { through: PlaylistTrack, foreignKey: 'playlistId', as: 'Tracks' });
Track.belongsToMany(Playlist, { through: PlaylistTrack, foreignKey: 'trackId', as: 'Playlists' });

// User <-> Track (likes)
User.belongsToMany(Track, { through: Like, foreignKey: 'userId', as: 'likedTracks' });
Track.belongsToMany(User, { through: Like, foreignKey: 'trackId', as: 'Likers' });
Like.belongsTo(Track, { foreignKey: 'trackId', as: 'Track' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'User' });

// User <-> PlayHistory
User.hasMany(PlayHistory, { foreignKey: 'userId', as: 'playHistory' });
PlayHistory.belongsTo(User, { foreignKey: 'userId', as: 'User' });

// Track <-> PlayHistory
Track.hasMany(PlayHistory, { foreignKey: 'trackId', as: 'playHistory' });
PlayHistory.belongsTo(Track, { foreignKey: 'trackId', as: 'Track' });

// Track <-> Genre (many-to-many via TrackGenre)
Track.belongsToMany(Genre, { through: TrackGenre, foreignKey: 'trackId', as: 'Genres' });
Genre.belongsToMany(Track, { through: TrackGenre, foreignKey: 'genreId', as: 'Tracks' });

export {
  User,
  Artist,
  Genre,
  Album,
  Track,
  Playlist,
  PlaylistTrack,
  Like,
  PlayHistory,
  TrackGenre,
};
