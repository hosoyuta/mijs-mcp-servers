/**
 * TASK-0003: Token Manager テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-29
 * 【テストフレームワーク】: Vitest
 * 【言語】: TypeScript 5.x
 * 【目的】: 認証・トークン管理機能のテスト実装（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import { TokenManager } from '../../src/auth/token-manager';

// =========================================
// 正常系テストケース（8ケース）
// =========================================
describe('TokenManager - 正常系テストケース', () => {
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
   * TC-NORMAL-001: 初回起動時のIDトークン取得 🔵
   *
   * 【テスト目的】: キャッシュが存在しない初回起動時に、
   *                 J-Quants APIからIDトークンを取得し、
   *                 キャッシュに保存できることを確認
   *
   * 【要件根拠】: REQ-001, REQ-002, REQ-003
   */
  it('TC-NORMAL-001: 初回起動時のIDトークン取得', async () => {
    // Given（前提条件）: キャッシュファイルが存在しない
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Given: fetch APIをモック（成功レスポンス）
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ idToken: 'new_token_12345' }),
      } as Response)
    );
    global.fetch = mockFetch as any;

    // Given: ファイル書き込みをモック
    const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    // When（実行条件）: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const idToken = await tokenManager.getIdToken();

    // Then（期待結果）: IDトークンが取得される
    expect(idToken).toBe('new_token_12345');

    // Then: fetch APIが1回呼ばれる
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Then: リクエストURLが正しい
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.jquants.com/v1/token/auth_user',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshtoken: 'valid_refresh_token_abc123' }),
      })
    );

    // Then: キャッシュファイルが作成される
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.stringMatching(/data[\\/]token\.json/),
      expect.stringContaining('new_token_12345'),
      'utf-8'
    );
  });

  /**
   * TC-NORMAL-002: キャッシュからのIDトークン取得 🔵
   *
   * 【テスト目的】: 有効なトークンキャッシュが存在する場合、
   *                 API呼び出しを行わずにキャッシュから
   *                 IDトークンを取得できることを確認
   *
   * 【要件根拠】: REQ-003, NFR-002
   */
  it('TC-NORMAL-002: キャッシュからのIDトークン取得', async () => {
    // Given: 有効なキャッシュファイルが存在する
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        id_token: 'cached_token_xyz789',
        obtained_at: '2025-10-29T10:00:00.000Z',
        expires_at: '2025-10-29T11:00:00.000Z', // 1時間後（有効）
      })
    );

    // Given: 現在時刻を10:30（有効期限まで30分）にモック
    vi.setSystemTime(new Date('2025-10-29T10:30:00.000Z'));

    // Given: fetch APIをモック（呼ばれないことを確認するため）
    const mockFetch = vi.fn();
    global.fetch = mockFetch as any;

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const idToken = await tokenManager.getIdToken();

    // Then: キャッシュのIDトークンが返される
    expect(idToken).toBe('cached_token_xyz789');

    // Then: fetch APIが呼ばれない（キャッシュから取得）
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * TC-NORMAL-003: トークン有効期限切れ時の自動再取得 🔵
   *
   * 【テスト目的】: キャッシュされたトークンが有効期限切れの場合、
   *                 自動的に新しいトークンを取得し、
   *                 キャッシュを更新できることを確認
   *
   * 【要件根拠】: REQ-604, REQ-003
   */
  it('TC-NORMAL-003: トークン有効期限切れ時の自動再取得', async () => {
    // Given: 期限切れのキャッシュファイルが存在する
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        id_token: 'expired_token_old123',
        obtained_at: '2025-10-29T09:00:00.000Z',
        expires_at: '2025-10-29T10:00:00.000Z', // 過去の時刻
      })
    );

    // Given: 現在時刻を10:30（有効期限から30分経過）にモック
    vi.setSystemTime(new Date('2025-10-29T10:30:00.000Z'));

    // Given: fetch APIをモック（新しいトークン取得）
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ idToken: 'new_token_fresh456' }),
      } as Response)
    );
    global.fetch = mockFetch as any;

    // Given: ファイル書き込みをモック
    const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    // When: TokenManagerを初期化し、getIdToken()を呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const idToken = await tokenManager.getIdToken();

    // Then: 新しいIDトークンが返される
    expect(idToken).toBe('new_token_fresh456');

    // Then: fetch APIが1回呼ばれる（トークン再取得）
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Then: キャッシュファイルが更新される
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.stringMatching(/data[\\/]token\.json/),
      expect.stringContaining('new_token_fresh456'),
      'utf-8'
    );
  });

  /**
   * TC-NORMAL-004: トークンキャッシュの保存 🔵
   *
   * 【テスト目的】: IDトークンを正しい形式でJSONファイルに
   *                 キャッシュできることを確認
   *
   * 【要件根拠】: REQ-003
   */
  it('TC-NORMAL-004: トークンキャッシュの保存', () => {
    // Given: 現在時刻を固定
    vi.setSystemTime(new Date('2025-10-29T10:00:00.000Z'));

    // Given: ファイル書き込みをモック
    const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    // When: cacheToken()メソッドを呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    tokenManager.cacheToken('test_token_abc123', 3600);

    // Then: ファイルが作成される
    expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);

    // Then: ファイル内容が正しい形式
    const savedContent = JSON.parse(writeFileSyncSpy.mock.calls[0][1] as string);
    expect(savedContent).toEqual({
      id_token: 'test_token_abc123',
      obtained_at: '2025-10-29T10:00:00.000Z',
      expires_at: '2025-10-29T11:00:00.000Z', // obtained_at + 3600秒
    });
  });

  /**
   * TC-NORMAL-005: トークンキャッシュの読み込み 🔵
   *
   * 【テスト目的】: キャッシュファイルから正しくトークン情報を
   *                 読み込めることを確認
   *
   * 【要件根拠】: REQ-003
   */
  it('TC-NORMAL-005: トークンキャッシュの読み込み', () => {
    // Given: キャッシュファイルが存在する
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        id_token: 'cached_token_xyz789',
        obtained_at: '2025-10-29T10:00:00.000Z',
        expires_at: '2025-10-29T11:00:00.000Z',
      })
    );

    // When: loadCachedToken()メソッドを呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const cachedToken = tokenManager.loadCachedToken();

    // Then: TokenCacheオブジェクトが返される
    expect(cachedToken).toEqual({
      id_token: 'cached_token_xyz789',
      obtained_at: '2025-10-29T10:00:00.000Z',
      expires_at: '2025-10-29T11:00:00.000Z',
    });
  });

  /**
   * TC-NORMAL-006: 有効期限チェック（有効なトークン）🔵
   *
   * 【テスト目的】: 有効期限が5分以上先のトークンが
   *                 「有効」と判定されることを確認
   *
   * 【要件根拠】: REQ-604
   */
  it('TC-NORMAL-006: 有効期限チェック（有効なトークン）', () => {
    // Given: 現在時刻を10:00にモック
    vi.setSystemTime(new Date('2025-10-29T10:00:00.000Z'));

    // Given: 有効期限が11:00（1時間後）
    const expiresAt = '2025-10-29T11:00:00.000Z';

    // When: isTokenExpired()メソッドを呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const isExpired = tokenManager.isTokenExpired(expiresAt);

    // Then: 期限切れでないと判定される（false）
    expect(isExpired).toBe(false);
  });

  /**
   * TC-NORMAL-007: 有効期限チェック（期限切れトークン）🔵
   *
   * 【テスト目的】: 有効期限が過去、または5分以内のトークンが
   *                 「期限切れ」と判定されることを確認
   *
   * 【要件根拠】: REQ-604
   */
  it('TC-NORMAL-007: 有効期限チェック（期限切れトークン）', () => {
    // Given: 現在時刻を10:06にモック
    vi.setSystemTime(new Date('2025-10-29T10:06:00.000Z'));

    // Given: 有効期限が10:10（4分後、安全マージン5分以内）
    const expiresAt = '2025-10-29T10:10:00.000Z';

    // When: isTokenExpired()メソッドを呼び出す
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const isExpired = tokenManager.isTokenExpired(expiresAt);

    // Then: 期限切れと判定される（true）
    expect(isExpired).toBe(true);
  });

  /**
   * TC-NORMAL-008: 認証APIからのトークン取得 🔵
   *
   * 【テスト目的】: J-Quants APIからIDトークンを
   *                 正しく取得できることを確認
   *
   * 【要件根拠】: REQ-002
   */
  it('TC-NORMAL-008: 認証APIからのトークン取得', async () => {
    // Given: キャッシュファイルが存在しない
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    // Given: fetch APIをモック（成功レスポンス）
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ idToken: 'api_token_jwt123' }),
      } as Response)
    );
    global.fetch = mockFetch as any;

    // Given: ファイル書き込みをモック
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    // When: getIdToken()メソッドを呼び出す（キャッシュがないため内部でAPIを呼び出す）
    const tokenManager = new TokenManager({
      refreshToken: 'valid_refresh_token_abc123',
    });
    const idToken = await tokenManager.getIdToken();

    // Then: IDトークンが返される
    expect(idToken).toBe('api_token_jwt123');

    // Then: fetch APIが正しいエンドポイントに呼ばれる
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.jquants.com/v1/token/auth_user',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshtoken: 'valid_refresh_token_abc123' }),
      })
    );
  });
});
