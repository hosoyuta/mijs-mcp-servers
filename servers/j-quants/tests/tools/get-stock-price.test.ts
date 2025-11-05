/**
 * TASK-0007: get_stock_price MCPツール テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-30
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.x
 * 【目的】: 株価データ取得ツールのテスト実装（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStockPrice } from '../../src/tools/get-stock-price';
import { JQuantsClient } from '../../src/api/j-quants-client';
import { TokenManager } from '../../src/auth/token-manager';
import { StockPrice } from '../../src/types';
import { ValidationError } from '../../src/utils/validator';

// =========================================
// 正常系テストケース（4件）
// =========================================
describe('get-stock-price.ts - 正常系テストケース', () => {
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
   * TC-NORMAL-001: getStockPrice() - codeのみ指定（全期間データ取得、日付降順）🔵
   *
   * 【テスト目的】: 銘柄コードのみを指定した場合に全期間の株価データが日付降順で取得できること
   * 【テスト内容】: code='7203'でgetStockPrice()を呼び出し
   * 【期待される動作】: 全期間のデータが日付降順でソートされて返却される
   * 🔵 信頼性レベル: 青信号（要件定義書とPhase 1タスク定義から確定）
   */
  it('TC-NORMAL-001: getStockPrice() - codeのみ指定', async () => {
    // Given（前提条件）: JQuantsClientのモックを準備
    // 【テストデータ準備】: 複数日の株価データをモック（日付は降順にはなっていない）
    // 【初期条件設定】: JQuantsClient.getDailyQuotes()が複数日のデータを返却するモック
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
        date: '2025-10-29',
        open: 3000,
        high: 3100,
        low: 2950,
        close: 3050,
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

    // 【モック設定】: JQuantsClient.getDailyQuotes()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);

    // When（実行）: getStockPrice()をcodeのみで呼び出し
    // 【実際の処理実行】: 全期間データ取得処理の実行
    // 【処理内容】: code='7203'で株価データを取得
    const result = await getStockPrice({ code: '7203' });

    // Then（検証）: 日付降順でデータが返却されることを確認
    // 【結果検証】: codeとprices配列の存在を確認
    expect(result).toHaveProperty('code'); // 【確認内容】: codeプロパティが存在すること 🔵
    expect(result.code).toBe('7203'); // 【確認内容】: codeが一致すること 🔵
    expect(result).toHaveProperty('prices'); // 【確認内容】: pricesプロパティが存在すること 🔵
    expect(result.prices).toBeInstanceOf(Array); // 【確認内容】: pricesが配列型であること 🔵
    expect(result.prices).toHaveLength(3); // 【確認内容】: 全3件が返却されること 🔵

    // 【日付降順確認】: prices[0].date >= prices[1].date >= prices[2].date
    expect(result.prices[0].date).toBe('2025-10-29'); // 【確認内容】: 最新日が最初 🔵
    expect(result.prices[1].date).toBe('2025-10-28'); // 【確認内容】: 2番目に新しい日 🔵
    expect(result.prices[2].date).toBe('2025-10-27'); // 【確認内容】: 3番目に新しい日 🔵

    // 【日付降順の一般検証】: すべての連続する要素で date[i] >= date[i+1]
    for (let i = 0; i < result.prices.length - 1; i++) {
      expect(result.prices[i].date >= result.prices[i + 1].date).toBe(true); // 【確認内容】: 日付降順が維持されていること 🔵
    }

    // 【API呼び出し確認】: JQuantsClient.getDailyQuotes()が正しく呼ばれたことを確認
    expect(JQuantsClient.prototype.getDailyQuotes).toHaveBeenCalledTimes(1); // 【確認内容】: APIが1回だけ呼ばれること 🔵
    expect(JQuantsClient.prototype.getDailyQuotes).toHaveBeenCalledWith('7203'); // 【確認内容】: codeで呼ばれること 🔵
  });

  /**
   * TC-NORMAL-002: getStockPrice() - code + from_date（開始日フィルタ）🔵
   *
   * 【テスト目的】: from_date を指定した場合、指定日以降のデータのみが返却されること
   * 【テスト内容】: code='7203', from_date='2025-10-28'でgetStockPrice()を呼び出し
   * 【期待される動作】: from_date以降のデータのみがフィルタリングされて返却される
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   */
  it('TC-NORMAL-002: getStockPrice() - code + from_date', async () => {
    // Given（前提条件）: 複数日のデータを準備
    // 【テストデータ準備】: 2025-10-27～2025-10-29の3日間のデータ
    // 【初期条件設定】: JQuantsClient.getDailyQuotes()が全日のデータを返却するモック
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
        date: '2025-10-28',
        open: 2950,
        high: 3020,
        low: 2900,
        close: 3000,
        volume: 950000,
      },
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

    // 【モック設定】: JQuantsClient.getDailyQuotes()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);

    // When（実行）: getStockPrice()をcode + from_dateで呼び出し
    // 【実際の処理実行】: 開始日フィルタの実行
    // 【処理内容】: from_date='2025-10-28'以降のデータを取得
    const result = await getStockPrice({ code: '7203', from_date: '2025-10-28' });

    // Then（検証）: from_date以降のデータのみが返却されることを確認
    // 【結果検証】: フィルタリング結果の検証
    expect(result.prices).toHaveLength(2); // 【確認内容】: 2025-10-28以降の2件が返却されること 🔵

    // 【from_date条件確認】: すべてのdate >= '2025-10-28'
    expect(
      result.prices.every((price) => price.date >= '2025-10-28')
    ).toBe(true); // 【確認内容】: すべて2025-10-28以降であること 🔵

    // 【除外データ確認】: 2025-10-27のデータが含まれていない
    expect(result.prices.some((price) => price.date === '2025-10-27')).toBe(
      false
    ); // 【確認内容】: 2025-10-27以前のデータが含まれないこと 🔵

    // 【日付降順維持確認】: フィルタ後も日付降順が維持されている
    expect(result.prices[0].date).toBe('2025-10-29'); // 【確認内容】: 最新日が最初 🔵
    expect(result.prices[1].date).toBe('2025-10-28'); // 【確認内容】: 2番目に新しい日 🔵
  });

  /**
   * TC-NORMAL-003: getStockPrice() - code + to_date（終了日フィルタ）🔵
   *
   * 【テスト目的】: to_date を指定した場合、指定日以前のデータのみが返却されること
   * 【テスト内容】: code='7203', to_date='2025-10-28'でgetStockPrice()を呼び出し
   * 【期待される動作】: to_date以前のデータのみがフィルタリングされて返却される
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   */
  it('TC-NORMAL-003: getStockPrice() - code + to_date', async () => {
    // Given（前提条件）: 複数日のデータを準備
    // 【テストデータ準備】: 2025-10-27～2025-10-29の3日間のデータ
    // 【初期条件設定】: JQuantsClient.getDailyQuotes()が全日のデータを返却するモック
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
        date: '2025-10-28',
        open: 2950,
        high: 3020,
        low: 2900,
        close: 3000,
        volume: 950000,
      },
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

    // 【モック設定】: JQuantsClient.getDailyQuotes()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);

    // When（実行）: getStockPrice()をcode + to_dateで呼び出し
    // 【実際の処理実行】: 終了日フィルタの実行
    // 【処理内容】: to_date='2025-10-28'以前のデータを取得
    const result = await getStockPrice({ code: '7203', to_date: '2025-10-28' });

    // Then（検証）: to_date以前のデータのみが返却されることを確認
    // 【結果検証】: フィルタリング結果の検証
    expect(result.prices).toHaveLength(2); // 【確認内容】: 2025-10-28以前の2件が返却されること 🔵

    // 【to_date条件確認】: すべてのdate <= '2025-10-28'
    expect(
      result.prices.every((price) => price.date <= '2025-10-28')
    ).toBe(true); // 【確認内容】: すべて2025-10-28以前であること 🔵

    // 【除外データ確認】: 2025-10-29のデータが含まれていない
    expect(result.prices.some((price) => price.date === '2025-10-29')).toBe(
      false
    ); // 【確認内容】: 2025-10-29以降のデータが含まれないこと 🔵

    // 【日付降順維持確認】: フィルタ後も日付降順が維持されている
    expect(result.prices[0].date).toBe('2025-10-28'); // 【確認内容】: 最新日が最初 🔵
    expect(result.prices[1].date).toBe('2025-10-27'); // 【確認内容】: 2番目に新しい日 🔵
  });

  /**
   * TC-NORMAL-004: getStockPrice() - code + from_date + to_date（日付範囲フィルタ）🔵
   *
   * 【テスト目的】: from_date と to_date を両方指定した場合、指定範囲内のデータのみが返却されること
   * 【テスト内容】: code='7203', from_date='2025-10-15', to_date='2025-10-20'でgetStockPrice()を呼び出し
   * 【期待される動作】: from_date <= date <= to_dateの範囲のデータのみがフィルタリングされて返却される
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   */
  it('TC-NORMAL-004: getStockPrice() - code + from_date + to_date', async () => {
    // Given（前提条件）: 広い日付範囲のデータを準備
    // 【テストデータ準備】: 2025-10-10～2025-10-25の複数日のデータ
    // 【初期条件設定】: JQuantsClient.getDailyQuotes()が全日のデータを返却するモック
    const mockPrices: StockPrice[] = [
      {
        code: '7203',
        date: '2025-10-10',
        open: 2800,
        high: 2850,
        low: 2750,
        close: 2820,
        volume: 800000,
      },
      {
        code: '7203',
        date: '2025-10-15',
        open: 2850,
        high: 2900,
        low: 2800,
        close: 2880,
        volume: 850000,
      },
      {
        code: '7203',
        date: '2025-10-18',
        open: 2900,
        high: 2950,
        low: 2850,
        close: 2920,
        volume: 900000,
      },
      {
        code: '7203',
        date: '2025-10-20',
        open: 2920,
        high: 2980,
        low: 2870,
        close: 2950,
        volume: 920000,
      },
      {
        code: '7203',
        date: '2025-10-25',
        open: 2980,
        high: 3050,
        low: 2920,
        close: 3000,
        volume: 950000,
      },
    ];

    // 【モック設定】: JQuantsClient.getDailyQuotes()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);

    // When（実行）: getStockPrice()をcode + from_date + to_dateで呼び出し
    // 【実際の処理実行】: 日付範囲フィルタの実行
    // 【処理内容】: from_date='2025-10-15', to_date='2025-10-20'の範囲データを取得
    const result = await getStockPrice({
      code: '7203',
      from_date: '2025-10-15',
      to_date: '2025-10-20',
    });

    // Then（検証）: from_date <= date <= to_dateの範囲のデータのみが返却されることを確認
    // 【結果検証】: 日付範囲フィルタリング結果の検証
    expect(result.prices).toHaveLength(3); // 【確認内容】: 2025-10-15～2025-10-20の3件が返却されること 🔵

    // 【from_date条件確認】: すべてのdate >= '2025-10-15'
    expect(
      result.prices.every((price) => price.date >= '2025-10-15')
    ).toBe(true); // 【確認内容】: すべて2025-10-15以降であること 🔵

    // 【to_date条件確認】: すべてのdate <= '2025-10-20'
    expect(
      result.prices.every((price) => price.date <= '2025-10-20')
    ).toBe(true); // 【確認内容】: すべて2025-10-20以前であること 🔵

    // 【除外データ確認】: 範囲外のデータが含まれていない
    expect(result.prices.some((price) => price.date === '2025-10-10')).toBe(
      false
    ); // 【確認内容】: 2025-10-10のデータが含まれないこと 🔵
    expect(result.prices.some((price) => price.date === '2025-10-25')).toBe(
      false
    ); // 【確認内容】: 2025-10-25のデータが含まれないこと 🔵

    // 【日付降順維持確認】: フィルタ後も日付降順が維持されている
    expect(result.prices[0].date).toBe('2025-10-20'); // 【確認内容】: 最新日が最初 🔵
    expect(result.prices[1].date).toBe('2025-10-18'); // 【確認内容】: 2番目に新しい日 🔵
    expect(result.prices[2].date).toBe('2025-10-15'); // 【確認内容】: 3番目に新しい日 🔵
  });
});

// =========================================
// 異常系テストケース（4件）
// =========================================
describe('get-stock-price.ts - 異常系テストケース', () => {
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
   * TC-ERROR-001: getStockPrice() - codeパラメータ未指定🔵
   *
   * 【テスト目的】: 必須パラメータ code が指定されていない場合にValidationErrorがスローされること
   * 【テスト内容】: パラメータ{}でgetStockPrice()を呼び出し
   * 【期待される動作】: ValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【エラーケースの概要】: 必須パラメータの欠如
   * 【エラー処理の重要性】: 必須パラメータ不足を早期に検出
   */
  it('TC-ERROR-001: getStockPrice() - codeパラメータ未指定', async () => {
    // Given（前提条件）: codeパラメータを含まない空のパラメータ
    // 【テストデータ準備】: code未指定の不正パラメータ
    // 【不正な理由】: codeは必須パラメータだが指定されていない
    // 【実際の発生シナリオ】: ユーザーが銘柄コードを指定せずにツールを実行した場合
    const params = {};

    // When & Then（実行と検証）: ValidationErrorがスローされることを確認
    // 【実際の処理実行】: code未指定でgetStockPrice()を呼び出し
    // 【結果検証】: ValidationErrorがスローされること
    await expect(getStockPrice(params)).rejects.toThrow(
      ValidationError
    ); // 【確認内容】: ValidationErrorがスローされること 🔵
    await expect(getStockPrice(params)).rejects.toThrow(
      '必須パラメータ code が指定されていません'
    ); // 【確認内容】: エラーメッセージが正しいこと 🔵

    // 【システムの安全性】: 不正なリクエストを事前に防止
  });

  /**
   * TC-ERROR-002: getStockPrice() - 不正なcode値🔵
   *
   * 【テスト目的】: 4桁数字以外のcodeが指定された場合にValidationErrorがスローされること
   * 【テスト内容】: code='123'（3桁）、code='12345'（5桁）、code='ABCD'（アルファベット）でgetStockPrice()を呼び出し
   * 【期待される動作】: すべてのケースでValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【エラーケースの概要】: 不正なcodeフォーマット
   * 【エラー処理の重要性】: 不正なフォーマットでのAPI呼び出しを防ぐ
   */
  it('TC-ERROR-002: getStockPrice() - 不正なcode値', async () => {
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
      // 【実際の処理実行】: 不正なcodeでgetStockPrice()を呼び出し
      // 【結果検証】: ValidationErrorがスローされること
      await expect(getStockPrice({ code })).rejects.toThrow(
        ValidationError
      ); // 【確認内容】: ValidationErrorがスローされること (${reason}) 🔵
      await expect(getStockPrice({ code })).rejects.toThrow(
        '銘柄コードは4桁の数字である必要があります'
      ); // 【確認内容】: エラーメッセージが正しいこと (${reason}) 🔵
    }

    // 【システムの安全性】: 不正なフォーマットでのAPI呼び出しを防ぐ
  });

  /**
   * TC-ERROR-003: getStockPrice() - 不正な日付形式🔵
   *
   * 【テスト目的】: YYYY-MM-DD形式以外の日付が指定された場合にValidationErrorがスローされること
   * 【テスト内容】: from_date='2025/10/01'（スラッシュ）、from_date='2025-1-1'（短縮）でgetStockPrice()を呼び出し
   * 【期待される動作】: すべてのケースでValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【エラーケースの概要】: 不正な日付フォーマット
   * 【エラー処理の重要性】: 不正な日付形式でフィルタリングエラーを防ぐ
   */
  it('TC-ERROR-003: getStockPrice() - 不正な日付形式', async () => {
    // Given（前提条件）: 不正な日付形式を準備
    // 【テストデータ準備】: スラッシュ区切り、短縮形式の不正な日付
    // 【不正な理由】: 日付はYYYY-MM-DD形式でなければならない
    // 【実際の発生シナリオ】: ユーザーが異なる日付フォーマットで入力した場合
    const invalidDates = [
      { from_date: '2025/10/01', reason: 'スラッシュ区切り' },
      { from_date: '2025-1-1', reason: '短縮形式' },
      { to_date: '2025/12/31', reason: 'スラッシュ区切り（to_date）' },
    ];

    // When & Then（実行と検証）: すべてのケースでValidationErrorがスローされることを確認
    for (const params of invalidDates) {
      // 【実際の処理実行】: 不正な日付形式でgetStockPrice()を呼び出し
      // 【結果検証】: ValidationErrorがスローされること
      await expect(getStockPrice({ code: '7203', ...params })).rejects.toThrow(
        ValidationError
      ); // 【確認内容】: ValidationErrorがスローされること 🔵
      await expect(getStockPrice({ code: '7203', ...params })).rejects.toThrow(
        '日付はYYYY-MM-DD形式で指定してください'
      ); // 【確認内容】: エラーメッセージが正しいこと 🔵
    }

    // 【システムの安全性】: 不正な日付でのフィルタリングを防ぐ
  });

  /**
   * TC-ERROR-004: getStockPrice() - from_date > to_date🔵
   *
   * 【テスト目的】: from_date が to_date より後の日付の場合にValidationErrorがスローされること
   * 【テスト内容】: from_date='2025-12-31', to_date='2025-01-01'でgetStockPrice()を呼び出し
   * 【期待される動作】: ValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【エラーケースの概要】: 論理的に矛盾する日付範囲
   * 【エラー処理の重要性】: 無効な範囲でのフィルタリングを防ぐ
   */
  it('TC-ERROR-004: getStockPrice() - from_date > to_date', async () => {
    // Given（前提条件）: from_date > to_dateの不正な日付範囲を準備
    // 【テストデータ準備】: from_dateがto_dateより後の矛盾した日付
    // 【不正な理由】: from_dateはto_date以前でなければならない
    // 【実際の発生シナリオ】: ユーザーが日付の順序を誤って入力した場合
    const params = {
      code: '7203',
      from_date: '2025-12-31',
      to_date: '2025-01-01',
    };

    // When & Then（実行と検証）: ValidationErrorがスローされることを確認
    // 【実際の処理実行】: from_date > to_dateでgetStockPrice()を呼び出し
    // 【結果検証】: ValidationErrorがスローされること
    await expect(getStockPrice(params)).rejects.toThrow(
      ValidationError
    ); // 【確認内容】: ValidationErrorがスローされること 🔵
    await expect(getStockPrice(params)).rejects.toThrow(
      'from_date は to_date 以前である必要があります'
    ); // 【確認内容】: エラーメッセージが正しいこと 🔵

    // 【システムの安全性】: 無効な範囲でのフィルタリングを防ぐ
  });
});

// =========================================
// 境界値テストケース（1件）
// =========================================
describe('get-stock-price.ts - 境界値テストケース', () => {
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
   * TC-BOUNDARY-001: getStockPrice() - 存在しない銘柄コード（空配列返却）🔵
   *
   * 【テスト目的】: 指定した銘柄コードのデータが1件も存在しない場合に空配列が返却されること
   * 【テスト内容】: code='9999'（存在しない銘柄コード）でgetStockPrice()を呼び出し
   * 【期待される動作】: エラーではなく空配列を返却する
   * 🔵 信頼性レベル: 青信号（要件定義書から確定）
   * 【境界値の意味】: データ件数が0件の境界
   * 【境界値での動作保証】: 空配列が正しく返却されること
   */
  it('TC-BOUNDARY-001: getStockPrice() - 存在しない銘柄コード', async () => {
    // Given（前提条件）: 存在しない銘柄コードのデータ（空配列）を準備
    // 【テストデータ準備】: 空配列をモック（銘柄コード9999は存在しない）
    // 【境界値選択の根拠】: データ件数が0件の最小のケース
    // 【実際の使用場面】: ユーザーが上場廃止銘柄や存在しない銘柄コードを指定した場合
    const mockPrices: StockPrice[] = [];

    // 【モック設定】: JQuantsClient.getDailyQuotes()が空配列を返すようにモック化
    vi.spyOn(JQuantsClient.prototype, 'getDailyQuotes').mockResolvedValue(mockPrices);

    // When（実行）: getStockPrice()を存在しない銘柄コードで呼び出し
    // 【実際の処理実行】: 存在しない銘柄コード '9999' でデータ取得
    // 【処理内容】: code='9999'で株価データを取得（API側で空を返す）
    const result = await getStockPrice({ code: '9999' });

    // Then（検証）: 空配列が返却されることを確認
    // 【結果検証】: 空のデータ結果の検証
    expect(result).toHaveProperty('code'); // 【確認内容】: codeプロパティが存在すること 🔵
    expect(result.code).toBe('9999'); // 【確認内容】: codeが一致すること 🔵
    expect(result).toHaveProperty('prices'); // 【確認内容】: pricesプロパティが存在すること 🔵
    expect(result.prices).toBeInstanceOf(Array); // 【確認内容】: pricesが配列型であること 🔵
    expect(result.prices).toHaveLength(0); // 【確認内容】: 空配列であること 🔵

    // 【境界での正確性】: 0件の場合も正しく空配列が返却される
    // 【一貫した動作】: エラーではなく空配列を返却する
    expect(JQuantsClient.prototype.getDailyQuotes).toHaveBeenCalledTimes(1); // 【確認内容】: APIが正常に呼ばれていること 🔵
  });
});
