/**
 * File System type definitions
 */

/**
 * ファイルメタデータ
 */
export interface FileMetadata {
  /** 絶対パス */
  path: string;
  /** バイトサイズ */
  size: number;
  /** 最終更新日時 */
  mtime: Date;
  /** 行数 */
  lines: number;
  /** エンコーディング */
  encoding: string;
}

/**
 * ファイル読み込み結果
 */
export interface FileReadResult {
  /** ファイルの内容 */
  content: string;
  /** ファイルのメタデータ */
  metadata: FileMetadata;
}

/**
 * ワークスペース情報
 */
export interface WorkspaceInfo {
  /** ワークスペースルート */
  rootPath: string;
  /** 除外パターン */
  excludePatterns?: string[];
}

/**
 * パス解決結果
 */
export interface ResolvedPath {
  /** 絶対パス */
  absolutePath: string;
  /** 相対パス */
  relativePath: string;
  /** ワークスペース内かどうか */
  isWithinWorkspace: boolean;
}

/**
 * ファイルシステムオプション
 * @deprecated Use FileMetadata instead
 */
export interface FileSystemOptions {
  encoding?: string;
  basePath?: string;
}

/**
 * ファイル情報
 * @deprecated Use FileReadResult instead
 */
export interface FileInfo {
  path: string;
  content: string;
  size: number;
}

/**
 * ファイルパス型
 */
export type FilePath = string;
