/**
 * ProgramManager - TypeScript Program Manager
 * Programインスタンスの再利用とキャッシュ管理を行うクラス
 */

import * as ts from "typescript";
import { CompilerHost } from "./CompilerHost";
import { CompilerConfig } from "../types/compiler";

/**
 * TypeScript Program Manager
 * Programインスタンスの再利用とキャッシュ管理
 */
export class ProgramManager {
  private readonly compilerHost: CompilerHost;
  private readonly programCache: Map<string, ts.Program>;
  private readonly maxCacheSize: number;

  /**
   * ProgramManagerを構築
   * @param config - Compiler設定
   * @param maxCacheSize - 最大キャッシュサイズ (デフォルト: 100)
   */
  constructor(config: CompilerConfig, maxCacheSize: number = 100) {
    this.compilerHost = new CompilerHost(config);
    this.programCache = new Map();
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Programを取得 (キャッシュから再利用)
   * @param fileNames - 解析するファイル一覧
   * @returns ts.Program
   */
  getProgram(fileNames: string[]): ts.Program {
    const cacheKey = this.getCacheKey(fileNames);

    if (this.programCache.has(cacheKey)) {
      // キャッシュヒット: LRU実装のため、一度削除して再追加
      const program = this.programCache.get(cacheKey)!;
      this.programCache.delete(cacheKey);
      this.programCache.set(cacheKey, program);
      return program;
    }

    // キャッシュミス: 新規作成
    const program = this.compilerHost.createProgram(fileNames);

    // LRU: サイズ超過時は最も古いエントリを削除
    if (this.programCache.size >= this.maxCacheSize) {
      const firstKey = this.programCache.keys().next().value;
      if (firstKey) {
        this.programCache.delete(firstKey);
      }
    }

    this.programCache.set(cacheKey, program);

    return program;
  }

  /**
   * TypeCheckerを取得
   * @param fileNames - 解析するファイル一覧
   * @returns ts.TypeChecker
   */
  getTypeChecker(fileNames: string[]): ts.TypeChecker {
    const program = this.getProgram(fileNames);
    return program.getTypeChecker();
  }

  /**
   * SourceFileを取得
   * @param fileName - ファイル名
   * @returns ts.SourceFile | undefined
   */
  getSourceFile(fileName: string): ts.SourceFile | undefined {
    const program = this.getProgram([fileName]);

    // TypeScript Programは正規化されたファイル名を使用するため、
    // ファイルパスの正規化を行って検索
    const sourceFiles = program.getSourceFiles();
    const normalizedFileName = fileName.replace(/\\/g, "/");

    return sourceFiles.find(sf => {
      const normalizedSourceFileName = sf.fileName.replace(/\\/g, "/");
      return normalizedSourceFileName.includes(normalizedFileName) ||
             normalizedFileName.includes(normalizedSourceFileName) ||
             normalizedSourceFileName.endsWith(normalizedFileName.split("/").pop() || "");
    });
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.programCache.clear();
  }

  /**
   * キャッシュキーを生成
   * @param fileNames - ファイル名の配列
   * @returns キャッシュキー
   */
  private getCacheKey(fileNames: string[]): string {
    // ファイル名をソートして一貫性を保つ
    // 配列のsort()は元の配列を変更するため、コピーを作成
    return [...fileNames].sort().join("|");
  }
}

export default ProgramManager;
