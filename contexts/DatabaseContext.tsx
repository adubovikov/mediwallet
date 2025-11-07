import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface DatabaseContextType {
  isReady: boolean;
  isInitializing: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
  isInitializing: true,
  error: null,
});

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'web') {
        setIsReady(false);
        setIsInitializing(false);
        return;
      }

      try {
        const { initDatabase } = await import('@/services/database');
        await initDatabase();
        setIsReady(true);
        console.log('Database context: Database is ready');
      } catch (err) {
        console.error('Database context: Failed to initialize:', err);
        setError(err as Error);
        setIsReady(false);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady, isInitializing, error }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabaseContext = () => useContext(DatabaseContext);

