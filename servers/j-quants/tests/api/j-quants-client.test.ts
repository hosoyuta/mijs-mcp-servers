/**
 * TASK-0004: J-Quants APIクライアント基礎 - テストケース（正常系）
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-29
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.6.3
 * 【目的】: J-Quants APIクライアントの基本動作テスト（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JQuantsClient } from '../../src/api/j-quants-client';
import { TokenManager } from '../../src/auth/token-manager';
import type { Company, StockPrice, FinancialStatements, CompanyInfo } from '../../src/types/index';

// =========================================
// 正常系テストケース（9ケース）
// =========================================
describe('JQuantsClient - 正常系テストケース', () => {
  let mockTokenManager: any;
  let mockFetch: any;

  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをクリアし、一貫したテスト条件を保証
    // 【環境初期化】: 前のテストの影響を受けないよう、モックをリセット
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // 【TokenManagerモック作成】: 常に有効なIDトークンを返すモックを準備
    // 【認証テスト分離】: 認証ロジックはTASK-0003で検証済みのため、ここでは成功を前提
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
   * TC-NORMAL-001: 基本HTTPリクエスト（GET /listed/info）🔵
   *
   * 【テスト目的】: JQuantsClient.getListedInfo()が正常にHTTPリクエストを送信し、
   *                 Company[]型のレスポンスを取得できることを確認
   * 【テスト内容】: fetchをモックし、GET /listed/infoを呼び出し、
   *                 レスポンスが正しくマッピングされることを検証
   * 【期待される動作】: Company[]型の配列が返却され、各要素が正しい構造を持つ
   * 【要件根拠】: REQ-001（認証）, REQ-002（IDトークン取得）
   * 🔵 信頼性レベル: 青信号（要件定義書、既存実装パターンに基づく）
   */
  it('TC-NORMAL-001: 基本HTTPリクエスト（GET /listed/info）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: J-Quants APIが正常なレスポンスを返すようにfetchをモック
    // 【初期条件設定】: トヨタ自動車（7203）のデータを含む銘柄一覧を準備
    // 【前提条件確認】: APIが正常稼働している状態を模擬
    const mockApiResponse: Company[] = [
      {
        code: '7203',
        name: 'トヨタ自動車',
        market: 'Prime' as any,
        sector: '0050' as any,
      },
    ];

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: JQuantsClientを初期化し、getListedInfo()を呼び出し
    // 【処理内容】: TokenManagerからIDトークンを取得し、認証ヘッダー付きでAPIリクエストを送信
    // 【実行タイミング】: TokenManagerの初期化直後、APIクライアントが最初に呼ばれる状態
    const client = new JQuantsClient(mockTokenManager);
    const companies = await client.getListedInfo();

    // ===== Then（期待結果）=====
    // 【結果検証】: 返却値がCompany[]型であることを確認
    // 【期待値確認】: レスポンスが正しくマッピングされ、期待通りのデータ構造であることを確認
    // 【品質保証】: この検証により、HTTP通信とレスポンスマッピングの正確性を保証

    // 【検証項目】: 返却値が配列であることを確認
    // 🔵 信頼性レベル: 青信号（型定義から確実）
    expect(Array.isArray(companies)).toBe(true);

    // 【検証項目】: 配列の要素数が正しいことを確認
    // 🔵 信頼性レベル: 青信号（モックデータと一致）
    expect(companies).toHaveLength(1);

    // 【検証項目】: 返却されたCompanyオブジェクトの構造が正しいことを確認
    // 🔵 信頼性レベル: 青信号（src/types/index.ts の型定義に基づく）
    expect(companies[0]).toEqual({
      code: '7203',
      name: 'トヨタ自動車',
      market: 'Prime',
      sector: '0050',
    });

    // 【検証項目】: fetchが正確に1回呼ばれることを確認（重複リクエスト防止）
    // 🔵 信頼性レベル: 青信号（モックの動作から確実）
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // 【検証項目】: fetchが正しいURLで呼ばれることを確認
    // 🔵 信頼性レベル: 青信号（API仕様から確実）
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.jquants.com/v1/listed/info',
      expect.any(Object)
    );
  });

  /**
   * TC-NORMAL-002: 認証ヘッダー付与（Bearer Token）🔵
   *
   * 【テスト目的】: すべてのAPIリクエストにAuthorization: Bearer {idToken}ヘッダーが付与されることを確認
   * 【テスト内容】: TokenManager.getIdToken()で取得したトークンがHTTPヘッダーに正しく含まれることを検証
   * 【期待される動作】: Bearerトークン形式でAuthorizationヘッダーが付与される
   * 【要件根拠】: REQ-001（認証）, NFR-101（セキュリティ）
   * 🔵 信頼性レベル: 青信号（TokenManagerの実装パターンから確実）
   */
  it('TC-NORMAL-002: 認証ヘッダー付与（Bearer Token）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: 特定のIDトークンを返すようにTokenManagerをモック
    // 【初期条件設定】: 認証が必要なAPIエンドポイントへのリクエストを準備
    // 【前提条件確認】: TokenManagerが正常にトークンを返却する状態
    mockTokenManager.getIdToken.mockResolvedValue('test_id_token_xyz789');

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: JQuantsClientを初期化し、任意のAPIメソッドを呼び出し
    // 【処理内容】: 内部でTokenManager.getIdToken()が呼ばれ、取得したトークンがヘッダーに付与される
    // 【実行タイミング】: APIリクエスト送信直前にトークンが取得される
    const client = new JQuantsClient(mockTokenManager);
    await client.getListedInfo();

    // ===== Then（期待結果）=====
    // 【結果検証】: Authorizationヘッダーが正しい形式で付与されることを確認
    // 【期待値確認】: Bearer形式でトークンが含まれることを確認
    // 【品質保証】: この検証により、J-Quants APIの認証要件を満たすことを保証

    // 【検証項目】: TokenManager.getIdToken()が呼ばれることを確認
    // 🔵 信頼性レベル: 青信号（TokenManagerとの連携が必須）
    expect(mockTokenManager.getIdToken).toHaveBeenCalledTimes(1);

    // 【検証項目】: fetchのheadersにAuthorizationヘッダーが含まれることを確認
    // 🔵 信頼性レベル: 青信号（NFR-101セキュリティ要件に基づく）
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test_id_token_xyz789',
        }),
      })
    );
  });

  /**
   * TC-NORMAL-003: 株価データ取得（クエリパラメータ付き）🔵
   *
   * 【テスト目的】: getDailyQuotes()でクエリパラメータ（code, from, to）が正しく構築されることを確認
   * 【テスト内容】: code, from, toパラメータがクエリストリングに正しく変換され、URLに含まれることを検証
   * 【期待される動作】: GET /prices/daily_quotes?code=7203&from=2025-01-01&to=2025-12-31 が呼ばれる
   * 【要件根拠】: REQ-201（株価データ取得）
   * 🔵 信頼性レベル: 青信号（要件定義書の仕様に基づく）
   */
  it('TC-NORMAL-003: 株価データ取得（クエリパラメータ付き）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: トヨタ自動車（7203）の2025年1年間の株価データを準備
    // 【初期条件設定】: 日付範囲を指定した株価データ取得を模擬
    // 【前提条件確認】: APIが日付範囲フィルタリングをサポートしている状態
    const mockStockPrices: StockPrice[] = [
      {
        code: '7203',
        date: '2025-01-01',
        open: 3000,
        high: 3100,
        low: 2950,
        close: 3050,
        volume: 1000000,
      },
    ];

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockStockPrices,
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getDailyQuotes()を日付範囲パラメータ付きで呼び出し
    // 【処理内容】: code, from, toパラメータをクエリストリングに変換してAPIリクエストを送信
    // 【実行タイミング】: ユーザーが特定期間の株価データを要求した時
    const client = new JQuantsClient(mockTokenManager);
    const prices = await client.getDailyQuotes('7203', '2025-01-01', '2025-12-31');

    // ===== Then（期待結果）=====
    // 【結果検証】: 返却値がStockPrice[]型であることを確認
    // 【期待値確認】: クエリパラメータが正しくURLに含まれることを確認
    // 【品質保証】: この検証により、パラメータの構築が正確であることを保証

    // 【検証項目】: 返却値が配列であることを確認
    // 🔵 信頼性レベル: 青信号（型定義から確実）
    expect(Array.isArray(prices)).toBe(true);

    // 【検証項目】: fetchが正しいクエリパラメータ付きURLで呼ばれることを確認
    // 🔵 信頼性レベル: 青信号（API仕様から確実）
    const fetchCallUrl = mockFetch.mock.calls[0][0] as string;
    expect(fetchCallUrl).toContain('/prices/daily_quotes');
    expect(fetchCallUrl).toContain('code=7203');
    expect(fetchCallUrl).toContain('from=2025-01-01');
    expect(fetchCallUrl).toContain('to=2025-12-31');
  });

  /**
   * TC-NORMAL-004: 財務諸表取得（typeパラメータ付き）🔵
   *
   * 【テスト目的】: getStatements()でtypeパラメータ（Consolidated/NonConsolidated）が正しく送信されることを確認
   * 【テスト内容】: StatementType列挙型の値が正しくクエリパラメータに変換されることを検証
   * 【期待される動作】: GET /fins/statements?code=7203&type=Consolidated が呼ばれる
   * 【要件根拠】: REQ-301（財務諸表取得）
   * 🔵 信頼性レベル: 青信号（型定義から確実）
   */
  it('TC-NORMAL-004: 財務諸表取得（typeパラメータ付き）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: トヨタ自動車（7203）の連結財務諸表データを準備
    // 【初期条件設定】: 連結財務諸表（Consolidated）の取得を模擬
    // 【前提条件確認】: APIが財務諸表種別フィルタリングをサポートしている状態
    const mockFinancialStatements: FinancialStatements = {
      code: '7203',
      fiscal_year: '2024',
      statement_type: 'Consolidated' as any,
      balance_sheet: {
        total_assets: 10000000000,
        current_assets: 5000000000,
        non_current_assets: 5000000000,
        total_liabilities: 6000000000,
        current_liabilities: 3000000000,
        non_current_liabilities: 3000000000,
        net_assets: 4000000000,
        equity: 4000000000,
      },
      profit_loss: {
        revenue: 500000000,
        cost_of_sales: 300000000,
        gross_profit: 200000000,
        operating_profit: 100000000,
        ordinary_profit: 90000000,
        profit_before_tax: 85000000,
        net_profit: 60000000,
      },
      cash_flow: {
        operating_cash_flow: 80000000,
        investing_cash_flow: -20000000,
        financing_cash_flow: -10000000,
        free_cash_flow: 60000000,
        cash_and_equivalents: 100000000,
      },
    };

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockFinancialStatements,
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getStatements()をtype='Consolidated'パラメータ付きで呼び出し
    // 【処理内容】: code, typeパラメータをクエリストリングに変換してAPIリクエストを送信
    // 【実行タイミング】: ユーザーが連結財務諸表を要求した時
    const client = new JQuantsClient(mockTokenManager);
    const statements = await client.getStatements('7203', 'Consolidated' as any);

    // ===== Then（期待結果）=====
    // 【結果検証】: 返却値がFinancialStatements型であることを確認
    // 【期待値確認】: typeパラメータが正しくURLに含まれることを確認
    // 【品質保証】: この検証により、列挙型パラメータの送信が正確であることを保証

    // 【検証項目】: 返却値がオブジェクトであることを確認
    // 🔵 信頼性レベル: 青信号（型定義から確実）
    expect(typeof statements).toBe('object');
    expect(statements.code).toBe('7203');

    // 【検証項目】: fetchが正しいtypeパラメータ付きURLで呼ばれることを確認
    // 🔵 信頼性レベル: 青信号（API仕様から確実）
    const fetchCallUrl = mockFetch.mock.calls[0][0] as string;
    expect(fetchCallUrl).toContain('/fins/statements');
    expect(fetchCallUrl).toContain('code=7203');
    expect(fetchCallUrl).toContain('type=Consolidated');
  });

  /**
   * TC-NORMAL-005: 企業情報取得🔵
   *
   * 【テスト目的】: getCompanyInfo()が正しいエンドポイント（/listed/info/{code}）を呼び出すことを確認
   * 【テスト内容】: パスパラメータ形式のエンドポイント呼び出しが正しく機能することを検証
   * 【期待される動作】: GET /listed/info/7203 が呼ばれる
   * 【要件根拠】: REQ-401（企業情報取得）
   * 🔵 信頼性レベル: 青信号（要件定義書の仕様に基づく）
   */
  it('TC-NORMAL-005: 企業情報取得', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: トヨタ自動車（7203）の企業情報と最新株価を準備
    // 【初期条件設定】: 企業詳細情報の取得を模擬
    // 【前提条件確認】: APIがパスパラメータ形式をサポートしている状態
    const mockCompanyInfo: CompanyInfo = {
      code: '7203',
      name: 'トヨタ自動車',
      market: 'Prime' as any,
      sector: '0050' as any,
      latest_price: 3050,
      change: 50,
      change_percent: 1.67,
    };

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockCompanyInfo,
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getCompanyInfo()を銘柄コードパラメータ付きで呼び出し
    // 【処理内容】: codeをURLパスに埋め込んでAPIリクエストを送信
    // 【実行タイミング】: ユーザーが特定企業の詳細情報を要求した時
    const client = new JQuantsClient(mockTokenManager);
    const companyInfo = await client.getCompanyInfo('7203');

    // ===== Then（期待結果）=====
    // 【結果検証】: 返却値がCompanyInfo型であることを確認
    // 【期待値確認】: パスパラメータが正しくURLに含まれることを確認
    // 【品質保証】: この検証により、RESTful APIパターンの実装が正確であることを保証

    // 【検証項目】: 返却値がオブジェクトであることを確認
    // 🔵 信頼性レベル: 青信号（型定義から確実）
    expect(typeof companyInfo).toBe('object');
    expect(companyInfo.code).toBe('7203');

    // 【検証項目】: fetchが正しいパスパラメータ付きURLで呼ばれることを確認
    // 🔵 信頼性レベル: 青信号（API仕様から確実）
    const fetchCallUrl = mockFetch.mock.calls[0][0] as string;
    expect(fetchCallUrl).toContain('/listed/info/7203');
  });

  /**
   * TC-NORMAL-006: getListedInfo()メソッドの正常動作🔵
   *
   * 【テスト目的】: publicメソッドとしてのgetListedInfo()の完全な動作を確認
   * 【テスト内容】: TokenManager連携、HTTP通信、レスポンスマッピングまで一連の処理が成功することを検証
   * 【期待される動作】: Company[]型の配列が返却され、各要素がCompanyインターフェースを満たす
   * 【要件根拠】: REQ-101（銘柄一覧取得）
   * 🔵 信頼性レベル: 青信号（既存実装パターンから確実）
   */
  it('TC-NORMAL-006: getListedInfo()メソッドの正常動作', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: 複数銘柄を含む銘柄一覧を準備
    // 【初期条件設定】: 全銘柄一覧の取得を模擬（引数なし）
    // 【前提条件確認】: APIが銘柄マスタデータを提供している状態
    const mockCompanies: Company[] = [
      {
        code: '7203',
        name: 'トヨタ自動車',
        market: 'Prime' as any,
        sector: '0050' as any,
      },
      {
        code: '9984',
        name: 'ソフトバンクグループ',
        market: 'Prime' as any,
        sector: '5250' as any,
      },
    ];

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockCompanies,
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getListedInfo()を引数なしで呼び出し（全銘柄取得）
    // 【処理内容】: 内部でTokenManager→fetch→レスポンスマッピングの流れを実行
    // 【実行タイミング】: アプリケーション起動時などの銘柄マスタ取得時
    const client = new JQuantsClient(mockTokenManager);
    const companies = await client.getListedInfo();

    // ===== Then（期待結果）=====
    // 【結果検証】: 返却値が型安全であり、すべての要素が型定義を満たすことを確認
    // 【期待値確認】: 複数銘柄が正しく返却されることを確認
    // 【品質保証】: この検証により、publicメソッドの契約を保証

    // 【検証項目】: 返却値が配列であることを確認
    // 🔵 信頼性レベル: 青信号（型定義から確実）
    expect(Array.isArray(companies)).toBe(true);
    expect(companies).toHaveLength(2);

    // 【検証項目】: 各要素がCompanyインターフェースを満たすことを確認
    // 🔵 信頼性レベル: 青信号（src/types/index.ts の型定義に基づく）
    companies.forEach((company) => {
      expect(company).toHaveProperty('code');
      expect(company).toHaveProperty('name');
      expect(company).toHaveProperty('market');
      expect(company).toHaveProperty('sector');
    });
  });

  /**
   * TC-NORMAL-007: getDailyQuotes()メソッドの正常動作（パラメータ省略）🔵
   *
   * 【テスト目的】: publicメソッドとしてのgetDailyQuotes()の完全な動作を確認（オプショナルパラメータ省略時）
   * 【テスト内容】: 必須パラメータ（code）のみ指定し、オプショナルパラメータ（from, to）を省略した場合の動作を検証
   * 【期待される動作】: StockPrice[]型の配列が返却され、from/toがクエリパラメータに含まれない
   * 【要件根拠】: REQ-201（株価データ取得）
   * 🔵 信頼性レベル: 青信号（型定義から確実）
   */
  it('TC-NORMAL-007: getDailyQuotes()メソッドの正常動作（パラメータ省略）', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: 日付範囲指定なしの株価データ取得を準備
    // 【初期条件設定】: オプショナルパラメータを省略した株価取得を模擬
    // 【前提条件確認】: APIがパラメータ省略時にすべてのデータを返す状態
    const mockStockPrices: StockPrice[] = [
      {
        code: '7203',
        date: '2025-01-01',
        open: 3000,
        high: 3100,
        low: 2950,
        close: 3050,
        volume: 1000000,
      },
    ];

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockStockPrices,
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getDailyQuotes()をcodeのみ指定して呼び出し
    // 【処理内容】: from/toパラメータを省略し、codeのみでAPIリクエストを送信
    // 【実行タイミング】: ユーザーが期間指定せずに株価データを要求した時
    const client = new JQuantsClient(mockTokenManager);
    const prices = await client.getDailyQuotes('7203');

    // ===== Then（期待結果）=====
    // 【結果検証】: 返却値がStockPrice[]型であることを確認
    // 【期待値確認】: from/toがクエリパラメータに含まれないことを確認
    // 【品質保証】: この検証により、オプショナルパラメータの適切な処理を保証

    // 【検証項目】: 返却値が配列であることを確認
    // 🔵 信頼性レベル: 青信号（型定義から確実）
    expect(Array.isArray(prices)).toBe(true);

    // 【検証項目】: fetchが呼ばれたURLにfrom/toが含まれないことを確認
    // 🔵 信頼性レベル: 青信号（オプショナルパラメータの仕様から確実）
    const fetchCallUrl = mockFetch.mock.calls[0][0] as string;
    expect(fetchCallUrl).toContain('/prices/daily_quotes');
    expect(fetchCallUrl).toContain('code=7203');
    expect(fetchCallUrl).not.toContain('from=');
    expect(fetchCallUrl).not.toContain('to=');
  });

  /**
   * TC-NORMAL-008: getStatements()メソッドの正常動作🔵
   *
   * 【テスト目的】: publicメソッドとしてのgetStatements()の完全な動作を確認
   * 【テスト内容】: 財務諸表データの取得が正常に完了し、ネストされたオブジェクト構造が正しくマッピングされることを検証
   * 【期待される動作】: FinancialStatements型のオブジェクトが返却され、balance_sheet, profit_loss, cash_flowの各プロパティが含まれる
   * 【要件根拠】: REQ-301（財務諸表取得）
   * 🔵 信頼性レベル: 青信号（型定義から確実）
   */
  it('TC-NORMAL-008: getStatements()メソッドの正常動作', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: 完全な財務諸表データ（BS/PL/CF）を準備
    // 【初期条件設定】: 連結財務諸表の取得を模擬
    // 【前提条件確認】: APIが財務三表をすべて提供している状態
    const mockFinancialStatements: FinancialStatements = {
      code: '7203',
      fiscal_year: '2024',
      statement_type: 'Consolidated' as any,
      balance_sheet: {
        total_assets: 10000000000,
        current_assets: 5000000000,
        non_current_assets: 5000000000,
        total_liabilities: 6000000000,
        current_liabilities: 3000000000,
        non_current_liabilities: 3000000000,
        net_assets: 4000000000,
        equity: 4000000000,
      },
      profit_loss: {
        revenue: 500000000,
        cost_of_sales: 300000000,
        gross_profit: 200000000,
        operating_profit: 100000000,
        ordinary_profit: 90000000,
        profit_before_tax: 85000000,
        net_profit: 60000000,
      },
      cash_flow: {
        operating_cash_flow: 80000000,
        investing_cash_flow: -20000000,
        financing_cash_flow: -10000000,
        free_cash_flow: 60000000,
        cash_and_equivalents: 100000000,
      },
    };

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockFinancialStatements,
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getStatements()を呼び出し、財務諸表を取得
    // 【処理内容】: 内部で複雑なネストオブジェクトをマッピング
    // 【実行タイミング】: ユーザーが企業分析のために財務諸表を要求した時
    const client = new JQuantsClient(mockTokenManager);
    const statements = await client.getStatements('7203', 'Consolidated' as any);

    // ===== Then（期待結果）=====
    // 【結果検証】: 返却値がFinancialStatements型であることを確認
    // 【期待値確認】: balance_sheet, profit_loss, cash_flowの各プロパティが含まれることを確認
    // 【品質保証】: この検証により、複雑なオブジェクト構造の正しいマッピングを保証

    // 【検証項目】: 返却値がオブジェクトであることを確認
    // 🔵 信頼性レベル: 青信号（型定義から確実）
    expect(typeof statements).toBe('object');

    // 【検証項目】: 財務三表のプロパティがすべて含まれることを確認
    // 🔵 信頼性レベル: 青信号（src/types/index.ts の型定義に基づく）
    expect(statements).toHaveProperty('balance_sheet');
    expect(statements).toHaveProperty('profit_loss');
    expect(statements).toHaveProperty('cash_flow');

    // 【検証項目】: ネストされたオブジェクトの構造が正しいことを確認
    // 🔵 信頼性レベル: 青信号（型定義から確実）
    expect(statements.balance_sheet).toHaveProperty('total_assets');
    expect(statements.profit_loss).toHaveProperty('revenue');
    expect(statements.cash_flow).toHaveProperty('operating_cash_flow');
  });

  /**
   * TC-NORMAL-009: getCompanyInfo()メソッドの正常動作🔵
   *
   * 【テスト目的】: publicメソッドとしてのgetCompanyInfo()の完全な動作を確認
   * 【テスト内容】: 企業情報と最新株価の組み合わせデータが正常に取得されることを検証
   * 【期待される動作】: CompanyInfo型のオブジェクトが返却され、code, name, market, sector, latest_priceの各プロパティが含まれる
   * 【要件根拠】: REQ-401（企業情報取得）
   * 🔵 信頼性レベル: 青信号（型定義から確実）
   */
  it('TC-NORMAL-009: getCompanyInfo()メソッドの正常動作', async () => {
    // ===== Given（前提条件）=====
    // 【テストデータ準備】: 企業情報と最新株価を含む複合データを準備
    // 【初期条件設定】: 企業詳細情報の取得を模擬
    // 【前提条件確認】: APIが企業マスタと最新株価を組み合わせて提供している状態
    const mockCompanyInfo: CompanyInfo = {
      code: '7203',
      name: 'トヨタ自動車',
      market: 'Prime' as any,
      sector: '0050' as any,
      latest_price: 3050,
      change: 50,
      change_percent: 1.67,
    };

    mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockCompanyInfo,
      } as Response)
    );
    global.fetch = mockFetch;

    // ===== When（実行条件）=====
    // 【実際の処理実行】: getCompanyInfo()を銘柄コードパラメータ付きで呼び出し
    // 【処理内容】: 内部で企業情報と最新株価の複合データを取得
    // 【実行タイミング】: ユーザーが企業詳細画面を開いた時
    const client = new JQuantsClient(mockTokenManager);
    const companyInfo = await client.getCompanyInfo('7203');

    // ===== Then（期待結果）=====
    // 【結果検証】: 返却値がCompanyInfo型であることを確認
    // 【期待値確認】: すべての必須フィールドが含まれることを確認
    // 【品質保証】: この検証により、複合データの取得が正確であることを保証

    // 【検証項目】: 返却値がオブジェクトであることを確認
    // 🔵 信頼性レベル: 青信号（型定義から確実）
    expect(typeof companyInfo).toBe('object');

    // 【検証項目】: すべての必須フィールドが含まれることを確認
    // 🔵 信頼性レベル: 青信号（src/types/index.ts の型定義に基づく）
    expect(companyInfo).toHaveProperty('code');
    expect(companyInfo).toHaveProperty('name');
    expect(companyInfo).toHaveProperty('market');
    expect(companyInfo).toHaveProperty('sector');
    expect(companyInfo).toHaveProperty('latest_price');

    // 【検証項目】: 銘柄コードが正しいことを確認
    // 🔵 信頼性レベル: 青信号（入力パラメータと一致）
    expect(companyInfo.code).toBe('7203');
  });
});
