/**
 * TASK-0003: Token Manager 異常系テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-29
 * 【テストフレームワーク】: Vitest
 * 【言語】: TypeScript 5.x
 * 【目的】: 異常系エラーハンドリングのテスト実装（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';

// 【注意】: TokenManagerクラスが実装されたため、インポートを有効化
import { TokenManager } from '../../src/auth/token-manager';

// モック用の型定義（実装前の仮定義）
interface TokenManagerConfig {
  refreshToken: string;
  cacheDir?: string;
  apiBaseUrl?: string;
}

declare class TokenManager {
  constructor(config: TokenManagerConfig);
  getIdToken(): Promise<string>;
  refreshToken(): Promise<string>;
}

// =========================================
// 異常系テストケース（7ケース）
// =========================================
describe('TokenManager - 異常系テストケース', () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをクリア
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // 【テスト後処理】: タイマーモックをリセット
    vi.useRealTimers();
  });

  /**
   * TC-ERROR-001: 環境変数未設定エラー 🔵
   *
   * 【テスト目的】: 環境変数 J_QUANTS_REFRESH_TOKEN が未設定の場合、
   *                 適切なエラーメッセージが表示されることを確認
   *
   * 【要件根拠】: EDGE-003, NFR-301, REQ-1101
   */
  it('TC-ERROR-001: 環境変数未設定エラー', () => {
    // Given: 環境変数が未設定（undefined）
    const invalidToken = undefined;

    // When: TokenManagerを初期化しようとする
    // Then: エラーがスローされる
    expect(() => {
      new TokenManager({
        refreshToken: invalidToken!,
      });
    }).toThrow('環境変数 J_QUANTS_REFRESH_TOKEN を設定してください');

    // Then: エラーメッセージが日本語
    // Then: エラーメッセージに「J_QUANTS_REFRESH_TOKEN」が含まれる
  });

  /**
   * TC-ERROR-002: 認証失敗エラー（401）🔵
   *
   * 【テスト目的】: 無効なリフレッシュトークンを使用した場合、
   *                 認証失敗エラーが正しく処理されることを確認
   *
   * 【要件根拠】: REQ-602, NFR-301
   */
  it('TC-ERROR-002: 認証失敗エラー（401）', async () => {
    // Given: キャッシュファイルが存在しない
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Given: fetch APIをモック（401 Unauthorized）
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Authentication failed' }),
      } as Response)
    );
    global.fetch = mockFetch as any;

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'invalid_refresh_token_xxx',
    });

    // Then: AUTHENTICATION_FAILEDエラーがスローされる
    await expect(tokenManager.getIdToken()).rejects.toThrow('認証に失敗しました。APIキーを確認してください');

    // Then: エラーメッセージが日本語
    // Then: ログファイルにエラーが記録される
  });

  /**
   * TC-ERROR-003: ネットワークエラー 🔵
   *
   * 【テスト目的】: ネットワーク接続が切断されている場合、
   *                 適切なエラーメッセージが表示されることを確認
   *
   * 【要件根拠】: EDGE-202, NFR-102, NFR-301
   */
  it('TC-ERROR-003: ネットワークエラー', async () => {
    // Given: キャッシュファイルが存在しない
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Given: fetch APIをモック（ネットワークエラー）
    const mockFetch = vi.fn(() => Promise.reject(new TypeError('fetch failed')));
    global.fetch = mockFetch as any;

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });

    // Then: NETWORK_ERRORエラーがスローされる
    await expect(tokenManager.getIdToken()).rejects.toThrow('ネットワークに接続できません。インターネット接続を確認してください');

    // Then: エラーメッセージが日本語
    // Then: エラーメッセージに「ネットワーク」「インターネット接続」が含まれる
    // Then: システムがクラッシュしない
  });

  /**
   * TC-ERROR-004: APIタイムアウトエラー 🔵
   *
   * 【テスト目的】: APIレスポンスが5秒以内に返らない場合、
   *                 タイムアウトエラーが発生することを確認
   *
   * 【要件根拠】: REQ-603, NFR-001
   */
  it('TC-ERROR-004: APIタイムアウトエラー', async () => {
    // Given: キャッシュファイルが存在しない
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Given: fetch APIをモック（タイムアウトエラー）
    const mockFetch = vi.fn(() =>
      Promise.reject(new DOMException('The operation was aborted', 'AbortError'))
    );
    global.fetch = mockFetch as any;

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });

    // Then: API_TIMEOUTエラーがスローされる
    await expect(tokenManager.getIdToken()).rejects.toThrow('APIの応答がタイムアウトしました（5秒）');

    // Then: エラーメッセージが日本語
    // Then: エラーメッセージに「タイムアウト」「5秒」が含まれる
    // Then: AbortController.abort()が呼ばれる
  });

  /**
   * TC-ERROR-005: キャッシュファイル破損 🔵
   *
   * 【テスト目的】: キャッシュファイルがJSONとしてパース不可能な場合、
   *                 適切にエラーハンドリングされることを確認
   *
   * 【要件根拠】: REQ-602, NFR-102
   */
  it('TC-ERROR-005: キャッシュファイル破損', async () => {
    // Given: キャッシュファイルが存在するが、内容が破損
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      '{ "id_token": "broken_token", "obtained_at": "invalid_date' // 閉じ括弧なし
    );

    // Given: fetch APIをモック（新しいトークン取得）
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ idToken: 'new_token_recovered' }),
      } as Response)
    );
    global.fetch = mockFetch as any;

    // Given: ファイル書き込みをモック
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const idToken = await tokenManager.getIdToken();

    // Then: loadCachedToken()がnullを返す
    // Then: システムがクラッシュしない
    // Then: 新しいトークンが取得される
    expect(idToken).toBe('new_token_recovered');

    // Then: ログファイルに警告が記録される
    // Then: キャッシュファイルが正常な内容で上書きされる
  });

  /**
   * TC-ERROR-006: APIメンテナンス中（503）🔵
   *
   * 【テスト目的】: J-Quants APIがメンテナンス中（503）の場合、
   *                 リトライ後にエラーが返されることを確認
   *
   * 【要件根拠】: REQ-601, EDGE-201
   */
  it('TC-ERROR-006: APIメンテナンス中（503）', async () => {
    // Given: キャッシュファイルが存在しない
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Given: fetch APIをモック（すべて503 Service Unavailable）
    let callCount = 0;
    const mockFetch = vi.fn(() => {
      callCount++;
      return Promise.resolve({
        ok: false,
        status: 503,
        json: async () => ({ message: 'Service Unavailable' }),
      } as Response);
    });
    global.fetch = mockFetch as any;

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });

    // Then: API_MAINTENANCEエラーがスローされる
    await expect(tokenManager.getIdToken()).rejects.toThrow('J-Quants APIがメンテナンス中です。しばらく時間をおいてから再試行してください');

    // Then: fetch APIが3回呼ばれる（初回 + リトライ2回）
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Then: エラーメッセージが日本語
    // Then: 4回目のリトライは行われない
    // Then: ログファイルに各リトライが記録される
  });

  /**
   * TC-ERROR-007: ファイル書き込みエラー 🟡
   *
   * 【テスト目的】: キャッシュファイルへの書き込み権限がない場合、
   *                 適切なエラーハンドリングが行われることを確認
   *
   * 【要件根拠】: NFR-102, REQ-602
   */
  it('TC-ERROR-007: ファイル書き込みエラー', async () => {
    // Given: キャッシュファイルが存在しない
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Given: fetch APIをモック（成功レスポンス）
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ idToken: 'new_token_write_fail' }),
      } as Response)
    );
    global.fetch = mockFetch as any;

    // Given: ファイル書き込みをモック（権限エラー）
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      const error = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      throw error;
    });

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const idToken = await tokenManager.getIdToken();

    // Then: IDトークンは正常に返却される（キャッシュ保存のみ失敗）
    expect(idToken).toBe('new_token_write_fail');

    // Then: システムがクラッシュしない
    // Then: ログファイルにエラーが記録される
    // Then: エラーコードがFILE_WRITE_ERROR
    // Then: 次回getIdToken()呼び出し時、再度API呼び出し
  });
});
