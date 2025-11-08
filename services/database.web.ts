import { TestResult, NewTestResult } from '@/types/test-result';

// Web-Plattform-Stubs - Datenbank wird auf Web nicht unterstützt
const webError = () => {
  throw new Error('Database operations are not supported on web platform. Please use iOS or Android.');
};

export const initDatabase = async (): Promise<void> => {
  // Auf Web still zurückkehren - Datenbank wird nicht unterstützt
  // Keine Warnung nötig, da Web-Plattform in der UI behandelt wird
  return;
};

export const saveImage = async (sourceUri: string): Promise<string> => {
  return webError();
};

export const addTestResult = async (testResult: NewTestResult): Promise<number> => {
  return webError();
};

export const getAllTestResults = async (): Promise<TestResult[]> => {
  return webError();
};

export const getTestResultById = async (id: number): Promise<TestResult | null> => {
  return webError();
};

export const updateTestResult = async (
  id: number,
  updates: Partial<Omit<TestResult, 'id' | 'createdAt'>>
): Promise<void> => {
  return webError();
};

export const deleteTestResult = async (id: number): Promise<void> => {
  return webError();
};

export const getDatabaseStats = async (): Promise<{
  totalTests: number;
  totalSize: number;
}> => {
  return webError();
};

