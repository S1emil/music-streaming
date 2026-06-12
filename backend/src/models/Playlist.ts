import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection';
import User from './User';
import Track from './Track';

class Playlist extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare coverUrl: string | null;
  declare userId: string;
  declare isPublic: boolean;
  declare isCollaborative: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare Owner?: User;
  declare Tracks?: Track[];
}

Playlist.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isCollaborative: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'playlists',
    timestamps: true,
  }
);

export default Playlist;
