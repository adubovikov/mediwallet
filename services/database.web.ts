import { TestResult, NewTestResult } from '@/types/test-result';

// Web platform stubs - database not supported on web
const webError = () => {
  throw new Error('Database operations are not supported on web platform. Please use iOS or Android.');
};

export const initDatabase = async (): Promise<void> => {
  console.warn('SQLite is not supported on web platform.');
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

