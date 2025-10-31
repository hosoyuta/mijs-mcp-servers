/**
 * コード解析MCP TypeScript インターフェース定義
 *
 * このファイルは、コード解析MCPサーバーで使用される全ての型定義を含みます。
 * 実装時は、このファイルを src/types/ ディレクトリにコピーして使用してください。
 *
 * @version 1.0.0
 * @date 2025-10-29
 */

// ============================================================================
// 基本型定義
// ============================================================================

/**
 * 解析モード
 * - concise: 簡潔モード（シグネチャのみ、90%削減）
 * - detailed: 詳細モード（実装の一部含む、70%削減）
 */
export type AnalysisMode = "concise" | "detailed";

/**
 * シンボルの種類
 */
export type SymbolType = "function" | "class" | "interface" | "type" | "enum" | "variable" | "property" | "method";

/**
 * マッチングタイプ
 */
export type MatchType = "exact" | "prefix" | "suffix" | "contains";

/**
 * アクセス修飾子
 */
export type AccessModifier = "public" | "private" | "protected";

/**
 * 依存関係の種類
 */
export type DependencyType = "external" | "internal";

// ============================================================================
// ファイル解析関連
// ============================================================================

/**
 * ファイル解析結果
 * analyze_file ツールの出力型
 */
export interface FileAnalysis {
  /** 解析が成功したか */
  success: boolean;

  /** 部分的な成功か（一部エラーあり） */
  partial: boolean;

  /** ファイルのメタデータ */
  file: FileMeta;

  /** ファイルの要約 */
  summary: string;

  /** エクスポートされた関数/クラス */
  exports: Export[];

  /** インポート文の一覧 */
  imports: Import[];

  /** 関数一覧 */
  functions: Function[];

  /** クラス一覧 */
  classes: Class[];

  /** 型定義一覧 (interface, type) */
  types: TypeDefinition[];

  /** Enum定義一覧 */
  enums: EnumDefinition[];

  /** 解析エラー（あれば） */
  errors?: ParseError[];

  /** フォールバック情報（解析失敗時の最小限の情報） */
  fallback?: FallbackInfo;
}

/**
 * ファイルのメタデータ
 */
export interface FileMeta {
  /** ファイルパス */
  path: string;

  /** ファイルサイズ (bytes) */
  size: number;

  /** 行数 */
  lines: number;

  /** 更新日時 (Unix timestamp) */
  mtime: number;

  /** 文字エンコーディング */
  encoding?: string;
}

/**
 * フォールバック情報
 * 解析に失敗した場合でも最低限返す情報
 */
export interface FallbackInfo {
  /** ファイルサイズ */
  size: number;

  /** 行数 */
  lines: number;

  /** ファイル拡張子 */
  extension: string;

  /** ファイル種別の推測 */
  inferredType?: string;
}

// ============================================================================
// 関数関連
// ============================================================================

/**
 * 関数情報
 */
export interface Function {
  /** 関数名 */
  name: string;

  /** エクスポートされているか */
  exported: boolean;

  /** 非同期関数か */
  async: boolean;

  /** ジェネレータ関数か */
  generator: boolean;

  /** 引数一覧 */
  parameters: Parameter[];

  /** 戻り値の型 */
  returnType: string;

  /** ジェネリック型パラメータ */
  typeParameters?: TypeParameter[];

  /** JSDocドキュメント */
  documentation?: Documentation;

  /** 位置情報 */
  location: Location;

  /** 関数本体（詳細モードのみ） */
  body?: string;

  /** 複雑度（詳細モードのみ） */
  complexity?: number;
}

/**
 * 関数の引数
 */
export interface Parameter {
  /** 引数名 */
  name: string;

  /** 型 */
  type: string;

  /** オプショナルか */
  optional: boolean;

  /** デフォルト値 */
  defaultValue?: string;

  /** Rest parameter か */
  rest: boolean;
}

/**
 * ジェネリック型パラメータ
 */
export interface TypeParameter {
  /** 型パラメータ名 (例: T, K, V) */
  name: string;

  /** 制約 (例: extends string) */
  constraint?: string;

  /** デフォルト型 */
  default?: string;
}

// ============================================================================
// クラス関連
// ============================================================================

/**
 * クラス情報
 */
export interface Class {
  /** クラス名 */
  name: string;

  /** エクスポートされているか */
  exported: boolean;

  /** 抽象クラスか */
  abstract: boolean;

  /** 継承元クラス */
  extends?: string;

  /** 実装インターフェース */
  implements: string[];

  /** ジェネリック型パラメータ */
  typeParameters?: TypeParameter[];

  /** プロパティ一覧 */
  properties: Property[];

  /** メソッド一覧 */
  methods: Method[];

  /** コンストラクタ */
  constructor?: Constructor;

  /** JSDocドキュメント */
  documentation?: Documentation;

  /** 位置情報 */
  location: Location;
}

/**
 * クラスのプロパティ
 */
export interface Property {
  /** プロパティ名 */
  name: string;

  /** 型 */
  type: string;

  /** アクセス修飾子 */
  accessModifier: AccessModifier;

  /** staticか */
  static: boolean;

  /** readonlyか */
  readonly: boolean;

  /** オプショナルか */
  optional: boolean;

  /** 初期値 */
  initializer?: string;

  /** JSDocドキュメント */
  documentation?: Documentation;

  /** 位置情報 */
  location: Location;
}

/**
 * クラスのメソッド
 */
export interface Method {
  /** メソッド名 */
  name: string;

  /** アクセス修飾子 */
  accessModifier: AccessModifier;

  /** staticか */
  static: boolean;

  /** 抽象メソッドか */
  abstract: boolean;

  /** 非同期メソッドか */
  async: boolean;

  /** 引数一覧 */
  parameters: Parameter[];

  /** 戻り値の型 */
  returnType: string;

  /** ジェネリック型パラメータ */
  typeParameters?: TypeParameter[];

  /** JSDocドキュメント */
  documentation?: Documentation;

  /** 位置情報 */
  location: Location;

  /** メソッド本体（詳細モードのみ） */
  body?: string;
}

/**
 * コンストラクタ
 */
export interface Constructor {
  /** アクセス修飾子 */
  accessModifier: AccessModifier;

  /** 引数一覧 */
  parameters: Parameter[];

  /** JSDocドキュメント */
  documentation?: Documentation;

  /** 位置情報 */
  location: Location;

  /** コンストラクタ本体（詳細モードのみ） */
  body?: string;
}

// ============================================================================
// 型定義関連
// ============================================================================

/**
 * 型定義 (interface, type)
 */
export interface TypeDefinition {
  /** 型名 */
  name: string;

  /** 型の種類 (interface or type) */
  kind: "interface" | "type";

  /** エクスポートされているか */
  exported: boolean;

  /** ジェネリック型パラメータ */
  typeParameters?: TypeParameter[];

  /** 継承元インターフェース (interfaceの場合) */
  extends?: string[];

  /** プロパティ一覧 */
  properties: TypeProperty[];

  /** 型エイリアスの定義 (typeの場合) */
  definition?: string;

  /** JSDocドキュメント */
  documentation?: Documentation;

  /** 位置情報 */
  location: Location;
}

/**
 * 型のプロパティ
 */
export interface TypeProperty {
  /** プロパティ名 */
  name: string;

  /** 型 */
  type: string;

  /** オプショナルか */
  optional: boolean;

  /** readonlyか */
  readonly: boolean;

  /** JSDocドキュメント */
  documentation?: Documentation;
}

/**
 * Enum定義
 */
export interface EnumDefinition {
  /** Enum名 */
  name: string;

  /** エクスポートされているか */
  exported: boolean;

  /** const enumか */
  const: boolean;

  /** メンバー一覧 */
  members: EnumMember[];

  /** JSDocドキュメント */
  documentation?: Documentation;

  /** 位置情報 */
  location: Location;
}

/**
 * Enumのメンバー
 */
export interface EnumMember {
  /** メンバー名 */
  name: string;

  /** 値 */
  value?: string | number;

  /** JSDocドキュメント */
  documentation?: Documentation;
}

// ============================================================================
// インポート/エクスポート関連
// ============================================================================

/**
 * インポート情報
 */
export interface Import {
  /** インポート元 (例: "react", "./types/User") */
  source: string;

  /** 依存関係の種類 (external or internal) */
  type: DependencyType;

  /** インポートされたシンボル一覧 */
  imported: ImportedSymbol[];

  /** デフォルトインポートか */
  default: boolean;

  /** 名前空間インポートか (import * as X) */
  namespace: boolean;

  /** 型のみのインポートか (import type) */
  typeOnly: boolean;

  /** 動的インポートか (import()) */
  dynamic: boolean;

  /** 位置情報 */
  location: Location;
}

/**
 * インポートされたシンボル
 */
export interface ImportedSymbol {
  /** インポート名 */
  name: string;

  /** エイリアス (as で指定された場合) */
  alias?: string;
}

/**
 * エクスポート情報
 */
export interface Export {
  /** エクスポートされたシンボル名 */
  name: string;

  /** シンボルの種類 */
  type: SymbolType;

  /** デフォルトエクスポートか */
  default: boolean;

  /** Re-exportか (export { ... } from) */
  reExport: boolean;

  /** Re-export元 (re-exportの場合) */
  source?: string;

  /** 位置情報 */
  location: Location;
}

// ============================================================================
// ドキュメント関連
// ============================================================================

/**
 * ドキュメント (JSDoc)
 */
export interface Documentation {
  /** 概要 */
  summary: string;

  /** 詳細説明 */
  description?: string;

  /** @param タグ */
  params?: ParamDoc[];

  /** @returns タグ */
  returns?: string;

  /** @throws タグ */
  throws?: string[];

  /** @example タグ */
  examples?: string[];

  /** @deprecated タグ */
  deprecated?: string;

  /** @see タグ */
  see?: string[];

  /** その他のタグ */
  tags?: Record<string, string>;
}

/**
 * @param のドキュメント
 */
export interface ParamDoc {
  /** 引数名 */
  name: string;

  /** 説明 */
  description: string;
}

// ============================================================================
// シンボル検索関連
// ============================================================================

/**
 * シンボル検索結果
 * search_symbol ツールの出力型
 */
export interface SymbolSearchResult {
  /** 検索結果の配列 */
  results: SymbolMatch[];

  /** 検索にかかった時間 (ms) */
  searchTime: number;

  /** 検索対象ファイル数 */
  filesScanned: number;
}

/**
 * マッチしたシンボル
 */
export interface SymbolMatch {
  /** シンボル名 */
  symbol: string;

  /** シンボルの種類 */
  type: SymbolType;

  /** ファイルパス */
  file: string;

  /** 行番号 */
  line: number;

  /** 列番号 */
  column: number;

  /** シグネチャ（関数/メソッドの場合） */
  signature?: string;

  /** エクスポートされているか */
  exported?: boolean;

  /** コンテキスト（前後数行） */
  context?: string;
}

// ============================================================================
// プロジェクト解析関連
// ============================================================================

/**
 * プロジェクト解析結果
 * analyze_project ツールの出力型
 */
export interface ProjectAnalysis {
  /** プロジェクトのメタデータ */
  project: ProjectMeta;

  /** プロジェクト全体の要約 */
  summary: string;

  /** ディレクトリ構造 */
  structure: FileNode[];

  /** 依存関係 */
  dependencies: ProjectDependencies;

  /** エクスポート一覧 (ファイル別) */
  exports: Record<string, Export[]>;

  /** 統計情報 */
  statistics: ProjectStatistics;
}

/**
 * プロジェクトのメタデータ
 */
export interface ProjectMeta {
  /** プロジェクトルートパス */
  rootPath: string;

  /** 総ファイル数 */
  totalFiles: number;

  /** 総行数 */
  totalLines: number;

  /** 解析日時 */
  analyzedAt: number;
}

/**
 * ディレクトリ/ファイルノード
 */
export interface FileNode {
  /** ファイル/ディレクトリ名 */
  name: string;

  /** パス */
  path: string;

  /** 種類 (file or directory) */
  type: "file" | "directory";

  /** 子ノード (directoryの場合) */
  children?: FileNode[];

  /** ファイルサイズ (fileの場合) */
  size?: number;

  /** 行数 (fileの場合) */
  lines?: number;
}

/**
 * プロジェクトの依存関係
 */
export interface ProjectDependencies {
  /** 外部ライブラリ */
  external: string[];

  /** 内部モジュール */
  internal: string[];

  /** 依存関係グラフ */
  graph?: DependencyGraph;
}

/**
 * プロジェクトの統計情報
 */
export interface ProjectStatistics {
  /** 総関数数 */
  totalFunctions: number;

  /** 総クラス数 */
  totalClasses: number;

  /** 総インターフェース数 */
  totalInterfaces: number;

  /** 総型エイリアス数 */
  totalTypes: number;

  /** 総Enum数 */
  totalEnums: number;

  /** 言語別ファイル数 */
  filesByLanguage: Record<string, number>;

  /** 平均ファイルサイズ */
  averageFileSize: number;

  /** 平均行数 */
  averageLines: number;
}

// ============================================================================
// 依存関係解析関連
// ============================================================================

/**
 * 依存関係グラフ
 * get_dependencies ツールの出力型
 */
export interface DependencyGraph {
  /** 対象ファイル */
  file: string;

  /** インポート一覧 */
  imports: DependencyNode[];

  /** このファイルに依存しているファイル (逆引き) */
  dependents?: string[];

  /** 循環依存の警告 */
  circularDependencies?: CircularDependency[];

  /** 依存グラフの深さ */
  depth: number;
}

/**
 * 依存ノード
 */
export interface DependencyNode {
  /** インポート元 */
  source: string;

  /** 依存関係の種類 */
  type: DependencyType;

  /** インポートされたシンボル */
  imported: string[];

  /** 解決されたファイルパス (internalの場合) */
  resolvedPath?: string;

  /** さらなる依存 (depth > 1 の場合) */
  dependencies?: DependencyNode[];
}

/**
 * 循環依存
 */
export interface CircularDependency {
  /** 循環依存のパス */
  cycle: string[];

  /** 警告メッセージ */
  message: string;
}

// ============================================================================
// エラー関連
// ============================================================================

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

  /** スタックトレース（詳細モードのみ） */
  stack?: string;
}

// ============================================================================
// ユーティリティ型
// ============================================================================

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
 * 位置 (行と列)
 */
export interface Position {
  /** 行番号 (1-indexed) */
  line: number;

  /** 列番号 (1-indexed) */
  column: number;

  /** オフセット (0-indexed) */
  offset?: number;
}

// ============================================================================
// ツール入力パラメータ
// ============================================================================

/**
 * analyze_file ツールの入力
 */
export interface AnalyzeFileInput {
  /** ファイルパス */
  path: string;

  /** 解析モード */
  mode?: AnalysisMode;

  /** 含める情報 (例: ["structure", "types", "docs"]) */
  include?: string[];
}

/**
 * search_symbol ツールの入力
 */
export interface SearchSymbolInput {
  /** 検索するシンボル名 */
  symbol: string;

  /** シンボルの種類でフィルタ */
  type?: SymbolType | "all";

  /** マッチングタイプ */
  matchType?: MatchType;
}

/**
 * analyze_project ツールの入力
 */
export interface AnalyzeProjectInput {
  /** プロジェクトルートパス */
  rootPath: string;

  /** 含めるファイルパターン */
  includePatterns?: string[];

  /** 除外するパターン */
  excludePatterns?: string[];

  /** 解析モード */
  mode?: AnalysisMode;
}

/**
 * get_dependencies ツールの入力
 */
export interface GetDependenciesInput {
  /** ファイルパス */
  path: string;

  /** 依存関係の深さ */
  depth?: number;
}

// ============================================================================
// キャッシュ関連
// ============================================================================

/**
 * キャッシュエントリ
 */
export interface CacheEntry<T> {
  /** キャッシュキー */
  key: string;

  /** データ */
  data: T;

  /** ファイルメタデータ */
  meta: FileMeta;

  /** キャッシュ作成日時 */
  createdAt: number;

  /** 最終アクセス日時 */
  lastAccessedAt: number;

  /** アクセスカウント */
  accessCount: number;
}

/**
 * キャッシュマネージャーの設定
 */
export interface CacheConfig {
  /** 最大エントリ数 */
  maxEntries: number;

  /** 最大メモリ使用量 (bytes) */
  maxMemory: number;

  /** TTL (ミリ秒, 0 = 無期限) */
  ttl: number;

  /** LRU方式を使用するか */
  useLRU: boolean;
}

// ============================================================================
// 設定関連
// ============================================================================

/**
 * 解析設定
 */
export interface AnalysisConfig {
  /** TypeScript Compiler Options */
  compilerOptions: {
    target: string;
    module: string;
    strict: boolean;
    jsx?: string;
  };

  /** 並行処理の最大数 */
  maxConcurrency: number;

  /** タイムアウト (ms) */
  timeout: number;

  /** キャッシュ設定 */
  cache: CacheConfig;

  /** ワークスペースルートパス */
  workspaceRoot: string;

  /** 除外パターン */
  excludePatterns: string[];
}

// ============================================================================
// MCP関連
// ============================================================================

/**
 * MCPツールのレスポンス
 */
export interface MCPToolResponse<T> {
  /** コンテンツ */
  content: Array<{
    type: "text";
    text: string;
  }>;

  /** メタデータ */
  _meta?: {
    /** 実行時間 (ms) */
    executionTime: number;

    /** キャッシュヒットしたか */
    cacheHit: boolean;
  };
}

/**
 * MCPエラーレスポンス
 */
export interface MCPErrorResponse {
  /** エラーコード */
  code: number;

  /** エラーメッセージ */
  message: string;

  /** エラー詳細 */
  data?: any;
}
