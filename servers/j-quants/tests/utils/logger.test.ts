/**
 * TASK-0005: ロガー テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-29
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.x
 * 【目的】: ログ記録機能のテスト実装（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { error, debug, info } from '../../src/utils/logger';

// =========================================
// 正常系テストケース（2件）
// =========================================
describe('logger.ts - 正常系テストケース', () => {
  const logsDir = path.join(process.cwd(), 'logs');
  const errorLogPath = path.join(logsDir, 'error.log');

  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをクリア
    vi.clearAllMocks();
    // 【環境初期化】: ログファイルが存在する場合は削除
    if (fs.existsSync(errorLogPath)) {
      fs.unlinkSync(errorLogPath);
    }
  });

  afterEach(() => {
    // 【テスト後処理】: テスト後にログファイルを削除
    if (fs.existsSync(errorLogPath)) {
      fs.unlinkSync(errorLogPath);
    }
  });

  /**
   * TC-NORMAL-009: error() - エラーログ記録🔵
   *
   * 【テスト目的】: エラーメッセージがlogs/error.logに記録されること
   * 【テスト内容】: メッセージとコンテキストをlogs/error.logに記録
   * 【期待される動作】: タイムスタンプ、ログレベル、メッセージを含むログエントリが作成
   * 🔵 信頼性レベル: 青信号（要件定義書のログフォーマットから抽出）
   */
  it('TC-NORMAL-009: error() - エラーログ記録', () => {
    // Given（前提条件）: エラーメッセージとコンテキストを準備
    // 【テストデータ準備】: 銘柄コード1234の株価取得時のエラー
    const message = 'Test error message';
    const context = { code: '1234', operation: 'getStockPrice' };

    // When（実行）: error()を呼び出してログ記録
    // 【実際の処理実行】: エラーログの記録
    error(message, context);

    // Then（検証）: logs/error.log ファイルが作成される
    // 【結果検証】: ログファイルが存在すること
    expect(fs.existsSync(errorLogPath)).toBe(true);
    // 【確認内容】: ログファイルが正しく作成されている

    // Then: ログ内容を読み込み
    const logContent = fs.readFileSync(errorLogPath, 'utf-8');

    // Then: ログ内容にタイムスタンプが含まれる
    // 【結果検証】: ISO 8601形式のタイムスタンプ
    expect(logContent).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    // 【確認内容】: タイムスタンプがISO 8601形式で記録されている

    // Then: ログ内容にERRORレベルが含まれる
    // 【結果検証】: ログレベルの記録
    expect(logContent).toContain('ERROR:');
    // 【確認内容】: ログレベルが正しく記録されている

    // Then: ログ内容にメッセージが含まれる
    // 【結果検証】: メッセージの記録
    expect(logContent).toContain('Test error message');
    // 【確認内容】: メッセージが正しく記録されている

    // Then: ログ内容にコンテキストが含まれる
    // 【結果検証】: コンテキストの記録
    expect(logContent).toContain('Context:');
    // 【確認内容】: コンテキストが正しく記録されている
    expect(logContent).toContain('"code":"1234"');
    // 【確認内容】: コンテキストのcode値が正しく記録されている
    expect(logContent).toContain('"operation":"getStockPrice"');
    // 【確認内容】: コンテキストのoperation値が正しく記録されている
  });

  /**
   * TC-NORMAL-010: debug() - デバッグログ（development環境）🔵
   *
   * 【テスト目的】: NODE_ENV=developmentの場合にコンソール出力されること
   * 【テスト内容】: developmentモードでのdebugログ出力
   * 【期待される動作】: developmentモードでのみdebugログが出力
   * 🔵 信頼性レベル: 青信号（要件定義書のdebug()仕様から抽出）
   */
  it('TC-NORMAL-010: debug() - デバッグログ（development環境）', () => {
    // Given（前提条件）: 環境変数をdevelopmentに設定
    // 【テストデータ準備】: 開発環境でのデバッグ情報
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Given: console.logをモック
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Given: デバッグメッセージとコンテキストを準備
    const message = 'Debug info';
    const context = { variable: 'value' };

    try {
      // When（実行）: debug()を呼び出してログ出力
      // 【実際の処理実行】: デバッグログの出力
      debug(message, context);

      // Then（検証）: console.logが呼ばれる
      // 【結果検証】: NODE_ENVの値によってログの有無が切り替わること
      expect(consoleLogSpy).toHaveBeenCalled();
      // 【確認内容】: developmentモードでログが出力される

      // Then: 出力内容に[DEBUG]が含まれる
      // 【結果検証】: ログレベルの記録
      const callArg = consoleLogSpy.mock.calls[0][0];
      expect(callArg).toContain('[DEBUG]');
      // 【確認内容】: DEBUGレベルが正しく出力されている

      // Then: 出力内容にメッセージが含まれる
      // 【結果検証】: メッセージの記録
      expect(callArg).toContain('Debug info');
      // 【確認内容】: メッセージが正しく出力されている
    } finally {
      // 【テスト後処理】: 環境変数を元に戻す
      process.env.NODE_ENV = originalEnv;
      consoleLogSpy.mockRestore();
    }
  });
});

// =========================================
// 境界値テストケース（2件）
// =========================================
describe('logger.ts - 境界値テストケース', () => {
  const logsDir = path.join(process.cwd(), 'logs');
  const errorLogPath = path.join(logsDir, 'error.log');

  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをクリア
    vi.clearAllMocks();
    // 【環境初期化】: ログファイルとディレクトリが存在する場合は削除
    if (fs.existsSync(errorLogPath)) {
      fs.unlinkSync(errorLogPath);
    }
    if (fs.existsSync(logsDir)) {
      fs.rmdirSync(logsDir);
    }
  });

  afterEach(() => {
    // 【テスト後処理】: テスト後にログファイルとディレクトリを削除
    if (fs.existsSync(errorLogPath)) {
      fs.unlinkSync(errorLogPath);
    }
    if (fs.existsSync(logsDir)) {
      fs.rmdirSync(logsDir);
    }
  });

  /**
   * TC-BOUNDARY-002: error() - 空のコンテキスト🔵
   *
   * 【テスト目的】: contextがundefinedの場合もログ記録されること
   * 【テスト内容】: contextなしでのエラーログ記録
   * 【期待される動作】: contextなしでもエラーが発生しないこと
   * 🔵 信頼性レベル: 青信号（要件定義書から推測）
   * 【境界値の意味】: contextパラメータの省略可能性
   * 【境界値での動作保証】: オプショナルパラメータの扱い
   */
  it('TC-BOUNDARY-002: error() - 空のコンテキスト', () => {
    // Given（前提条件）: メッセージのみ準備（contextなし）
    // 【テストデータ準備】: コンテキスト情報が不要なシンプルなエラー
    // 【境界値選択の根拠】: contextはオプショナル
    // 【実際の使用場面】: コンテキスト情報が不要なシンプルなエラー
    const message = 'Error without context';

    // When（実行）: error()を呼び出してログ記録（contextなし）
    // 【実際の処理実行】: contextなしでのログ記録
    error(message);

    // Then（検証）: logs/error.log ファイルが作成される
    // 【結果検証】: contextなしでもエラーが発生しないこと
    expect(fs.existsSync(errorLogPath)).toBe(true);
    // 【確認内容】: ログファイルが正しく作成されている

    // Then: ログ内容を読み込み
    const logContent = fs.readFileSync(errorLogPath, 'utf-8');

    // Then: ログ内容にメッセージが含まれる
    // 【結果検証】: メッセージの記録
    expect(logContent).toContain('Error without context');
    // 【確認内容】: メッセージが正しく記録されている

    // Then: ログ内容にContext:が含まれない
    // 【境界での正確性】: context省略時もクラッシュしないこと
    // 【一貫した動作】: メッセージ部分は同じフォーマット
    expect(logContent).not.toContain('Context:');
    // 【確認内容】: contextが省略されている場合はContext:が出力されない
  });

  /**
   * TC-BOUNDARY-003: error() - ログディレクトリが存在しない🟡
   *
   * 【テスト目的】: logs/ディレクトリが存在しない場合に自動作成されること
   * 【テスト内容】: ディレクトリ自動作成の検証
   * 【期待される動作】: ディレクトリ作成後も通常通りログ記録
   * 🟡 信頼性レベル: 黄信号（要件定義書から推測、実装詳細不明）
   * 【境界値の意味】: 初回実行時の状態
   * 【境界値での動作保証】: ファイルシステムの初期化
   */
  it('TC-BOUNDARY-003: error() - ログディレクトリが存在しない', () => {
    // Given（前提条件）: logs/ディレクトリが存在しない
    // 【テストデータ準備】: 初回実行時の状態
    // 【境界値選択の根拠】: アプリケーション初回起動時
    // 【実際の使用場面】: 初回デプロイ直後
    expect(fs.existsSync(logsDir)).toBe(false);
    // 【確認内容】: logs/ディレクトリが存在しないことを確認

    const message = 'First error';

    // When（実行）: error()を呼び出してログ記録
    // 【実際の処理実行】: ディレクトリ自動作成とログ記録
    error(message);

    // Then（検証）: logs/ ディレクトリが自動作成される
    // 【結果検証】: 事前準備なしでも動作すること
    expect(fs.existsSync(logsDir)).toBe(true);
    // 【境界での正確性】: ディレクトリが自動作成されること

    // Then: logs/error.log ファイルが作成される
    // 【結果検証】: ログファイルが正しく作成されること
    expect(fs.existsSync(errorLogPath)).toBe(true);
    // 【一貫した動作】: ディレクトリ作成後も通常通りログ記録

    // Then: ログ内容を読み込み
    const logContent = fs.readFileSync(errorLogPath, 'utf-8');

    // Then: ログ内容にメッセージが含まれる
    // 【結果検証】: メッセージの記録
    expect(logContent).toContain('First error');
    // 【確認内容】: メッセージが正しく記録されている
  });
});
