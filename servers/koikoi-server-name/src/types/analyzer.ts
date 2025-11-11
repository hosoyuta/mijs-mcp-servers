/**
 * Analyzer type definitions
 * Structures for code analysis results
 */

import * as ts from "typescript";

/**
 * ソースコード内の位置 (行と列)
 */
export interface Position {
  /** 行番号 (1-indexed) */
  line: number;

  /** 列番号 (1-indexed) */
  column: number;

  /** オフセット (0-indexed) */
  offset?: number;
}

/**
 * ソースコード内の位置情報
 */
export interface Location {
  /** ファイルパス */
  file: string;

  /** 開始位置 */
  start: Position;

  /** 終了位置 */
  end: Position;
}

/**
 * 関数情報（基本構造のみ、TASK-0202で詳細化）
 */
export interface FunctionInfo {
  /** 関数名 */
  name: string;

  /** 位置情報 */
  location: Location;

  /** エクスポートされているか */
  exported: boolean;
}

/**
 * クラス情報（基本構造のみ、TASK-0203で詳細化）
 */
export interface ClassInfo {
  /** クラス名 */
  name: string;

  /** 位置情報 */
  location: Location;

  /** エクスポートされているか */
  exported: boolean;
}

/**
 * 解析エラー
 */
export interface ParseError {
  /** エラーコード */
  code: string;

  /** エラーメッセージ */
  message: string;

  /** エラーの重大度 */
  severity: "error" | "warning" | "info";

  /** 位置情報 */
  location?: Location;
}

/**
 * Analyzer設定
 */
export interface AnalyzerConfig {
  /** 詳細モードか */
  detailedMode: boolean;

  /** タイムアウト (ms) */
  timeout: number;

  /** エラー時の動作（throw or return partial） */
  errorHandling: "throw" | "partial";
}

/**
 * 構造解析結果
 */
export interface StructureAnalysisResult {
  /** 解析対象ファイルパス */
  filePath: string;

  /** 解析実行日時 (Unix timestamp) */
  timestamp: number;

  /** 解析が完全に成功したか */
  success: boolean;

  /** 抽出された関数一覧 */
  functions: FunctionInfo[];

  /** 抽出されたクラス一覧 */
  classes: ClassInfo[];

  /** 解析エラー（あれば） */
  errors?: ParseError[];
}
