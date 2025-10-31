import { stat } from "fs/promises";

/**
 * Workspace validator class
 * Provides workspace validation and file existence checks
 */
export class WorkspaceValidator {
  constructor() {
    // No initialization required
  }

  /**
   * Validates if the workspace path is a valid directory
   *
   * @param path - Workspace path to validate
   * @returns True if path exists and is a directory
   *
   * @example
   * ```typescript
   * const validator = new WorkspaceValidator();
   * const isValid = await validator.validateWorkspace('./my-project');
   * ```
   */
  async validateWorkspace(path: string): Promise<boolean> {
    return this.directoryExists(path);
  }

  /**
   * Checks if a file exists at the given path
   *
   * @param path - File path to check
   * @returns True if file exists
   *
   * @example
   * ```typescript
   * const validator = new WorkspaceValidator();
   * const exists = await validator.fileExists('./src/index.ts');
   * ```
   */
  async fileExists(path: string): Promise<boolean> {
    return this.pathExists(path);
  }

  /**
   * Checks if a directory exists at the given path
   *
   * @param path - Directory path to check
   * @returns True if path exists and is a directory
   *
   * @example
   * ```typescript
   * const validator = new WorkspaceValidator();
   * const exists = await validator.directoryExists('./src');
   * ```
   */
  async directoryExists(path: string): Promise<boolean> {
    try {
      const stats = await stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Checks if a path exists (file or directory)
   *
   * @param path - Path to check
   * @returns True if path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }
}

export default WorkspaceValidator;
