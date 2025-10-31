/**
 * TASK-0005: エラーハンドラー実装
 *
 * 【モジュール概要】: 統一されたエラーハンドリング機能を提供
 * 【設計方針】: 日本語エラーメッセージ、リトライ判定、エラーレスポンス整形
 * 【対応テストケース】: TC-NORMAL-001～004, TC-ERROR-001
 * 【最終更新】: 2025-10-29
 */

/**
 * エラーコード列挙型
 *
 * 【機能概要】: システム全体で使用するエラーコードを定義
 * 【実装方針】: 要件定義書から8種類のエラーコードを抽出
 * 【テスト対応】: TC-NORMAL-001で使用
 * 🔵 信頼性レベル: 青信号（要件定義書から確定）
 */
export enum ErrorCode {
  /** 【エラー種別】: 銘柄コード不正 */
  INVALID_CODE = 'INVALID_CODE',
  /** 【エラー種別】: 日付形式不正 */
  INVALID_DATE = 'INVALID_DATE',
  /** 【エラー種別】: API接続エラー */
  API_ERROR = 'API_ERROR',
  /** 【エラー種別】: タイムアウト */
  TIMEOUT = 'TIMEOUT',
  /** 【エラー種別】: 必須パラメータ不足 */
  MISSING_PARAM = 'MISSING_PARAM',
  /** 【エラー種別】: 日付範囲不正 */
  INVALID_RANGE = 'INVALID_RANGE',
  /** 【エラー種別】: ネットワークエラー */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 【エラー種別】: レート制限 */
  RATE_LIMIT = 'RATE_LIMIT',
}

/**
 * エラーレスポンス型定義
 *
 * 【型概要】: 統一されたエラーレスポンス形式
 * 【実装方針】: 要件定義書のErrorResponseインターフェースを実装
 * 【テスト対応】: TC-NORMAL-004で使用
 * 🔵 信頼性レベル: 青信号（要件定義書から確定）
 */
export interface ErrorResponse {
  /** 【プロパティ】: エラーコード */
  code: ErrorCode;
  /** 【プロパティ】: エラーメッセージ */
  message: string;
  /** 【プロパティ】: 追加コンテキスト情報 */
  context?: any;
  /** 【プロパティ】: エラー発生タイムスタンプ（ISO 8601形式） */
  timestamp: string;
}

/**
 * エラーメッセージ定義
 *
 * 【定数概要】: ErrorCodeに対応する日本語エラーメッセージ
 * 【実装方針】: 要件定義書から日本語メッセージを抽出
 * 【テンプレート変数】: {code}, {param} などの変数をサポート
 * 【テスト対応】: TC-NORMAL-001, TC-NORMAL-002で使用
 * 🔵 信頼性レベル: 青信号（要件定義書から確定）
 */
const errorMessages: Record<ErrorCode, string> = {
  INVALID_CODE: '指定された銘柄コード（{code}）は存在しません',
  INVALID_DATE: '日付はYYYY-MM-DD形式で指定してください',
  API_ERROR: 'J-Quants APIへの接続に失敗しました',
  TIMEOUT: 'APIの応答がタイムアウトしました（5秒）',
  MISSING_PARAM: '必須パラメータ {param} が指定されていません',
  INVALID_RANGE: '日付範囲が不正です（from > to）',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  RATE_LIMIT: 'APIレート制限に達しました。しばらく待ってから再試行してください',
};

/**
 * エラーメッセージ取得関数
 *
 * 【機能概要】: ErrorCodeとcontextからテンプレート置換された日本語メッセージを取得
 * 【実装方針】: テンプレート変数（{variable}）をcontextの値で置換
 * 【テスト対応】: TC-NORMAL-001, TC-NORMAL-002で使用
 * 🔵 信頼性レベル: 青信号（要件定義書から確定）
 *
 * @param errorCode - エラーコード（列挙型）
 * @param context - エラーメッセージテンプレート変数（オプション）
 * @returns 日本語エラーメッセージ
 */
export function getErrorMessage(errorCode: ErrorCode, context?: any): string {
  // 【メッセージテンプレート取得】: errorMessagesからエラーコードに対応するメッセージを取得 🔵
  let message = errorMessages[errorCode];

  // 【テンプレート変数置換】: contextが存在する場合、{variable}形式の変数を置換 🔵
  if (context) {
    // 【置換処理】: contextの各キーに対して、{key}をvalueで置換
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{${key}}`;
      message = message.replace(placeholder, String(value));
    }
  }

  // 【結果返却】: 置換後のメッセージを返却
  return message;
}

/**
 * リトライ可能エラー判定関数
 *
 * 【機能概要】: エラーがリトライ可能かどうかを判定
 * 【実装方針】: HTTPステータスコードとエラー種別に基づいて判定
 * 【判定ロジック】:
 *   - 5xxエラー → true（サーバーエラー、リトライ可能）
 *   - 429エラー → true（レート制限、リトライ可能）
 *   - ネットワークエラー（TypeError） → true
 *   - タイムアウト（AbortError） → true
 *   - 400エラー → false（クライアントエラー、リトライ不可）
 * 【テスト対応】: TC-NORMAL-003, TC-ERROR-001で使用
 * 🔵 信頼性レベル: 青信号（要件定義書の判定ロジックから確定）
 *
 * @param error - 判定対象のエラーオブジェクト
 * @returns リトライ可能な場合true、不可の場合false
 */
export function isRetryableError(error: any): boolean {
  // 【HTTPステータスコード判定】: error.statusが存在する場合の判定 🔵
  if (error && typeof error.status === 'number') {
    const status = error.status;

    // 【400エラー判定】: クライアントエラーはリトライ不可
    if (status === 400) {
      return false;
    }

    // 【5xxエラー判定】: サーバーエラーはリトライ可能
    if (status >= 500 && status < 600) {
      return true;
    }

    // 【429エラー判定】: レート制限はリトライ可能
    if (status === 429) {
      return true;
    }

    // 【401エラー判定】: 認証エラーはトークン再取得でリトライ可能
    if (status === 401) {
      return true;
    }
  }

  // 【ネットワークエラー判定】: TypeErrorはネットワークエラー、リトライ可能 🔵
  if (error instanceof TypeError) {
    return true;
  }

  // 【タイムアウト判定】: AbortErrorはタイムアウト、リトライ可能 🔵
  if (error && error.name === 'AbortError') {
    return true;
  }

  // 【デフォルト判定】: 上記以外はリトライ不可
  return false;
}

/**
 * エラーレスポンス整形関数
 *
 * 【機能概要】: 任意のエラーオブジェクトをErrorResponse形式に変換
 * 【実装方針】: code, message, context, timestampを含む統一形式に整形
 * 【テスト対応】: TC-NORMAL-004で使用
 * 🔵 信頼性レベル: 青信号（要件定義書のErrorResponseインターフェースから確定）
 *
 * @param error - 整形対象のエラーオブジェクト
 * @returns 統一形式のエラーレスポンス
 */
export function formatErrorResponse(error: any): ErrorResponse {
  // 【タイムスタンプ生成】: ISO 8601形式の現在時刻を生成 🔵
  const timestamp = new Date().toISOString();

  // 【エラーコード判定】: エラーの種類に基づいてErrorCodeを決定 🔵
  let code: ErrorCode = ErrorCode.API_ERROR;

  // 【エラーメッセージ抽出】: errorオブジェクトからメッセージを抽出 🔵
  const message = error?.message || 'Unknown error';

  // 【エラーレスポンス構築】: ErrorResponse形式のオブジェクトを構築
  const response: ErrorResponse = {
    code,
    message,
    timestamp,
  };

  // 【コンテキスト追加】: error.contextが存在する場合は追加 🟡
  if (error?.context) {
    response.context = error.context;
  }

  // 【結果返却】: 整形されたエラーレスポンスを返却
  return response;
}

/**
 * API エラーハンドリング関数
 *
 * 【機能概要】: エラーをログに記録し、整形されたエラーをスロー
 * 【実装方針】: 最小限の実装（ロガー統合は将来対応）
 * 【テスト対応】: 現在のテストではインポートのみ、将来のテストで使用予定
 * 🟡 信頼性レベル: 黄信号（要件定義書から推測）
 *
 * @param error - キャッチされたエラーオブジェクト
 * @param context - エラー発生コンテキスト（例: "銘柄情報取得"）
 * @returns never（必ず例外をスロー）
 */
export function handleApiError(error: any, context: string): never {
  // 【エラーログ記録】: 将来的にloggerモジュールと統合予定 🟡
  // TODO: error(context, { error }) でログ記録

  // 【エラーレスポンス整形】: formatErrorResponse()を使用してエラーを整形
  const formattedError = formatErrorResponse(error);

  // 【エラースロー】: 整形されたエラーをスローして呼び出し元に通知
  throw new Error(`[${context}] ${formattedError.message}`);
}
