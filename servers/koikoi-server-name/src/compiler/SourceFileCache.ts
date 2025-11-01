/**
 * SourceFileCache - TypeScript SourceFile Cache Manager
 * mtimeベースのキャッシュ無効化とLRUキャッシュを実装
 */

import * as ts from "typescript";
import { stat } from "fs/promises";

/**
 * Cache Entry Interface
 */
interface CacheEntry {
  sourceFile: ts.SourceFile;
  mtime: number;
}

/**
 * SourceFile Cache Manager
 * mtimeベースのキャッシュ無効化とLRUキャッシュ管理
 */
export class SourceFileCache {
  private readonly cache: Map<string, CacheEntry>;
  private readonly maxSize: number;

  /**
   * SourceFileCacheを構築
   * @param maxSize - 最大キャッシュサイズ (デフォルト: 100)
   */
  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * SourceFileを取得 (キャッシュから)
   * mtimeが一致すればキャッシュを返し、異なれば再作成
   * @param filePath - ファイルパス
   * @returns ts.SourceFile
   */
  async get(filePath: string): Promise<ts.SourceFile> {
    // ファイルのmtimeを取得
    const stats = await stat(filePath);
    const mtime = stats.mtime.getTime();

    const cached = this.cache.get(filePath);

    // キャッシュヒット & mtime一致
    if (cached && cached.mtime === mtime) {
      // LRU実装のため、一度削除して再追加
      this.cache.delete(filePath);
      this.cache.set(filePath, cached);
      return cached.sourceFile;
    }

    // キャッシュミスまたはmtime不一致 → 新規作成
    const content = await Bun.file(filePath).text();
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true // setParentNodes
    );

    this.set(filePath, sourceFile, mtime);
    return sourceFile;
  }

  /**
   * キャッシュに保存
   * LRU: サイズ超過時は最も古いエントリを削除
   * @param filePath - ファイルパス
   * @param sourceFile - SourceFile
   * @param mtime - ファイル更新時刻
   */
  private set(filePath: string, sourceFile: ts.SourceFile, mtime: number): void {
    // LRU: サイズ超過時は最も古いエントリを削除
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(filePath, { sourceFile, mtime });
  }

  /**
   * キャッシュを無効化 (特定ファイル)
   * @param filePath - ファイルパス
   */
  async invalidate(filePath: string): Promise<void> {
    this.cache.delete(filePath);
  }

  /**
   * 全キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * キャッシュサイズを取得 (テスト用)
   * @returns キャッシュエントリ数
   */
  size(): number {
    return this.cache.size;
  }
}

export default SourceFileCache;
