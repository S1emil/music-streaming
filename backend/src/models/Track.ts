import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection';
import User from './User';
import Artist from './Artist';
import Genre from './Genre';

class Track extends Model {
  declare id: string;
  declare title: string;
  declare artistId: string;
  declare albumId: string | null;
  declare genreId: string | null;
  declare duration: number;
  declare filePath: string;
  declare coverUrl: string | null;
  declare lyrics: string | null;
  declare themes: string[];
  declare mood: string | null;
  declare plays: number;
  declare likes: number;
  declare uploadedBy: string;
  declare explicit: boolean;
  declare tags: string[];
  declare tempo: number | null;
  declare energy: number | null;
  declare valence: number | null;
  declare acousticness: number | null;
  declare danceability: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare Artist?: Artist;
  declare Genre?: Genre;
  declare Uploader?: User;
}

Track.init(
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
    albumId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'albums', key: 'id' },
    },
    genreId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'genres', key: 'id' },
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    coverUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    lyrics: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    themes: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('themes');
        try {
          return JSON.parse(rawValue || '[]');
        } catch {
          return [];
        }
      },
      set(value: string[]) {
        this.setDataValue('themes', JSON.stringify(value || []));
      },
    },
    mood: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    plays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    explicit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    tags: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('tags');
        try {
          return JSON.parse(rawValue || '[]');
        } catch {
          return [];
        }
      },
      set(value: string[]) {
        this.setDataValue('tags', JSON.stringify(value || []));
      },
    },
    tempo: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    energy: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    valence: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    acousticness: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    danceability: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tracks',
    timestamps: true,
  }
);

export default Track;
