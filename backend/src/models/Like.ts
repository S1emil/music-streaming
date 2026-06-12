import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection';

class Like extends Model {
  declare id: string;
  declare userId: string;
  declare trackId: string;
  declare createdAt: Date;
}

Like.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    trackId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'tracks', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'likes',
    timestamps: true,
    indexes: [{ unique: true, fields: ['userId', 'trackId'] }],
  }
);

export default Like;
