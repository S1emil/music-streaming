import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection';

class Genre extends Model {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare image: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Genre.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'genres',
    timestamps: true,
  }
);

export default Genre;
