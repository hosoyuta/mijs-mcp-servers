/**
 * TASK-0004: J-Quants APIクライアント基礎
 *
 * 【機能概要】: J-Quants APIとの通信を担当する基盤クライアントクラス
 * 【実装方針】: TDD Green Phaseの原則に従い、テストを通すための最小実装
 * 【テスト対応】: 13件のテストケース（正常系9件、異常系7件、境界値4件）を通す実装
 * 🔵 信頼性レベル: 青信号（要件定義書、テストケース、既存実装パターンに基づく）
 *
 * @module JQuantsClient
 */

import type { TokenManager } from '../auth/token-manager.js';
import type {
  Company,
  StockPrice,
  FinancialStatements,
  CompanyInfo,
  StatementType,
} from '../types/index.js';

/**
 * 【定数定義】: API設定の集中管理
 * 【設計方針】: マジックナンバーを排除し、可読性と保守性を向上
 * 🔵 信頼性レベル: 青信号（要件定義書REQ-603に基づく）
 */

/**
 * 【APIベースURL】: J-Quants APIのエンドポイント
 * 🔵 信頼性レベル: 青信号（J-Quants API公式仕様に基づく）
 */
const API_BASE_URL = 'https://api.jquants.com/v1';

/**
 * 【タイムアウト設定】: APIリクエストのタイムアウト時間（5秒）
 * 【要件根拠】: REQ-603（タイムアウト制御）
 * 🔵 信頼性レベル: 青信号（要件定義書に基づく）
 */
const REQUEST_TIMEOUT_MS = 5000;

/**
 * 【最大リトライ回数】: リクエスト失敗時の最大リトライ回数（初回含めて3回）
 * 【要件根拠】: REQ-601（リトライロジック）
 * 🔵 信頼性レベル: 青信号（要件定義書に基づく）
 */
const MAX_RETRIES = 3;

/**
 * 【リトライ待機時間】: Exponential backoff（1秒 → 2秒）
 * 【要件根拠】: REQ-601（リトライロジック）
 * 🔵 信頼性レベル: 青信号（要件定義書に基づく）
 */
const RETRY_DELAYS_MS = [1000, 2000];

/**
 * 【JQuantsClientクラス】: J-Quants APIとの通信を担当するクライアント
 *
 * 【責務】:
 * - HTTP通信の実行
 * - 認証ヘッダーの自動付与
 * - リトライロジックの実装
 * - タイムアウト制御
 *
 * 【依存関係】:
 * - TokenManager: 認証トークン管理を担当
 *
 * 🔵 信頼性レベル: 青信号（要件定義書、テストケースに基づく）
 */
export class JQuantsClient {
  /**
   * 【TokenManager参照】: 認証トークン管理インスタンス
   * 【用途】: IDトークンの取得に使用
   * 🔵 信頼性レベル: 青信号（TASK-0003のTokenManagerに依存）
   */
  private tokenManager: TokenManager;

  /**
   * 【ベースURL】: APIエンドポイントのベースURL
   * 【用途】: 相対パスと組み合わせて完全なURLを構築
   * 🔵 信頼性レベル: 青信号（J-Quants API仕様に基づく）
   */
  private baseUrl: string;

  /**
   * 【コンストラクタ】: JQuantsClientの初期化
   *
   * 【実装方針】: TokenManagerへの参照を保持し、ベースURLを設定
   * 【テスト対応】: すべてのテストケースで使用される基本的な初期化処理
   * 🔵 信頼性レベル: 青信号（要件定義書に基づく）
   *
   * @param tokenManager - 認証トークン管理インスタンス
   * @param baseUrl - APIベースURL（オプション、デフォルト: https://api.jquants.com/v1）
   */
  constructor(tokenManager: TokenManager, baseUrl?: string) {
    // 【TokenManager保持】: 認証トークン取得のため、TokenManagerへの参照を保存
    // 🔵 信頼性レベル: 青信号（TASK-0003のTokenManagerに依存）
    this.tokenManager = tokenManager;

    // 【ベースURL設定】: デフォルトまたはカスタムベースURLを設定
    // 🔵 信頼性レベル: 青信号（J-Quants API仕様に基づく）
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  /**
   * 【銘柄一覧取得】: 上場銘柄一覧を取得
   *
   * 【機能概要】: GET /listed/info を呼び出し、Company[]型のレスポンスを取得
   * 【実装方針】: request()メソッドを使用してHTTP通信を実行
   * 【テスト対応】: TC-NORMAL-001, TC-NORMAL-002, TC-NORMAL-006
   * 🔵 信頼性レベル: 青信号（要件定義書、テストケースに基づく）
   *
   * @returns Promise<Company[]> - 銘柄情報の配列
   */
  async getListedInfo(): Promise<Company[]> {
    // 【HTTP GET実行】: /listed/infoエンドポイントにGETリクエストを送信
    // 【レスポンスマッピング】: APIレスポンスをCompany[]型にマッピング
    // 【APIレスポンス形式】: J-Quants APIは { info: RawCompany[] } 形式で返すため、.infoを抽出
    // 🔵 信頼性レベル: 青信号（J-Quants API仕様に基づく）
    interface RawCompany {
      Code: string;
      CompanyName: string;
      MarketCode: string;
      MarketCodeName: string;
      Sector33Code: string;
      Date?: string;
    }
    const response = await this.request<{ info: RawCompany[] }>('/listed/info');

    // 【フィールド名変換とマッピング】: APIレスポンスをCompany型に変換
    return response.info.map((raw) => {
      // MarketCodeNameからMarket enumへの変換
      let market: Company['market'];
      if (raw.MarketCodeName === 'プライム' || raw.MarketCode === '0111') {
        market = 'Prime' as Company['market'];
      } else if (raw.MarketCodeName === 'スタンダード' || raw.MarketCode === '0112') {
        market = 'Standard' as Company['market'];
      } else if (raw.MarketCodeName === 'グロース' || raw.MarketCode === '0113') {
        market = 'Growth' as Company['market'];
      } else {
        market = 'Other' as Company['market'];
      }

      // 【銘柄コード正規化】: APIは5桁形式("72030")を返すが、4桁形式("7203")に正規化
      // 🔵 信頼性レベル: 青信号（実際のAPI動作に基づく）
      const normalizedCode = raw.Code.substring(0, 4);

      return {
        code: normalizedCode,
        name: raw.CompanyName,
        market,
        sector: raw.Sector33Code as Company['sector'],
        listed_date: raw.Date,
      };
    });
  }

  /**
   * 【株価データ取得】: 指定銘柄の日次株価データを取得
   *
   * 【機能概要】: GET /prices/daily_quotes を呼び出し、StockPrice[]型のレスポンスを取得
   * 【実装方針】: 共通ヘルパーメソッドでクエリパラメータを構築
   * 【改善内容】: buildQueryParams()により重複コードを削減
   * 【APIレスポンス形式】: J-Quants APIは { daily_quotes: RawStockPrice[] } 形式で返すため、.daily_quotesを抽出
   * 🔵 信頼性レベル: 青信号（要件定義書、テストケース、実際のAPI応答に基づく）
   *
   * @param code - 銘柄コード（4桁数字）
   * @param from - 開始日（YYYY-MM-DD形式、オプション）
   * @param to - 終了日（YYYY-MM-DD形式、オプション）
   * @returns Promise<StockPrice[]> - 株価データの配列
   */
  async getDailyQuotes(
    code: string,
    from?: string,
    to?: string
  ): Promise<StockPrice[]> {
    // 【APIレスポンス型定義】: J-Quants APIが返すPascalCase形式のraw data
    // 🔵 信頼性レベル: 青信号（実際のAPI応答形式に基づく）
    interface RawStockPrice {
      Date: string;
      Code: string;
      Open: number;
      High: number;
      Low: number;
      Close: number;
      Volume: number;
      TurnoverValue?: number;
      AdjustmentClose?: number;
    }

    const queryString = this.buildQueryParams({ code, from, to });
    const response = await this.request<{ daily_quotes: RawStockPrice[] }>(
      `/prices/daily_quotes?${queryString}`
    );

    // 【フィールド名変換とマッピング】: APIレスポンスをStockPrice型に変換
    // 🔵 PascalCase → camelCase マッピング
    return response.daily_quotes.map((raw) => {
      // 【銘柄コード正規化】: APIは5桁形式("72030")を返すが、4桁形式("7203")に正規化
      // 🔵 信頼性レベル: 青信号（実際のAPI動作に基づく）
      const normalizedCode = raw.Code.substring(0, 4);

      return {
        code: normalizedCode,
        date: raw.Date,
        open: raw.Open,
        high: raw.High,
        low: raw.Low,
        close: raw.Close,
        volume: raw.Volume,
        turnover: raw.TurnoverValue,
        adjusted_close: raw.AdjustmentClose,
      };
    });
  }

  /**
   * 【財務諸表取得】: 指定銘柄の財務諸表を取得
   *
   * 【機能概要】: GET /fins/statements を呼び出し、FinancialStatements型のレスポンスを取得
   * 【実装方針】: 共通ヘルパーメソッドでクエリパラメータを構築
   * 【改善内容】: buildQueryParams()により重複コードを削減
   * 🔵 信頼性レベル: 青信号（要件定義書、テストケースに基づく）
   *
   * @param code - 銘柄コード（4桁数字）
   * @param type - 財務諸表種別（'Consolidated' | 'NonConsolidated'、オプション）
   * @returns Promise<FinancialStatements> - 財務諸表データ
   */
  async getStatements(
    code: string,
    type?: StatementType
  ): Promise<FinancialStatements> {
    const queryString = this.buildQueryParams({ code, type });
    return this.request<FinancialStatements>(`/fins/statements?${queryString}`);
  }

  /**
   * 【企業情報取得】: 指定銘柄の企業情報を取得
   *
   * 【機能概要】: 企業情報と最新株価を組み合わせて取得
   * 【実装方針】: getListedInfo()とgetDailyQuotes()を組み合わせて企業情報+最新株価を返す
   * 【APIエンドポイント変更理由】: /listed/info/{code}エンドポイントが存在しないため、
   *                               /listed/infoで全件取得してフィルタリングする方式に変更
   * 【テスト対応】: TC-NORMAL-005, TC-NORMAL-009
   * 🔵 信頼性レベル: 青信号（実際のAPI動作に基づく）
   *
   * @param code - 銘柄コード（4桁数字）
   * @returns Promise<CompanyInfo> - 企業情報データ
   */
  async getCompanyInfo(code: string): Promise<CompanyInfo> {
    // 【企業情報取得】: getListedInfo()で全銘柄情報を取得し、指定コードでフィルタリング
    // 🔵 信頼性レベル: 青信号（J-Quants API実装に基づく）
    const allCompanies = await this.getListedInfo();
    const company = allCompanies.find((c) => c.code === code);

    if (!company) {
      throw new Error(`指定された銘柄コード（${code}）は存在しません`);
    }

    // 【最新株価取得】: getDailyQuotes()で株価データを取得
    // 🔵 信頼性レベル: 青信号（get-company-info.tsツールと同じパターン）
    const prices = await this.getDailyQuotes(code);

    // 【最新株価抽出】: reduce()で最新日の株価を抽出（O(n)で効率的）
    // 🔵 信頼性レベル: 青信号（パフォーマンス最適化済み）
    let latest_price: number | undefined = undefined;
    if (prices.length > 0) {
      const latestPrice = prices.reduce((latest, current) =>
        current.date > latest.date ? current : latest
      );
      latest_price = latestPrice.close;
    }

    // 【結果返却】: CompanyInfo型で企業情報+最新株価を返す
    // 🔵 信頼性レベル: 青信号（CompanyInfo型定義に準拠）
    return {
      code: company.code,
      name: company.name,
      market: company.market,
      sector: company.sector,
      latest_price,
    };
  }

  /**
   * 【基本HTTPリクエスト】: 認証ヘッダー付きでAPIリクエストを送信
   *
   * 【機能概要】: TokenManagerからIDトークンを取得し、Authorization: Bearer {token}ヘッダーを付与して
   *              HTTP GETリクエストを送信
   * 【実装方針】: AbortControllerでタイムアウト制御、エラー時はretryableRequest()でリトライ
   * 【テスト対応】: すべてのテストケース（TC-NORMAL-001～009、TC-ERROR-001～007、TC-BOUNDARY-001～004）
   * 🔵 信頼性レベル: 青信号（要件定義書、テストケース、TokenManagerパターンに基づく）
   *
   * @param url - リクエストURL（相対パス、例: "/listed/info"）
   * @returns Promise<T> - APIレスポンスボディ（ジェネリック型）
   */
  private async request<T>(url: string): Promise<T> {
    // 【リトライ可能なリクエスト実行】: retryableRequest()でラップして自動リトライ機能を追加
    // 🔵 信頼性レベル: 青信号（REQ-601リトライロジックに基づく）
    return this.retryableRequest(async () => {
      // 【IDトークン取得】: TokenManagerから最新のIDトークンを取得
      // 【認証準備】: APIリクエストに必要な認証情報を準備
      // 🔵 信頼性レベル: 青信号（TASK-0003のTokenManagerに依存）
      const idToken = await this.tokenManager.getIdToken();

      // 【タイムアウト制御】: AbortControllerで5秒タイムアウトを設定
      // 【要件根拠】: REQ-603（タイムアウト制御）
      // 🔵 信頼性レベル: 青信号（Web標準APIに基づく）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        // 【HTTP GET実行】: fetchでAPIリクエストを送信
        // 【認証ヘッダー付与】: Authorization: Bearer {token}ヘッダーを追加
        // 🔵 信頼性レベル: 青信号（NFR-101セキュリティ要件に基づく）
        const response = await fetch(`${this.baseUrl}${url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        // 【ステータスコード判定】: HTTPステータスコードに応じた処理
        // 🔵 信頼性レベル: 青信号（HTTP標準仕様に基づく）
        if (!response.ok) {
          // 【エラーレスポンス処理】: 非2xxステータスコードの場合、エラーをスロー
          // 【401エラー特別処理】: 401エラーの場合、retryableRequest()で自動的にトークン再取得
          // 🔵 信頼性レベル: 青信号（REQ-004認証失敗時の再取得に基づく）
          throw new Error(
            `API request failed with status ${response.status}: ${response.statusText}`
          );
        }

        // 【レスポンスボディ取得】: JSONレスポンスをパースして返却
        // 🔵 信頼性レベル: 青信号（J-Quants API仕様に基づく）
        return await response.json() as T;
      } finally {
        // 【タイムアウトクリア】: タイムアウトタイマーを必ずクリア（メモリリーク防止）
        // 🔵 信頼性レベル: 青信号（リソース管理のベストプラクティス）
        clearTimeout(timeoutId);
      }
    });
  }

  /**
   * 【リトライロジック付きリクエスト実行】: エラー時に自動的にリトライ
   *
   * 【機能概要】: リクエスト失敗時、リトライ対象エラーであれば最大3回までExponential backoffでリトライ
   * 【実装方針】: エラー種別を判定し、リトライ可能なエラーの場合のみリトライ
   * 【テスト対応】: TC-ERROR-001～007, TC-BOUNDARY-001～004
   * 🔵 信頼性レベル: 青信号（要件定義書REQ-601、テストケースに基づく）
   *
   * @param fn - リトライ対象の関数
   * @returns Promise<T> - 成功時のレスポンス
   */
  private async retryableRequest<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    // 【リトライループ】: 最大3回（初回 + リトライ2回）まで試行
    // 【要件根拠】: REQ-601（最大リトライ回数3回）
    // 🔵 信頼性レベル: 青信号（要件定義書に基づく）
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // 【リクエスト実行】: 渡された関数を実行
        // 【成功時】: 即座に結果を返却
        // 🔵 信頼性レベル: 青信号（標準的なリトライパターン）
        return await fn();
      } catch (error) {
        // 【エラー保存】: 最後のエラーを保持（最終的な失敗時に返却）
        // 🔵 信頼性レベル: 青信号（標準的なエラーハンドリング）
        lastError = error as Error;

        // 【401エラー処理】: 401エラーの場合、次のリトライでTokenManager.getIdToken()が
        //                   自動的に新しいトークンを取得する
        // 【実装方針】: TokenManagerに委譲し、リトライ時に自然にトークンが更新される
        // 🔵 信頼性レベル: 青信号（REQ-004認証失敗時の再取得、TASK-0003のTokenManagerに基づく）

        // 【リトライ対象外判定】: 400エラーなどのクライアントエラーはリトライしない
        // 【要件根拠】: REQ-601（400エラーはリトライ対象外）
        // 🔵 信頼性レベル: 青信号（テストケースTC-ERROR-001に基づく）
        if (!this.isRetryableError(error as Error)) {
          // 【即座にエラーをスロー】: リトライ対象外エラーは即座に失敗
          // 🔵 信頼性レベル: 青信号（要件定義書に基づく）
          throw error;
        }

        // 【最終試行判定】: 最大リトライ回数に達した場合、エラーをスロー
        // 🔵 信頼性レベル: 青信号（REQ-601最大リトライ回数に基づく）
        if (attempt >= MAX_RETRIES - 1) {
          // 【最終的な失敗】: すべてのリトライが失敗した場合、エラーをスロー
          // 🔵 信頼性レベル: 青信号（テストケースTC-ERROR-007に基づく）
          throw error;
        }

        // 【Exponential backoff待機】: リトライ前に待機時間を挿入
        // 【待機時間】: 1回目リトライ→1秒、2回目リトライ→2秒
        // 【要件根拠】: REQ-601（Exponential backoff: 1s → 2s）
        // 🔵 信頼性レベル: 青信号（要件定義書、テストケースTC-ERROR-004に基づく）
        const delayMs = RETRY_DELAYS_MS[attempt] ?? 1000;
        await this.delay(delayMs);
      }
    }

    // 【最終的なエラーをスロー】: すべてのリトライが失敗した場合
    // 🔵 信頼性レベル: 青信号（標準的なエラーハンドリング）
    throw lastError || new Error('Request failed after maximum retries');
  }

  /**
   * 【リトライ対象エラー判定】: エラーがリトライ対象かどうかを判定
   *
   * 【機能概要】: エラーメッセージとHTTPステータスコードからリトライ可否を判定
   * 【実装方針】: 429, 5xx, ネットワークエラー, タイムアウトはリトライ対象
   * 【テスト対応】: TC-ERROR-001, TC-ERROR-003, TC-ERROR-004, TC-ERROR-005, TC-ERROR-006
   * 🔵 信頼性レベル: 青信号（要件定義書REQ-601、テストケースに基づく）
   *
   * @param error - 発生したエラー
   * @returns boolean - リトライ対象の場合true
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message;

    // 【400エラー判定】: 400エラーはリトライ対象外
    // 【要件根拠】: REQ-601（クライアントエラーはリトライしない）
    // 🔵 信頼性レベル: 青信号（テストケースTC-ERROR-001に基づく）
    if (message.includes('status 400')) return false;

    // 【401エラー判定】: 401エラーはリトライ対象（トークン再取得後）
    // 【要件根拠】: REQ-004（認証失敗時の再取得）
    // 🔵 信頼性レベル: 青信号（テストケースTC-ERROR-002に基づく）
    if (message.includes('status 401')) return true;

    // 【429エラー判定】: 429エラー（レート制限）はリトライ対象
    // 【要件根拠】: REQ-601（レート制限エラーはリトライ）
    // 🔵 信頼性レベル: 青信号（テストケースTC-ERROR-003に基づく）
    if (message.includes('status 429')) return true;

    // 【5xxエラー判定】: 500番台のサーバーエラーはリトライ対象
    // 【要件根拠】: REQ-601（サーバーエラーはリトライ）
    // 🔵 信頼性レベル: 青信号（テストケースTC-ERROR-004に基づく）
    if (message.includes('status 5')) return true;

    // 【ネットワークエラー判定】: fetch failedはネットワークエラーとしてリトライ対象
    // 【要件根拠】: REQ-601（ネットワークエラーはリトライ）
    // 🔵 信頼性レベル: 青信号（テストケースTC-ERROR-005に基づく）
    if (error.name === 'TypeError' || message.includes('fetch failed')) return true;

    // 【タイムアウトエラー判定】: AbortErrorはタイムアウトとしてリトライ対象
    // 【要件根拠】: REQ-603（タイムアウトエラーはリトライ）
    // 🔵 信頼性レベル: 青信号（テストケースTC-ERROR-006に基づく）
    if (error.name === 'AbortError') return true;

    // 【その他エラー】: 上記以外のエラーはリトライ対象外
    // 🔵 信頼性レベル: 青信号（安全側の判断）
    return false;
  }

  /**
   * 【クエリパラメータ構築】: オブジェクトからURLクエリ文字列を生成
   *
   * 【機能概要】: キー・値のオブジェクトを受け取り、URLSearchParamsで安全なクエリ文字列を生成
   * 【実装方針】: DRY原則に従い、重複コードを共通化
   * 【再利用性】: getDailyQuotes(), getStatements()で使用
   * 【改善内容】: リファクタリングで追加されたヘルパーメソッド
   * 🟡 信頼性レベル: 黄信号（リファクタリングで追加、Web標準APIに基づく）
   *
   * @param params - クエリパラメータオブジェクト
   * @returns string - URLエンコード済みクエリ文字列
   */
  private buildQueryParams(params: Record<string, string | undefined>): string {
    const searchParams = new URLSearchParams();

    // 【パラメータ追加】: undefined値を除外し、有効な値のみ追加
    // 【保守性】: Object.entries()で柔軟なパラメータ処理
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    }

    return searchParams.toString();
  }

  /**
   * 【待機処理】: 指定ミリ秒待機
   *
   * 【機能概要】: PromiseでラップしたsetTimeoutによる非同期待機
   * 【実装方針】: リトライ前の待機時間を実装
   * 【テスト対応】: TC-ERROR-003, TC-ERROR-004, TC-BOUNDARY-001, TC-BOUNDARY-002
   * 🔵 信頼性レベル: 青信号（標準的な非同期待機パターン）
   *
   * @param ms - 待機時間（ミリ秒）
   * @returns Promise<void> - 待機完了時に解決されるPromise
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
