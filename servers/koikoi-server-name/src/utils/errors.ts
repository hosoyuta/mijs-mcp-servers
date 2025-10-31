/**
 * Error utilities
 */

import * as ts from "typescript";

/**
 * File system error class
 * Base error for all file system related errors
 */
export class FileSystemError extends Error {
  /**
   * Creates a file system error
   *
   * @param message - Error message
   * @param path - Path where the error occurred
   * @param code - Optional error code
   *
   * @example
   * ```typescript
   * throw new FileSystemError('File not found', '/path/to/file', 'ENOENT');
   * ```
   */
  constructor(
    message: string,
    public readonly path: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "FileSystemError";
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

/**
 * Workspace boundary error class
 * Thrown when attempting to access files outside workspace boundaries
 */
export class WorkspaceBoundaryError extends FileSystemError {
  /**
   * Creates a workspace boundary error
   *
   * @param path - Path outside workspace
   * @param workspace - Workspace root path
   *
   * @example
   * ```typescript
   * throw new WorkspaceBoundaryError('/etc/passwd', '/home/user/project');
   * ```
   */
  constructor(path: string, workspace: string) {
    super(
      `Path '${path}' is outside workspace '${workspace}'`,
      path,
      "WORKSPACE_BOUNDARY"
    );
    this.name = "WorkspaceBoundaryError";
    Object.setPrototypeOf(this, WorkspaceBoundaryError.prototype);
  }
}

/**
 * Compiler error class
 * Thrown when TypeScript compilation errors occur
 */
export class CompilerError extends Error {
  /**
   * Creates a compiler error
   *
   * @param message - Error message
   * @param diagnostics - TypeScript diagnostic information
   *
   * @example
   * ```typescript
   * throw new CompilerError('Compilation failed', diagnostics);
   * ```
   */
  constructor(
    message: string,
    public readonly diagnostics?: ts.Diagnostic[]
  ) {
    super(message);
    this.name = "CompilerError";
    Object.setPrototypeOf(this, CompilerError.prototype);
  }
}

/**
 * エラーファクトリー関数
 * @deprecated Use specific error classes directly
 */
export const createError = (type: string, message: string): Error => {
  switch (type) {
    case 'fs':
      return new FileSystemError(message, '', undefined);
    case 'compiler':
      return new CompilerError(message);
    default:
      return new Error(message);
  }
};
