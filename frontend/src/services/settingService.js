import { db } from '../data/db';
import apiClient from './apiClient';

export const settingService = {
  getSettings: async () => {
    return db.getSettings();
  }
};
