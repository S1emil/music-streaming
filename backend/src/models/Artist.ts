import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection';

class Artist extends Model {
  declare id: string;
  declare name: string;
  declare bio: string | null;
  declare image: string | null;
  declare verified: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Artist.init(
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
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'artists',
    timestamps: true,
  }
);

export default Artist;
