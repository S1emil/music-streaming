import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection';

class TrackGenre extends Model {
  declare trackId: string;
  declare genreId: string;
}

TrackGenre.init({
  trackId: { type: DataTypes.UUID, primaryKey: true, references: { model: 'tracks', key: 'id' } },
  genreId: { type: DataTypes.UUID, primaryKey: true, references: { model: 'genres', key: 'id' } },
}, { sequelize, tableName: 'track_genres', timestamps: false });

export default TrackGenre;
