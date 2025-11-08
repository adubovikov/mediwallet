import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { TestResult, NewTestResult } from '@/types/test-result';

const DB_NAME = 'mediwallet.db';

let db: SQLite.SQLiteDatabase | null = null;

// Datenbank initialisieren
export const initDatabase = async (): Promise<void> => {
  // Wenn bereits initialisiert, früh zurückkehren
  if (db) {
    console.log('Database already initialized');
    return;
  }

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Tabellen erstellen
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        test_type TEXT NOT NULL,
        image_path TEXT NOT NULL,
        results TEXT,
        notes TEXT,
        analyzed_data TEXT
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    db = null; // Bei Fehler zurücksetzen
    throw error;
  }
};

// Bild in permanenten Speicher speichern
export const saveImage = async (sourceUri: string): Promise<string> => {
  try {
    console.log('saveImage: Starting, sourceUri:', sourceUri);
    const timestamp = Date.now();
    const filename = `test_${timestamp}.jpg`;
    
    // Dokumentenverzeichnis mit neuer API abrufen
    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      throw new Error('Document directory is not available');
    }
    
    const directory = `${docDir}medical_tests/`;
    
    console.log('saveImage: Directory path:', directory);
    console.log('saveImage: Document directory:', docDir);
    
    // Verzeichnis erstellen, falls es nicht existiert
    const dirInfo = await FileSystem.getInfoAsync(directory);
    console.log('saveImage: Directory exists:', dirInfo.exists);
    
    if (!dirInfo.exists) {
      console.log('saveImage: Creating directory...');
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      console.log('saveImage: Directory created');
    }
    
    const destinationUri = `${directory}${filename}`;
    console.log('saveImage: Destination URI:', destinationUri);
    
    // Bild in permanenten Speicher kopieren
    console.log('saveImage: Copying file...');
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    
    console.log('saveImage: Image saved successfully to:', destinationUri);
    return destinationUri;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

// Neues Testergebnis hinzufügen
export const addTestResult = async (testResult: NewTestResult): Promise<number> => {
  // Wenn Datenbank nicht initialisiert ist, versuchen zu initialisieren
  if (!db) {
    console.log('Database not initialized, attempting to initialize...');
    await initDatabase();
    if (!db) {
      throw new Error('Failed to initialize database. Please restart the app.');
    }
  }
  
  try {
    console.log('addTestResult: Inserting test result:', {
      testType: testResult.testType,
      imagePath: testResult.imagePath,
      notes: testResult.notes,
    });
    
    const result = await db.runAsync(
      `INSERT INTO test_results (created_at, test_type, image_path, results, notes, analyzed_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        new Date().toISOString(),
        testResult.testType,
        testResult.imagePath,
        testResult.results || null,
        testResult.notes || null,
        testResult.analyzedData || null,
      ]
    );
    
    const insertedId = result.lastInsertRowId;
    console.log('addTestResult: Test result added successfully with ID:', insertedId);
    return insertedId;
  } catch (error: any) {
    console.error('addTestResult: Error adding test result:', error);
    console.error('addTestResult: Error message:', error?.message);
    console.error('addTestResult: Error stack:', error?.stack);
    
    // Wenn Datenbankverbindung verloren geht, versuchen erneut zu initialisieren
    if (error?.message?.includes('closed') || error?.message?.includes('not open')) {
      console.log('addTestResult: Database connection lost, reinitializing...');
      db = null;
      await initDatabase();
      // Einmal erneut versuchen
      try {
        const retryResult = await db!.runAsync(
          `INSERT INTO test_results (created_at, test_type, image_path, results, notes, analyzed_data)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            new Date().toISOString(),
            testResult.testType,
            testResult.imagePath,
            testResult.results || null,
            testResult.notes || null,
            testResult.analyzedData || null,
          ]
        );
        console.log('addTestResult: Retry successful, ID:', retryResult.lastInsertRowId);
        return retryResult.lastInsertRowId;
      } catch (retryError) {
        console.error('addTestResult: Retry failed:', retryError);
        throw new Error(`Failed to save test result after retry: ${retryError}`);
      }
    }
    
    throw error;
  }
};

// Alle Testergebnisse abrufen
export const getAllTestResults = async (): Promise<TestResult[]> => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const results = await db.getAllAsync<any>(
      'SELECT * FROM test_results ORDER BY created_at DESC'
    );
    
    return results.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      testType: row.test_type,
      imagePath: row.image_path,
      results: row.results || undefined,
      notes: row.notes || undefined,
      analyzedData: row.analyzed_data || undefined,
    }));
  } catch (error) {
    console.error('Error getting test results:', error);
    throw error;
  }
};

// Testergebnis nach ID abrufen
export const getTestResultById = async (id: number): Promise<TestResult | null> => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM test_results WHERE id = ?',
      [id]
    );
    
    if (!result) {
      return null;
    }
    
    return {
      id: result.id,
      createdAt: result.created_at,
      testType: result.test_type,
      imagePath: result.image_path,
      results: result.results || undefined,
      notes: result.notes || undefined,
      analyzedData: result.analyzed_data || undefined,
    };
  } catch (error) {
    console.error('Error getting test result by ID:', error);
    throw error;
  }
};

// Testergebnis aktualisieren
export const updateTestResult = async (
  id: number,
  updates: Partial<Omit<TestResult, 'id' | 'createdAt'>>
): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.testType !== undefined) {
      fields.push('test_type = ?');
      values.push(updates.testType);
    }
    if (updates.results !== undefined) {
      fields.push('results = ?');
      values.push(updates.results);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.analyzedData !== undefined) {
      fields.push('analyzed_data = ?');
      values.push(updates.analyzedData);
    }
    
    if (fields.length === 0) {
      return;
    }
    
    values.push(id);
    
    await db.runAsync(
      `UPDATE test_results SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    console.log('Test result updated:', id);
  } catch (error) {
    console.error('Error updating test result:', error);
    throw error;
  }
};

// Testergebnis löschen
export const deleteTestResult = async (id: number): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    // Bildpfad vor dem Löschen abrufen
    const testResult = await getTestResultById(id);
    
    if (testResult) {
      // Bilddatei löschen
      const fileInfo = await FileSystem.getInfoAsync(testResult.imagePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(testResult.imagePath);
        console.log('Image file deleted:', testResult.imagePath);
      }
    }
    
    // Aus Datenbank löschen
    await db.runAsync('DELETE FROM test_results WHERE id = ?', [id]);
    
    console.log('Test result deleted:', id);
  } catch (error) {
    console.error('Error deleting test result:', error);
    throw error;
  }
};

// Datenbankstatistiken abrufen
export const getDatabaseStats = async (): Promise<{
  totalTests: number;
  totalSize: number;
}> => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM test_results'
    );
    
    const totalTests = countResult?.count || 0;
    
    // Gesamtgröße der Bilder berechnen
    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      return { totalTests, totalSize: 0 };
    }
    
    const directory = `${docDir}medical_tests/`;
    let totalSize = 0;
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(directory);
        for (const file of files) {
          const fileInfo = await FileSystem.getInfoAsync(`${directory}${file}`);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            totalSize += fileInfo.size || 0;
          }
        }
      }
    } catch (err) {
      console.warn('Could not calculate directory size:', err);
    }
    
    return {
      totalTests,
      totalSize,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
};

