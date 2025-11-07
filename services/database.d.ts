// Type definitions for platform-specific database module
// React Native resolver automatically selects database.native.ts or database.web.ts at runtime

import { TestResult, NewTestResult } from '@/types/test-result';

export function initDatabase(): Promise<void>;
export function saveImage(sourceUri: string): Promise<string>;
export function addTestResult(testResult: NewTestResult): Promise<number>;
export function getAllTestResults(): Promise<TestResult[]>;
export function getTestResultById(id: number): Promise<TestResult | null>;
export function updateTestResult(
  id: number,
  updates: Partial<Omit<TestResult, 'id' | 'createdAt'>>
): Promise<void>;
export function deleteTestResult(id: number): Promise<void>;
export function getDatabaseStats(): Promise<{
  totalTests: number;
  totalSize: number;
}>;

