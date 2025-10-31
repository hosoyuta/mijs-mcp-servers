/**
 * FileReader tests
 */

import { describe, test, expect } from 'bun:test';
import { FileReader } from '../../src/fs/FileReader';

describe('FileReader', () => {
  test('正常にファイルを読み込める', async () => {
    const reader = new FileReader();
    const result = await reader.readFile('./tests/fixtures/sample-simple.ts');

    expect(result.content).toBeDefined();
    expect(result.metadata.path).toContain('sample-simple.ts');
    expect(result.metadata.size).toBeGreaterThan(0);
    expect(result.metadata.lines).toBeGreaterThan(0);
  });

  test('存在しないファイルはエラー', async () => {
    const reader = new FileReader();
    await expect(reader.readFile('./nonexistent.ts')).rejects.toThrow();
  });

  test('ファイルメタデータが正確', async () => {
    const reader = new FileReader();
    const result = await reader.readFile('./tests/fixtures/sample-simple.ts');

    expect(result.metadata.mtime).toBeInstanceOf(Date);
    expect(result.metadata.encoding).toBe('utf-8');
    expect(result.metadata.lines).toBeGreaterThan(0);
  });

  test('大きなファイルも読み込める', async () => {
    const reader = new FileReader();
    const result = await reader.readFile('./tests/fixtures/sample-large.ts');

    expect(result.metadata.lines).toBeGreaterThan(1000);
  });
});
