/**
 * TASK-0005: ロガー実装
 *
 * 【モジュール概要】: ログ記録機能を提供するユーティリティモジュール
 * 【実装方針】: テストケースを通すための最小限の実装
 * 【対応テストケース】: TC-NORMAL-009～010, TC-BOUNDARY-002～003
 * 【作成日】: 2025-10-29
 */

import fs from 'fs';
import path from 'path';

/**
 * ログディレクトリパス
 *
 * 【定数概要】: ログファイルを保存するディレクトリパス
 * 【実装方針】: process.cwd()からの相対パスでlogs/ディレクトリを指定
 * 🔵 信頼性レベル: 青信号（要件定義書から確定）
 */
const LOGS_DIR = path.join(process.cwd(), 'logs');

/**
 * エラーログファイルパス
 *
 * 【定数概要】: エラーログを記録するファイルパス
 * 【実装方針】: logs/error.log として定義
 * 🔵 信頼性レベル: 青信号（要件定義書から確定）
 */
const ERROR_LOG_PATH = path.join(LOGS_DIR, 'error.log');

/**
 * ログディレクトリ確保関数
 *
 * 【機能概要】: logs/ディレクトリが存在しない場合に自動作成
 * 【実装方針】: fs.existsSync()とfs.mkdirSync()を使用
 * 【テスト対応】: TC-BOUNDARY-003で使用
 * 🟡 信頼性レベル: 黄信号（要件定義書から推測、実装詳細は不明）
 */
function ensureLogsDirectory(): void {
  // 【ディレクトリ存在確認】: logs/ディレクトリが存在するか確認 🟡
  if (!fs.existsSync(LOGS_DIR)) {
    // 【ディレクトリ作成】: 存在しない場合は作成
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

/**
 * エラーログ記録関数
 *
 * 【機能概要】: エラーメッセージをlogs/error.logに記録
 * 【実装方針】:
 *   - ISO 8601形式のタイムスタンプを付与
 *   - [timestamp] ERROR: message の形式
 *   - contextが存在する場合は追加行として記録
 * 【テスト対応】: TC-NORMAL-009, TC-BOUNDARY-002, TC-BOUNDARY-003で使用
 * 🔵 信頼性レベル: 青信号（要件定義書のログフォーマットから確定）
 *
 * @param message - ログメッセージ
 * @param context - 追加コンテキスト情報（オプション）
 */
export function error(message: string, context?: any): void {
  // 【ディレクトリ確保】: logs/ディレクトリを確保 🟡
  ensureLogsDirectory();

  // 【タイムスタンプ生成】: ISO 8601形式の現在時刻を生成 🔵
  const timestamp = new Date().toISOString();

  // 【ログメッセージ構築】: [timestamp] ERROR: message 形式 🔵
  let logMessage = `[${timestamp}] ERROR: ${message}`;

  // 【コンテキスト追加】: contextが存在する場合は追加 🔵
  if (context !== undefined) {
    logMessage += `\nContext: ${JSON.stringify(context)}`;
  }

  // 【改行追加】: ログエントリの区切りとして改行を追加
  logMessage += '\n';

  // 【ファイル書き込み】: logs/error.logに追記 🔵
  fs.appendFileSync(ERROR_LOG_PATH, logMessage, 'utf-8');
}

/**
 * ログメッセージ構築ヘルパー関数
 *
 * 【ヘルパー関数】: ログレベルとメッセージ、コンテキストから統一フォーマットのログを生成
 * 【再利用性】: debug(), info()で共通利用
 * 【単一責任】: ログメッセージのフォーマット整形のみを担当
 * 【改善内容】: 重複コードを削減し、DRY原則を適用 🔵
 *
 * @param level - ログレベル（DEBUG, INFO等）
 * @param message - ログメッセージ
 * @param context - 追加コンテキスト情報（オプション）
 * @returns フォーマット済みログメッセージ
 */
function buildLogMessage(level: string, message: string, context?: any): string {
  // 【ログフォーマット】: [LEVEL] message 形式 🔵
  let logMessage = `[${level}] ${message}`;

  // 【コンテキスト追加】: contextが存在する場合はJSON文字列化して追加 🔵
  if (context !== undefined) {
    logMessage += ` ${JSON.stringify(context)}`;
  }

  return logMessage;
}

/**
 * デバッグログ出力関数
 *
 * 【機能概要】: NODE_ENV=developmentの場合にコンソールにログ出力
 * 【実装方針】: 環境変数による条件付きログ出力
 * 【改善内容】: buildLogMessage()を使用してコード重複を削減 🔵
 * 【テスト対応】: TC-NORMAL-010で使用
 * 🔵 信頼性レベル: 青信号（要件定義書のdebug()仕様から確定）
 *
 * @param message - ログメッセージ
 * @param context - 追加コンテキスト情報（オプション）
 */
export function debug(message: string, context?: any): void {
  // 【環境判定】: NODE_ENV=developmentの場合のみログ出力 🔵
  if (process.env.NODE_ENV === 'development') {
    const logMessage = buildLogMessage('DEBUG', message, context);
    console.log(logMessage);
  }
}

/**
 * 情報ログ出力関数
 *
 * 【機能概要】: 情報レベルのログをコンソールに出力
 * 【実装方針】: 最小限の実装（将来拡張可能）
 * 【改善内容】: buildLogMessage()を使用してコード重複を削減 🔵
 * 【テスト対応】: 現在のテストではインポートのみ、将来のテストで使用予定
 * 🟡 信頼性レベル: 黄信号（要件定義書に記載あるが詳細不明）
 *
 * @param message - ログメッセージ
 * @param context - 追加コンテキスト情報（オプション）
 */
export function info(message: string, context?: any): void {
  const logMessage = buildLogMessage('INFO', message, context);
  console.log(logMessage);
}
