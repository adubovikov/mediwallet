import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const useDatabase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      // Skip database initialization on web
      if (Platform.OS === 'web') {
        setIsLoading(false);
        return;
      }

      try {
        // Dynamic import - React Native resolver will pick database.native.ts or database.web.ts
        const { initDatabase } = await import('@/services/database');
        await initDatabase();
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  return { isLoading, error };
};

