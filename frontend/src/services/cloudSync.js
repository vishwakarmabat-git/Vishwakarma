const DB_KEY_PREFIX = "vk_bathouse_";

export const cloudSync = {
  // Pull all data from Hostinger file storage and hydrate localStorage
  pull: async () => {
    // Legacy hostinger localStorage sync disabled
    return true;
  },

  // Push all local vk_bathouse data to Hostinger file storage
  push: async () => {
    // Legacy hostinger localStorage sync disabled
    return true;
  }
};
