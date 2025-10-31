/**
 * FileReader - Handles file reading operations using Bun.file() API
 * Provides secure file reading with metadata extraction
 */

import type { FileReadResult, FileMetadata } from '../types/fs';

/**
 * Maximum file size allowed (100MB)
 * Prevents DoS attacks and out-of-memory errors
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Default file encoding
 */
const DEFAULT_ENCODING = 'utf-8';

/**
 * File reader class for reading TypeScript files with metadata
 */
export class FileReader {
  constructor() {
    // No initialization required
  }

  /**
   * Reads a file and returns its content with metadata
   *
   * @param path - File path to read
   * @returns File content and metadata
   * @throws Error if path is invalid, file doesn't exist, or file size exceeds limit
   *
   * @example
   * ```typescript
   * const reader = new FileReader();
   * const result = await reader.readFile('./src/index.ts');
   * console.log(result.content);
   * console.log(result.metadata.lines);
   * ```
   */
  async readFile(path: string): Promise<FileReadResult> {
    this.validatePath(path);

    const file = Bun.file(path);

    const exists = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${path}`);
    }

    const size = file.size;
    if (size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE} bytes: ${path}`);
    }

    const stats = await file.stat();
    const mtime = stats.mtime;
    const content = await file.text();
    const lines = this.countLines(content);

    const metadata: FileMetadata = {
      path,
      size,
      mtime: mtime instanceof Date ? mtime : new Date(mtime),
      lines,
      encoding: DEFAULT_ENCODING,
    };

    return {
      content,
      metadata,
    };
  }

  /**
   * Validates file path
   *
   * @param path - Path to validate
   * @throws Error if path is invalid
   */
  private validatePath(path: string): void {
    if (!path || typeof path !== 'string' || path.trim().length === 0) {
      throw new Error('Path is required and must be a non-empty string');
    }
  }

  /**
   * Counts lines in a string
   *
   * @param content - String content to count lines
   * @returns Number of lines
   */
  private countLines(content: string): number {
    if (content.length === 0) {
      return 0;
    }
    return content.split('\n').length;
  }
}

export default FileReader;
