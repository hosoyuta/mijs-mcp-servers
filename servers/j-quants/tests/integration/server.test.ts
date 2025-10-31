/**
 * TASK-0010: MCPサーバー本体実装・統合 テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-30
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.x
 * 【目的】: MCPサーバー統合テスト（実装は存在しないため、全テストが失敗する）
 *
 * テストケース総数: 8件
 * - 正常系: 3件
 * - 異常系: 3件
 * - 境界値: 2件
 *
 * 要件網羅率: 100% （6/6要件）
 * 信頼性レベル: 🔵 100% （すべてのテストケースが要件定義書から確定）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { startMCPServer } from '../../src/index.js';
import { TokenManager } from '../../src/auth/token-manager.js';
import * as getListedCompaniesModule from '../../src/tools/get-listed-companies.js';
import * as getCompanyInfoModule from '../../src/tools/get-company-info.js';

// =========================================
// 正常系テストケース（3件）
// =========================================
describe('MCPサーバー統合テスト - 正常系', () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをリセットし、環境変数を設定
    // 【環境初期化】: 前のテストの影響を受けないよう、クリーンな状態にする
    vi.clearAllMocks();
    process.env.J_QUANTS_REFRESH_TOKEN = 'test-refresh-token-valid';
  });

  afterEach(() => {
    // 【テスト後処理】: 環境変数をクリーンアップ
    // 【状態復元】: 次のテストに影響しないよう、環境変数を削除
    delete process.env.J_QUANTS_REFRESH_TOKEN;
  });

  /**
   * TC-NORMAL-001: startMCPServer() - 正常起動（TokenManager初期化、ツール登録）🔵
   *
   * 【テスト目的】: 環境変数が正しく設定されている場合に、MCPサーバーが正常に起動すること
   * 【テスト内容】: 環境変数を設定し、startMCPServer()を実行、ツールリストを取得
   * 【期待される動作】: サーバーが起動完了状態になり、4つのツールがlistTools()で取得できる
   * 🔵 信頼性レベル: 青信号（要件定義書 REQ-1002、Phase 1タスク定義から確定）
   */
  it('TC-NORMAL-001: MCPサーバー起動成功', async () => {
    // Given（前提条件）: TokenManagerをモック化し、IDトークン取得を成功させる
    // 【テストデータ準備】: 環境変数を設定し、TokenManagerをモック化
    // 【初期条件設定】: J_QUANTS_REFRESH_TOKENを有効な値に設定
    // 【前提条件確認】: TokenManager.getIdToken()が成功するようモック化
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-id-token-12345');

    // When（実行）: MCPサーバーを起動
    // 【実際の処理実行】: startMCPServer()を呼び出し、初期化処理を実行
    // 【処理内容】: TokenManager初期化、ツール登録、サーバー起動を実行
    // 【実行タイミング】: テストデータ準備完了後、すぐに実行
    const server = await startMCPServer();

    // Then（検証）: サーバーが正常に起動し、ツールが登録されていることを確認
    // 【結果検証】: サーバーが正常に起動し、ツールが登録されていることを確認
    // 【期待値確認】: 4つのツールがlistTools()で取得できることを確認
    // 【品質保証】: MCPサーバーの統合が正しく動作し、すべてのツールが使用可能

    // サーバーインスタンスが定義されていることを確認
    expect(server).toBeDefined(); // 【確認内容】: サーバーが正常に作成されている 🔵
    expect(server).toBeInstanceOf(Server); // 【確認内容】: Serverインスタンスが返却されている 🔵

    // サーバー情報が正しく設定されていることを確認
    expect(server.name).toBe('j-quants-mcp-server'); // 【確認内容】: サーバー名が正しく設定されている 🔵
    expect(server.version).toBe('1.0.0'); // 【確認内容】: バージョンが正しく設定されている 🔵

    // TokenManagerが呼ばれたことを確認
    expect(TokenManager.prototype.getIdToken).toHaveBeenCalled(); // 【確認内容】: TokenManagerが初期化され、認証フローが実行された 🔵

    // ツールが登録されていることを確認
    const tools = await server.listTools();
    expect(tools).toBeDefined(); // 【確認内容】: ツールリストが取得できる 🔵
    expect(tools).toHaveLength(4); // 【確認内容】: 4つのツールが登録されている 🔵

    // 各ツールの名前が含まれていることを確認
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain('get_listed_companies'); // 【確認内容】: get_listed_companiesが登録されている 🔵
    expect(toolNames).toContain('get_stock_price'); // 【確認内容】: get_stock_priceが登録されている 🔵
    expect(toolNames).toContain('get_financial_statements'); // 【確認内容】: get_financial_statementsが登録されている 🔵
    expect(toolNames).toContain('get_company_info'); // 【確認内容】: get_company_infoが登録されている 🔵
  });

  /**
   * TC-NORMAL-002: listTools() - 4つのMCPツールが正しく登録されていることを確認🔵
   *
   * 【テスト目的】: 登録されたツールの定義が要件通りに設定されていること
   * 【テスト内容】: 各ツールの名前、説明、入力スキーマを検証
   * 【期待される動作】: 4つのツールすべてが正しく定義され、MCPプロトコルに準拠している
   * 🔵 信頼性レベル: 青信号（要件定義書、Phase 1タスク定義から確定）
   */
  it('TC-NORMAL-002: ツール登録確認（4つのツール定義）', async () => {
    // Given（前提条件）: サーバー起動済み
    // 【テストデータ準備】: TokenManagerをモック化
    // 【初期条件設定】: サーバーが起動済みであることが前提
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-id-token-12345');
    const server = await startMCPServer();

    // When（実行）: ツールリストを取得
    // 【実際の処理実行】: server.listTools()を呼び出し
    // 【処理内容】: 登録されているツールの定義を取得
    const tools = await server.listTools();

    // Then（検証）: 各ツールの定義が要件通りに設定されていることを確認
    // 【結果検証】: ツール定義の検証
    // 【期待値確認】: 各ツールの名前、説明、入力スキーマが要件通りに設定されている
    // 【品質保証】: ツール定義が正しく、MCPプロトコルに準拠している

    // ツール数の確認
    expect(tools).toHaveLength(4); // 【確認内容】: 4つのツールが登録されている 🔵

    // ============================================
    // get_listed_companies の確認
    // ============================================
    const getListedCompaniesTool = tools.find((t) => t.name === 'get_listed_companies');
    expect(getListedCompaniesTool).toBeDefined(); // 【確認内容】: get_listed_companiesが登録されている 🔵
    expect(getListedCompaniesTool!.description).toBe('J-Quants APIから上場銘柄一覧を取得します'); // 【確認内容】: 日本語説明が正しく設定されている 🔵
    expect(getListedCompaniesTool!.inputSchema.type).toBe('object'); // 【確認内容】: 入力スキーマがobject型 🔵
    expect(getListedCompaniesTool!.inputSchema.properties).toHaveProperty('market'); // 【確認内容】: marketプロパティが定義されている 🔵
    expect(getListedCompaniesTool!.inputSchema.properties).toHaveProperty('sector'); // 【確認内容】: sectorプロパティが定義されている 🔵

    // ============================================
    // get_stock_price の確認
    // ============================================
    const getStockPriceTool = tools.find((t) => t.name === 'get_stock_price');
    expect(getStockPriceTool).toBeDefined(); // 【確認内容】: get_stock_priceが登録されている 🔵
    expect(getStockPriceTool!.description).toBe('指定銘柄の日次株価データを取得します'); // 【確認内容】: 日本語説明が正しく設定されている 🔵
    expect(getStockPriceTool!.inputSchema.type).toBe('object'); // 【確認内容】: 入力スキーマがobject型 🔵
    expect(getStockPriceTool!.inputSchema.required).toContain('code'); // 【確認内容】: codeが必須パラメータとして定義されている 🔵
    expect(getStockPriceTool!.inputSchema.properties).toHaveProperty('code'); // 【確認内容】: codeプロパティが定義されている 🔵
    expect(getStockPriceTool!.inputSchema.properties).toHaveProperty('from_date'); // 【確認内容】: from_dateプロパティが定義されている 🔵
    expect(getStockPriceTool!.inputSchema.properties).toHaveProperty('to_date'); // 【確認内容】: to_dateプロパティが定義されている 🔵

    // ============================================
    // get_financial_statements の確認
    // ============================================
    const getFinancialStatementsTool = tools.find((t) => t.name === 'get_financial_statements');
    expect(getFinancialStatementsTool).toBeDefined(); // 【確認内容】: get_financial_statementsが登録されている 🔵
    expect(getFinancialStatementsTool!.description).toBe('指定銘柄の財務諸表を取得します'); // 【確認内容】: 日本語説明が正しく設定されている 🔵
    expect(getFinancialStatementsTool!.inputSchema.type).toBe('object'); // 【確認内容】: 入力スキーマがobject型 🔵
    expect(getFinancialStatementsTool!.inputSchema.required).toContain('code'); // 【確認内容】: codeが必須パラメータとして定義されている 🔵
    expect(getFinancialStatementsTool!.inputSchema.properties).toHaveProperty('code'); // 【確認内容】: codeプロパティが定義されている 🔵
    expect(getFinancialStatementsTool!.inputSchema.properties).toHaveProperty('statement_type'); // 【確認内容】: statement_typeプロパティが定義されている 🔵

    // ============================================
    // get_company_info の確認
    // ============================================
    const getCompanyInfoTool = tools.find((t) => t.name === 'get_company_info');
    expect(getCompanyInfoTool).toBeDefined(); // 【確認内容】: get_company_infoが登録されている 🔵
    expect(getCompanyInfoTool!.description).toBe('指定銘柄の企業情報と最新株価を取得します'); // 【確認内容】: 日本語説明が正しく設定されている 🔵
    expect(getCompanyInfoTool!.inputSchema.type).toBe('object'); // 【確認内容】: 入力スキーマがobject型 🔵
    expect(getCompanyInfoTool!.inputSchema.required).toContain('code'); // 【確認内容】: codeが必須パラメータとして定義されている 🔵
    expect(getCompanyInfoTool!.inputSchema.properties).toHaveProperty('code'); // 【確認内容】: codeプロパティが定義されている 🔵
  });

  /**
   * TC-NORMAL-003: callTool('get_listed_companies') - ツール実行が成功し、銘柄一覧が返却される🔵
   *
   * 【テスト目的】: MCPサーバー経由でツールを呼び出せること
   * 【テスト内容】: get_listed_companiesツールを実行し、銘柄一覧が返却されることを確認
   * 【期待される動作】: ツール実装関数が正しく実行され、JSON形式で結果が返却される
   * 🔵 信頼性レベル: 青信号（Phase 1タスク定義、既存ツール実装から確定）
   */
  it('TC-NORMAL-003: ツール実行（end-to-end、get_listed_companies）', async () => {
    // Given（前提条件）: サーバー起動済み、TokenManagerをモック化
    // 【テストデータ準備】: サーバーを起動し、ツール実行環境を準備
    // 【初期条件設定】: get_listed_companiesツールが実行可能な状態
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-id-token-12345');

    // 【ツール関数モック化】: get_listed_companiesをモック化し、テストデータを返却 🔵
    vi.spyOn(getListedCompaniesModule, 'getListedCompanies').mockResolvedValue({
      companies: [
        { code: '7203', name: 'トヨタ自動車', market: 'Prime', sector: '輸送用機器' },
        { code: '9984', name: 'ソフトバンクグループ', market: 'Prime', sector: '情報・通信業' },
        { code: '6758', name: 'ソニーグループ', market: 'Prime', sector: '電気機器' },
      ],
    });

    const server = await startMCPServer();

    // When（実行）: get_listed_companiesツールを実行
    // 【実際の処理実行】: server.callTool('get_listed_companies', { market: 'Prime' })を呼び出し
    // 【処理内容】: 東証プライム市場の銘柄一覧を取得
    // 【実行タイミング】: サーバー起動完了後、すぐに実行
    const toolName = 'get_listed_companies';
    const params = { market: 'Prime' };
    const result = await server.callTool(toolName, params);

    // Then（検証）: ツール実行が成功し、銘柄一覧が返却されることを確認
    // 【結果検証】: 実行結果の検証
    // 【期待値確認】: エラーが発生せず、JSON形式で銘柄一覧が返却される
    // 【品質保証】: ツール実行のend-to-endフローが正しく動作

    // 実行成功
    expect(result.isError).toBe(false); // 【確認内容】: ツール実行がエラーなく成功 🔵

    // 結果がJSON形式
    expect(result.content).toBeDefined(); // 【確認内容】: 実行結果が定義されている 🔵
    expect(result.content).toHaveLength(1); // 【確認内容】: 1つのコンテンツブロックが返却される 🔵
    expect(result.content[0].type).toBe('text'); // 【確認内容】: テキスト形式のコンテンツ 🔵

    // 銘柄一覧が返却されている
    const data = JSON.parse(result.content[0].text);
    expect(data.companies).toBeDefined(); // 【確認内容】: companiesプロパティが存在する 🔵
    expect(Array.isArray(data.companies)).toBe(true); // 【確認内容】: companiesが配列型である 🔵
    expect(data.companies.length).toBeGreaterThan(0); // 【確認内容】: 銘柄が1件以上取得されている 🔵

    // 各銘柄がプライム市場
    data.companies.forEach((company: any) => {
      expect(company.market).toBe('Prime'); // 【確認内容】: すべての銘柄がPrime市場 🔵
    });
  });
});

// =========================================
// 異常系テストケース（3件）
// =========================================
describe('MCPサーバー統合テスト - 異常系', () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをリセット
    // 【環境初期化】: 前のテストの影響を受けないよう、クリーンな状態にする
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 【テスト後処理】: 環境変数をクリーンアップ
    // 【状態復元】: 次のテストに影響しないよう、環境変数を削除
    delete process.env.J_QUANTS_REFRESH_TOKEN;
  });

  /**
   * TC-ERROR-001: startMCPServer() - J_QUANTS_REFRESH_TOKEN未設定時のエラー🔵
   *
   * 【テスト目的】: 環境変数が設定されていない場合に適切なエラーが発生すること
   * 【テスト内容】: J_QUANTS_REFRESH_TOKENを未設定にし、startMCPServer()を実行
   * 【期待される動作】: 明確なエラーメッセージが表示され、サーバーが起動しない
   * 🔵 信頼性レベル: 青信号（要件定義書 EDGE-001、Phase 1タスク定義から確定）
   */
  it('TC-ERROR-001: 環境変数未設定でのサーバー起動失敗', async () => {
    // Given（前提条件）: 環境変数未設定
    // 【テストデータ準備】: 環境変数を削除し、未設定状態を作る
    // 【初期条件設定】: J_QUANTS_REFRESH_TOKENが存在しない状態
    // 【前提条件確認】: TokenManagerが正常に動作できない状態
    delete process.env.J_QUANTS_REFRESH_TOKEN;

    // When（実行）→ Then（検証）: サーバー起動がエラーをスロー
    // 【実際の処理実行】: startMCPServer()を呼び出し
    // 【処理内容】: TokenManager初期化時にエラーが発生
    // 【結果検証】: 適切なエラーメッセージでエラーがスローされる
    // 【期待値確認】: 「環境変数 J_QUANTS_REFRESH_TOKEN を設定してください」というエラーメッセージ
    // 【品質保証】: ユーザーフレンドリーなエラーメッセージで、設定すべき内容が明確

    await expect(startMCPServer()).rejects.toThrow(); // 【確認内容】: エラーがスローされる 🔵
    await expect(startMCPServer()).rejects.toThrow('環境変数 J_QUANTS_REFRESH_TOKEN を設定してください'); // 【確認内容】: 適切なエラーメッセージ 🔵

    // TokenManagerが呼ばれていないこと（初期化前にエラー）
    expect(TokenManager.prototype.getIdToken).not.toHaveBeenCalled(); // 【確認内容】: 初期化前にエラーが発生し、TokenManagerが呼ばれていない 🔵
  });

  /**
   * TC-ERROR-002: callTool('get_stock_price') - 不正なパラメータでのエラー🔵
   *
   * 【テスト目的】: ツール呼び出し時にパラメータが不正な場合にエラーが返却されること
   * 【テスト内容】: 不正な銘柄コード（3桁）でget_stock_priceツールを実行
   * 【期待される動作】: ValidationErrorが発生し、ユーザーフレンドリーなエラーメッセージが返却される
   * 🔵 信頼性レベル: 青信号（要件定義書 EDGE-003、既存ツール実装のバリデーションから確定）
   */
  it('TC-ERROR-002: ツール実行時のパラメータエラー', async () => {
    // Given（前提条件）: サーバー起動済み
    // 【テストデータ準備】: サーバーを起動し、ツール実行環境を準備
    // 【初期条件設定】: get_stock_priceツールが実行可能な状態
    process.env.J_QUANTS_REFRESH_TOKEN = 'test-refresh-token-valid';
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-id-token-12345');
    const server = await startMCPServer();

    // When（実行）: 不正なパラメータでツールを実行
    // 【実際の処理実行】: server.callTool('get_stock_price', { code: '123' })を呼び出し
    // 【処理内容】: 不正な銘柄コード（3桁）でツール実行を試みる
    // 【実行タイミング】: サーバー起動完了後、すぐに実行
    const toolName = 'get_stock_price';
    const params = { code: '123' }; // 不正: 3桁（4桁必須）
    const result = await server.callTool(toolName, params);

    // Then（検証）: エラーレスポンスが返却されることを確認
    // 【結果検証】: エラーレスポンスの検証
    // 【期待値確認】: ValidationErrorが発生し、適切なエラーメッセージが返却される
    // 【品質保証】: ユーザーフレンドリーなエラーメッセージで、正しい形式が明確

    // エラーレスポンス
    expect(result.isError).toBe(true); // 【確認内容】: エラーレスポンスが返却される 🔵

    // エラーメッセージが日本語で分かりやすい
    expect(result.content).toBeDefined(); // 【確認内容】: エラーコンテンツが定義されている 🔵
    expect(result.content[0].type).toBe('text'); // 【確認内容】: テキスト形式のエラーメッセージ 🔵
    expect(result.content[0].text).toContain('銘柄コードは4桁の数字である必要があります'); // 【確認内容】: 適切なエラーメッセージ 🔵

    // エラーが発生（セキュリティ向上のため、エラー型名は除外し「Error:」のみ表示）
    expect(result.content[0].text).toContain('Error:'); // 【確認内容】: エラーメッセージが返却される 🔵
  });

  /**
   * TC-ERROR-003: startMCPServer() - リフレッシュトークンが無効な場合のエラー🔵
   *
   * 【テスト目的】: 認証失敗時に適切なエラーハンドリングが行われること
   * 【テスト内容】: リフレッシュトークンが無効な場合にエラーが発生することを確認
   * 【期待される動作】: 認証失敗のエラーメッセージが表示され、サーバーが起動しない
   * 🔵 信頼性レベル: 青信号（要件定義書 EDGE-002、Phase 1タスク定義から確定）
   */
  it('TC-ERROR-003: 起動時認証失敗（TokenManager初期化エラー）', async () => {
    // Given（前提条件）: 無効なリフレッシュトークン
    // 【テストデータ準備】: 無効なリフレッシュトークンを設定
    // 【初期条件設定】: TokenManager.getIdToken()がエラーをスローするようモック化
    // 【前提条件確認】: 認証が失敗する状態
    process.env.J_QUANTS_REFRESH_TOKEN = 'invalid-token';
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockRejectedValue(
      new Error('認証に失敗しました: リフレッシュトークンが無効です')
    );

    // When（実行）→ Then（検証）: サーバー起動がエラーをスロー
    // 【実際の処理実行】: startMCPServer()を呼び出し
    // 【処理内容】: TokenManager初期化時に認証エラーが発生
    // 【結果検証】: 適切なエラーメッセージでエラーがスローされる
    // 【期待値確認】: 「J-Quants API認証に失敗しました」というエラーメッセージ
    // 【品質保証】: ユーザーフレンドリーなエラーメッセージで、認証失敗の理由が明確

    await expect(startMCPServer()).rejects.toThrow(); // 【確認内容】: エラーがスローされる 🔵
    await expect(startMCPServer()).rejects.toThrow('J-Quants API認証に失敗しました'); // 【確認内容】: 適切なエラーメッセージ 🔵

    // TokenManagerが呼ばれたこと（初期化は試みられた）
    expect(TokenManager.prototype.getIdToken).toHaveBeenCalled(); // 【確認内容】: 初期化は試みられたが、認証失敗でエラー 🔵
  });
});

// =========================================
// 境界値テストケース（2件）
// =========================================
describe('MCPサーバー統合テスト - 境界値', () => {
  beforeEach(() => {
    // 【テスト前準備】: 各テスト実行前にモックをリセットし、環境変数を設定
    // 【環境初期化】: 前のテストの影響を受けないよう、クリーンな状態にする
    vi.clearAllMocks();
    process.env.J_QUANTS_REFRESH_TOKEN = 'test-refresh-token-valid';
  });

  afterEach(() => {
    // 【テスト後処理】: 環境変数をクリーンアップ
    // 【状態復元】: 次のテストに影響しないよう、環境変数を削除
    delete process.env.J_QUANTS_REFRESH_TOKEN;
  });

  /**
   * TC-BOUNDARY-001: callTool('get_company_info') - 必須パラメータのみ指定🔵
   *
   * 【テスト目的】: 必須パラメータのみでツールが正常に動作すること
   * 【テスト内容】: get_company_infoツールを最小パラメータで実行
   * 【期待される動作】: オプションパラメータが省略されても正しく動作する
   * 🔵 信頼性レベル: 青信号（既存ツール実装、要件定義書から確定）
   */
  it('TC-BOUNDARY-001: 最小パラメータでのツール実行', async () => {
    // Given（前提条件）: サーバー起動済み
    // 【テストデータ準備】: サーバーを起動し、ツール実行環境を準備
    // 【初期条件設定】: get_company_infoツールが実行可能な状態
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-id-token-12345');

    // 【ツール関数モック化】: get_company_infoをモック化し、テストデータを返却 🔵
    vi.spyOn(getCompanyInfoModule, 'getCompanyInfo').mockResolvedValue({
      code: '7203',
      name: 'トヨタ自動車',
      market: 'Prime',
      sector: '輸送用機器',
      latest_price: 2500,
    });

    const server = await startMCPServer();

    // When（実行）: 必須パラメータのみでツールを実行
    // 【実際の処理実行】: server.callTool('get_company_info', { code: '7203' })を呼び出し
    // 【処理内容】: 必須パラメータ（code）のみを指定してツール実行
    // 【実行タイミング】: サーバー起動完了後、すぐに実行
    const toolName = 'get_company_info';
    const params = { code: '7203' }; // 必須パラメータのみ
    const result = await server.callTool(toolName, params);

    // Then（検証）: ツール実行が成功することを確認
    // 【結果検証】: 実行結果の検証
    // 【期待値確認】: エラーが発生せず、企業情報が返却される
    // 【品質保証】: 最小限のパラメータでツールが正しく動作

    // 実行成功
    expect(result.isError).toBe(false); // 【確認内容】: ツール実行がエラーなく成功 🔵

    // 企業情報が返却される
    const data = JSON.parse(result.content[0].text);
    expect(data.code).toBe('7203'); // 【確認内容】: 指定した銘柄コードが返却される 🔵
    expect(data.name).toBeDefined(); // 【確認内容】: 企業名が定義されている 🔵
    expect(data.market).toBeDefined(); // 【確認内容】: 市場区分が定義されている 🔵
    expect(data.sector).toBeDefined(); // 【確認内容】: 業種が定義されている 🔵
    // latest_priceはオプション（undefinedも許容）
  });

  /**
   * TC-BOUNDARY-002: startMCPServer() - 起動時間が5秒以内であることを確認🔵
   *
   * 【テスト目的】: パフォーマンス要件を満たしていること
   * 【テスト内容】: サーバー起動時間を計測し、5秒以内であることを確認
   * 【期待される動作】: サーバーが5秒以内に起動完了する
   * 🔵 信頼性レベル: 青信号（要件定義書 NFR-001から確定）
   */
  it('TC-BOUNDARY-002: サーバー起動時間の確認（5秒以内）', async () => {
    // Given（前提条件）: 正常な環境変数、TokenManagerモック化
    // 【テストデータ準備】: 環境変数を設定し、TokenManagerをモック化
    // 【初期条件設定】: サーバー起動に必要な設定が完了している状態
    // 【前提条件確認】: TokenManager.getIdToken()が成功するようモック化
    vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-id-token-12345');

    // When（実行）: サーバー起動時間を計測
    // 【実際の処理実行】: startMCPServer()を呼び出し、起動時間を計測
    // 【処理内容】: 起動開始から完了までの時間を測定
    // 【実行タイミング】: 計測開始直後にサーバー起動を実行
    const startTime = Date.now();
    const server = await startMCPServer();
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    // Then（検証）: 起動時間が5秒以内であることを確認
    // 【結果検証】: パフォーマンス要件の検証
    // 【期待値確認】: 起動時間が5000ms（5秒）未満であることを確認
    // 【品質保証】: パフォーマンス要件を満たし、ユーザー体験を損なわない

    // サーバーが起動成功
    expect(server).toBeDefined(); // 【確認内容】: サーバーが正常に起動している 🔵

    // 起動時間が5秒以内
    expect(elapsedTime).toBeLessThan(5000); // 【確認内容】: 起動時間が5秒（5000ms）未満 🔵

    // ツールがすべて登録されている
    const tools = await server.listTools();
    expect(tools).toHaveLength(4); // 【確認内容】: 4つのツールが登録されている 🔵
  });
});
