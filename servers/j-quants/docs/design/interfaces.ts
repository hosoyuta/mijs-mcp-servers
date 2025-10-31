/**
 * J-Quants MCP Server TypeScript型定義
 *
 * このファイルは、J-Quants MCP Serverで使用する全ての型定義を含みます。
 * 要件定義書（j-quants-requirements.md）に基づいて定義されています。
 *
 * 信頼性レベル:
 * - 🔵 要件定義書に基づく確実な型定義
 * - 🟡 要件定義書から妥当な推測による型定義
 * - 🔴 既存資料にない推測による型定義
 */

// ============================================================================
// MCPツールの入力・出力型定義 🔵
// ============================================================================

/**
 * get_listed_companies の入力パラメータ
 * 要件根拠: REQ-101, REQ-501, REQ-502
 */
export interface GetListedCompaniesInput {
  /** 市場区分（オプション）: "プライム", "スタンダード", "グロース" */
  market?: string;
  /** 業種コード（オプション） */
  sector?: string;
}

/**
 * get_listed_companies の出力
 * 要件根拠: REQ-102
 */
export interface GetListedCompaniesOutput {
  companies: Company[];
}

/**
 * get_stock_price の入力パラメータ
 * 要件根拠: REQ-201, REQ-503, REQ-504
 */
export interface GetStockPriceInput {
  /** 銘柄コード（必須）: 例 "7203" */
  code: string;
  /** 取得開始日（オプション）: YYYY-MM-DD形式 */
  from_date?: string;
  /** 取得終了日（オプション）: YYYY-MM-DD形式 */
  to_date?: string;
}

/**
 * get_stock_price の出力
 * 要件根拠: REQ-202, REQ-203
 */
export interface GetStockPriceOutput {
  /** 銘柄コード */
  code: string;
  /** 株価データ（日付降順） */
  prices: StockPrice[];
}

/**
 * get_financial_statements の入力パラメータ
 * 要件根拠: REQ-301
 */
export interface GetFinancialStatementsInput {
  /** 銘柄コード（必須） */
  code: string;
  /** 財務諸表種別（オプション）: "BS", "PL", "CF", "ALL" */
  statement_type?: 'BS' | 'PL' | 'CF' | 'ALL';
}

/**
 * get_financial_statements の出力
 * 要件根拠: REQ-302
 */
export interface GetFinancialStatementsOutput {
  /** 銘柄コード */
  code: string;
  /** 会計年度 */
  fiscal_year: string;
  /** 貸借対照表 */
  balance_sheet: BalanceSheet;
  /** 損益計算書 */
  profit_loss: ProfitAndLoss;
  /** キャッシュフロー計算書 */
  cash_flow: CashFlow;
}

/**
 * get_company_info の入力パラメータ
 * 要件根拠: REQ-401
 */
export interface GetCompanyInfoInput {
  /** 銘柄コード（必須） */
  code: string;
}

/**
 * get_company_info の出力
 * 要件根拠: REQ-402
 */
export interface GetCompanyInfoOutput {
  /** 銘柄コード */
  code: string;
  /** 会社名 */
  name: string;
  /** 市場区分 */
  market: string;
  /** 業種 */
  sector: string;
  /** 最新株価情報 */
  latest_price: LatestPrice;
}

// ============================================================================
// エンティティ型定義 🔵
// ============================================================================

/**
 * 上場企業情報
 * 要件根拠: REQ-102
 */
export interface Company {
  /** 銘柄コード: 4桁の数字 */
  code: string;
  /** 会社名 */
  name: string;
  /** 市場区分: "プライム", "スタンダード", "グロース" */
  market: string;
  /** 業種名 */
  sector: string;
  /** 業種コード */
  sector_code: string;
}

/**
 * 株価データ（日次）
 * 要件根拠: REQ-202
 */
export interface StockPrice {
  /** 日付: YYYY-MM-DD形式 */
  date: string;
  /** 始値 */
  open: number;
  /** 高値 */
  high: number;
  /** 安値 */
  low: number;
  /** 終値 */
  close: number;
  /** 出来高 */
  volume: number;
}

/**
 * 最新株価情報
 * 要件根拠: REQ-402
 */
export interface LatestPrice {
  /** 日付 */
  date: string;
  /** 終値 */
  close: number;
  /** 前日比（差分） */
  change: string;
  /** 変動率（パーセント） */
  change_percent: string;
}

/**
 * 貸借対照表（Balance Sheet）
 * 要件根拠: REQ-302
 */
export interface BalanceSheet {
  /** 総資産（円） */
  total_assets: number;
  /** 総負債（円） */
  total_liabilities: number;
  /** 純資産（円） */
  net_assets: number;
}

/**
 * 損益計算書（Profit and Loss）
 * 要件根拠: REQ-302
 */
export interface ProfitAndLoss {
  /** 売上高（円） */
  revenue: number;
  /** 営業利益（円） */
  operating_income: number;
  /** 純利益（円） */
  net_income: number;
}

/**
 * キャッシュフロー計算書
 * 要件根拠: REQ-302
 */
export interface CashFlow {
  /** 営業活動によるキャッシュフロー（円） */
  operating_cf: number;
  /** 投資活動によるキャッシュフロー（円） */
  investing_cf: number;
  /** 財務活動によるキャッシュフロー（円） */
  financing_cf: number;
}

// ============================================================================
// J-Quants API レスポンス型定義 🟡
// ============================================================================

/**
 * J-Quants API 認証レスポンス
 * 要件根拠: REQ-002
 * 信頼性: 🟡 J-Quants API仕様から推測
 */
export interface JQuantsAuthResponse {
  /** IDトークン */
  idToken: string;
  /** リフレッシュトークン */
  refreshToken?: string;
}

/**
 * J-Quants API 上場銘柄情報レスポンス
 * 要件根拠: REQ-101
 * 信頼性: 🟡 J-Quants API仕様から推測
 */
export interface JQuantsListedInfoResponse {
  info: Array<{
    Code: string;
    CompanyName: string;
    Sector17Code: string;
    Sector17CodeName: string;
    MarketCode: string;
    MarketCodeName: string;
  }>;
}

/**
 * J-Quants API 株価データレスポンス
 * 要件根拠: REQ-201
 * 信頼性: 🟡 J-Quants API仕様から推測
 */
export interface JQuantsDailyQuotesResponse {
  daily_quotes: Array<{
    Code: string;
    Date: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
  }>;
}

/**
 * J-Quants API 財務情報レスポンス
 * 要件根拠: REQ-301
 * 信頼性: 🟡 J-Quants API仕様から推測
 */
export interface JQuantsFinancialStatementsResponse {
  statements: Array<{
    Code: string;
    FiscalYear: string;
    TotalAssets: number;
    TotalLiabilities: number;
    NetAssets: number;
    Revenue: number;
    OperatingIncome: number;
    NetIncome: number;
    OperatingCF: number;
    InvestingCF: number;
    FinancingCF: number;
  }>;
}

// ============================================================================
// 認証・トークン管理型定義 🔵
// ============================================================================

/**
 * トークンキャッシュ
 * 要件根拠: REQ-003
 */
export interface TokenCache {
  /** IDトークン */
  id_token: string;
  /** 取得日時（ISO 8601形式） */
  obtained_at: string;
  /** 有効期限（ISO 8601形式） */
  expires_at: string;
}

/**
 * 環境変数設定
 * 要件根拠: REQ-1101
 */
export interface EnvironmentConfig {
  /** J-Quants APIリフレッシュトークン */
  J_QUANTS_REFRESH_TOKEN: string;
  /** APIベースURL（オプション） */
  J_QUANTS_API_BASE_URL?: string;
  /** デバッグモード（オプション） */
  DEBUG?: string;
  /** ログレベル（オプション） */
  LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
}

// ============================================================================
// エラー型定義 🔵
// ============================================================================

/**
 * エラーコード列挙型
 * 要件根拠: REQ-601～REQ-605, REQ-701, EDGE-001～EDGE-302
 */
export enum ErrorCode {
  // バリデーションエラー
  MISSING_REQUIRED_PARAMETER = 'MISSING_REQUIRED_PARAMETER', // REQ-701
  INVALID_CODE = 'INVALID_CODE', // EDGE-001
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT', // EDGE-002
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE', // EDGE-102

  // 認証エラー
  MISSING_API_KEY = 'MISSING_API_KEY', // EDGE-003
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED', // REQ-001
  TOKEN_EXPIRED = 'TOKEN_EXPIRED', // REQ-604

  // API呼び出しエラー
  API_ERROR = 'API_ERROR', // REQ-602
  API_TIMEOUT = 'API_TIMEOUT', // REQ-603
  API_RATE_LIMIT = 'API_RATE_LIMIT', // REQ-605
  API_MAINTENANCE = 'API_MAINTENANCE', // EDGE-201
  NETWORK_ERROR = 'NETWORK_ERROR', // EDGE-202

  // データエラー
  INVALID_RESPONSE = 'INVALID_RESPONSE', // EDGE-301
  MISSING_DATA = 'MISSING_DATA', // EDGE-302
  DATA_OUT_OF_RANGE = 'DATA_OUT_OF_RANGE', // EDGE-101

  // その他
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * カスタムエラークラス用のインターフェース
 * 要件根拠: REQ-602, NFR-301
 */
export interface JQuantsError {
  /** エラーコード */
  code: ErrorCode;
  /** エラーメッセージ（日本語） */
  message: string;
  /** 元のエラー（オプション） */
  originalError?: Error;
  /** 追加情報（オプション） */
  details?: Record<string, unknown>;
  /** タイムスタンプ */
  timestamp: string;
}

// ============================================================================
// ログ型定義 🔵
// ============================================================================

/**
 * ログレベル
 * 要件根拠: REQ-602, REQ-901
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

/**
 * ログエントリ
 * 要件根拠: REQ-602
 */
export interface LogEntry {
  /** ログレベル */
  level: LogLevel;
  /** タイムスタンプ（ISO 8601形式） */
  timestamp: string;
  /** メッセージ */
  message: string;
  /** エラー情報（オプション） */
  error?: JQuantsError;
  /** 追加データ（オプション） */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// HTTP リクエスト・レスポンス型定義 🟡
// ============================================================================

/**
 * HTTPリクエストオプション
 * 要件根拠: REQ-004, REQ-603
 * 信頼性: 🟡 実装詳細から推測
 */
export interface HttpRequestOptions {
  /** HTTPメソッド */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** リクエストヘッダー */
  headers?: Record<string, string>;
  /** リクエストボディ */
  body?: string | object;
  /** タイムアウト（ミリ秒） */
  timeout?: number;
  /** リトライ回数 */
  retries?: number;
}

/**
 * HTTPレスポンス
 * 信頼性: 🟡 実装詳細から推測
 */
export interface HttpResponse<T = unknown> {
  /** ステータスコード */
  status: number;
  /** レスポンスヘッダー */
  headers: Record<string, string>;
  /** レスポンスボディ */
  data: T;
}

// ============================================================================
// MCP Protocol型定義 🔵
// ============================================================================

/**
 * MCPツール定義
 * 要件根拠: REQ-1002
 */
export interface MCPTool {
  /** ツール名 */
  name: string;
  /** ツールの説明（日本語） */
  description: string;
  /** 入力パラメータスキーマ */
  inputSchema: object;
  /** ツールの実行関数 */
  execute: (input: unknown) => Promise<unknown>;
}

/**
 * MCPツール実行結果
 * 要件根拠: REQ-101～REQ-401
 */
export interface MCPToolResult<T = unknown> {
  /** 実行成功フラグ */
  success: boolean;
  /** 結果データ */
  data?: T;
  /** エラー情報 */
  error?: JQuantsError;
}

// ============================================================================
// バリデーション型定義 🟡
// ============================================================================

/**
 * バリデーション結果
 * 要件根拠: REQ-701
 * 信頼性: 🟡 実装詳細から推測
 */
export interface ValidationResult {
  /** バリデーション成功フラグ */
  valid: boolean;
  /** エラーメッセージ（バリデーション失敗時） */
  errors?: string[];
}

/**
 * パラメータバリデータ型
 * 信頼性: 🟡 実装詳細から推測
 */
export type ParameterValidator<T> = (input: T) => ValidationResult;

// ============================================================================
// リトライ戦略型定義 🟡
// ============================================================================

/**
 * リトライ設定
 * 要件根拠: REQ-601, REQ-605
 * 信頼性: 🟡 実装詳細から推測
 */
export interface RetryConfig {
  /** 最大リトライ回数 */
  maxRetries: number;
  /** 初期待機時間（ミリ秒） */
  initialDelay: number;
  /** Exponential backoff係数 */
  backoffMultiplier: number;
  /** 最大待機時間（ミリ秒） */
  maxDelay: number;
  /** リトライ可能なエラーコード */
  retryableErrors: ErrorCode[];
}

// ============================================================================
// パフォーマンス監視型定義 🟡
// ============================================================================

/**
 * API呼び出しメトリクス
 * 要件根拠: REQ-902
 * 信頼性: 🟡 オプション要件から推測
 */
export interface ApiMetrics {
  /** APIエンドポイント */
  endpoint: string;
  /** リクエスト開始時刻 */
  startTime: number;
  /** リクエスト終了時刻 */
  endTime: number;
  /** レスポンスタイム（ミリ秒） */
  responseTime: number;
  /** ステータスコード */
  statusCode: number;
  /** 成功フラグ */
  success: boolean;
}

// ============================================================================
// 定数型定義 🔵
// ============================================================================

/**
 * APIエンドポイント定義
 * 要件根拠: J-Quants API仕様
 */
export const API_ENDPOINTS = {
  AUTH_USER: '/token/auth_user',
  AUTH_REFRESH: '/token/auth_refresh',
  LISTED_INFO: '/listed/info',
  DAILY_QUOTES: '/prices/daily_quotes',
  FINANCIAL_STATEMENTS: '/fins/statements',
  FINANCIAL_DETAILS: '/fins/fs_details',
  DIVIDEND: '/fins/dividend',
  TRADING_CALENDAR: '/markets/trading_calendar',
} as const;

/**
 * タイムアウト設定
 * 要件根拠: REQ-603, NFR-001
 */
export const TIMEOUTS = {
  /** APIリクエストタイムアウト（5秒） */
  API_REQUEST: 5000,
  /** 認証タイムアウト（10秒） */
  AUTHENTICATION: 10000,
} as const;

/**
 * リトライ設定デフォルト値
 * 要件根拠: REQ-601
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  retryableErrors: [
    ErrorCode.API_ERROR,
    ErrorCode.API_TIMEOUT,
    ErrorCode.NETWORK_ERROR,
  ],
};

// ============================================================================
// 型ガード関数 🟡
// ============================================================================

/**
 * 銘柄コードの型ガード
 * 信頼性: 🟡 実装詳細から推測
 */
export function isValidStockCode(code: unknown): code is string {
  return typeof code === 'string' && /^\d{4}$/.test(code);
}

/**
 * 日付フォーマットの型ガード
 * 信頼性: 🟡 実装詳細から推測
 */
export function isValidDateFormat(date: unknown): date is string {
  return (
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
  );
}

/**
 * エラーコードの型ガード
 * 信頼性: 🟡 実装詳細から推測
 */
export function isJQuantsError(error: unknown): error is JQuantsError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

// ============================================================================
// エクスポート
// ============================================================================

export type {
  // MCPツール型
  GetListedCompaniesInput,
  GetListedCompaniesOutput,
  GetStockPriceInput,
  GetStockPriceOutput,
  GetFinancialStatementsInput,
  GetFinancialStatementsOutput,
  GetCompanyInfoInput,
  GetCompanyInfoOutput,

  // エンティティ型
  Company,
  StockPrice,
  LatestPrice,
  BalanceSheet,
  ProfitAndLoss,
  CashFlow,

  // J-Quants API型
  JQuantsAuthResponse,
  JQuantsListedInfoResponse,
  JQuantsDailyQuotesResponse,
  JQuantsFinancialStatementsResponse,

  // 認証型
  TokenCache,
  EnvironmentConfig,

  // エラー型
  JQuantsError,

  // ログ型
  LogEntry,

  // HTTP型
  HttpRequestOptions,
  HttpResponse,

  // MCP型
  MCPTool,
  MCPToolResult,

  // バリデーション型
  ValidationResult,
  ParameterValidator,

  // リトライ型
  RetryConfig,

  // パフォーマンス型
  ApiMetrics,
};

export {
  ErrorCode,
  LogLevel,
  API_ENDPOINTS,
  TIMEOUTS,
  DEFAULT_RETRY_CONFIG,
  isValidStockCode,
  isValidDateFormat,
  isJQuantsError,
};
