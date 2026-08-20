import { db } from '../data/db';

export const settingService = {
  getSettings: async () => {
    return db.getSettings();
  }
};
