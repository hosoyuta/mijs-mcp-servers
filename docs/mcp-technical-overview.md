# MCPサーバー 技術概要

## 目次

1. [MCPプロトコルとは](#mcpプロトコルとは)
2. [アーキテクチャ](#アーキテクチャ)
3. [プロトコル基盤](#プロトコル基盤)
4. [トランスポート層](#トランスポート層)
5. [主要コンポーネント](#主要コンポーネント)
6. [メッセージフロー](#メッセージフロー)
7. [ライフサイクル](#ライフサイクル)
8. [TypeScript実装](#typescript実装)
9. [セキュリティ考慮事項](#セキュリティ考慮事項)

## MCPプロトコルとは

**Model Context Protocol (MCP)** は、AIアシスタント（Claude等）とツール・データソースを接続するための標準化されたプロトコルです。MCPは、AIモデルが外部システムと安全かつ構造化された方法で対話できるようにします。

### 主な特徴

- **標準化**: JSON-RPC 2.0ベースの統一されたプロトコル
- **双方向通信**: クライアントとサーバー間の双方向メッセージング
- **型安全性**: 厳密な型定義による安全な通信
- **拡張性**: カスタムツール、リソース、プロンプトの定義が可能
- **トランスポート非依存**: stdio、HTTP、WebSocket等、様々なトランスポートに対応

## アーキテクチャ

MCPは**クライアント・サーバーアーキテクチャ**を採用しています。

```
┌─────────────────┐        MCP Protocol         ┌──────────────────┐
│                 │    (JSON-RPC 2.0 over       │                  │
│  MCPクライアント │◄───────Transport Layer────────►│  MCPサーバー     │
│  (Claude等)     │     (stdio/HTTP/WS)         │  (Your Code)     │
│                 │                              │                  │
└─────────────────┘                              └──────────────────┘
                                                          │
                                                          │
                                          ┌───────────────┴──────────────┐
                                          │                              │
                                    ┌─────▼──────┐              ┌───────▼────────┐
                                    │  外部API    │              │  データソース   │
                                    │ (REST等)    │              │  (JSON/DB等)   │
                                    └────────────┘              └────────────────┘
```

### コンポーネントの役割

#### MCPクライアント
- AIモデル（Claude等）が動作するホスト環境
- ユーザーの要求をMCPサーバーに伝達
- サーバーからの応答を解釈してユーザーに提示

#### MCPサーバー
- 特定の機能を提供するバックエンドプロセス
- ツール（実行可能な関数）を公開
- リソース（読み取り可能なデータ）を公開
- プロンプトテンプレートを公開

## プロトコル基盤

MCPは**JSON-RPC 2.0**プロトコルをベースにしています。

### JSON-RPC 2.0の基本構造

#### リクエスト
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "location": "Tokyo"
    }
  }
}
```

#### レスポンス（成功）
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "東京の天気: 晴れ、気温25℃"
      }
    ]
  }
}
```

#### レスポンス（エラー）
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "location is required"
    }
  }
}
```

### MCP固有のメソッド

MCPは以下のような標準メソッドを定義しています：

| メソッド | 説明 |
|---------|------|
| `initialize` | サーバーとの接続を初期化 |
| `tools/list` | 利用可能なツール一覧を取得 |
| `tools/call` | 特定のツールを実行 |
| `resources/list` | 利用可能なリソース一覧を取得 |
| `resources/read` | 特定のリソースを読み取り |
| `prompts/list` | 利用可能なプロンプト一覧を取得 |
| `prompts/get` | 特定のプロンプトを取得 |

## トランスポート層

MCPは複数のトランスポート層をサポートしています。

### 1. stdio（標準入出力）

最も一般的なトランスポート。サーバーは標準入出力でJSON-RPCメッセージを送受信します。

**利点:**
- シンプルで実装が容易
- プロセス管理が簡単
- ローカル環境に最適

**実装例:**
```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. HTTP/HTTPS

RESTful APIのようなHTTPベースの通信。

**利点:**
- ネットワーク越しの通信が可能
- 既存のHTTPインフラを活用可能
- 認証・暗号化が容易

### 3. WebSocket

双方向のリアルタイム通信。

**利点:**
- 低レイテンシ
- リアルタイムストリーミングに適している
- 永続的な接続

## 主要コンポーネント

MCPサーバーは3つの主要コンポーネントを公開できます。

### 1. ツール (Tools)

AIモデルが呼び出せる**実行可能な関数**です。

#### ツールの定義
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_weather",
        description: "指定された場所の天気情報を取得します",
        inputSchema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "都市名（例: Tokyo, New York）"
            },
            units: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
              description: "温度の単位"
            }
          },
          required: ["location"]
        }
      }
    ]
  };
});
```

#### ツールの実行
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_weather") {
    const { location, units = "celsius" } = request.params.arguments;

    // 天気情報を取得するロジック
    const weatherData = await fetchWeather(location, units);

    return {
      content: [
        {
          type: "text",
          text: `${location}の天気: ${weatherData.condition}, 気温${weatherData.temperature}°${units === "celsius" ? "C" : "F"}`
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});
```

### 2. リソース (Resources)

AIモデルが読み取れる**データソース**です。

#### リソースの定義
```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file:///config/settings.json",
        name: "アプリケーション設定",
        description: "現在のアプリケーション設定",
        mimeType: "application/json"
      },
      {
        uri: "db://users/recent",
        name: "最近のユーザー",
        description: "最近登録されたユーザー一覧",
        mimeType: "application/json"
      }
    ]
  };
});
```

#### リソースの読み取り
```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === "file:///config/settings.json") {
    const settings = await fs.readFile("./config/settings.json", "utf-8");
    return {
      contents: [
        {
          uri: uri,
          mimeType: "application/json",
          text: settings
        }
      ]
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});
```

### 3. プロンプト (Prompts)

定型タスク用の**プロンプトテンプレート**です。

#### プロンプトの定義
```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "code_review",
        description: "コードレビューを実施するプロンプト",
        arguments: [
          {
            name: "code",
            description: "レビュー対象のコード",
            required: true
          },
          {
            name: "language",
            description: "プログラミング言語",
            required: false
          }
        ]
      }
    ]
  };
});
```

#### プロンプトの取得
```typescript
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "code_review") {
    const { code, language = "不明" } = request.params.arguments || {};

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `以下の${language}コードをレビューしてください：\n\n${code}\n\nセキュリティ、パフォーマンス、可読性の観点からフィードバックをお願いします。`
          }
        }
      ]
    };
  }

  throw new Error(`Unknown prompt: ${request.params.name}`);
});
```

## メッセージフロー

典型的なMCPのメッセージフローは以下の通りです。

### 1. 初期化フロー

```
Client                                Server
  │                                     │
  ├─────── initialize request ─────────►│
  │   (クライアント情報、機能)           │
  │                                     │
  │◄────── initialize response ─────────┤
  │   (サーバー情報、機能、バージョン)   │
  │                                     │
  ├─────── initialized notification ───►│
  │                                     │
```

### 2. ツール呼び出しフロー

```
Client                                Server
  │                                     │
  ├─────── tools/list request ─────────►│
  │                                     │
  │◄────── tools/list response ────────┤
  │   (利用可能なツール一覧)             │
  │                                     │
  ├─────── tools/call request ─────────►│
  │   (ツール名、引数)                   │
  │                                     │
  │                    [サーバー側で処理実行]
  │                                     │
  │◄────── tools/call response ─────────┤
  │   (実行結果)                         │
  │                                     │
```

### 3. リソース読み取りフロー

```
Client                                Server
  │                                     │
  ├─── resources/list request ─────────►│
  │                                     │
  │◄─── resources/list response ────────┤
  │   (利用可能なリソース一覧)           │
  │                                     │
  ├─── resources/read request ─────────►│
  │   (リソースURI)                      │
  │                                     │
  │◄─── resources/read response ────────┤
  │   (リソース内容)                     │
  │                                     │
```

## ライフサイクル

MCPサーバーの典型的なライフサイクルは以下の通りです。

```
1. 起動 (Startup)
   ├─ サーバーインスタンス作成
   ├─ ハンドラー登録（tools, resources, prompts）
   └─ トランスポート初期化

2. 初期化 (Initialization)
   ├─ クライアントからのinitializeリクエスト受信
   ├─ サーバー情報・機能のネゴシエーション
   └─ initialized通知受信

3. アクティブ (Active)
   ├─ ツール呼び出し処理
   ├─ リソース読み取り処理
   ├─ プロンプト取得処理
   └─ エラーハンドリング

4. シャットダウン (Shutdown)
   ├─ クライアント切断
   ├─ リソースクリーンアップ
   └─ プロセス終了
```

## TypeScript実装

### 基本的なサーバー実装

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// サーバーインスタンス作成
const server = new Server(
  {
    name: "my-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},  // ツール機能を有効化
    },
  }
);

// ツール一覧ハンドラー
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "example_tool",
        description: "サンプルツール",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "メッセージ"
            }
          },
          required: ["message"]
        }
      }
    ]
  };
});

// ツール呼び出しハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "example_tool") {
    const { message } = request.params.arguments;

    return {
      content: [
        {
          type: "text",
          text: `受信したメッセージ: ${message}`
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

### エラーハンドリング

```typescript
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // ツール実行ロジック
    const result = await executeTool(request.params.name, request.params.arguments);
    return result;
  } catch (error) {
    // MCP標準エラーとして返す
    if (error instanceof McpError) {
      throw error;
    }

    // その他のエラーを適切なMCPエラーに変換
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});
```

### 型安全性

TypeScript SDKは完全な型定義を提供しています：

```typescript
import type {
  CallToolRequest,
  CallToolResult,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// 型安全なツール定義
const weatherTool: Tool = {
  name: "get_weather",
  description: "天気情報を取得",
  inputSchema: {
    type: "object",
    properties: {
      location: { type: "string" }
    },
    required: ["location"]
  }
};

// 型安全なハンドラー
async function handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
  // TypeScriptが型チェックを実施
  const { name, arguments: args } = request.params;

  // ...
}
```

## セキュリティ考慮事項

### 1. 入力検証

すべてのツール引数を厳密に検証してください：

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { arguments: args } = request.params;

  // 入力検証
  if (typeof args.location !== "string" || args.location.length === 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "location must be a non-empty string"
    );
  }

  // SQLインジェクション対策: パラメータ化クエリを使用
  // XSS対策: 出力をエスケープ
  // コマンドインジェクション対策: シェルコマンドを避ける
});
```

### 2. 認証と認可

外部APIとの通信では適切な認証を実装：

```typescript
// 環境変数から認証情報を読み込む
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is required");
}

// APIリクエストにトークンを含める
const response = await fetch("https://api.example.com/data", {
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  }
});
```

### 3. レート制限

外部APIへの過度なリクエストを防ぐ：

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number, timeWindowMs: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      throw new McpError(
        ErrorCode.InternalError,
        "Rate limit exceeded"
      );
    }

    this.requests.push(now);
  }
}

const limiter = new RateLimiter(10, 60000); // 1分間に10リクエスト

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await limiter.checkLimit();
  // ツール実行...
});
```

### 4. エラー情報の制限

内部実装の詳細を露出しない：

```typescript
try {
  // 処理...
} catch (error) {
  // 詳細なエラー情報はログに記録
  console.error("Internal error:", error);

  // ユーザーには一般的なエラーメッセージのみ返す
  throw new McpError(
    ErrorCode.InternalError,
    "An error occurred while processing your request"
  );
}
```

### 5. データの暗号化

機密データは暗号化して保存：

```typescript
import crypto from "crypto";

function encryptData(data: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptData(encrypted: string, key: string): string {
  const parts = encrypted.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

## まとめ

MCPは、AIモデルと外部ツール・データソースを接続するための強力で柔軟なプロトコルです。

**主な利点:**
- 標準化されたインターフェース
- 型安全性と拡張性
- 複数のトランスポート層のサポート
- 明確に定義されたライフサイクル

**ベストプラクティス:**
- 入力を常に検証する
- エラーを適切にハンドリングする
- セキュリティを最優先にする
- ドキュメントを充実させる
- テストを書く

## 参考リソース

- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP仕様](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCPサーバー例](https://github.com/modelcontextprotocol/servers)
- [JSON-RPC 2.0仕様](https://www.jsonrpc.org/specification)
