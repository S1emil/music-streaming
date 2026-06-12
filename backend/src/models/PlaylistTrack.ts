import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection';

class PlaylistTrack extends Model {
  declare playlistId: string;
  declare trackId: string;
  declare position: number;
  declare addedAt: Date;
}

PlaylistTrack.init(
  {
    playlistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'playlists', key: 'id' },
      primaryKey: true,
    },
    trackId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'tracks', key: 'id' },
      primaryKey: true,
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    addedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'playlist_tracks',
    timestamps: false,
  }
);

export default PlaylistTrack;
