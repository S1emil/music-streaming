import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection';
import Artist from './Artist';

class Album extends Model {
  declare id: string;
  declare title: string;
  declare artistId: string;
  declare coverUrl: string | null;
  declare year: number | null;
  declare type: 'album' | 'single' | 'ep';
  declare createdAt: Date;
  declare updatedAt: Date;

  declare Artist?: Artist;
}

Album.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    artistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'artists', key: 'id' },
    },
    coverUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('album', 'single', 'ep'),
      defaultValue: 'album',
    },
  },
  {
    sequelize,
    tableName: 'albums',
    timestamps: true,
  }
);

export default Album;
