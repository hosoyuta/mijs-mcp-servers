/**
 * TASK-0008: get_financial_statements MCPツール テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-30
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.x
 * 【目的】: 財務諸表取得ツールのテスト実装（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFinancialStatements } from '../../src/tools/get-financial-statements';
import { JQuantsClient } from '../../src/api/j-quants-client';
import { TokenManager } from '../../src/auth/token-manager';
import { FinancialStatements, StatementType } from '../../src/types';
import { ValidationError } from '../../src/utils/validator';

// =========================================
// 正常系テストケース（3件）
// =========================================
describe('get-financial-statements.ts - 正常系テストケース', () => {
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
   * TC-NORMAL-001: getFinancialStatements() - codeのみ指定（デフォルト：連結財務諸表取得）🔵
   *
   * 【テスト目的】: 銘柄コードのみを指定した場合に最新の連結財務諸表データが取得できること
   * 【テスト内容】: code='7203'でgetFinancialStatements()を呼び出し
   * 【期待される動作】: 連結財務諸表（Consolidated）のデータが返却される
   * 🔵 信頼性レベル: 青信号（要件定義書REQ-FUNC-001, REQ-FUNC-004とPhase 1タスク定義から確定）
   */
  it('TC-NORMAL-001: getFinancialStatements() - codeのみ指定', async () => {
    // Given（前提条件）: JQuantsClientのモックを準備
    // 【テストデータ準備】: トヨタ自動車の連結財務諸表データをモック
    // 【初期条件設定】: JQuantsClient.getStatements()が連結財務諸表データを返却するモック
    const mockStatements: FinancialStatements = {
      code: '7203',
      fiscal_year: '2024',
      statement_type: StatementType.CONSOLIDATED,
      balance_sheet: {
        total_assets: 10000000000,
        current_assets: 5000000000,
        non_current_assets: 5000000000,
        total_liabilities: 4000000000,
        current_liabilities: 3000000000,
        non_current_liabilities: 1000000000,
        net_assets: 6000000000,
        equity: 5500000000,
      },
      profit_loss: {
        revenue: 500000000,
        cost_of_sales: 350000000,
        gross_profit: 150000000,
        operating_profit: 50000000,
        ordinary_profit: 48000000,
        profit_before_tax: 45000000,
        net_profit: 30000000,
        earnings_per_share: 150.5,
      },
      cash_flow: {
        operating_cash_flow: 40000000,
        investing_cash_flow: -10000000,
        financing_cash_flow: -5000000,
        free_cash_flow: 30000000,
        cash_and_equivalents: 100000000,
      },
    };

    // 【モック設定】: JQuantsClient.getStatements()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getStatements').mockResolvedValue(mockStatements);

    // When（実行）: getFinancialStatements()をcodeのみで呼び出し
    // 【実際の処理実行】: 連結財務諸表取得処理の実行
    // 【処理内容】: code='7203'で財務諸表データを取得
    const result = await getFinancialStatements({ code: '7203' });

    // Then（検証）: 連結財務諸表データが返却されることを確認
    // 【結果検証】: codeと各財務諸表の存在を確認
    expect(result).toHaveProperty('code'); // 【確認内容】: codeプロパティが存在すること 🔵
    expect(result.code).toBe('7203'); // 【確認内容】: codeが一致すること 🔵
    expect(result).toHaveProperty('fiscal_year'); // 【確認内容】: fiscal_yearプロパティが存在すること 🔵
    expect(result).toHaveProperty('statement_type'); // 【確認内容】: statement_typeプロパティが存在すること 🔵
    expect(result.statement_type).toBe(StatementType.CONSOLIDATED); // 【確認内容】: デフォルトで連結財務諸表が返却されること 🔵

    // 【財務三表の存在確認】: balance_sheet, profit_loss, cash_flow が存在すること
    expect(result).toHaveProperty('balance_sheet'); // 【確認内容】: balance_sheetが存在すること 🔵
    expect(result).toHaveProperty('profit_loss'); // 【確認内容】: profit_lossが存在すること 🔵
    expect(result).toHaveProperty('cash_flow'); // 【確認内容】: cash_flowが存在すること 🔵

    // 【貸借対照表の構造確認】: BalanceSheetの全プロパティが存在すること
    expect(result.balance_sheet).toHaveProperty('total_assets'); // 【確認内容】: 総資産が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('current_assets'); // 【確認内容】: 流動資産が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('non_current_assets'); // 【確認内容】: 固定資産が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('total_liabilities'); // 【確認内容】: 総負債が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('current_liabilities'); // 【確認内容】: 流動負債が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('non_current_liabilities'); // 【確認内容】: 固定負債が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('net_assets'); // 【確認内容】: 純資産が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('equity'); // 【確認内容】: 自己資本が存在すること 🔵

    // 【損益計算書の構造確認】: ProfitLossの全プロパティが存在すること
    expect(result.profit_loss).toHaveProperty('revenue'); // 【確認内容】: 売上高が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('cost_of_sales'); // 【確認内容】: 売上原価が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('gross_profit'); // 【確認内容】: 売上総利益が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('operating_profit'); // 【確認内容】: 営業利益が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('ordinary_profit'); // 【確認内容】: 経常利益が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('profit_before_tax'); // 【確認内容】: 税引前当期純利益が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('net_profit'); // 【確認内容】: 当期純利益が存在すること 🔵

    // 【キャッシュフロー計算書の構造確認】: CashFlowの全プロパティが存在すること
    expect(result.cash_flow).toHaveProperty('operating_cash_flow'); // 【確認内容】: 営業CFが存在すること 🔵
    expect(result.cash_flow).toHaveProperty('investing_cash_flow'); // 【確認内容】: 投資CFが存在すること 🔵
    expect(result.cash_flow).toHaveProperty('financing_cash_flow'); // 【確認内容】: 財務CFが存在すること 🔵
    expect(result.cash_flow).toHaveProperty('free_cash_flow'); // 【確認内容】: フリーCFが存在すること 🔵
    expect(result.cash_flow).toHaveProperty('cash_and_equivalents'); // 【確認内容】: 現金及び現金同等物が存在すること 🔵

    // 【API呼び出し確認】: JQuantsClient.getStatements()が正しく呼ばれたことを確認
    expect(JQuantsClient.prototype.getStatements).toHaveBeenCalledTimes(1); // 【確認内容】: APIが1回だけ呼ばれること 🔵
    expect(JQuantsClient.prototype.getStatements).toHaveBeenCalledWith('7203', undefined); // 【確認内容】: codeで呼ばれること 🔵
  });

  /**
   * TC-NORMAL-002: getFinancialStatements() - code + statement_type='Consolidated' 指定🔵
   *
   * 【テスト目的】: statement_type='Consolidated' を明示的に指定した場合に連結財務諸表が取得できること
   * 【テスト内容】: code='7203', statement_type='Consolidated'でgetFinancialStatements()を呼び出し
   * 【期待される動作】: 連結財務諸表のデータが返却される
   * 🔵 信頼性レベル: 青信号（要件定義書REQ-FUNC-002とPhase 1タスク定義から確定）
   */
  it('TC-NORMAL-002: getFinancialStatements() - code + statement_type="Consolidated"', async () => {
    // Given（前提条件）: 連結財務諸表データを準備
    // 【テストデータ準備】: トヨタ自動車の連結財務諸表データをモック
    // 【初期条件設定】: JQuantsClient.getStatements()が連結財務諸表データを返却するモック
    const mockStatements: FinancialStatements = {
      code: '7203',
      fiscal_year: '2024',
      statement_type: StatementType.CONSOLIDATED,
      balance_sheet: {
        total_assets: 10000000000,
        current_assets: 5000000000,
        non_current_assets: 5000000000,
        total_liabilities: 4000000000,
        current_liabilities: 3000000000,
        non_current_liabilities: 1000000000,
        net_assets: 6000000000,
        equity: 5500000000,
      },
      profit_loss: {
        revenue: 500000000,
        cost_of_sales: 350000000,
        gross_profit: 150000000,
        operating_profit: 50000000,
        ordinary_profit: 48000000,
        profit_before_tax: 45000000,
        net_profit: 30000000,
        earnings_per_share: 150.5,
      },
      cash_flow: {
        operating_cash_flow: 40000000,
        investing_cash_flow: -10000000,
        financing_cash_flow: -5000000,
        free_cash_flow: 30000000,
        cash_and_equivalents: 100000000,
      },
    };

    // 【モック設定】: JQuantsClient.getStatements()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getStatements').mockResolvedValue(mockStatements);

    // When（実行）: getFinancialStatements()をcode + statement_type='Consolidated'で呼び出し
    // 【実際の処理実行】: 連結財務諸表取得処理の実行
    // 【処理内容】: code='7203', statement_type='Consolidated'で財務諸表データを取得
    const result = await getFinancialStatements({
      code: '7203',
      statement_type: 'Consolidated',
    });

    // Then（検証）: 連結財務諸表データが返却されることを確認
    // 【結果検証】: statement_typeが'Consolidated'であることを確認
    expect(result.code).toBe('7203'); // 【確認内容】: codeが一致すること 🔵
    expect(result.statement_type).toBe(StatementType.CONSOLIDATED); // 【確認内容】: statement_typeが連結であること 🔵

    // 【財務三表の存在確認】: balance_sheet, profit_loss, cash_flow が存在すること
    expect(result.balance_sheet).toBeDefined(); // 【確認内容】: balance_sheetが定義されていること 🔵
    expect(result.profit_loss).toBeDefined(); // 【確認内容】: profit_lossが定義されていること 🔵
    expect(result.cash_flow).toBeDefined(); // 【確認内容】: cash_flowが定義されていること 🔵

    // 【API呼び出し確認】: JQuantsClient.getStatements()が statement_type='Consolidated' で呼ばれたことを確認
    expect(JQuantsClient.prototype.getStatements).toHaveBeenCalledTimes(1); // 【確認内容】: APIが1回だけ呼ばれること 🔵
    expect(JQuantsClient.prototype.getStatements).toHaveBeenCalledWith('7203', 'Consolidated'); // 【確認内容】: statement_type='Consolidated'で呼ばれること 🔵
  });

  /**
   * TC-NORMAL-003: getFinancialStatements() - code + statement_type='NonConsolidated' 指定🔵
   *
   * 【テスト目的】: statement_type='NonConsolidated' を指定した場合に単体財務諸表が取得できること
   * 【テスト内容】: code='7203', statement_type='NonConsolidated'でgetFinancialStatements()を呼び出し
   * 【期待される動作】: 単体財務諸表のデータが返却される
   * 🔵 信頼性レベル: 青信号（要件定義書REQ-FUNC-003とPhase 1タスク定義から確定）
   */
  it('TC-NORMAL-003: getFinancialStatements() - code + statement_type="NonConsolidated"', async () => {
    // Given（前提条件）: 単体財務諸表データを準備
    // 【テストデータ準備】: トヨタ自動車の単体財務諸表データをモック
    // 【初期条件設定】: JQuantsClient.getStatements()が単体財務諸表データを返却するモック
    const mockStatements: FinancialStatements = {
      code: '7203',
      fiscal_year: '2024',
      statement_type: StatementType.NON_CONSOLIDATED,
      balance_sheet: {
        total_assets: 8000000000,
        current_assets: 4000000000,
        non_current_assets: 4000000000,
        total_liabilities: 3000000000,
        current_liabilities: 2500000000,
        non_current_liabilities: 500000000,
        net_assets: 5000000000,
        equity: 4500000000,
      },
      profit_loss: {
        revenue: 400000000,
        cost_of_sales: 280000000,
        gross_profit: 120000000,
        operating_profit: 40000000,
        ordinary_profit: 38000000,
        profit_before_tax: 36000000,
        net_profit: 25000000,
        earnings_per_share: 125.0,
      },
      cash_flow: {
        operating_cash_flow: 35000000,
        investing_cash_flow: -8000000,
        financing_cash_flow: -4000000,
        free_cash_flow: 27000000,
        cash_and_equivalents: 90000000,
      },
    };

    // 【モック設定】: JQuantsClient.getStatements()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getStatements').mockResolvedValue(mockStatements);

    // When（実行）: getFinancialStatements()をcode + statement_type='NonConsolidated'で呼び出し
    // 【実際の処理実行】: 単体財務諸表取得処理の実行
    // 【処理内容】: code='7203', statement_type='NonConsolidated'で財務諸表データを取得
    const result = await getFinancialStatements({
      code: '7203',
      statement_type: 'NonConsolidated',
    });

    // Then（検証）: 単体財務諸表データが返却されることを確認
    // 【結果検証】: statement_typeが'NonConsolidated'であることを確認
    expect(result.code).toBe('7203'); // 【確認内容】: codeが一致すること 🔵
    expect(result.statement_type).toBe(StatementType.NON_CONSOLIDATED); // 【確認内容】: statement_typeが単体であること 🔵

    // 【財務三表の存在確認】: balance_sheet, profit_loss, cash_flow が存在すること
    expect(result.balance_sheet).toBeDefined(); // 【確認内容】: balance_sheetが定義されていること 🔵
    expect(result.profit_loss).toBeDefined(); // 【確認内容】: profit_lossが定義されていること 🔵
    expect(result.cash_flow).toBeDefined(); // 【確認内容】: cash_flowが定義されていること 🔵

    // 【API呼び出し確認】: JQuantsClient.getStatements()が statement_type='NonConsolidated' で呼ばれたことを確認
    expect(JQuantsClient.prototype.getStatements).toHaveBeenCalledTimes(1); // 【確認内容】: APIが1回だけ呼ばれること 🔵
    expect(JQuantsClient.prototype.getStatements).toHaveBeenCalledWith(
      '7203',
      'NonConsolidated'
    ); // 【確認内容】: statement_type='NonConsolidated'で呼ばれること 🔵
  });
});

// =========================================
// 異常系テストケース（4件）
// =========================================
describe('get-financial-statements.ts - 異常系テストケース', () => {
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
   * TC-ERROR-001: getFinancialStatements() - codeパラメータ未指定🔵
   *
   * 【テスト目的】: 必須パラメータ code が指定されていない場合にValidationErrorがスローされること
   * 【テスト内容】: パラメータ{}でgetFinancialStatements()を呼び出し
   * 【期待される動作】: ValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書REQ-VAL-001とPhase 1タスク定義から確定）
   * 【エラーケースの概要】: 必須パラメータの欠如
   * 【エラー処理の重要性】: 必須パラメータ不足を早期に検出
   */
  it('TC-ERROR-001: getFinancialStatements() - codeパラメータ未指定', async () => {
    // Given（前提条件）: codeパラメータを含まない空のパラメータ
    // 【テストデータ準備】: code未指定の不正パラメータ
    // 【不正な理由】: codeは必須パラメータだが指定されていない
    // 【実際の発生シナリオ】: ユーザーが銘柄コードを指定せずにツールを実行した場合
    const params = {};

    // When & Then（実行と検証）: ValidationErrorがスローされることを確認
    // 【実際の処理実行】: code未指定でgetFinancialStatements()を呼び出し
    // 【結果検証】: ValidationErrorがスローされること
    await expect(getFinancialStatements(params)).rejects.toThrow(ValidationError); // 【確認内容】: ValidationErrorがスローされること 🔵
    await expect(getFinancialStatements(params)).rejects.toThrow(
      '必須パラメータ code が指定されていません'
    ); // 【確認内容】: エラーメッセージが正しいこと 🔵

    // 【システムの安全性】: 不正なリクエストを事前に防止
  });

  /**
   * TC-ERROR-002: getFinancialStatements() - 不正なcode値🔵
   *
   * 【テスト目的】: 4桁数字以外のcodeが指定された場合にValidationErrorがスローされること
   * 【テスト内容】: code='123'（3桁）、code='12345'（5桁）、code='ABCD'（アルファベット）でgetFinancialStatements()を呼び出し
   * 【期待される動作】: すべてのケースでValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書REQ-VAL-002とPhase 1タスク定義から確定）
   * 【エラーケースの概要】: 不正なcodeフォーマット
   * 【エラー処理の重要性】: 不正なフォーマットでのAPI呼び出しを防ぐ
   */
  it('TC-ERROR-002: getFinancialStatements() - 不正なcode値', async () => {
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
      // 【実際の処理実行】: 不正なcodeでgetFinancialStatements()を呼び出し
      // 【結果検証】: ValidationErrorがスローされること
      await expect(getFinancialStatements({ code })).rejects.toThrow(ValidationError); // 【確認内容】: ValidationErrorがスローされること (${reason}) 🔵
      await expect(getFinancialStatements({ code })).rejects.toThrow(
        '銘柄コードは4桁の数字である必要があります'
      ); // 【確認内容】: エラーメッセージが正しいこと (${reason}) 🔵
    }

    // 【システムの安全性】: 不正なフォーマットでのAPI呼び出しを防ぐ
  });

  /**
   * TC-ERROR-003: getFinancialStatements() - 不正なstatement_type値🔵
   *
   * 【テスト目的】: 'Consolidated' または 'NonConsolidated' 以外の値が指定された場合にValidationErrorがスローされること
   * 【テスト内容】: code='7203', statement_type='INVALID'でgetFinancialStatements()を呼び出し
   * 【期待される動作】: ValidationErrorがスローされる
   * 🔵 信頼性レベル: 青信号（要件定義書REQ-VAL-003とPhase 1タスク定義から確定）
   * 【エラーケースの概要】: 不正な列挙型値
   * 【エラー処理の重要性】: 不正な statement_type でのAPI呼び出しを防ぐ
   */
  it('TC-ERROR-003: getFinancialStatements() - 不正なstatement_type値', async () => {
    // Given（前提条件）: 不正なstatement_type値を準備
    // 【テストデータ準備】: 'INVALID'などの不正なstatement_type
    // 【不正な理由】: statement_typeは'Consolidated'または'NonConsolidated'でなければならない
    // 【実際の発生シナリオ】: ユーザーが誤った値を指定した場合
    const params = {
      code: '7203',
      statement_type: 'INVALID',
    };

    // When & Then（実行と検証）: ValidationErrorがスローされることを確認
    // 【実際の処理実行】: 不正なstatement_typeでgetFinancialStatements()を呼び出し
    // 【結果検証】: ValidationErrorがスローされること
    await expect(getFinancialStatements(params)).rejects.toThrow(ValidationError); // 【確認内容】: ValidationErrorがスローされること 🔵
    await expect(getFinancialStatements(params)).rejects.toThrow(
      'statement_type パラメータの値が不正です'
    ); // 【確認内容】: エラーメッセージが正しいこと 🔵

    // 【システムの安全性】: 不正な statement_type でAPI呼び出しをしない
  });

  /**
   * TC-ERROR-004: getFinancialStatements() - 存在しない銘柄コード🔵
   *
   * 【テスト目的】: 形式は正しいが実在しない銘柄コードが指定された場合にErrorがスローされること
   * 【テスト内容】: code='9999'（存在しない銘柄コード）でgetFinancialStatements()を呼び出し
   * 【期待される動作】: Errorがスローされる
   * 🔵 信頼性レベル: 青信号（Phase 1タスク定義のテストケース7から確定）
   * 【エラーケースの概要】: 実在しない銘柄コード
   * 【エラー処理の重要性】: 存在しないデータへのアクセスを適切に処理
   */
  it('TC-ERROR-004: getFinancialStatements() - 存在しない銘柄コード', async () => {
    // Given（前提条件）: 存在しない銘柄コードでAPIエラーをモック
    // 【テストデータ準備】: JQuantsClient.getStatements()がエラーをスローするようにモック
    // 【不正な理由】: 銘柄コード'9999'は実在しない
    // 【実際の発生シナリオ】: ユーザーが誤った銘柄コードを入力した場合
    vi.spyOn(JQuantsClient.prototype, 'getStatements').mockRejectedValue(
      new Error('指定された銘柄コード（9999）は存在しません')
    );

    // When & Then（実行と検証）: Errorがスローされることを確認
    // 【実際の処理実行】: 存在しない銘柄コードでgetFinancialStatements()を呼び出し
    // 【結果検証】: Errorがスローされること
    await expect(getFinancialStatements({ code: '9999' })).rejects.toThrow(Error); // 【確認内容】: Errorがスローされること 🔵
    await expect(getFinancialStatements({ code: '9999' })).rejects.toThrow(
      '指定された銘柄コード（9999）は存在しません'
    ); // 【確認内容】: エラーメッセージが正しいこと 🔵

    // 【システムの安全性】: 存在しないデータへのアクセスを適切に処理
  });
});

// =========================================
// 境界値テストケース（2件）
// =========================================
describe('get-financial-statements.ts - 境界値テストケース', () => {
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
   * TC-BOUNDARY-001: getFinancialStatements() - 財務データが存在しない企業🔵
   *
   * 【テスト目的】: 銘柄コードは存在するが財務データが存在しない場合にErrorがスローされること
   * 【テスト内容】: code='8000'（財務データなし）でgetFinancialStatements()を呼び出し
   * 【期待される動作】: Errorがスローされる
   * 🔵 信頼性レベル: 青信号（Phase 1タスク定義のテストケース8から確定）
   * 【境界値の意味】: データ存在の有無の境界
   * 【境界値での動作保証】: データ不在を適切に処理
   */
  it('TC-BOUNDARY-001: getFinancialStatements() - 財務データが存在しない企業', async () => {
    // Given（前提条件）: 財務データが存在しない銘柄コードでAPIエラーをモック
    // 【テストデータ準備】: JQuantsClient.getStatements()がエラーをスローするようにモック
    // 【境界値選択の根拠】: 銘柄コードは存在するがデータがないケース
    // 【実際の使用場面】: IPO直後の企業や財務諸表提出前の企業
    vi.spyOn(JQuantsClient.prototype, 'getStatements').mockRejectedValue(
      new Error('財務諸表データが利用できません')
    );

    // When & Then（実行と検証）: Errorがスローされることを確認
    // 【実際の処理実行】: 財務データなしの銘柄コードでgetFinancialStatements()を呼び出し
    // 【結果検証】: Errorがスローされること
    await expect(getFinancialStatements({ code: '8000' })).rejects.toThrow(Error); // 【確認内容】: Errorがスローされること 🔵
    await expect(getFinancialStatements({ code: '8000' })).rejects.toThrow(
      '財務諸表データが利用できません'
    ); // 【確認内容】: エラーメッセージが正しいこと 🔵

    // 【境界での正確性】: データ不在を適切に検出
    // 【一貫した動作】: 他のエラーケースと同様の形式でエラーを返却
  });

  /**
   * TC-BOUNDARY-002: getFinancialStatements() - データ構造の完全性確認🔵
   *
   * 【テスト目的】: 返却データが財務三表（BS/PL/CF）を完全に含むことの確認
   * 【テスト内容】: code='7203'でgetFinancialStatements()を呼び出し、全プロパティの存在を確認
   * 【期待される動作】: すべてのプロパティが存在する
   * 🔵 信頼性レベル: 青信号（Phase 1タスク定義のテストケース9と要件定義書REQ-FUNC-001から確定）
   * 【境界値の意味】: データ構造の完全性の境界
   * 【境界値での動作保証】: 部分的なデータではなく完全な財務三表が返却される
   */
  it('TC-BOUNDARY-002: getFinancialStatements() - データ構造の完全性確認', async () => {
    // Given（前提条件）: 完全な財務諸表データを準備
    // 【テストデータ準備】: すべてのプロパティを含む財務諸表データをモック
    // 【境界値選択の根拠】: 財務三表が揃っている正常なデータで構造を検証
    // 【実際の使用場面】: すべての財務データを利用した分析
    const mockStatements: FinancialStatements = {
      code: '7203',
      fiscal_year: '2024',
      statement_type: StatementType.CONSOLIDATED,
      balance_sheet: {
        total_assets: 10000000000,
        current_assets: 5000000000,
        non_current_assets: 5000000000,
        total_liabilities: 4000000000,
        current_liabilities: 3000000000,
        non_current_liabilities: 1000000000,
        net_assets: 6000000000,
        equity: 5500000000,
      },
      profit_loss: {
        revenue: 500000000,
        cost_of_sales: 350000000,
        gross_profit: 150000000,
        operating_profit: 50000000,
        ordinary_profit: 48000000,
        profit_before_tax: 45000000,
        net_profit: 30000000,
        earnings_per_share: 150.5,
      },
      cash_flow: {
        operating_cash_flow: 40000000,
        investing_cash_flow: -10000000,
        financing_cash_flow: -5000000,
        free_cash_flow: 30000000,
        cash_and_equivalents: 100000000,
      },
    };

    // 【モック設定】: JQuantsClient.getStatements()をモック化
    vi.spyOn(JQuantsClient.prototype, 'getStatements').mockResolvedValue(mockStatements);

    // When（実行）: getFinancialStatements()をcodeで呼び出し
    // 【実際の処理実行】: 完全なデータ構造取得の実行
    // 【処理内容】: code='7203'で財務諸表データを取得
    const result = await getFinancialStatements({ code: '7203' });

    // Then（検証）: すべてのプロパティが存在することを確認
    // 【結果検証】: データ構造の完全性検証

    // 【トップレベルプロパティの存在確認】
    expect(result).toHaveProperty('code'); // 【確認内容】: codeが存在すること 🔵
    expect(result).toHaveProperty('fiscal_year'); // 【確認内容】: fiscal_yearが存在すること 🔵
    expect(result).toHaveProperty('statement_type'); // 【確認内容】: statement_typeが存在すること 🔵
    expect(result).toHaveProperty('balance_sheet'); // 【確認内容】: balance_sheetが存在すること 🔵
    expect(result).toHaveProperty('profit_loss'); // 【確認内容】: profit_lossが存在すること 🔵
    expect(result).toHaveProperty('cash_flow'); // 【確認内容】: cash_flowが存在すること 🔵

    // 【貸借対照表の全プロパティ存在確認】（8プロパティ）
    expect(result.balance_sheet).toHaveProperty('total_assets'); // 【確認内容】: 総資産が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('current_assets'); // 【確認内容】: 流動資産が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('non_current_assets'); // 【確認内容】: 固定資産が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('total_liabilities'); // 【確認内容】: 総負債が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('current_liabilities'); // 【確認内容】: 流動負債が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('non_current_liabilities'); // 【確認内容】: 固定負債が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('net_assets'); // 【確認内容】: 純資産が存在すること 🔵
    expect(result.balance_sheet).toHaveProperty('equity'); // 【確認内容】: 自己資本が存在すること 🔵

    // 【損益計算書の全プロパティ存在確認】（8プロパティ）
    expect(result.profit_loss).toHaveProperty('revenue'); // 【確認内容】: 売上高が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('cost_of_sales'); // 【確認内容】: 売上原価が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('gross_profit'); // 【確認内容】: 売上総利益が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('operating_profit'); // 【確認内容】: 営業利益が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('ordinary_profit'); // 【確認内容】: 経常利益が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('profit_before_tax'); // 【確認内容】: 税引前当期純利益が存在すること 🔵
    expect(result.profit_loss).toHaveProperty('net_profit'); // 【確認内容】: 当期純利益が存在すること 🔵

    // 【キャッシュフロー計算書の全プロパティ存在確認】（5プロパティ）
    expect(result.cash_flow).toHaveProperty('operating_cash_flow'); // 【確認内容】: 営業CFが存在すること 🔵
    expect(result.cash_flow).toHaveProperty('investing_cash_flow'); // 【確認内容】: 投資CFが存在すること 🔵
    expect(result.cash_flow).toHaveProperty('financing_cash_flow'); // 【確認内容】: 財務CFが存在すること 🔵
    expect(result.cash_flow).toHaveProperty('free_cash_flow'); // 【確認内容】: フリーCFが存在すること 🔵
    expect(result.cash_flow).toHaveProperty('cash_and_equivalents'); // 【確認内容】: 現金及び現金同等物が存在すること 🔵

    // 【境界での正確性】: すべてのプロパティが存在すること
    // 【一貫した動作】: FinancialStatements 型定義に完全に準拠
    // 【TypeScript strict mode での型安全性】: コンパイル時に型エラーがないこと
  });
});
