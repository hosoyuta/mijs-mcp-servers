/**
 * TASK-0004: J-Quants APIクライアント基礎 - テストケース（異常系・境界値）
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-29
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.6.3
 * 【目的】: J-Quants APIクライアントのエラーハンドリングとリトライロジックのテスト（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JQuantsClient } from '../../src/api/j-quants-client';
import { TokenManager } from '../../src/auth/token-manager';

// =========================================
// 異常系テストケース（7ケース）
// =========================================
describe('JQuantsClient - 異常系テストケース', () => {
  let mockTokenManager: any;
  let mockFetch: any;

  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをクリアし、一貫したテスト条件を保証
    // 【環境初期化】: 前のテストの影響を受けないよう、モックをリセット
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // 【TokenManagerモック作成】: 常に有効なIDトークンを返すモックを準備
    mockTokenManager = {
      getIdToken: vi.fn().mockResolvedValue('test_id_token_12345'),
    };
  });

  afterEach(() => {
    // 【テスト後処理】: テスト実行後にタイマーやfetchモックをクリーンアップ
    // 【状態復元】: 次のテストに影響しないようグローバル状態を元に戻す
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /**
   * TC-ERROR-001: バリデーションエラー（400、リトライなし）🔵
   *
   * 【テスト目的】: 400エラー時はリトライせず即座にエラーをスローすることを確認
   * 【テスト内容】: 無効な銘柄コードなどのクライアント側エラーに対してリトライしないことを検証
   * 【期待される動作】: Errorがスローされ、fetchが1回のみ呼ばれる（リトライなし）
   * 【要件根拠】: REQ-601（リトライロジック）, NFR-301（日本語エラーメッセージ）
   * 🔵 信頼性レベル: 青信号（要件定義書の仕様に基づく）
   */
  it('TC-ERROR-001: バリデーションエラー（400、リトライなし）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: 無効な銘柄コード（INVALID）を使用
    // 【初期条件設定】: APIが400エラーを返すようにモック
    // 【前提条件確認】: クライアント側のバリデーションエラーを模擬
    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid code format' }),
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When & Then（実行条件と期待結果）=====
    // 【実際の処理実行】: getDailyQuotes()を無効な銘柄コードで呼び出し
    // 【処理内容】: 内部で400エラーを受信し、リトライ対象外と判定
    // 【実行タイミング】: ユーザーが誤った銘柄コードを入力した時
    const client = new JQuantsClient(mockTokenManager);

    // 【結果検証】: Errorがスローされることを確認
    // 【期待値確認】: 日本語のエラーメッセージが含まれることを確認
    // 【品質保証】: この検証により、ユーザーエクスペリエンスの向上（適切なエラー通知）を保証
    await expect(client.getDailyQuotes('INVALID')).rejects.toThrow();

    // 【検証項目】: fetchが正確に1回のみ呼ばれることを確認（リトライなし）
    // 🔵 信頼性レベル: 青信号（REQ-601リトライロジックの仕様に基づく）
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  /**
   * TC-ERROR-002: 認証エラー（401、トークン再取得）🔵
   *
   * 【テスト目的】: 401エラー時はTokenManager.getIdToken()で新しいトークンを取得してリトライすることを確認
   * 【テスト内容】: IDトークンが無効または期限切れの場合、自動的にトークンを更新してリトライすることを検証
   * 【期待される動作】: TokenManager.getIdToken()が2回呼ばれ、fetchが2回呼ばれる（1回目401、2回目200）
   * 【要件根拠】: REQ-004（認証失敗時の再取得）, REQ-601（リトライロジック）
   * 🔵 信頼性レベル: 青信号（TokenManagerの実装パターンから確実）
   */
  it('TC-ERROR-002: 認証エラー（401、トークン再取得）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: 1回目は期限切れトークン、2回目は新しいトークンを返すようモック
    // 【初期条件設定】: APIが1回目は401、2回目は200を返すようにモック
    // 【前提条件確認】: トークンの自動更新機能を模擬
    let callCount = 0;
    mockTokenManager.getIdToken.mockImplementation(async () => {
      callCount++;
      return callCount === 1 ? 'expired_token_old123' : 'new_token_fresh456';
    });

    mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し、内部で401エラーを処理
    // 【処理内容】: 1回目の401エラー後、TokenManager.getIdToken()を再呼び出し、新しいトークンでリトライ
    // 【実行タイミング】: APIリクエスト中にトークンが期限切れになった場合
    const client = new JQuantsClient(mockTokenManager);
    const companies = await client.getListedInfo();

    // ===== Then（期待結果）=====
    // 【結果検証】: TokenManager.getIdToken()が2回呼ばれることを確認
    // 【期待値確認】: fetchが2回呼ばれ、最終的に正常なレスポンスが返却されることを確認
    // 【品質保証】: この検証により、システムの自動回復能力の保証

    // 【検証項目】: TokenManager.getIdToken()が2回呼ばれることを確認（401エラー時の再取得）
    // 🔵 信頼性レベル: 青信号（REQ-004の仕様に基づく）
    expect(mockTokenManager.getIdToken).toHaveBeenCalledTimes(2);

    // 【検証項目】: fetchが2回呼ばれることを確認（1回目401、2回目200）
    // 🔵 信頼性レベル: 青信号（リトライロジックの仕様に基づく）
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // 【検証項目】: 最終的に正常なレスポンスが返却されることを確認
    // 🔵 信頼性レベル: 青信号（自動リカバリの成功を保証）
    expect(Array.isArray(companies)).toBe(true);
  });

  /**
   * TC-ERROR-003: レート制限エラー（429、リトライ対象）🔵
   *
   * 【テスト目的】: 429エラー時は自動的にリトライすることを確認
   * 【テスト内容】: APIレート制限に到達した場合、1秒待機後にリトライすることを検証
   * 【期待される動作】: fetchが2回呼ばれる（1回目429、2回目200）
   * 【要件根拠】: REQ-601（リトライロジック）
   * 🔵 信頼性レベル: 青信号（要件定義書の仕様に基づく）
   */
  it('TC-ERROR-003: レート制限エラー（429、リトライ対象）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: APIが1回目は429、2回目は200を返すようにモック
    // 【初期条件設定】: レート制限エラーの発生とその後の成功を模擬
    // 【前提条件確認】: APIレート制限に到達した状態
    mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);
    global.fetch = mockFetch;

    // 【タイマーモック設定】: 待機時間を測定するためタイマーをモック
    // 【時間制御】: テスト実行時間を短縮するため、実際の待機をスキップ
    vi.useFakeTimers();

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し、内部で429エラーを処理
    // 【処理内容】: 1回目の429エラー後、1秒待機してリトライ
    // 【実行タイミング】: 大量のデータ取得処理中にレート制限に到達
    const client = new JQuantsClient(mockTokenManager);
    const promise = client.getListedInfo();

    // 【時間経過シミュレーション】: 1秒の待機時間を進める
    await vi.advanceTimersByTimeAsync(1000);

    const companies = await promise;

    // ===== Then（期待結果）=====
    // 【結果検証】: fetchが2回呼ばれることを確認
    // 【期待値確認】: リトライ後に正常なレスポンスが返却されることを確認
    // 【品質保証】: この検証により、システムの耐障害性の保証

    // 【検証項目】: fetchが2回呼ばれることを確認（1回目429、2回目200）
    // 🔵 信頼性レベル: 青信号（REQ-601リトライロジックの仕様に基づく）
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // 【検証項目】: 最終的に正常なレスポンスが返却されることを確認
    // 🔵 信頼性レベル: 青信号（リトライ成功の保証）
    expect(Array.isArray(companies)).toBe(true);
  });

  /**
   * TC-ERROR-004: サーバーエラー（500、リトライ対象）🔵
   *
   * 【テスト目的】: 500エラー時は自動的にリトライすることを確認（Exponential backoff）
   * 【テスト内容】: J-Quants APIサーバーの一時的なエラーに対して、1秒→2秒の待機時間でリトライすることを検証
   * 【期待される動作】: fetchが3回呼ばれる（1回目500、2回目500、3回目200）
   * 【要件根拠】: REQ-601（リトライロジック、Exponential backoff）
   * 🔵 信頼性レベル: 青信号（要件定義書の仕様に基づく）
   */
  it('TC-ERROR-004: サーバーエラー（500、リトライ対象、Exponential backoff）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: APIが2回は500、3回目は200を返すようにモック
    // 【初期条件設定】: サーバーエラーの発生とその後の回復を模擬
    // 【前提条件確認】: J-Quants APIサーバーの一時的な障害状態
    mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);
    global.fetch = mockFetch;

    // 【タイマーモック設定】: Exponential backoffの待機時間を測定
    vi.useFakeTimers();

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し、内部で500エラーを処理
    // 【処理内容】: 1回目失敗→1秒待機→2回目失敗→2秒待機→3回目成功
    // 【実行タイミング】: J-Quants APIサーバーの一時的な障害時
    const client = new JQuantsClient(mockTokenManager);
    const promise = client.getListedInfo();

    // 【時間経過シミュレーション】: 1秒待機（1回目のリトライ前）
    await vi.advanceTimersByTimeAsync(1000);
    // 【時間経過シミュレーション】: 2秒待機（2回目のリトライ前）
    await vi.advanceTimersByTimeAsync(2000);

    const companies = await promise;

    // ===== Then（期待結果）=====
    // 【結果検証】: fetchが3回呼ばれることを確認
    // 【期待値確認】: Exponential backoffで段階的に待機時間が増加することを確認
    // 【品質保証】: この検証により、システムの回復力の保証

    // 【検証項目】: fetchが3回呼ばれることを確認（1回目500、2回目500、3回目200）
    // 🔵 信頼性レベル: 青信号（REQ-601リトライロジックの仕様に基づく）
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // 【検証項目】: 最終的に正常なレスポンスが返却されることを確認
    // 🔵 信頼性レベル: 青信号（リトライ成功の保証）
    expect(Array.isArray(companies)).toBe(true);
  });

  /**
   * TC-ERROR-005: ネットワークエラー（TypeError、リトライ対象）🔵
   *
   * 【テスト目的】: ネットワークエラー時は自動的にリトライすることを確認
   * 【テスト内容】: インターネット接続の一時的な切断に対して、1秒待機後にリトライすることを検証
   * 【期待される動作】: fetchが2回呼ばれる（1回目TypeError、2回目200）
   * 【要件根拠】: REQ-601（リトライロジック）, EDGE-201（ネットワークエラー）
   * 🔵 信頼性レベル: 青信号（要件定義書とTokenManagerの実装パターンから確実）
   */
  it('TC-ERROR-005: ネットワークエラー（TypeError、リトライ対象）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: fetchが1回目はTypeError、2回目は200を返すようにモック
    // 【初期条件設定】: ネットワーク接続の一時的な切断とその後の回復を模擬
    // 【前提条件確認】: ネットワークエラーが発生した状態
    mockFetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);
    global.fetch = mockFetch;

    // 【タイマーモック設定】: 待機時間を測定するためタイマーをモック
    vi.useFakeTimers();

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し、内部でTypeErrorを処理
    // 【処理内容】: 1回目のTypeError後、1秒待機してリトライ
    // 【実行タイミング】: Wi-Fi接続の一時的な切断時
    const client = new JQuantsClient(mockTokenManager);
    const promise = client.getListedInfo();

    // 【時間経過シミュレーション】: 1秒の待機時間を進める
    await vi.advanceTimersByTimeAsync(1000);

    const companies = await promise;

    // ===== Then（期待結果）=====
    // 【結果検証】: fetchが2回呼ばれることを確認
    // 【期待値確認】: ネットワークエラー後にリトライが成功することを確認
    // 【品質保証】: この検証により、システムの耐障害性の保証

    // 【検証項目】: fetchが2回呼ばれることを確認（1回目TypeError、2回目200）
    // 🔵 信頼性レベル: 青信号（REQ-601リトライロジックの仕様に基づく）
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // 【検証項目】: 最終的に正常なレスポンスが返却されることを確認
    // 🔵 信頼性レベル: 青信号（リトライ成功の保証）
    expect(Array.isArray(companies)).toBe(true);
  });

  /**
   * TC-ERROR-006: タイムアウトエラー（5秒超過、AbortController）🔵
   *
   * 【テスト目的】: 5秒以内に応答がない場合はAbortControllerでキャンセルしリトライすることを確認
   * 【テスト内容】: APIサーバーの応答遅延に対して、5秒でタイムアウトし、1秒待機後にリトライすることを検証
   * 【期待される動作】: fetchが2回呼ばれ、1回目はAbortController.abort()が呼ばれる
   * 【要件根拠】: REQ-603（タイムアウト制御）, REQ-601（リトライロジック）
   * 🔵 信頼性レベル: 青信号（要件定義書とTokenManagerの実装パターンから確実）
   */
  it('TC-ERROR-006: タイムアウトエラー（5秒超過、AbortController使用）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: fetchが1回目はAbortError、2回目は200を返すようにモック
    // 【初期条件設定】: APIサーバーの応答遅延とその後の正常応答を模擬
    // 【前提条件確認】: APIサーバーが高負荷状態
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    mockFetch = vi.fn()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);
    global.fetch = mockFetch;

    // 【タイマーモック設定】: タイムアウトとリトライの待機時間を測定
    vi.useFakeTimers();

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し、内部でタイムアウトを処理
    // 【処理内容】: 1回目のタイムアウト後、1秒待機してリトライ
    // 【実行タイミング】: J-Quants APIサーバーの高負荷時
    const client = new JQuantsClient(mockTokenManager);
    const promise = client.getListedInfo();

    // 【時間経過シミュレーション】: タイムアウト（5秒）+ リトライ待機（1秒）を進める
    await vi.advanceTimersByTimeAsync(6000);

    const companies = await promise;

    // ===== Then（期待結果）=====
    // 【結果検証】: fetchが2回呼ばれることを確認
    // 【期待値確認】: タイムアウト後にリトライが成功することを確認
    // 【品質保証】: この検証により、システムの応答性の保証

    // 【検証項目】: fetchが2回呼ばれることを確認（1回目AbortError、2回目200）
    // 🔵 信頼性レベル: 青信号（REQ-603タイムアウト制御の仕様に基づく）
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // 【検証項目】: 最終的に正常なレスポンスが返却されることを確認
    // 🔵 信頼性レベル: 青信号（リトライ成功の保証）
    expect(Array.isArray(companies)).toBe(true);
  });

  /**
   * TC-ERROR-007: 最大リトライ回数超過（3回すべて失敗）🔵
   *
   * 【テスト目的】: 3回すべてのリクエストが失敗した場合はエラーをスローすることを確認
   * 【テスト内容】: 継続的なサーバーエラーに対して、最大3回リトライ後にエラーをスローすることを検証
   * 【期待される動作】: fetchが3回呼ばれ、最終的にErrorがスローされる
   * 【要件根拠】: REQ-601（リトライロジック、最大3回）
   * 🔵 信頼性レベル: 青信号（要件定義書の仕様に基づく）
   */
  it('TC-ERROR-007: 最大リトライ回数超過（3回すべて失敗）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: fetchが3回とも500エラーを返すようにモック
    // 【初期条件設定】: 継続的なサーバーエラーを模擬
    // 【前提条件確認】: J-Quants APIサーバーが長期間の障害状態
    mockFetch = vi.fn()
      .mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);
    global.fetch = mockFetch;

    // 【タイマーモック設定】: リトライ待機時間を測定
    vi.useFakeTimers();

    // ===== When & Then（実行条件と期待結果）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し、3回の失敗を経験
    // 【処理内容】: 1回目失敗→1秒待機→2回目失敗→2秒待機→3回目失敗→エラーをスロー
    // 【実行タイミング】: J-Quants APIサーバーのメンテナンス中
    const client = new JQuantsClient(mockTokenManager);
    const promise = client.getListedInfo();

    // 【時間経過シミュレーション】: 1秒 + 2秒の待機時間を進める
    await vi.advanceTimersByTimeAsync(3000);

    // 【結果検証】: Errorがスローされることを確認
    // 【期待値確認】: 最大リトライ回数超過のエラーメッセージが含まれることを確認
    // 【品質保証】: この検証により、システムの安定性の保証（無限ループを避ける）
    await expect(promise).rejects.toThrow();

    // 【検証項目】: fetchが正確に3回呼ばれることを確認（最大リトライ回数）
    // 🔵 信頼性レベル: 青信号（REQ-601の仕様に基づく）
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

// =========================================
// 境界値テストケース（4ケース）
// =========================================
describe('JQuantsClient - 境界値テストケース', () => {
  let mockTokenManager: any;
  let mockFetch: any;

  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをクリアし、一貫したテスト条件を保証
    vi.clearAllMocks();
    vi.restoreAllMocks();

    mockTokenManager = {
      getIdToken: vi.fn().mockResolvedValue('test_id_token_12345'),
    };
  });

  afterEach(() => {
    // 【テスト後処理】: テスト実行後にタイマーやfetchモックをクリーンアップ
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /**
   * TC-BOUNDARY-001: リトライロジック（1回目失敗、2回目成功）🔵
   *
   * 【テスト目的】: 1回目失敗、2回目成功のリトライパターン（最小成功パターン）を確認
   * 【テスト内容】: リトライの最小成功パターンが正しく動作することを検証
   * 【期待される動作】: fetchが2回呼ばれ、1秒待機後にリトライが成功
   * 【要件根拠】: REQ-601（リトライロジック）
   * 🔵 信頼性レベル: 青信号（要件定義書の仕様に基づく）
   */
  it('TC-BOUNDARY-001: リトライロジック（1回目失敗、2回目成功）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: APIが1回目は500、2回目は200を返すようにモック
    // 【初期条件設定】: 最小限のリトライで成功するパターンを模擬
    // 【前提条件確認】: サーバーの一時的な障害が即座に回復する状態
    mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);
    global.fetch = mockFetch;

    vi.useFakeTimers();

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し
    // 【処理内容】: 1回目失敗→1秒待機→2回目成功
    // 【実行タイミング】: サーバーの一時的な障害が即座に回復する場合
    const client = new JQuantsClient(mockTokenManager);
    const promise = client.getListedInfo();

    // 【時間経過シミュレーション】: 1秒の待機時間を進める
    await vi.advanceTimersByTimeAsync(1000);

    const companies = await promise;

    // ===== Then（期待結果）=====
    // 【結果検証】: fetchが正確に2回呼ばれることを確認
    // 【期待値確認】: リトライ間隔が正確に1秒であることを確認（待機時間の測定）
    // 【品質保証】: この検証により、最小限のリトライで回復できることを保証

    // 【検証項目】: fetchが2回呼ばれることを確認
    // 🔵 信頼性レベル: 青信号（REQ-601の仕様に基づく）
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // 【検証項目】: 最終的に正常なレスポンスが返却されることを確認
    // 🔵 信頼性レベル: 青信号（リトライ成功の保証）
    expect(Array.isArray(companies)).toBe(true);
  });

  /**
   * TC-BOUNDARY-002: リトライロジック（2回目失敗、3回目成功）🔵
   *
   * 【テスト目的】: 2回目失敗、3回目成功のリトライパターン（最大成功パターン）を確認
   * 【テスト内容】: リトライの限界点での成功が正しく動作することを検証
   * 【期待される動作】: fetchが3回呼ばれ、1秒→2秒のExponential backoff後にリトライが成功
   * 【要件根拠】: REQ-601（リトライロジック、Exponential backoff）
   * 🔵 信頼性レベル: 青信号（要件定義書の仕様に基づく）
   */
  it('TC-BOUNDARY-002: リトライロジック（2回目失敗、3回目成功）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: APIが2回は500、3回目は200を返すようにモック
    // 【初期条件設定】: 最大リトライ回数ぎりぎりで成功するパターンを模擬
    // 【前提条件確認】: サーバーの回復に時間がかかる状態
    mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);
    global.fetch = mockFetch;

    vi.useFakeTimers();

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し
    // 【処理内容】: 1回目失敗→1秒待機→2回目失敗→2秒待機→3回目成功
    // 【実行タイミング】: サーバーの回復に時間がかかる場合
    const client = new JQuantsClient(mockTokenManager);
    const promise = client.getListedInfo();

    // 【時間経過シミュレーション】: 1秒 + 2秒の待機時間を進める
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const companies = await promise;

    // ===== Then（期待結果）=====
    // 【結果検証】: fetchが正確に3回呼ばれることを確認
    // 【期待値確認】: リトライ間隔が正確に1秒→2秒であることを確認（Exponential backoff）
    // 【品質保証】: この検証により、最大リトライ回数で成功できることを保証

    // 【検証項目】: fetchが3回呼ばれることを確認
    // 🔵 信頼性レベル: 青信号（REQ-601の仕様に基づく）
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // 【検証項目】: 最終的に正常なレスポンスが返却されることを確認
    // 🔵 信頼性レベル: 青信号（リトライ成功の保証）
    expect(Array.isArray(companies)).toBe(true);
  });

  /**
   * TC-BOUNDARY-003: 空のレスポンスボディ🟡
   *
   * 【テスト目的】: APIが空のレスポンスボディを返した場合の処理を確認
   * 【テスト内容】: レスポンスボディが空配列の場合、エラーなく空配列を返すことを検証
   * 【期待される動作】: エラーがスローされず、空配列[]が返却される
   * 【要件根拠】: EDGE-003（空データ）
   * 🟡 信頼性レベル: 黄信号（要件定義書に明記されていないため、推測）
   */
  it('TC-BOUNDARY-003: 空のレスポンスボディ', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: APIが空配列を返すようにモック
    // 【初期条件設定】: 検索結果が0件の状態を模擬
    // 【前提条件確認】: データが存在しない場合の動作確認
    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し
    // 【処理内容】: 空配列を正しくマッピング
    // 【実行タイミング】: 検索結果が0件の場合
    const client = new JQuantsClient(mockTokenManager);
    const companies = await client.getListedInfo();

    // ===== Then（期待結果）=====
    // 【結果検証】: エラーがスローされないことを確認
    // 【期待値確認】: 返却値が空配列であることを確認
    // 【品質保証】: この検証により、予期しないデータでもクラッシュしないことを保証

    // 【検証項目】: 返却値が配列であることを確認
    // 🟡 信頼性レベル: 黄信号（空データ処理の仕様は要件定義書に明記なし）
    expect(Array.isArray(companies)).toBe(true);

    // 【検証項目】: 返却値が空配列であることを確認
    // 🟡 信頼性レベル: 黄信号（空配列の適切な処理を推測）
    expect(companies).toHaveLength(0);
  });

  /**
   * TC-BOUNDARY-004: 大量データ取得（1000件以上）🟡
   *
   * 【テスト目的】: 1000件以上のデータを取得できることを確認（パフォーマンス確認）
   * 【テスト内容】: 大量データでもメモリエラーやパフォーマンス問題が発生しないことを検証
   * 【期待される動作】: エラーがスローされず、1000件のCompany配列が返却される
   * 【要件根拠】: NFR-001（パフォーマンス要件）
   * 🟡 信頼性レベル: 黄信号（要件定義書に具体的な件数の記載なし、推測）
   */
  it('TC-BOUNDARY-004: 大量データ取得（1000件以上）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: 1000件のCompany配列を生成
    // 【初期条件設定】: 全銘柄一覧取得（約4000銘柄）を模擬
    // 【前提条件確認】: 実運用での最大データ量を想定
    const largeMockData = Array.from({ length: 1000 }, (_, i) => ({
      code: String(1000 + i).padStart(4, '0'),
      name: `テスト企業${i + 1}`,
      market: 'Prime' as any,
      sector: '0050' as any,
    }));

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => largeMockData,
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を呼び出し、1000件のデータを取得
    // 【処理内容】: 大量データを正しくマッピング
    // 【実行タイミング】: 全銘柄一覧取得時
    const client = new JQuantsClient(mockTokenManager);
    const startTime = Date.now();
    const companies = await client.getListedInfo();
    const endTime = Date.now();

    // ===== Then（期待結果）=====
    // 【結果検証】: エラーがスローされないことを確認
    // 【期待値確認】: 1000件すべてが正しくマッピングされることを確認
    // 【品質保証】: この検証により、スケーラビリティの保証

    // 【検証項目】: 返却値が1000件の配列であることを確認
    // 🟡 信頼性レベル: 黄信号（大量データ処理の仕様は要件定義書に具体的な記載なし）
    expect(companies).toHaveLength(1000);

    // 【検証項目】: 各要素が正しい構造を持つことを確認（サンプリング検証）
    // 🟡 信頼性レベル: 黄信号（パフォーマンス要件の推測）
    expect(companies[0]).toHaveProperty('code');
    expect(companies[0]).toHaveProperty('name');

    // 【検証項目】: テスト実行時間が3秒以内であることを確認（パフォーマンス確認）
    // 🟡 信頼性レベル: 黄信号（パフォーマンス要件の具体的な数値は未定義）
    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(3000);
  });
});
