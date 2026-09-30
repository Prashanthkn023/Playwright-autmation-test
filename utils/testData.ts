
import fs from 'fs';
import path from 'path';

export function readJsonFile<T>(relativePath: string): T {
  const filePath = path.resolve(process.cwd(), relativePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Test data file not found: ${filePath}`
    );
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');

  return JSON.parse(fileContent) as T;
}

export function getTestCases<T>(relativePath: string): T[] {
  const data = readJsonFile<T | T[]>(relativePath);

  return Array.isArray(data) ? data : [data];
}