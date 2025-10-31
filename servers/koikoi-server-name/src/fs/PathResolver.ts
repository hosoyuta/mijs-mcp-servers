import { resolve, relative, normalize, sep } from "path";
import { glob } from "glob";
import { ResolvedPath } from "../types/fs";
import { WorkspaceBoundaryError } from "../utils/errors";

/**
 * Default exclude patterns for file matching
 */
const DEFAULT_EXCLUDE_PATTERNS = [
  "node_modules/**",
  "dist/**",
  ".git/**",
  "**/*.map",
  "**/.DS_Store",
] as const;

/**
 * Path resolver class
 * Provides path resolution, workspace boundary checking, and glob pattern matching
 */
export class PathResolver {
  private readonly workspaceRoot: string;

  /**
   * Creates a PathResolver instance
   *
   * @param workspaceRoot - Workspace root path
   *
   * @example
   * ```typescript
   * const resolver = new PathResolver('./my-project');
   * ```
   */
  constructor(workspaceRoot: string) {
    this.workspaceRoot = normalize(resolve(workspaceRoot));
  }

  /**
   * Resolves a path and validates workspace boundary
   *
   * @param filePath - Path to resolve (relative or absolute)
   * @returns Resolved path information
   * @throws WorkspaceBoundaryError if path is outside workspace
   *
   * @example
   * ```typescript
   * const resolver = new PathResolver('./my-project');
   * const resolved = resolver.resolve('./src/index.ts');
   * console.log(resolved.absolutePath);
   * console.log(resolved.relativePath);
   * ```
   */
  resolve(filePath: string): ResolvedPath {
    const absolutePath = this.toAbsolutePath(filePath);

    if (!this.isWithinWorkspace(absolutePath)) {
      throw new WorkspaceBoundaryError(absolutePath, this.workspaceRoot);
    }

    const relativePath = this.toRelativePath(absolutePath);

    return {
      absolutePath,
      relativePath,
      isWithinWorkspace: true,
    };
  }

  /**
   * Matches files using glob patterns
   *
   * @param patterns - Array of glob patterns (e.g., `["src/**\/*.ts", "tests/**\/*.test.ts"]`)
   * @param excludePatterns - Array of exclude patterns (default: node_modules, dist, etc.)
   * @returns Array of matched file paths (relative paths)
   *
   * @example
   * ```typescript
   * const resolver = new PathResolver('./my-project');
   * const files = await resolver.matchFiles(['src/**\/*.ts']);
   * ```
   */
  async matchFiles(
    patterns: string[],
    excludePatterns: string[] = [...DEFAULT_EXCLUDE_PATTERNS]
  ): Promise<string[]> {
    if (patterns.length === 0) {
      return [];
    }

    const matchedFiles = new Set<string>();

    for (const pattern of patterns) {
      try {
        const matched = await glob(pattern, {
          cwd: this.workspaceRoot,
          ignore: excludePatterns,
          nodir: true,
          dot: false,
        });

        matched.forEach((file) => matchedFiles.add(this.normalizePath(file)));
      } catch (error) {
        // Silently skip patterns that cause errors
        console.error(`Pattern matching error for "${pattern}":`, error);
      }
    }

    return Array.from(matchedFiles).sort();
  }

  /**
   * Gets the workspace root path
   *
   * @returns Normalized workspace root path
   */
  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  /**
   * Converts a relative or absolute path to an absolute path
   *
   * @param filePath - Path to convert
   * @returns Normalized absolute path
   */
  private toAbsolutePath(filePath: string): string {
    return normalize(resolve(this.workspaceRoot, filePath));
  }

  /**
   * Converts an absolute path to a relative path (cross-platform compatible)
   *
   * @param absolutePath - Absolute path
   * @returns Normalized relative path (always uses forward slashes)
   */
  private toRelativePath(absolutePath: string): string {
    return relative(this.workspaceRoot, absolutePath).replace(/\\/g, "/");
  }

  /**
   * Checks if a path is within the workspace
   *
   * @param absolutePath - Absolute path to check
   * @returns True if path is within workspace
   */
  private isWithinWorkspace(absolutePath: string): boolean {
    const normalizedPath = normalize(absolutePath);
    const normalizedWorkspace = normalize(this.workspaceRoot);

    const workspaceWithSep = normalizedWorkspace.endsWith(sep)
      ? normalizedWorkspace
      : normalizedWorkspace + sep;

    return (
      normalizedPath === normalizedWorkspace ||
      normalizedPath.startsWith(workspaceWithSep)
    );
  }

  /**
   * Normalizes a path (always uses forward slashes)
   *
   * @param path - Path to normalize
   * @returns Normalized path
   */
  private normalizePath(path: string): string {
    return path.replace(/\\/g, "/");
  }
}

export default PathResolver;
