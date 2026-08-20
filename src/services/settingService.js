import { db } from '../data/db';
import apiClient from './apiClient';

export const settingService = {
  getSettings: async () => {
    try {
      const response = await apiClient.get('/settings/get.php');
      if (response && response.status === 'success' && response.data && Object.keys(response.data).length > 0) {
        return response.data;
      }
    } catch {
      // Offline fallback
    }
    return db.getSettings();
  }
};
