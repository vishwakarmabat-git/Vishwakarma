const DB_KEY_PREFIX = "vk_bathouse_";

export const cloudSync = {
  // Pull all data from Hostinger file storage and hydrate localStorage
  pull: async () => {
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '/api') + '/sync.php');
      const data = await response.json();
      
      if (data && data.status !== 'empty' && !data.error) {
        window.__blockCloudPush = true;
        // Hydrate localStorage
        Object.keys(data).forEach(key => {
          if (key.startsWith(DB_KEY_PREFIX)) {
            localStorage.setItem(key, data[key]);
          }
        });
        window.__blockCloudPush = false;
        console.log("Successfully synced database from Hostinger cloud.");
        return true;
      }
    } catch (e) {
      window.__blockCloudPush = false;
      console.warn("Could not sync from cloud, falling back to local cache.", e);
    }
    return false;
  },

  // Push all local vk_bathouse data to Hostinger file storage
  push: async () => {
    try {
      const payload = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(DB_KEY_PREFIX)) {
          payload[key] = localStorage.getItem(key);
        }
      }

      await fetch((import.meta.env.VITE_API_URL || '/api') + '/sync.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'vk_super_admin_secret_9988'
        },
        body: JSON.stringify(payload)
      });
      console.log("Successfully pushed local changes to Hostinger cloud.");
    } catch (e) {
      console.warn("Failed to push changes to cloud.", e);
    }
  }
};
