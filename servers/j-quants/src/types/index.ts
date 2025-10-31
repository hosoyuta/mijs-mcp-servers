/**
 * J-Quants MCP Server - TypeScript型定義
 *
 * 【作成日】: 2025-10-29
 * 【タスクID】: TASK-0002
 * 【目的】: J-Quants MCP Serverで使用する全ての型定義を集約
 * 【要件根拠】: REQ-102, REQ-202, REQ-302, REQ-402
 */

// =========================================
// 1. 基本インターフェース定義（20+種類）
// =========================================

/**
 * 銘柄情報インターフェース
 *
 * 【用途】: J-Quants APIから取得した銘柄マスタデータ
 * 【API エンドポイント】: GET /listed/info
 */
export interface Company {
  /** 銘柄コード（4桁数字） */
  code: string;
  /** 銘柄名 */
  name: string;
  /** 市場区分 */
  market: Market;
  /** 業種コード */
  sector: Sector;
  /** 上場日（YYYY-MM-DD形式） */
  listed_date?: string;
  /** 企業規模（大型株/中型株/小型株） */
  scale?: 'large' | 'mid' | 'small';
}

/**
 * 株価データインターフェース
 *
 * 【用途】: 日次株価データ（OHLCV）
 * 【API エンドポイント】: GET /prices/daily_quotes
 */
export interface StockPrice {
  /** 銘柄コード */
  code: string;
  /** 取引日（YYYY-MM-DD形式） */
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
  /** 売買代金 */
  turnover?: number;
  /** 調整後終値 */
  adjusted_close?: number;
}

/**
 * 財務諸表インターフェース
 *
 * 【用途】: 企業の財務諸表データ（BS/PL/CF）
 * 【API エンドポイント】: GET /fins/statements
 */
export interface FinancialStatements {
  /** 銘柄コード */
  code: string;
  /** 会計年度（YYYY形式） */
  fiscal_year: string;
  /** 財務諸表種別（連結/単体） */
  statement_type: StatementType;
  /** 貸借対照表 */
  balance_sheet: BalanceSheet;
  /** 損益計算書 */
  profit_loss: ProfitLoss;
  /** キャッシュフロー計算書 */
  cash_flow: CashFlow;
}

/**
 * 貸借対照表（Balance Sheet）インターフェース
 *
 * 【用途】: 企業の資産・負債・純資産情報
 */
export interface BalanceSheet {
  /** 総資産 */
  total_assets: number;
  /** 流動資産 */
  current_assets: number;
  /** 固定資産 */
  non_current_assets: number;
  /** 総負債 */
  total_liabilities: number;
  /** 流動負債 */
  current_liabilities: number;
  /** 固定負債 */
  non_current_liabilities: number;
  /** 純資産 */
  net_assets: number;
  /** 自己資本 */
  equity: number;
}

/**
 * 損益計算書（Profit & Loss）インターフェース
 *
 * 【用途】: 企業の収益・費用・利益情報
 */
export interface ProfitLoss {
  /** 売上高 */
  revenue: number;
  /** 売上原価 */
  cost_of_sales: number;
  /** 売上総利益 */
  gross_profit: number;
  /** 営業利益 */
  operating_profit: number;
  /** 経常利益 */
  ordinary_profit: number;
  /** 税引前当期純利益 */
  profit_before_tax: number;
  /** 当期純利益 */
  net_profit: number;
  /** 1株当たり当期純利益（EPS） */
  earnings_per_share?: number;
}

/**
 * キャッシュフロー計算書（Cash Flow）インターフェース
 *
 * 【用途】: 企業のキャッシュフロー情報
 */
export interface CashFlow {
  /** 営業活動によるキャッシュフロー */
  operating_cash_flow: number;
  /** 投資活動によるキャッシュフロー */
  investing_cash_flow: number;
  /** 財務活動によるキャッシュフロー */
  financing_cash_flow: number;
  /** フリーキャッシュフロー */
  free_cash_flow: number;
  /** 現金及び現金同等物の期末残高 */
  cash_and_equivalents: number;
}

/**
 * 企業情報インターフェース
 *
 * 【用途】: 銘柄マスタと最新株価を組み合わせた情報
 */
export interface CompanyInfo {
  /** 銘柄コード */
  code: string;
  /** 銘柄名 */
  name: string;
  /** 市場区分 */
  market: Market;
  /** 業種コード */
  sector: Sector;
  /** 最新株価 */
  latest_price?: number;
  /** 前日比 */
  change?: number;
  /** 前日比率（%） */
  change_percent?: number;
}

/**
 * トークンキャッシュデータインターフェース
 *
 * 【用途】: IDトークンをファイルキャッシュする際の構造
 * 【保存先】: data/token.json
 */
export interface TokenCacheData {
  /** IDトークン */
  id_token: string;
  /** 取得日時（ISO 8601形式） */
  obtained_at: string;
  /** 有効期限（ISO 8601形式） */
  expires_at: string;
}

/**
 * API通用レスポンスインターフェース
 *
 * 【用途】: J-Quants APIの成功レスポンス
 */
export interface APIResponse<T> {
  /** レスポンスデータ */
  data: T;
  /** ページネーション情報 */
  pagination?: PaginationInfo;
  /** メタデータ */
  meta?: Record<string, unknown>;
}

/**
 * ページネーション情報インターフェース
 *
 * 【用途】: 大量データ取得時のページング制御
 */
export interface PaginationInfo {
  /** 現在のページ番号 */
  current_page: number;
  /** 1ページあたりの件数 */
  per_page: number;
  /** 総件数 */
  total_count: number;
  /** 総ページ数 */
  total_pages: number;
}

/**
 * APIエラーインターフェース
 *
 * 【用途】: J-Quants APIのエラーレスポンス
 */
export interface APIError {
  /** エラーコード */
  code: ErrorCode;
  /** エラーメッセージ（日本語） */
  message: string;
  /** HTTPステータスコード */
  status: number;
  /** エラー詳細 */
  details?: string;
  /** エラー発生日時（ISO 8601形式） */
  timestamp: string;
}

/**
 * バリデーションエラーインターフェース
 *
 * 【用途】: 入力値検証エラー
 */
export interface ValidationError {
  /** エラーが発生したフィールド名 */
  field: string;
  /** エラーメッセージ（日本語） */
  message: string;
  /** 入力された値 */
  value: unknown;
}

/**
 * TokenManager設定インターフェース
 *
 * 【用途】: TokenManagerクラスの初期化パラメータ
 */
export interface TokenManagerConfig {
  /** リフレッシュトークン */
  refreshToken: string;
  /** キャッシュディレクトリ */
  cacheDir?: string;
  /** APIベースURL */
  apiBaseUrl?: string;
}

/**
 * リクエストオプションインターフェース
 *
 * 【用途】: APIリクエスト時のオプション設定
 */
export interface RequestOptions {
  /** タイムアウト（ミリ秒） */
  timeout?: number;
  /** リトライ回数 */
  retries?: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
  /** カスタムヘッダー */
  headers?: Record<string, string>;
}

/**
 * 株価検索条件インターフェース
 *
 * 【用途】: 株価データ取得時のフィルタ条件
 */
export interface StockPriceQuery {
  /** 銘柄コード */
  code?: string;
  /** 開始日（YYYY-MM-DD形式） */
  from?: string;
  /** 終了日（YYYY-MM-DD形式） */
  to?: string;
  /** 市場区分フィルタ */
  market?: Market;
  /** ページ番号 */
  page?: number;
  /** 1ページあたりの件数 */
  per_page?: number;
}

/**
 * 財務諸表検索条件インターフェース
 *
 * 【用途】: 財務諸表データ取得時のフィルタ条件
 */
export interface FinancialStatementsQuery {
  /** 銘柄コード */
  code?: string;
  /** 会計年度 */
  fiscal_year?: string;
  /** 財務諸表種別 */
  statement_type?: StatementType;
}

/**
 * ログエントリインターフェース
 *
 * 【用途】: ログファイルへの記録データ
 */
export interface LogEntry {
  /** ログレベル */
  level: LogLevel;
  /** ログメッセージ */
  message: string;
  /** タイムスタンプ（ISO 8601形式） */
  timestamp: string;
  /** メタデータ */
  meta?: Record<string, unknown>;
}

/**
 * キャッシュエントリインターフェース
 *
 * 【用途】: データキャッシング
 */
export interface CacheEntry<T> {
  /** キャッシュキー */
  key: string;
  /** キャッシュデータ */
  value: T;
  /** 有効期限（ISO 8601形式） */
  expires_at: string;
  /** キャッシュ作成日時（ISO 8601形式） */
  created_at: string;
}

// =========================================
// 2. 列挙型定義（5種類）
// =========================================

/**
 * 市場区分列挙型
 *
 * 【用途】: 東京証券取引所の市場区分
 */
export enum Market {
  /** プライム市場 */
  PRIME = 'Prime',
  /** スタンダード市場 */
  STANDARD = 'Standard',
  /** グロース市場 */
  GROWTH = 'Growth',
  /** その他 */
  OTHER = 'Other',
}

/**
 * 業種コード列挙型
 *
 * 【用途】: 東証33業種分類
 * 【参考】: https://www.jpx.co.jp/markets/statistics-equities/misc/01.html
 */
export enum Sector {
  /** 水産・農林業 */
  FISHERY_AGRICULTURE = '0050',
  /** 鉱業 */
  MINING = '1050',
  /** 建設業 */
  CONSTRUCTION = '2050',
  /** 食料品 */
  FOODS = '3050',
  /** 繊維製品 */
  TEXTILES = '3100',
  /** パルプ・紙 */
  PULP_PAPER = '3150',
  /** 化学 */
  CHEMICALS = '3200',
  /** 医薬品 */
  PHARMACEUTICAL = '3250',
  /** 石油・石炭製品 */
  OIL_COAL = '3300',
  /** ゴム製品 */
  RUBBER = '3350',
  /** ガラス・土石製品 */
  GLASS_CERAMICS = '3400',
  /** 鉄鋼 */
  STEEL = '3450',
  /** 非鉄金属 */
  NONFERROUS_METALS = '3500',
  /** 金属製品 */
  METAL_PRODUCTS = '3550',
  /** 機械 */
  MACHINERY = '3600',
  /** 電気機器 */
  ELECTRIC_APPLIANCES = '3650',
  /** 輸送用機器 */
  TRANSPORTATION_EQUIPMENT = '3700',
  /** 精密機器 */
  PRECISION_INSTRUMENTS = '3750',
  /** その他製品 */
  OTHER_PRODUCTS = '3800',
  /** 電気・ガス業 */
  ELECTRIC_GAS = '4050',
  /** 陸運業 */
  LAND_TRANSPORTATION = '5050',
  /** 海運業 */
  MARINE_TRANSPORTATION = '5100',
  /** 空運業 */
  AIR_TRANSPORTATION = '5150',
  /** 倉庫・運輸関連業 */
  WAREHOUSING = '5200',
  /** 情報・通信業 */
  INFORMATION_COMMUNICATION = '5250',
  /** 卸売業 */
  WHOLESALE_TRADE = '6050',
  /** 小売業 */
  RETAIL_TRADE = '6100',
  /** 銀行業 */
  BANKS = '7050',
  /** 証券、商品先物取引業 */
  SECURITIES = '7100',
  /** 保険業 */
  INSURANCE = '7150',
  /** その他金融業 */
  OTHER_FINANCING_BUSINESS = '7200',
  /** 不動産業 */
  REAL_ESTATE = '8050',
  /** サービス業 */
  SERVICES = '9050',
}

/**
 * 財務諸表種別列挙型
 *
 * 【用途】: 連結/単体の区別
 */
export enum StatementType {
  /** 連結財務諸表 */
  CONSOLIDATED = 'Consolidated',
  /** 単体財務諸表 */
  NON_CONSOLIDATED = 'NonConsolidated',
}

/**
 * ログレベル列挙型
 *
 * 【用途】: ログ出力時の重要度レベル
 */
export enum LogLevel {
  /** エラー */
  ERROR = 'ERROR',
  /** 警告 */
  WARN = 'WARN',
  /** 情報 */
  INFO = 'INFO',
  /** デバッグ */
  DEBUG = 'DEBUG',
}

/**
 * エラーコード列挙型
 *
 * 【用途】: システム全体のエラー分類
 */
export enum ErrorCode {
  /** 無効な銘柄コード */
  INVALID_CODE = 'INVALID_CODE',
  /** 無効な日付形式 */
  INVALID_DATE = 'INVALID_DATE',
  /** APIエラー */
  API_ERROR = 'API_ERROR',
  /** 認証エラー */
  AUTH_ERROR = 'AUTH_ERROR',
  /** ネットワークエラー */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** タイムアウトエラー */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  /** データ未発見エラー */
  NOT_FOUND = 'NOT_FOUND',
  /** バリデーションエラー */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** レート制限エラー */
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  /** 内部エラー */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// =========================================
// 3. 定数定義
// =========================================

/**
 * APIエンドポイント定数
 *
 * 【用途】: J-Quants API のエンドポイントURL管理
 */
export const API_ENDPOINTS = {
  /** 認証: IDトークン取得 */
  TOKEN_AUTH_USER: '/token/auth_user',
  /** 銘柄情報取得 */
  LISTED_INFO: '/listed/info',
  /** 株価データ取得 */
  PRICES_DAILY_QUOTES: '/prices/daily_quotes',
  /** 財務諸表取得 */
  FINS_STATEMENTS: '/fins/statements',
  /** 銘柄検索 */
  LISTED_SEARCH: '/listed/search',
} as const;

/**
 * エラーメッセージ定数（日本語）
 *
 * 【用途】: ユーザー向けエラーメッセージの統一管理
 */
export const ERROR_MESSAGES = {
  [ErrorCode.INVALID_CODE]: '無効な銘柄コードです。4桁の数字を指定してください。',
  [ErrorCode.INVALID_DATE]:
    '無効な日付形式です。YYYY-MM-DD形式で指定してください。',
  [ErrorCode.API_ERROR]: 'J-Quants APIでエラーが発生しました。',
  [ErrorCode.AUTH_ERROR]:
    '認証に失敗しました。リフレッシュトークンを確認してください。',
  [ErrorCode.NETWORK_ERROR]:
    'ネットワークエラーが発生しました。接続を確認してください。',
  [ErrorCode.TIMEOUT_ERROR]:
    'リクエストがタイムアウトしました。時間をおいて再試行してください。',
  [ErrorCode.NOT_FOUND]: '指定されたデータが見つかりませんでした。',
  [ErrorCode.VALIDATION_ERROR]: '入力値が不正です。',
  [ErrorCode.RATE_LIMIT_ERROR]:
    'APIリクエスト制限に達しました。しばらく待ってから再試行してください。',
  [ErrorCode.INTERNAL_ERROR]: '内部エラーが発生しました。',
} as const;

/**
 * バリデーションルール定数
 *
 * 【用途】: 入力値検証ルール
 */
export const VALIDATION_RULES = {
  /** 銘柄コード: 4桁の数字 */
  CODE_PATTERN: /^\d{4}$/,
  /** 日付形式: YYYY-MM-DD */
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  /** 最小銘柄コード */
  MIN_CODE: 1000,
  /** 最大銘柄コード */
  MAX_CODE: 9999,
  /** 最小ページ番号 */
  MIN_PAGE: 1,
  /** 最大ページサイズ */
  MAX_PAGE_SIZE: 1000,
} as const;

/**
 * リトライ設定定数
 *
 * 【用途】: APIリクエスト失敗時のリトライ制御
 * 【要件根拠】: REQ-601
 */
export const RETRY_CONFIG = {
  /** 最大リトライ回数（初回 + リトライ2回 = 合計3回） */
  MAX_RETRIES: 2,
  /** リトライ間隔（ミリ秒）: Exponential backoff [1秒, 2秒] */
  RETRY_DELAYS_MS: [1000, 2000],
} as const;

/**
 * タイムアウト設定定数
 *
 * 【用途】: HTTPリクエストのタイムアウト制御
 * 【要件根拠】: REQ-603, NFR-001
 */
export const TIMEOUT_CONFIG = {
  /** APIリクエストタイムアウト（ミリ秒） */
  REQUEST_TIMEOUT: 5000,
  /** トークン取得タイムアウト（ミリ秒） */
  TOKEN_TIMEOUT: 5000,
} as const;

/**
 * キャッシュ設定定数
 *
 * 【用途】: データキャッシングの有効期限管理
 */
export const CACHE_CONFIG = {
  /** トークン有効期限（秒） */
  TOKEN_EXPIRY_SECONDS: 3600,
  /** トークン安全マージン（秒） */
  TOKEN_SAFETY_MARGIN_SECONDS: 300,
  /** データキャッシュ有効期限（秒） */
  DATA_CACHE_EXPIRY_SECONDS: 86400, // 24時間
} as const;

/**
 * ファイルパス定数
 *
 * 【用途】: ファイル保存先の統一管理
 */
export const FILE_PATHS = {
  /** デフォルトキャッシュディレクトリ */
  DEFAULT_CACHE_DIR: 'data',
  /** トークンキャッシュファイル名 */
  TOKEN_CACHE_FILE: 'token.json',
  /** エラーログファイル名 */
  ERROR_LOG_FILE: 'error.log',
  /** アクセスログファイル名 */
  ACCESS_LOG_FILE: 'access.log',
} as const;

/**
 * デフォルトAPI設定定数
 *
 * 【用途】: J-Quants API接続設定
 */
export const DEFAULT_API_CONFIG = {
  /** APIベースURL */
  BASE_URL: 'https://api.jquants.com/v1',
  /** APIバージョン */
  API_VERSION: 'v1',
  /** Content-Type */
  CONTENT_TYPE: 'application/json',
} as const;

// =========================================
// 4. ユーティリティ型定義
// =========================================

/**
 * MCPツールパラメータ基本型
 *
 * 【用途】: Model Context Protocol のツール引数定義
 */
export type ToolParameter = {
  /** パラメータ名 */
  name: string;
  /** パラメータ型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** パラメータ説明 */
  description: string;
  /** 必須フラグ */
  required: boolean;
  /** デフォルト値 */
  default?: unknown;
};

/**
 * MCPツール戻り値型
 *
 * 【用途】: Model Context Protocol のツール実行結果
 */
export type ToolResult<T = unknown> = {
  /** 成功フラグ */
  success: boolean;
  /** 結果データ */
  data?: T;
  /** エラー情報 */
  error?: APIError;
};

/**
 * 非同期関数型
 *
 * 【用途】: 非同期処理の型定義
 */
export type AsyncFunction<T = void, U = void> = (arg: T) => Promise<U>;

/**
 * 読み取り専用プロパティ型
 *
 * 【用途】: イミュータブルなオブジェクト定義
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 部分的にオプショナルな型
 *
 * 【用途】: 一部のプロパティをオプショナルにする
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 必須プロパティ型
 *
 * 【用途】: すべてのプロパティを必須にする
 */
export type RequiredAll<T> = {
  [P in keyof T]-?: T[P];
};
