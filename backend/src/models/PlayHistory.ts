import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection';

class PlayHistory extends Model {
  declare id: string;
  declare userId: string;
  declare trackId: string;
  declare playedAt: Date;
  declare progress: number;
}

PlayHistory.init(
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
    playedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'play_history',
    timestamps: false,
  }
);

export default PlayHistory;
