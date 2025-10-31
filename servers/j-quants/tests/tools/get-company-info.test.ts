/**
 * TASK-0009: get_company_info MCPツール テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-30
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.x
 * 【目的】: 企業情報+最新株価取得ツールのテスト実装（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCompanyInfo } from '../../src/tools/get-company-info';
import { JQuantsClient } from '../../src/api/j-quants-client';
import { TokenManager } from '../../src/auth/token-manager';
import { Company, StockPrice, Market, Sector } from '../../src/types';
import { ValidationError } from '../../src/utils/validator';

// =========================================
// 正常系テストケース（2件）
// =========================================
describe('get-company-info.ts - 正常系テストケース', () => {
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
   * TC-NORMAL-001: getCompanyInfo() - codeのみ指定（基本的な企業情報+最新株価取得）🔵
   *
   * 【テスト目的】: 銘柄コード指定で企業情報（名称、市場、業種）と最新株価を統合して取得できること
   * 【テスト内容】: code='7203'でgetCompanyInfo()を呼び出し、企業情報と最新株価が統合されて返却されることを確認
   * 【期待される動作】: JQuantsClient.getListedInfo()とgetDailyQuotes()を呼び出し、データを統合してCompanyInfo形式で返却
   * 🔵 信頼性レベル: 青信号（要件定義書 REQ-FUNC-001, REQ-FUNC-002, REQ-FUNC-003 から確定）
   */
  it('TC-NORMAL-001: getCompanyInfo() - codeのみ指定', async () => {
    // Given（前提条件）: JQuantsClientのモックを準備
    // 【テストデータ準備】: トヨタ自動車の企業情報と株価データをモック
    // 【初期条件設定】: JQuantsClient.getListedInfo()とgetDailyQuotes()が企業情報と株価を返却するモック
    const mockCompany: Company = {
      code: '7203',
      name: 'トヨタ自動車',
      market: Market.PRIME,
      sector: Sector.TRANSPORTATION_EQUIPMENT,
    };

    const mockPrices: StockPrice[] = [
      {
        code: '7203',
        date: '2025-10-29',
        open: 3000,
        high: 3100,
        low: 2950,
        close: 3050,
        volume: 1000000,
      },
    ];

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue([mockCompany]);

    // 【モック設定】: JQuantsClient.getDailyQuotes()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);

    // When（実行）: getCompanyInfo()をcodeのみで呼び出し
    // 【実際の処理実行】: 企業情報+最新株価取得処理の実行
    // 【処理内容】: code='7203'で企業情報と最新株価データを取得
    const result = await getCompanyInfo({ code: '7203' });

    // Then（検証）: 企業情報と最新株価が統合されて返却されることを確認
    // 【結果検証】: CompanyInfoの全プロパティの存在を確認
    expect(result).toHaveProperty('code'); // 【確認内容】: codeプロパティが存在すること 🔵
    expect(result.code).toBe('7203'); // 【確認内容】: codeが入力値と一致すること 🔵
    expect(result).toHaveProperty('name'); // 【確認内容】: nameプロパティが存在すること 🔵
    expect(result.name).toBe('トヨタ自動車'); // 【確認内容】: nameが企業名と一致すること 🔵
    expect(result).toHaveProperty('market'); // 【確認内容】: marketプロパティが存在すること 🔵
    expect(result.market).toBe(Market.PRIME); // 【確認内容】: marketがPrime市場であること 🔵
    expect(result).toHaveProperty('sector'); // 【確認内容】: sectorプロパティが存在すること 🔵
    expect(result.sector).toBe(Sector.TRANSPORTATION_EQUIPMENT); // 【確認内容】: sectorが輸送用機器であること 🔵
    expect(result).toHaveProperty('latest_price'); // 【確認内容】: latest_priceプロパティが存在すること 🔵
    expect(result.latest_price).toBe(3050); // 【確認内容】: latest_priceが最新日のclose値であること 🔵

    // 【API呼び出し確認】: JQuantsClient.getListedInfo()が正しく呼ばれたことを確認
    expect(JQuantsClient.prototype.getListedInfo).toHaveBeenCalledTimes(1); // 【確認内容】: getListedInfo()が1回だけ呼ばれること 🔵

    // 【API呼び出し確認】: JQuantsClient.getDailyQuotes()が正しく呼ばれたことを確認
    expect(JQuantsClient.prototype.getDailyQuotes).toHaveBeenCalledTimes(1); // 【確認内容】: getDailyQuotes()が1回だけ呼ばれること 🔵
    expect(JQuantsClient.prototype.getDailyQuotes).toHaveBeenCalledWith('7203'); // 【確認内容】: codeパラメータで呼ばれること 🔵
  });

  /**
   * TC-NORMAL-002: getCompanyInfo() - 最新株価が正しく抽出されることを確認🔵
   *
   * 【テスト目的】: 複数日の株価データが存在する場合に、最新日（日付が最も新しい）のデータが抽出されること
   * 【テスト内容】: code='7203'で複数日の株価データをモック、最新日の株価が返却されることを確認
   * 【期待される動作】: getDailyQuotes()が複数日のデータを返却、日付降順でソート、先頭データのclose値をlatest_priceに設定
   * 🔵 信頼性レベル: 青信号（要件定義書 REQ-FUNC-002 と Phase 1タスク定義から確定）
   */
  it('TC-NORMAL-002: getCompanyInfo() - 最新株価の日付検証', async () => {
    // Given（前提条件）: 企業情報と複数日の株価データを準備
    // 【テストデータ準備】: トヨタ自動車の企業情報と、順不同の複数日の株価データをモック
    // 【初期条件設定】: JQuantsClient.getListedInfo()とgetDailyQuotes()がデータを返却するモック
    const mockCompany: Company = {
      code: '7203',
      name: 'トヨタ自動車',
      market: Market.PRIME,
      sector: Sector.TRANSPORTATION_EQUIPMENT,
    };

    // 【日付順不同のデータ】: 実際のAPIはソートされていない可能性があるため、順不同でテスト
    const mockPrices: StockPrice[] = [
      {
        code: '7203',
        date: '2025-10-27',
        open: 2900,
        high: 2980,
        low: 2850,
        close: 2950,
        volume: 900000,
      },
      {
        code: '7203',
        date: '2025-10-29', // 最新日
        open: 3000,
        high: 3100,
        low: 2950,
        close: 3050, // 最新株価
        volume: 1000000,
      },
      {
        code: '7203',
        date: '2025-10-28',
        open: 2950,
        high: 3020,
        low: 2900,
        close: 3000,
        volume: 950000,
      },
    ];

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue([mockCompany]);

    // 【モック設定】: JQuantsClient.getDailyQuotes()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);

    // When（実行）: getCompanyInfo()をcodeで呼び出し
    // 【実際の処理実行】: 企業情報+最新株価取得処理の実行
    // 【処理内容】: code='7203'で企業情報と最新株価データを取得（複数日の中から最新を抽出）
    const result = await getCompanyInfo({ code: '7203' });

    // Then（検証）: 最新日の株価が抽出されることを確認
    // 【結果検証】: latest_priceが最新日（2025-10-29）のclose値であることを確認
    expect(result.latest_price).toBe(3050); // 【確認内容】: latest_priceが最新日（2025-10-29）のclose値3050であること 🔵
    expect(result.latest_price).not.toBe(2950); // 【確認内容】: 古い日付（2025-10-27）のclose値2950でないこと 🔵
    expect(result.latest_price).not.toBe(3000); // 【確認内容】: 古い日付（2025-10-28）のclose値3000でないこと 🔵
  });
});

// =========================================
// 異常系テストケース（3件）
// =========================================
describe('get-company-info.ts - 異常系テストケース', () => {
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
   * TC-ERROR-001: getCompanyInfo() - codeパラメータ未指定🔵
   *
   * 【テスト目的】: 必須パラメータ code が指定されていない場合にValidationErrorがスローされること
   * 【テスト内容】: パラメータ{}でgetCompanyInfo()を呼び出し
   * 【期待される動作】: ValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書 REQ-VAL-001 と既存実装パターンから確定）
   * 【エラーケースの概要】: 必須パラメータの欠如
   * 【エラー処理の重要性】: 必須パラメータ不足を早期に検出
   */
  it('TC-ERROR-001: getCompanyInfo() - codeパラメータ未指定', async () => {
    // Given（前提条件）: codeパラメータを含まない空のパラメータ
    // 【テストデータ準備】: code未指定の不正パラメータ
    // 【不正な理由】: codeは必須パラメータだが指定されていない
    // 【実際の発生シナリオ】: ユーザーが銘柄コードを指定せずにツールを実行した場合
    const params = {};

    // When & Then（実行と検証）: ValidationErrorがスローされることを確認
    // 【実際の処理実行】: code未指定でgetCompanyInfo()を呼び出し
    // 【結果検証】: ValidationErrorがスローされること
    await expect(getCompanyInfo(params)).rejects.toThrow(ValidationError); // 【確認内容】: ValidationErrorがスローされること 🔵
    await expect(getCompanyInfo(params)).rejects.toThrow(
      '必須パラメータ code が指定されていません'
    ); // 【確認内容】: エラーメッセージが正しいこと 🔵

    // 【システムの安全性】: 不正なリクエストを事前に防止
  });

  /**
   * TC-ERROR-002: getCompanyInfo() - 不正なcode値🔵
   *
   * 【テスト目的】: 4桁数字以外のcodeが指定された場合にValidationErrorがスローされること
   * 【テスト内容】: code='123'（3桁）、code='12345'（5桁）、code='ABCD'（アルファベット）でgetCompanyInfo()を呼び出し
   * 【期待される動作】: すべてのケースでValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書 REQ-VAL-002 と既存実装パターンから確定）
   * 【エラーケースの概要】: 不正なcodeフォーマット
   * 【エラー処理の重要性】: 不正なフォーマットでのAPI呼び出しを防ぐ
   */
  it('TC-ERROR-002: getCompanyInfo() - 不正なcode値', async () => {
    // Given（前提条件）: 不正なcode値を準備
    // 【テストデータ準備】: 3桁、5桁、アルファベットの不正なcode
    // 【不正な理由】: codeは4桁の数字でなければならない
    // 【実際の発生シナリオ】: ユーザーが誤った形式の銘柄コードを入力した場合
    const invalidCodes = [
      { code: '123', reason: '3桁' },
      { code: '12345', reason: '5桁' },
      { code: 'ABCD', reason: 'アルファベット' },
    ];

    // When & Then（実行と検証）: すべてのケースでValidationErrorがスローされることを確認
    for (const { code, reason } of invalidCodes) {
      // 【実際の処理実行】: 不正なcodeでgetCompanyInfo()を呼び出し
      // 【結果検証】: ValidationErrorがスローされること
      await expect(getCompanyInfo({ code })).rejects.toThrow(ValidationError); // 【確認内容】: ValidationErrorがスローされること (${reason}) 🔵
      await expect(getCompanyInfo({ code })).rejects.toThrow(
        '銘柄コードは4桁の数字である必要があります'
      ); // 【確認内容】: エラーメッセージが正しいこと (${reason}) 🔵
    }

    // 【システムの安全性】: 不正なフォーマットでのAPI呼び出しを防ぐ
  });

  /**
   * TC-ERROR-003: getCompanyInfo() - 存在しない銘柄コード🔵
   *
   * 【テスト目的】: 形式は正しいが実在しない銘柄コードが指定された場合にErrorがスローされること
   * 【テスト内容】: code='9999'（存在しない銘柄コード）でgetCompanyInfo()を呼び出し
   * 【期待される動作】: Errorがスローされる
   * 🔵 信頼性レベル: 青信号（Phase 1タスク定義のテストケース5と既存実装パターンから確定）
   * 【エラーケースの概要】: 実在しない銘柄コード
   * 【エラー処理の重要性】: 存在しないデータへのアクセスを適切に処理
   */
  it('TC-ERROR-003: getCompanyInfo() - 存在しない銘柄コード', async () => {
    // Given（前提条件）: 存在しない銘柄コードでJQuantsClient.getListedInfo()が空配列を返すモック
    // 【テストデータ準備】: JQuantsClient.getListedInfo()が空配列を返すようにモック
    // 【不正な理由】: 銘柄コード'9999'は実在しない
    // 【実際の発生シナリオ】: ユーザーが誤った銘柄コードを入力した場合
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue([]);

    // When & Then（実行と検証）: Errorがスローされることを確認
    // 【実際の処理実行】: 存在しない銘柄コードでgetCompanyInfo()を呼び出し
    // 【結果検証】: Errorがスローされること
    await expect(getCompanyInfo({ code: '9999' })).rejects.toThrow(Error); // 【確認内容】: Errorがスローされること 🔵
    await expect(getCompanyInfo({ code: '9999' })).rejects.toThrow(
      '指定された銘柄コード'
    ); // 【確認内容】: エラーメッセージに銘柄コードが含まれること 🔵

    // 【システムの安全性】: 存在しないデータへのアクセスを適切に処理
  });
});

// =========================================
// 境界値テストケース（2件）
// =========================================
describe('get-company-info.ts - 境界値テストケース', () => {
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
   * TC-BOUNDARY-001: getCompanyInfo() - 株価データが存在しない企業🔵
   *
   * 【テスト目的】: 企業情報は存在するが株価データが存在しない場合の処理が正しく動作すること
   * 【テスト内容】: code='8000'（株価データなし）でgetCompanyInfo()を呼び出し
   * 【期待される動作】: latest_priceがundefinedで企業情報のみが返却される、またはErrorがスローされる
   * 🔵 信頼性レベル: 青信号（Phase 1タスク定義のテストケース6から確定）
   * 【境界値の意味】: 企業情報は存在するが株価データが存在しない境界ケース
   * 【境界値での動作保証】: 部分的なデータ欠損に対する堅牢性
   */
  it('TC-BOUNDARY-001: getCompanyInfo() - 株価データが存在しない企業', async () => {
    // Given（前提条件）: 企業情報は存在するが株価データが存在しないケースをモック
    // 【テストデータ準備】: 企業情報は返却されるが、株価データは空配列
    // 【境界値選択の根拠】: 企業情報は存在するが株価データが存在しないケース
    // 【実際の使用場面】: IPO直後でまだ株価データが登録されていない企業
    const mockCompany: Company = {
      code: '8000',
      name: 'テスト企業',
      market: Market.PRIME,
      sector: Sector.INFORMATION_COMMUNICATION,
    };

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue([mockCompany]);

    // 【モック設定】: JQuantsClient.getDailyQuotes()が空配列を返すようにモック化
    vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue([]);

    // When（実行）: getCompanyInfo()を株価データなしの銘柄コードで呼び出し
    // 【実際の処理実行】: 企業情報取得処理の実行
    // 【処理内容】: code='8000'で企業情報を取得（株価データなし）
    const result = await getCompanyInfo({ code: '8000' });

    // Then（検証）: 企業情報は返却され、latest_priceはundefinedであることを確認
    // 【結果検証】: 株価データが存在しない場合の処理結果の検証
    expect(result.code).toBe('8000'); // 【確認内容】: codeが一致すること 🔵
    expect(result.name).toBe('テスト企業'); // 【確認内容】: nameが一致すること 🔵
    expect(result.market).toBe(Market.PRIME); // 【確認内容】: marketが一致すること 🔵
    expect(result.sector).toBe(Sector.INFORMATION_COMMUNICATION); // 【確認内容】: sectorが一致すること 🔵
    expect(result.latest_price).toBeUndefined(); // 【確認内容】: latest_priceがundefinedであること 🔵

    // 【境界での正確性】: 株価データが0件の場合でも、企業情報は正しく返却される
    // 【一貫した動作】: CompanyInfo 型定義に準拠
  });

  /**
   * TC-BOUNDARY-002: getCompanyInfo() - データ構造の完全性確認🔵
   *
   * 【テスト目的】: 返却データが CompanyInfo インターフェースの全プロパティを含むことの確認
   * 【テスト内容】: code='7203'でgetCompanyInfo()を呼び出し、全プロパティの存在を確認
   * 【期待される動作】: すべてのプロパティが存在する
   * 🔵 信頼性レベル: 青信号（CompanyInfo 型定義とPhase 1タスク定義から確定）
   * 【境界値の意味】: 返却データが CompanyInfo インターフェースの全プロパティを含むことの境界
   * 【境界値での動作保証】: 部分的なデータではなく、完全なデータ構造が返却される
   */
  it('TC-BOUNDARY-002: getCompanyInfo() - データ構造の完全性確認', async () => {
    // Given（前提条件）: 完全な企業情報と株価データを準備
    // 【テストデータ準備】: すべてのプロパティを含む企業情報と株価データをモック
    // 【境界値選択の根拠】: CompanyInfo インターフェースの全プロパティが揃っている正常なデータで構造を検証
    // 【実際の使用場面】: すべてのデータを利用した分析
    const mockCompany: Company = {
      code: '7203',
      name: 'トヨタ自動車',
      market: Market.PRIME,
      sector: Sector.TRANSPORTATION_EQUIPMENT,
    };

    const mockPrices: StockPrice[] = [
      {
        code: '7203',
        date: '2025-10-29',
        open: 3000,
        high: 3100,
        low: 2950,
        close: 3050,
        volume: 1000000,
      },
    ];

    // 【モック設定】: JQuantsClient.getListedInfo()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getListedInfo').mockResolvedValue([mockCompany]);

    // 【モック設定】: JQuantsClient.getDailyQuotes()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);

    // When（実行）: getCompanyInfo()をcodeで呼び出し
    // 【実際の処理実行】: 完全なデータ構造取得の実行
    // 【処理内容】: code='7203'で企業情報と株価データを取得
    const result = await getCompanyInfo({ code: '7203' });

    // Then（検証）: すべてのプロパティが存在することを確認
    // 【結果検証】: データ構造の完全性検証

    // 【CompanyInfo型定義の全プロパティ存在確認】
    expect(result).toHaveProperty('code'); // 【確認内容】: codeが存在すること 🔵
    expect(result).toHaveProperty('name'); // 【確認内容】: nameが存在すること 🔵
    expect(result).toHaveProperty('market'); // 【確認内容】: marketが存在すること 🔵
    expect(result).toHaveProperty('sector'); // 【確認内容】: sectorが存在すること 🔵
    expect(result).toHaveProperty('latest_price'); // 【確認内容】: latest_priceが存在すること 🔵

    // 【型の検証】
    expect(typeof result.code).toBe('string'); // 【確認内容】: codeがstring型であること 🔵
    expect(typeof result.name).toBe('string'); // 【確認内容】: nameがstring型であること 🔵
    expect(typeof result.market).toBe('string'); // 【確認内容】: marketがenum値（string型）であること 🔵
    expect(typeof result.sector).toBe('string'); // 【確認内容】: sectorがenum値（string型）であること 🔵
    expect(typeof result.latest_price).toBe('number'); // 【確認内容】: latest_priceがnumber型であること 🔵

    // 【境界での正確性】: すべてのプロパティが存在すること
    // 【一貫した動作】: CompanyInfo 型定義に完全に準拠
    // 【TypeScript strict mode での型安全性】: コンパイル時に型エラーがないこと
  });
});
