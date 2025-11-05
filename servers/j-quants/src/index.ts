/**
 * TASK-0010: MCPサーバー本体実装・統合
 *
 * 【機能概要】: J-Quants MCP Serverのエントリーポイント
 * 【実装方針】: テストを通すための最小限の実装を行う
 * 【テスト対応】: Red Phaseで作成された8件のテストケースを通すための実装
 * 🔵 信頼性レベル: 青信号（要件定義書、テストケースから確定）
 *
 * @module index
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { TokenManager } from './auth/token-manager.js';
import { getListedCompanies } from './tools/get-listed-companies.js';
import { getStockPrice } from './tools/get-stock-price.js';
import { getFinancialStatements } from './tools/get-financial-statements.js';
import { getCompanyInfo } from './tools/get-company-info.js';

/**
 * MCPサーバー起動関数
 *
 * 【機能】:
 * - 環境変数の検証
 * - TokenManagerの初期化
 * - MCPサーバーの作成
 * - 4つのツールの登録
 * - サーバーの起動
 *
 * 【実装方針】: テストを通すための最小限の実装
 * 【テスト対応】: TC-NORMAL-001, TC-ERROR-001, TC-ERROR-003, TC-BOUNDARY-002
 * 🔵 信頼性レベル: 青信号
 *
 * @returns Promise<Server> - 起動済みMCPサーバーインスタンス
 * @throws Error - 環境変数未設定または認証失敗時
 */
export async function startMCPServer(): Promise<Server> {
  // 【環境変数検証】: J_QUANTS_REFRESH_TOKENが設定されているか確認 🔵
  // 【エラーハンドリング】: 未設定時は明確なエラーメッセージをスロー 🔵
  // 【テスト対応】: TC-ERROR-001（環境変数未設定エラー）
  if (!process.env.J_QUANTS_REFRESH_TOKEN) {
    throw new Error('環境変数 J_QUANTS_REFRESH_TOKEN を設定してください');
  }

  // 【TokenManager初期化】: 認証情報の管理 🔵
  // 【実装方針】: TokenManagerを作成し、IDトークン取得を試みる
  // 【テスト対応】: TC-NORMAL-001, TC-ERROR-003（起動時認証失敗）
  const tokenManager = new TokenManager({
    refreshToken: process.env.J_QUANTS_REFRESH_TOKEN,
  });

  try {
    // 【認証実行】: IDトークン取得を試行 🔵
    // 【エラーハンドリング】: 認証失敗時はユーザーフレンドリーなエラーメッセージ
    await tokenManager.getIdToken();
  } catch (error) {
    // 【認証失敗処理】: J-Quants API認証エラー 🔵
    throw new Error('J-Quants API認証に失敗しました');
  }

  // 【MCPサーバー作成】: @modelcontextprotocol/sdkのServerインスタンス 🔵
  // 【実装方針】: サーバー名とバージョンを設定
  // 【テスト対応】: TC-NORMAL-001（サーバー起動成功）
  const server = new Server(
    {
      name: 'j-quants-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 【ツール定義】: 4つのMCPツール定義を一元管理 🔵
  // 【DRY原則】: ツール定義の重複を排除し、単一の定義元を確立
  // 【保守性向上】: ツール定義の追加・変更時に1箇所のみ修正すれば良い
  // 【テスト対応】: TC-NORMAL-002（ツール登録確認）
  const toolRegistry = [
    // 【ツール1】: get_listed_companies 🔵
    {
      name: 'get_listed_companies',
      description: 'J-Quants APIから上場銘柄一覧を取得します。デフォルトで最初の100件を返します。offsetとlimitでページングが可能です。',
      inputSchema: {
        type: 'object',
        properties: {
          market: {
            type: 'string',
            description: '市場区分（例: Prime, Standard, Growth）',
          },
          sector: {
            type: 'string',
            description: '業種コード',
          },
          limit: {
            type: 'number',
            description: '取得件数の上限（デフォルト: 100、最大: 100）',
          },
          offset: {
            type: 'number',
            description: '取得開始位置（デフォルト: 0）。例: offset=100で101件目から取得',
          },
        },
      },
    },
    // 【ツール2】: get_stock_price 🔵
    {
      name: 'get_stock_price',
      description: '指定銘柄の株価データ（日足・終値・始値・高値・安値・出来高）を取得します。トヨタ自動車(7203)やソニー(6758)などの株価情報を取得する際に使用します。銘柄コード（4桁の数字）が必要です。',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: '銘柄コード（4桁の数字、例: トヨタ自動車=7203、ソニー=6758、任天堂=7974）',
          },
          from_date: {
            type: 'string',
            description: '開始日（YYYY-MM-DD形式）',
          },
          to_date: {
            type: 'string',
            description: '終了日（YYYY-MM-DD形式）',
          },
        },
        required: ['code'],
      },
    },
    // 【ツール3】: get_financial_statements 🔵
    {
      name: 'get_financial_statements',
      description: '指定銘柄の財務諸表を取得します',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: '銘柄コード（4桁）',
          },
          statement_type: {
            type: 'string',
            description: '財務諸表種別（consolidated, non_consolidated）',
          },
        },
        required: ['code'],
      },
    },
    // 【ツール4】: get_company_info 🔵
    {
      name: 'get_company_info',
      description: '指定銘柄の企業情報（会社名・業種・市場区分）と最新株価（今日の株価・現在値）を取得します。「トヨタ自動車の今日の株価」のように最新の株価情報を取得する際に最適です。銘柄コード（4桁の数字）が必要です。',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: '銘柄コード（4桁の数字、例: トヨタ自動車=7203、ソニー=6758、任天堂=7974）',
          },
        },
        required: ['code'],
      },
    },
  ];

  // 【ツールリスト登録】: listToolsリクエストハンドラー 🔵
  // 【実装方針】: toolRegistryを返却（DRY原則に基づく単一定義元の活用）
  // 【テスト対応】: TC-NORMAL-002（ツール登録確認）
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolRegistry,
    };
  });

  // 【ツール実行ロジック】: ツール名に応じた関数呼び出しを行う共通処理 🔵
  // 【DRY原則】: ツール実行ロジックを一元化し、重複を排除
  // 【保守性向上】: ツール追加時に1箇所のみ修正すれば良い
  // 【テスト対応】: TC-NORMAL-003, TC-ERROR-002, TC-BOUNDARY-001
  const executeToolFunction = async (name: string, args: any) => {
    switch (name) {
      case 'get_listed_companies':
        // 【実装内容】: 上場銘柄一覧取得 🔵
        return await getListedCompanies(args || {});

      case 'get_stock_price':
        // 【実装内容】: 株価データ取得 🔵
        return await getStockPrice(args || {});

      case 'get_financial_statements':
        // 【実装内容】: 財務諸表取得 🔵
        return await getFinancialStatements(args || {});

      case 'get_company_info':
        // 【実装内容】: 企業情報取得 🔵
        return await getCompanyInfo(args || {});

      default:
        // 【エラー処理】: 未知のツール名 🔵
        throw new Error(`Unknown tool: ${name}`);
    }
  };

  // 【ツール実行ハンドラー】: callToolリクエストハンドラー 🔵
  // 【実装方針】: executeToolFunctionを使用してツールを実行（DRY原則）
  // 【テスト対応】: TC-NORMAL-003, TC-ERROR-002, TC-BOUNDARY-001
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // 【ツール実行】: executeToolFunction()を呼び出し 🔵
      const result = await executeToolFunction(name, args);

      // 【結果返却】: JSON形式で結果を返却 🔵
      // 【実装方針】: MCP Protocolに準拠したレスポンス形式
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      // 【エラーハンドリング】: ツール実行時のエラー処理 🔵
      // 【実装方針】: ユーザーフレンドリーなエラーメッセージを返却
      // 【セキュリティ向上】: error.constructor.nameを除外し、内部実装を隠蔽
      // 【テスト対応】: TC-ERROR-002（パラメータエラー）
      const errorMessage =
        error instanceof Error ? error.message : '予期しないエラーが発生しました';

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // 【テストヘルパー】: テスト用のメソッドを追加 🔵
  // 【実装方針】: テストで直接呼び出せるようにする
  // 【注意】: 本番環境ではstdio経由でMCPプロトコルを使用するため、これらは使われない
  (server as any).name = 'j-quants-mcp-server';
  (server as any).version = '1.0.0';
  (server as any).listTools = async () => {
    return toolRegistry;
  };
  (server as any).callTool = async (name: string, args: any) => {
    // 【ツール実行ロジック】: executeToolFunction()を使用（DRY原則）🔵
    try {
      // 【ツール実行】: executeToolFunction()を呼び出し 🔵
      const result = await executeToolFunction(name, args);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error) {
      // 【エラーハンドリング】: ユーザーフレンドリーなエラーメッセージを返却 🔵
      // 【セキュリティ向上】: error.constructor.nameを除外し、内部実装を隠蔽
      const errorMessage =
        error instanceof Error ? error.message : '予期しないエラーが発生しました';

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  };

  return server;
}

/**
 * メイン処理（スクリプト直接実行時）
 *
 * 【機能】: MCPサーバーを起動し、stdio経由でClaude Desktopと通信
 * 【実装方針】: package.jsonのエントリーポイントとして機能
 * 🔵 信頼性レベル: 青信号
 */
async function main() {
  try {
    // 【サーバー起動】: MCPサーバーインスタンスを作成 🔵
    const server = await startMCPServer();

    // 【トランスポート設定】: stdio経由でClaude Desktopと通信 🔵
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // 【起動完了ログ】: サーバー起動成功メッセージ 🔵
    console.error('J-Quants MCP Server started successfully');
  } catch (error) {
    // 【起動失敗ログ】: エラーメッセージを出力 🔵
    console.error('Failed to start J-Quants MCP Server:', error);
    process.exit(1);
  }
}

// 【スクリプト実行判定】: 直接実行時のみmain()を呼び出し 🔵
// 【実装方針】: テスト時はmain()を実行しない（Windows対応）
const currentFilePath = fileURLToPath(import.meta.url);
const argv1Path = resolve(process.argv[1] || '');

if (currentFilePath === argv1Path) {
  main();
}
