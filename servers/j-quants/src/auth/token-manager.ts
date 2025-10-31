/**
 * TASK-0003: 認証・トークン管理 (Token Manager)
 *
 * 【機能概要】: J-Quants APIへの認証を管理し、リフレッシュトークンから
 *              IDトークンを取得・管理するコンポーネント
 * 【実装方針】: TDD Green Phaseの原則に従い、テストを通すための最小実装
 * 【テスト対応】: 21件のテストケース（正常系8件、異常系7件、境界値6件）
 *
 * @module TokenManager
 */

import fs from 'fs';
import path from 'path';

/**
 * 【型定義】: トークンキャッシュの構造
 * 🔵 信頼性: 高（interfaces.ts、要件定義書ベース）
 */
interface TokenCache {
  id_token: string;       // IDトークン
  obtained_at: string;    // 取得時刻（ISO 8601形式）
  expires_at: string;     // 有効期限（ISO 8601形式）
}

/**
 * 【型定義】: TokenManagerの設定
 * 🔵 信頼性: 高（token-manager-requirements.md ベース）
 */
interface TokenManagerConfig {
  refreshToken: string;   // リフレッシュトークン（必須）
  cacheDir?: string;      // キャッシュディレクトリ（デフォルト: 'data'）
  apiBaseUrl?: string;    // APIベースURL（デフォルト: 'https://api.jquants.com/v1'）
}

/**
 * 【定数定義】: 設定値の集中管理
 * 【設計方針】: マジックナンバーを排除し、可読性と保守性を向上
 * 【調整可能性】: 将来的な調整を容易にするため定数化
 * 🔵 信頼性: 高（REQ-601, REQ-603, REQ-604 ベース）
 */

/**
 * 【安全マージン】: トークン有効期限チェック時の余裕時間（5分 = 300秒）
 * 【用途】: APIリクエスト中にトークンが期限切れになることを防ぐ
 * 【理由】: ネットワーク遅延やAPI処理時間を考慮した安全マージン
 * 🔵 信頼性: 高（REQ-604）
 */
const SAFETY_MARGIN_MS = 300 * 1000; // 5分

/**
 * 【リトライ設定】: API呼び出し失敗時の再試行回数
 * 【最大試行回数】: 初回 + リトライ2回 = 合計3回
 * 【理由】: 一時的なネットワークエラーやAPIメンテナンスに対応
 * 🔵 信頼性: 高（REQ-601）
 */
const MAX_RETRY_ATTEMPTS = 2; // 初回 + 2回リトライ = 合計3回

/**
 * 【Exponential Backoff設定】: リトライ間隔（ミリ秒）
 * 【待機時間】: 1回目失敗後→1秒、2回目失敗後→2秒
 * 【理由】: APIサーバーへの負荷軽減と成功率向上
 * 🔵 信頼性: 高（REQ-601、architecture.md エラーハンドリング戦略）
 */
const RETRY_DELAYS_MS = [1000, 2000]; // [1秒, 2秒]

/**
 * 【APIタイムアウト】: HTTP リクエストのタイムアウト時間（5秒）
 * 【理由】: ユーザビリティを考慮した適切な待機時間
 * 🔵 信頼性: 高（REQ-603、NFR-001）
 */
const API_TIMEOUT_MS = 5000; // 5秒

/**
 * 【トークン有効期限】: IDトークンのデフォルト有効期間（秒）
 * 【設定値】: 3600秒 = 1時間
 * 【理由】: J-Quants APIの標準的なトークン有効期限
 * 🟡 信頼性: 中（API仕様から推測）
 */
const DEFAULT_TOKEN_EXPIRY_SECONDS = 3600; // 1時間

/**
 * 【デフォルト設定】: キャッシュディレクトリとAPIベースURL
 * 🔵 信頼性: 高（tech-stack.md、api-integration.md）
 */
const DEFAULT_CACHE_DIR = 'data';
const DEFAULT_API_BASE_URL = 'https://api.jquants.com/v1';

/**
 * TokenManager クラス
 *
 * 【機能概要】: J-Quants API認証トークンの取得・管理
 * 【実装方針】: テストケースを1つずつ通すためのシンプルな実装
 * 【設計根拠】: architecture.md 第4章「認証モジュール」、
 *              dataflow.md「起動・認証フロー」
 * 🔵 信頼性: 高（EARS要件定義書、設計文書ベース）
 */
export class TokenManager {
  private refreshToken: string;
  private cacheDir: string;
  private apiBaseUrl: string;
  private cacheFilePath: string;

  /**
   * 【コンストラクタ】: TokenManagerインスタンスの初期化
   * 【実装方針】: 環境変数未設定エラー（TC-ERROR-001）に対応
   * 【テスト対応】: TC-ERROR-001（環境変数未設定エラー）
   *
   * @param config - TokenManager設定
   * @throws {Error} refreshTokenが未設定の場合
   * 🔵 信頼性: 高（REQ-1101、EDGE-003 ベース）
   */
  constructor(config: TokenManagerConfig) {
    // 【環境変数検証】: リフレッシュトークンの存在確認
    // 【エラー処理】: TC-ERROR-001（環境変数未設定エラー）に対応
    // 🔵 信頼性: 高（EDGE-003、NFR-301）
    if (!config.refreshToken || config.refreshToken.trim() === '') {
      throw new Error('環境変数 J_QUANTS_REFRESH_TOKEN を設定してください');
    }

    this.refreshToken = config.refreshToken;
    this.cacheDir = config.cacheDir || DEFAULT_CACHE_DIR;
    this.apiBaseUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;

    // 【キャッシュファイルパス構築】: プラットフォーム非依存のパス生成
    // 🔵 信頼性: 高（REQ-003）
    this.cacheFilePath = path.join(this.cacheDir, 'token.json');
  }

  /**
   * 【メインメソッド】: IDトークンを取得（キャッシュ優先、期限切れ時は再取得）
   * 【実装方針】: テストケースTC-NORMAL-001, TC-NORMAL-002, TC-NORMAL-003を通すための実装
   * 【処理フロー】:
   *   1. キャッシュを確認
   *   2. キャッシュが有効 → キャッシュのトークンを返却
   *   3. キャッシュが無効or存在しない → 新規取得 → キャッシュ保存 → 返却
   * 【テスト対応】:
   *   - TC-NORMAL-001: 初回起動時のIDトークン取得
   *   - TC-NORMAL-002: キャッシュからのIDトークン取得
   *   - TC-NORMAL-003: トークン有効期限切れ時の自動再取得
   *
   * @returns {Promise<string>} 有効なIDトークン
   * @throws {Error} 認証失敗時、ネットワークエラー時
   * 🔵 信頼性: 高（REQ-002, REQ-003, REQ-604）
   */
  async getIdToken(): Promise<string> {
    // 【キャッシュ確認】: まずキャッシュからトークンを取得を試みる
    // 🔵 信頼性: 高（REQ-003）
    const cached = this.loadCachedToken();

    // 【キャッシュ有効性チェック】: キャッシュが存在し、有効期限内か確認
    // 【パフォーマンス最適化】: 有効なキャッシュがあればAPI呼び出しを省略
    // 🔵 信頼性: 高（NFR-002）
    if (cached && !this.isTokenExpired(cached.expires_at)) {
      // 【キャッシュ利用】: TC-NORMAL-002（キャッシュからのIDトークン取得）に対応
      return cached.id_token;
    }

    // 【新規トークン取得】: キャッシュが無効or存在しない場合、APIから取得
    // 【テスト対応】: TC-NORMAL-001, TC-NORMAL-003
    // 🔵 信頼性: 高（REQ-002, REQ-604）
    const newToken = await this.refreshTokenFromApi();

    // 【キャッシュ保存】: 取得したトークンをキャッシュに保存
    // 【有効期限】: APIレスポンスから取得（DEFAULT_TOKEN_EXPIRY_SECONDS = 1時間）
    // 🟡 信頼性: 中（APIレスポンス形式を推測）
    this.cacheToken(newToken, DEFAULT_TOKEN_EXPIRY_SECONDS);

    // 【トークン返却】: 新しく取得したIDトークンを返却
    return newToken;
  }

  /**
   * 【キャッシュ保存】: IDトークンをJSONファイルに保存
   * 【実装方針】: TC-NORMAL-004（トークンキャッシュの保存）を通すための実装
   * 【処理内容】:
   *   1. 現在時刻を記録（obtained_at）
   *   2. 有効期限を計算（expires_at = obtained_at + expiresIn * 1000）
   *   3. TokenCacheオブジェクトを作成
   *   4. JSONファイルに保存
   * 【テスト対応】: TC-NORMAL-004（トークンキャッシュの保存）
   *
   * @param token - IDトークン
   * @param expiresIn - 有効期限（秒単位）
   * 🔵 信頼性: 高（REQ-003、token-manager-requirements.md ベース）
   */
  cacheToken(token: string, expiresIn: number): void {
    // 【現在時刻取得】: トークン取得時刻を記録
    // 🔵 信頼性: 高（REQ-003）
    const now = new Date();
    const obtainedAt = now.toISOString();

    // 【有効期限計算】: obtained_at + expiresIn秒
    // 【計算式】: expiresIn（秒） → ミリ秒に変換して加算
    // 🔵 信頼性: 高（REQ-003）
    const expiresAt = new Date(now.getTime() + expiresIn * 1000).toISOString();

    // 【キャッシュデータ作成】: TokenCache型のオブジェクト
    // 🔵 信頼性: 高（interfaces.ts - TokenCache型）
    const cacheData: TokenCache = {
      id_token: token,
      obtained_at: obtainedAt,
      expires_at: expiresAt,
    };

    try {
      // 【ディレクトリ作成】: キャッシュディレクトリが存在しない場合は作成
      // 🔵 信頼性: 高（REQ-003）
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }

      // 【ファイル書き込み】: JSONファイルとして保存
      // 【フォーマット】: インデント2スペースで可読性確保
      // 【エンコーディング】: UTF-8
      // 🔵 信頼性: 高（REQ-003）
      fs.writeFileSync(
        this.cacheFilePath,
        JSON.stringify(cacheData, null, 2),
        'utf-8'
      );
    } catch (error) {
      // 【エラーハンドリング】: TC-ERROR-007（ファイル書き込みエラー）に対応
      // 【方針】: ファイル書き込み失敗時もIDトークンは返却する（グレースフルデグラデーション）
      // 【ログ記録】: エラー内容をログに記録（将来実装予定）
      // 🔵 信頼性: 高（NFR-102、REQ-602）
      console.error('トークンキャッシュファイルの書き込みに失敗しました:', error);
      // 【注意】: エラーをスローせずに処理続行（TC-ERROR-007の期待動作）
    }
  }

  /**
   * 【キャッシュ読み込み】: JSONファイルからトークン情報を取得
   * 【実装方針】: TC-NORMAL-005（トークンキャッシュの読み込み）を通すための実装
   * 【処理フロー】:
   *   1. ファイル存在確認
   *   2. ファイルが存在 → JSONパース → TokenCacheオブジェクト返却
   *   3. ファイルが存在しない → null返却
   *   4. パースエラー → null返却（ログ記録）
   * 【テスト対応】:
   *   - TC-NORMAL-005: トークンキャッシュの読み込み
   *   - TC-ERROR-005: キャッシュファイル破損
   *   - TC-BOUNDARY-003: 空のキャッシュファイル
   *
   * @returns {TokenCache | null} トークンキャッシュまたはnull
   * 🔵 信頼性: 高（REQ-003）
   */
  loadCachedToken(): TokenCache | null {
    try {
      // 【ファイル存在確認】: キャッシュファイルが存在するか確認
      // 🔵 信頼性: 高（REQ-003）
      if (!fs.existsSync(this.cacheFilePath)) {
        // 【キャッシュなし】: ファイルが存在しない場合はnullを返却
        return null;
      }

      // 【ファイル読み込み】: UTF-8エンコーディングで読み込み
      // 🔵 信頼性: 高（REQ-003）
      const data = fs.readFileSync(this.cacheFilePath, 'utf-8');

      // 【空ファイルチェック】: TC-BOUNDARY-003（空のキャッシュファイル）に対応
      // 🔵 信頼性: 高（TC-BOUNDARY-003）
      if (!data || data.trim() === '') {
        console.warn('トークンキャッシュファイルが空です');
        return null;
      }

      // 【JSONパース】: 文字列をTokenCacheオブジェクトに変換
      // 🔵 信頼性: 高（interfaces.ts - TokenCache型）
      const cache: TokenCache = JSON.parse(data);

      // 【キャッシュ返却】: 正常にパースできた場合はキャッシュを返却
      return cache;
    } catch (error) {
      // 【エラーハンドリング】: TC-ERROR-005（キャッシュファイル破損）に対応
      // 【方針】: パースエラー時はnullを返却（システムクラッシュを防ぐ）
      // 【ログ記録】: 警告メッセージを記録
      // 🔵 信頼性: 高（NFR-102、REQ-602）
      console.warn('トークンキャッシュファイルの読み込みに失敗しました:', error);
      // 【自動回復】: nullを返却することで、getIdToken()が新しいトークンを取得する
      return null;
    }
  }

  /**
   * 【有効期限チェック】: トークンが期限切れかどうかを判定
   * 【実装方針】: TC-NORMAL-006, TC-NORMAL-007, TC-BOUNDARY-001, TC-BOUNDARY-002を通すための実装
   * 【判定ロジック】:
   *   - 現在時刻 >= (有効期限 - 5分) → true（期限切れ）
   *   - 現在時刻 < (有効期限 - 5分) → false（有効）
   * 【安全マージン】: 5分（300秒）の余裕を持たせる
   * 【理由】: APIリクエスト中にトークンが期限切れになることを防ぐ
   * 【テスト対応】:
   *   - TC-NORMAL-006: 有効期限チェック（有効なトークン）
   *   - TC-NORMAL-007: 有効期限チェック（期限切れトークン）
   *   - TC-BOUNDARY-001: 有効期限ちょうど5分前
   *   - TC-BOUNDARY-002: 有効期限5分1秒前
   *
   * @param expiresAt - 有効期限（ISO 8601形式）
   * @returns {boolean} 期限切れならtrue、有効ならfalse
   * 🔵 信頼性: 高（REQ-604、token-manager-requirements.md ベース）
   */
  isTokenExpired(expiresAt: string): boolean {
    // 【現在時刻取得】: ミリ秒単位のタイムスタンプ
    // 🔵 信頼性: 高（REQ-604）
    const now = Date.now();

    // 【有効期限取得】: ISO 8601形式の文字列をミリ秒タイムスタンプに変換
    // 🔵 信頼性: 高（REQ-604）
    const expires = new Date(expiresAt).getTime();

    // 【期限切れ判定】: 安全マージン（5分）を考慮した判定
    // 【ロジック】: now >= (expires - SAFETY_MARGIN_MS) → 期限切れ
    // 【境界値】: TC-BOUNDARY-001（ちょうど5分前）で `>=` を使用
    // 🔵 信頼性: 高（REQ-604、TC-BOUNDARY-001, TC-BOUNDARY-002）
    return now >= (expires - SAFETY_MARGIN_MS);
  }

  /**
   * 【API認証】: J-Quants APIから新しいIDトークンを取得
   * 【実装方針】: TC-NORMAL-008を通すための実装
   * 【エンドポイント】: POST /token/auth_user
   * 【リクエストボディ】: { "refreshtoken": "<refresh_token>" }
   * 【リトライロジック】: REQ-601に基づき最大3回まで自動リトライ
   * 【リトライ対象】: 503, 5xx, ネットワークエラー
   * 【リトライ対象外】: 401, 400
   * 【バックオフ】: Exponential backoff (1秒, 2秒, 4秒)
   * 【テスト対応】:
   *   - TC-NORMAL-008: 認証APIからのトークン取得
   *   - TC-ERROR-002: 認証失敗エラー（401）
   *   - TC-ERROR-003: ネットワークエラー
   *   - TC-ERROR-004: APIタイムアウトエラー
   *   - TC-ERROR-006: APIメンテナンス中（503）
   *   - TC-BOUNDARY-005: リトライ回数境界値（3回目成功）
   *   - TC-BOUNDARY-006: リトライ回数超過（4回目なし）
   *
   * @returns {Promise<string>} IDトークン
   * @throws {Error} API呼び出し失敗時
   * 🔵 信頼性: 高（REQ-002, REQ-601、api-integration.md ベース）
   */
  private async refreshTokenFromApi(): Promise<string> {
    // 【リトライ設定】: REQ-601に基づく最大3回の試行（初回 + リトライ2回）
    // 【改善内容】: 定数を使用してマジックナンバーを排除
    // 🔵 信頼性: 高（REQ-601）
    let lastError: Error | null = null;

    // 【リトライループ】: 初回 + リトライ2回 = 合計3回試行
    // 【パフォーマンス】: Exponential backoffでAPIサーバーへの負荷を軽減
    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await this.attemptTokenFetch();
      } catch (error) {
        lastError = error as Error;

        // 【リトライ判定】: 401（認証失敗）はリトライ対象外（REQ-601）
        // 【理由】: 認証情報が間違っている場合、リトライしても成功しないため
        if (lastError.message.includes('認証に失敗しました')) {
          throw lastError;
        }

        // 【リトライ判定】: 最後の試行ではリトライしない
        if (attempt === MAX_RETRY_ATTEMPTS) {
          break;
        }

        // 【リトライ待機】: Exponential backoff で段階的に待機時間を延長
        // 【エラーログ】: リトライ情報を記録（将来的にログファイルに出力予定）
        const delay = RETRY_DELAYS_MS[attempt];
        console.error(`API呼び出し失敗（試行 ${attempt + 1}/${MAX_RETRY_ATTEMPTS + 1}）: ${delay}ms後にリトライします...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // 【最終エラー】: すべてのリトライが失敗した場合
    // 【エラーメッセージ】: 最後に発生したエラーをスロー
    throw lastError || new Error('API呼び出しに失敗しました');
  }

  /**
   * 【内部メソッド】: トークン取得の実際の処理
   * 【タイムアウト】: 5秒（REQ-603, NFR-001）
   * 【エラーハンドリング】: 401, 503, ネットワークエラー, タイムアウト
   *
   * @returns {Promise<string>} IDトークン
   * @throws {Error} API呼び出し失敗時
   * 🔵 信頼性: 高（REQ-002）
   */
  private async attemptTokenFetch(): Promise<string> {
    // 【エンドポイントURL構築】: ベースURL + /token/auth_refresh + クエリパラメータ
    // 🔵 信頼性: 高（api-integration.md「認証エンドポイント」セクション）
    const url = `${this.apiBaseUrl}/token/auth_refresh?refreshtoken=${encodeURIComponent(this.refreshToken)}`;

    // 【タイムアウト制御】: AbortControllerでタイムアウトを実装
    // 【タイムアウト時間】: API_TIMEOUT_MS（5秒）- ユーザビリティ考慮
    // 【テスト対応】: TC-ERROR-004（APIタイムアウトエラー）
    // 【改善内容】: 定数化により調整が容易に
    // 🔵 信頼性: 高（REQ-603、NFR-001）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      // 【HTTPリクエスト実行】: POST /token/auth_refresh
      // 【クエリパラメータ】: refreshtoken=<refresh_token>
      // 🔵 信頼性: 高（api-integration.md「認証エンドポイント」）
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
      });

      // 【タイムアウトクリア】: リクエスト成功後、タイマーをクリア
      clearTimeout(timeoutId);

      // 【HTTPステータスコード確認】: 200 OK以外はエラー
      // 🔵 信頼性: 高（api-integration.md「レスポンス」）
      if (!response.ok) {

        // 【認証失敗（401）】: TC-ERROR-002に対応
        // 🔵 信頼性: 高（REQ-602、NFR-301）
        if (response.status === 401) {
          throw new Error('認証に失敗しました。APIキーを確認してください');
        }

        // 【APIメンテナンス（503）】: TC-ERROR-006に対応
        // 🔵 信頼性: 高（EDGE-201）
        if (response.status === 503) {
          throw new Error('J-Quants APIがメンテナンス中です。しばらく時間をおいてから再試行してください');
        }

        // 【その他のHTTPエラー】: ステータスコードを含むエラーメッセージ
        // 🟡 信頼性: 中（汎用的なエラーハンドリング）
        throw new Error(`API呼び出しに失敗しました（ステータスコード: ${response.status}）`);
      }

      // 【レスポンスボディ解析】: JSONからidTokenを抽出
      // 【期待形式】: { "idToken": "<id_token_string>" }
      // 🔵 信頼性: 高（api-integration.md「レスポンス（成功時）」）
      const data = await response.json() as { idToken?: string };

      // 【IDトークン抽出】: レスポンスボディからidTokenを取得
      // 🔵 信頼性: 高（api-integration.md）
      const idToken = data.idToken;

      // 【IDトークン存在確認】: idTokenがレスポンスに含まれているか確認
      // 🟡 信頼性: 中（堅牢性のための追加チェック）
      if (!idToken) {
        throw new Error('APIレスポンスにIDトークンが含まれていません');
      }

      // 【IDトークン返却】: 取得したIDトークンを返却
      return idToken;

    } catch (error) {
      // 【タイムアウトクリア】: エラー発生時もタイマーをクリア
      clearTimeout(timeoutId);

      // 【DEBUG】エラー詳細をログ出力
      console.error('[DEBUG] attemptTokenFetch() error:', {
        type: error?.constructor?.name,
        name: error instanceof Error ? error.name : undefined,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 200) : undefined,
      });

      // 【エラー種別判定】: エラーの種類に応じて適切なメッセージを生成

      // 【タイムアウトエラー】: TC-ERROR-004に対応
      // 🔵 信頼性: 高（REQ-603、NFR-001）
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('APIの応答がタイムアウトしました（5秒）');
      }

      // 【ネットワークエラー】: TC-ERROR-003に対応
      // 🔵 信頼性: 高（EDGE-202、NFR-102、NFR-301）
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('ネットワークに接続できません。インターネット接続を確認してください');
      }

      // 【その他のエラー】: 元のエラーをそのまま再スロー
      // 🟡 信頼性: 中（既知のエラーは再スロー）
      throw error;
    }
  }
}
