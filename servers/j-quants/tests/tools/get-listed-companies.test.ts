/**
 * TASK-0006: get_listed_companies MCPツール テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-29
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.x
 * 【目的】: 上場銘柄一覧取得ツールのテスト実装（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getListedCompanies } from '../../src/tools/get-listed-companies';
import { JQuantsClient } from '../../src/api/j-quants-client';
import { TokenManager } from '../../src/auth/token-manager';
import { Company, Market, Sector } from '../../src/types';
import { ValidationError } from '../../src/utils/validator';

// =========================================
// 正常系テストケース（4件）
// =========================================
describe('get-listed-companies.ts - 正常系テストケース', () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをリセットし、一貫したテスト条件を保証
    // 【環境初期化】: 前のテストの影響を受けないよう、モックをクリーンにリセット
    vi.clearAllMocks();

    // 【環境変数設定】: TokenManagerが必要とする環境変数を設定
    process.env.JQUANTS_REFRESH_TOKEN = 'test-refresh-token';

    // 【TokenManagerモック】: TokenManagerのgetIdTokenメソッドをモック化
    // 【理由】: 実際のAPI呼び出しを回避し、テストを高速化
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-token');
  });

  /**
   * TC-NORMAL-001: getListedCompanies() - パラメータなし（全銘柄取得）🔵
   *
   * 【テスト目的】: パラメータを指定しない場合に全上場銘柄が取得できること
   * 【テスト内容】: パラメータ{}でgetListedCompanies()を呼び出し、全銘柄が返却されることを確認
   * 【期待される動作】: JQuantsClient.getListedInfo()が呼ばれ、全銘柄（3000+件）が返却される
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   */
  it('TC-NORMAL-001: getListedCompanies() - パラメータなし', async () => {
    // Given（前提条件）: JQuantsClientのモックを準備
    // 【テストデータ準備】: 全上場銘柄をシミュレート（3銘柄のサンプルデータ）
    // 【初期条件設定】: JQuantsClient.getListedInfo()が正常に全銘柄を返却するモック
    const mockCompanies: Company[] = [
      {
        code: '7203',
        name: 'トヨタ自動車',
        market: Market.PRIME,
        sector: Sector.TRANSPORTATION_EQUIPMENT,
      },
      {
        code: '9984',
        name: 'ソフトバンクグループ',
        market: Market.PRIME,
        sector: Sector.INFORMATION_COMMUNICATION,
      },
      {
        code: '6758',
        name: 'ソニーグループ',
        market: Market.PRIME,
        sector: Sector.ELECTRIC_APPLIANCES,
      },
    ];

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue(mockCompanies);

    // When（実行）: getListedCompanies()をパラメータなしで呼び出し
    // 【実際の処理実行】: 全銘柄取得ツールの実行
    // 【処理内容】: market, sectorフィルタなしで全銘柄を取得
    const result = await getListedCompanies({});

    // Then（検証）: 全銘柄が返却されることを確認
    // 【結果検証】: 返却データの検証
    expect(result).toHaveProperty('companies'); // 【確認内容】: companiesプロパティが存在すること 🔵
    expect(result.companies).toBeInstanceOf(Array); // 【確認内容】: companies が配列型であること 🔵
    expect(result.companies).toHaveLength(mockCompanies.length); // 【確認内容】: 全銘柄数が一致すること 🔵
    expect(result.companies).toEqual(mockCompanies); // 【確認内容】: 銘柄データが完全に一致すること 🔵

    // 【API呼び出し確認】: JQuantsClient.getListedInfo()が正しく呼ばれたことを確認
    expect(JQuantsClient.prototype.getListedInfo).toHaveBeenCalledTimes(1); // 【確認内容】: APIが1回だけ呼ばれること 🔵
  });

  /**
   * TC-NORMAL-002: getListedCompanies() - marketフィルタ（Prime市場のみ）🔵
   *
   * 【テスト目的】: market パラメータでPrime市場の銘柄のみがフィルタリングされること
   * 【テスト内容】: market='Prime'でgetListedCompanies()を呼び出し、Prime市場の銘柄のみが返却されることを確認
   * 【期待される動作】: 全銘柄取得後、Prime市場の銘柄のみがフィルタリングされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   */
  it('TC-NORMAL-002: getListedCompanies() - marketフィルタ', async () => {
    // Given（前提条件）: Prime、Standard、Growthの混在データを準備
    // 【テストデータ準備】: 異なる市場区分の銘柄
    // 【初期条件設定】: JQuantsClient.getListedInfo()が複数市場の銘柄を返却するモック
    const mockCompanies: Company[] = [
      {
        code: '7203',
        name: 'トヨタ自動車',
        market: Market.PRIME,
        sector: Sector.TRANSPORTATION_EQUIPMENT,
      },
      {
        code: '9984',
        name: 'ソフトバンクグループ',
        market: Market.PRIME,
        sector: Sector.INFORMATION_COMMUNICATION,
      },
      {
        code: '4563',
        name: 'アンジェス',
        market: Market.GROWTH,
        sector: Sector.PHARMACEUTICAL,
      },
    ];

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue(mockCompanies);

    // When（実行）: getListedCompanies()をmarket='Prime'で呼び出し
    // 【実際の処理実行】: Prime市場フィルタの実行
    // 【処理内容】: market='Prime'でフィルタリング
    const result = await getListedCompanies({ market: 'Prime' });

    // Then（検証）: Prime市場の銘柄のみが返却されることを確認
    // 【結果検証】: フィルタリング結果の検証
    expect(result.companies).toHaveLength(2); // 【確認内容】: Prime市場の銘柄が2件返却されること 🔵
    expect(result.companies.every((c) => c.market === Market.PRIME)).toBe(true); // 【確認内容】: すべてPrime市場であること 🔵
    expect(result.companies[0].code).toBe('7203'); // 【確認内容】: トヨタ自動車が含まれること 🔵
    expect(result.companies[1].code).toBe('9984'); // 【確認内容】: ソフトバンクグループが含まれること 🔵
  });

  /**
   * TC-NORMAL-003: getListedCompanies() - sectorフィルタ（銀行業のみ）🔵
   *
   * 【テスト目的】: sector パラメータで特定業種の銘柄のみがフィルタリングされること
   * 【テスト内容】: sector='7050'（銀行業）でgetListedCompanies()を呼び出し、銀行業の銘柄のみが返却されることを確認
   * 【期待される動作】: 全銘柄取得後、銀行業の銘柄のみがフィルタリングされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   */
  it('TC-NORMAL-003: getListedCompanies() - sectorフィルタ', async () => {
    // Given（前提条件）: 異なる業種の銘柄データを準備
    // 【テストデータ準備】: 銀行業と他業種の混在データ
    // 【初期条件設定】: JQuantsClient.getListedInfo()が複数業種の銘柄を返却するモック
    const mockCompanies: Company[] = [
      {
        code: '8306',
        name: '三菱UFJフィナンシャル・グループ',
        market: Market.PRIME,
        sector: Sector.BANKS,
      },
      {
        code: '8316',
        name: '三井住友フィナンシャルグループ',
        market: Market.PRIME,
        sector: Sector.BANKS,
      },
      {
        code: '7203',
        name: 'トヨタ自動車',
        market: Market.PRIME,
        sector: Sector.TRANSPORTATION_EQUIPMENT,
      },
    ];

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue(mockCompanies);

    // When（実行）: getListedCompanies()をsector='7050'（銀行業）で呼び出し
    // 【実際の処理実行】: 銀行業フィルタの実行
    // 【処理内容】: sector='7050'でフィルタリング
    const result = await getListedCompanies({ sector: '7050' });

    // Then（検証）: 銀行業の銘柄のみが返却されることを確認
    // 【結果検証】: フィルタリング結果の検証
    expect(result.companies).toHaveLength(2); // 【確認内容】: 銀行業の銘柄が2件返却されること 🔵
    expect(result.companies.every((c) => c.sector === Sector.BANKS)).toBe(true); // 【確認内容】: すべて銀行業であること 🔵
    expect(result.companies[0].code).toBe('8306'); // 【確認内容】: 三菱UFJが含まれること 🔵
    expect(result.companies[1].code).toBe('8316'); // 【確認内容】: 三井住友が含まれること 🔵
  });

  /**
   * TC-NORMAL-004: getListedCompanies() - 複合フィルタ（market + sector）🔵
   *
   * 【テスト目的】: marketとsectorの両方のパラメータが同時に機能すること
   * 【テスト内容】: market='Prime', sector='7050'でgetListedCompanies()を呼び出し、Prime市場かつ銀行業の銘柄のみが返却されることを確認
   * 【期待される動作】: 全銘柄取得後、市場と業種の両方の条件でフィルタリングされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   */
  it('TC-NORMAL-004: getListedCompanies() - 複合フィルタ', async () => {
    // Given（前提条件）: 市場と業種が混在するデータを準備
    // 【テストデータ準備】: Prime銀行業、Prime自動車、Standard銀行業の混在データ
    // 【初期条件設定】: JQuantsClient.getListedInfo()が複数市場・業種の銘柄を返却するモック
    const mockCompanies: Company[] = [
      {
        code: '8306',
        name: '三菱UFJフィナンシャル・グループ',
        market: Market.PRIME,
        sector: Sector.BANKS,
      },
      {
        code: '7203',
        name: 'トヨタ自動車',
        market: Market.PRIME,
        sector: Sector.TRANSPORTATION_EQUIPMENT,
      },
      {
        code: '8356',
        name: '十六フィナンシャルグループ',
        market: Market.STANDARD,
        sector: Sector.BANKS,
      },
    ];

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue(mockCompanies);

    // When（実行）: getListedCompanies()をmarket='Prime', sector='7050'で呼び出し
    // 【実際の処理実行】: 複合フィルタの実行
    // 【処理内容】: market='Prime' AND sector='7050'でフィルタリング
    const result = await getListedCompanies({ market: 'Prime', sector: '7050' });

    // Then（検証）: Prime市場かつ銀行業の銘柄のみが返却されることを確認
    // 【結果検証】: 複合フィルタリング結果の検証
    expect(result.companies).toHaveLength(1); // 【確認内容】: Prime市場かつ銀行業の銘柄が1件返却されること 🔵
    expect(result.companies[0].market).toBe(Market.PRIME); // 【確認内容】: Prime市場であること 🔵
    expect(result.companies[0].sector).toBe(Sector.BANKS); // 【確認内容】: 銀行業であること 🔵
    expect(result.companies[0].code).toBe('8306'); // 【確認内容】: 三菱UFJが返却されること 🔵
  });
});

// =========================================
// 異常系テストケース（3件）
// =========================================
describe('get-listed-companies.ts - 異常系テストケース', () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをリセット
    // 【環境初期化】: 前のテストの影響を受けないよう、モックをクリーンにリセット
    vi.clearAllMocks();

    // 【環境変数設定】: TokenManagerが必要とする環境変数を設定
    process.env.JQUANTS_REFRESH_TOKEN = 'test-refresh-token';

    // 【TokenManagerモック】: TokenManagerのgetIdTokenメソッドをモック化
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-token');
  });

  /**
   * TC-ERROR-001: getListedCompanies() - 不正なmarket値🔵
   *
   * 【テスト目的】: 不正な市場区分が指定された場合にValidationErrorがスローされること
   * 【テスト内容】: market='Invalid'でgetListedCompanies()を呼び出し、ValidationErrorがスローされることを確認
   * 【期待される動作】: validateEnum()でエラーが検出され、ValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【エラーケースの概要】: 列挙型に存在しない値の指定
   * 【エラー処理の重要性】: 不正なパラメータでAPIリクエストを送らないため
   */
  it('TC-ERROR-001: getListedCompanies() - 不正なmarket値', async () => {
    // Given（前提条件）: 不正な市場区分値を準備
    // 【テストデータ準備】: Market列挙型に存在しない値
    // 【不正な理由】: 'Invalid' は Market列挙型に存在しない
    // 【実際の発生シナリオ】: ユーザーの誤入力、外部データの誤り
    const invalidMarket = 'Invalid';

    // When & Then（実行と検証）: ValidationErrorがスローされることを確認
    // 【実際の処理実行】: 不正な市場区分でgetListedCompanies()を呼び出し
    // 【結果検証】: ValidationErrorがスローされること
    await expect(getListedCompanies({ market: invalidMarket })).rejects.toThrow(
      ValidationError
    ); // 【確認内容】: ValidationErrorがスローされること 🔵
    await expect(getListedCompanies({ market: invalidMarket })).rejects.toThrow(
      'market パラメータの値が不正です'
    ); // 【確認内容】: エラーメッセージが正しいこと 🔵
    // 【システムの安全性】: 不正なリクエストを事前に防止
  });

  /**
   * TC-ERROR-002: getListedCompanies() - 不正なsector値🔵
   *
   * 【テスト目的】: 不正な業種コードが指定された場合にValidationErrorがスローされること
   * 【テスト内容】: sector='9999'でgetListedCompanies()を呼び出し、ValidationErrorがスローされることを確認
   * 【期待される動作】: validateEnum()でエラーが検出され、ValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【エラーケースの概要】: 列挙型に存在しない業種コードの指定
   * 【エラー処理の重要性】: 不正なパラメータでAPIリクエストを送らないため
   */
  it('TC-ERROR-002: getListedCompanies() - 不正なsector値', async () => {
    // Given（前提条件）: 不正な業種コード値を準備
    // 【テストデータ準備】: Sector列挙型に存在しない値
    // 【不正な理由】: '9999' は Sector列挙型に存在しない
    // 【実際の発生シナリオ】: ユーザーの誤入力、業種コードの誤り
    const invalidSector = '9999';

    // When & Then（実行と検証）: ValidationErrorがスローされることを確認
    // 【実際の処理実行】: 不正な業種コードでgetListedCompanies()を呼び出し
    // 【結果検証】: ValidationErrorがスローされること
    await expect(getListedCompanies({ sector: invalidSector })).rejects.toThrow(
      ValidationError
    ); // 【確認内容】: ValidationErrorがスローされること 🔵
    await expect(getListedCompanies({ sector: invalidSector })).rejects.toThrow(
      'sector パラメータの値が不正です'
    ); // 【確認内容】: エラーメッセージが正しいこと 🔵
    // 【システムの安全性】: 不正なリクエストを事前に防止
  });

  /**
   * TC-ERROR-003: getListedCompanies() - API通信エラー🔵
   *
   * 【テスト目的】: JQuantsClient.getListedInfo()がエラーをスローした場合に適切にエラーがハンドリングされること
   * 【テスト内容】: JQuantsClient.getListedInfo()がエラーをスローし、そのエラーが適切に伝播されることを確認
   * 【期待される動作】: APIエラーがそのまま呼び出し元にスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【エラーケースの概要】: J-Quants APIとの通信エラー
   * 【エラー処理の重要性】: API障害時の適切なエラー伝播
   */
  it('TC-ERROR-003: getListedCompanies() - API通信エラー', async () => {
    // Given（前提条件）: JQuantsClientがエラーをスローするモックを準備
    // 【テストデータ準備】: API通信エラーをシミュレート
    // 【初期条件設定】: JQuantsClient.getListedInfo()がエラーをスローするモック
    // 【実際の発生シナリオ】: ネットワーク障害、APIサーバーダウン、認証エラー
    const apiError = new Error('API通信エラー: ネットワークに接続できません');

    // 【モック設定】: JQuantsClient.getListedInfo()をエラーをスローするようにモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockRejectedValue(apiError);

    // When & Then（実行と検証）: APIエラーがスローされることを確認
    // 【実際の処理実行】: getListedCompanies()を呼び出し、APIエラーが発生
    // 【結果検証】: エラーが適切に伝播されること
    await expect(getListedCompanies({})).rejects.toThrow('API通信エラー'); // 【確認内容】: エラーが伝播されること 🔵
    // 【システムの安全性】: APIエラーが適切に呼び出し元に伝播される
  });
});

// =========================================
// 境界値テストケース（2件）
// =========================================
describe('get-listed-companies.ts - 境界値テストケース', () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをリセット
    // 【環境初期化】: 前のテストの影響を受けないよう、モックをクリーンにリセット
    vi.clearAllMocks();

    // 【環境変数設定】: TokenManagerが必要とする環境変数を設定
    process.env.JQUANTS_REFRESH_TOKEN = 'test-refresh-token';

    // 【TokenManagerモック】: TokenManagerのgetIdTokenメソッドをモック化
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-token');
  });

  /**
   * TC-BOUNDARY-001: getListedCompanies() - 空のフィルタ結果🔵
   *
   * 【テスト目的】: フィルタ条件に一致する銘柄が0件の場合に空配列が返却されること
   * 【テスト内容】: 存在しないmarket='Growth'を指定し、空配列が返却されることを確認
   * 【期待される動作】: フィルタ結果が0件の場合に空配列が返却される
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【境界値の意味】: フィルタ結果が0件の境界
   * 【境界値での動作保証】: 空配列が正しく返却されること
   */
  it('TC-BOUNDARY-001: getListedCompanies() - 空のフィルタ結果', async () => {
    // Given（前提条件）: Growth市場の銘柄が存在しないデータを準備
    // 【テストデータ準備】: Prime市場の銘柄のみ
    // 【境界値選択の根拠】: フィルタ結果が0件になる最小のケース
    // 【実際の使用場面】: 新興市場の銘柄が少ない場合、特定の業種が存在しない場合
    const mockCompanies: Company[] = [
      {
        code: '7203',
        name: 'トヨタ自動車',
        market: Market.PRIME,
        sector: Sector.TRANSPORTATION_EQUIPMENT,
      },
      {
        code: '9984',
        name: 'ソフトバンクグループ',
        market: Market.PRIME,
        sector: Sector.INFORMATION_COMMUNICATION,
      },
    ];

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue(mockCompanies);

    // When（実行）: getListedCompanies()をmarket='Growth'で呼び出し
    // 【実際の処理実行】: Growth市場フィルタの実行
    // 【処理内容】: market='Growth'でフィルタリング（一致する銘柄なし）
    const result = await getListedCompanies({ market: 'Growth' });

    // Then（検証）: 空配列が返却されることを確認
    // 【結果検証】: 空のフィルタ結果の検証
    expect(result.companies).toBeInstanceOf(Array); // 【確認内容】: 配列型であること 🔵
    expect(result.companies).toHaveLength(0); // 【確認内容】: 空配列であること 🔵
    // 【境界での正確性】: 0件の場合も正しく空配列が返却される
  });

  /**
   * TC-BOUNDARY-002: getListedCompanies() - 大量データ処理（3000+銘柄）🔵
   *
   * 【テスト目的】: 全銘柄取得時に3000件以上のデータを正しく処理できること
   * 【テスト内容】: 3000件以上の銘柄データを取得し、すべてのデータが正しく返却されることを確認
   * 【期待される動作】: 大量のデータも正しく処理され、全件が返却される
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【境界値の意味】: 実際の全銘柄取得時のデータ量（約3800銘柄）
   * 【境界値での動作保証】: 大量データでもパフォーマンス劣化やメモリエラーが発生しないこと
   */
  it('TC-BOUNDARY-002: getListedCompanies() - 大量データ処理', async () => {
    // Given（前提条件）: 3000件以上の銘柄データを準備
    // 【テストデータ準備】: 3800銘柄をシミュレート
    // 【境界値選択の根拠】: 実際の東証全銘柄数（約3800銘柄）
    // 【実際の使用場面】: パラメータなしで全銘柄を取得する場合
    const mockCompanies: Company[] = Array.from({ length: 3800 }, (_, i) => ({
      code: String(1000 + i).padStart(4, '0'),
      name: `テスト企業${i + 1}`,
      market: Market.PRIME,
      sector: Sector.INFORMATION_COMMUNICATION,
    }));

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue(mockCompanies);

    // When（実行）: getListedCompanies()をパラメータなしで呼び出し
    // 【実際の処理実行】: 全銘柄取得の実行
    // 【処理内容】: 3800件のデータ取得とフィルタリングなしの処理
    const result = await getListedCompanies({});

    // Then（検証）: 全3800件が返却されることを確認
    // 【結果検証】: 大量データの処理結果の検証
    expect(result.companies).toHaveLength(3800); // 【確認内容】: 全3800件が返却されること 🔵
    expect(result.companies[0].code).toBe('1000'); // 【確認内容】: 最初の銘柄コードが正しいこと 🔵
    expect(result.companies[3799].code).toBe('4799'); // 【確認内容】: 最後の銘柄コードが正しいこと 🔵
    // 【境界での正確性】: 大量データでもすべてのデータが正しく処理されること
    // 【パフォーマンス】: メモリエラーやタイムアウトが発生しないこと
  });
});
