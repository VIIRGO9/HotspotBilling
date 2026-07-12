import { SettingsRepository } from './settings.repository.js';
import { AppError } from '../../shared/middleware/error.handler.js';

export const SettingsService = {
  getAll: async () => {
    const settings = await SettingsRepository.findAll();
    
    // Ensure all values are properly serialized
    return settings.map(setting => ({
      ...setting,
      // Prisma JSON field might return as object, ensure it's handled
      value: setting.value,
    }));
  },
  
  getByKey: async (key) => {
    const setting = await SettingsRepository.findByKey(key);
    if (!setting) throw new AppError('Setting not found.', 404, 'SETTING_001');
    return setting;
  },
  
  update: async (key, data) => {
    // Ensure value is properly formatted for JSON column
    const updateData = {
      value: data.value,
      ...(data.description && { description: data.description }),
    };
    
    return SettingsRepository.upsert(key, updateData);
  },
};
