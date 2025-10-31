# Phase 4: MCPプロトコルレイヤー + テスト - MCP Protocol Layer + Testing

## フェーズ概要

### 基本情報
- **フェーズ名**: Phase 4 - MCPプロトコルレイヤー + 統合テスト (MCP Protocol Layer + E2E Testing)
- **期間**: 8-10営業日
- **推定工数**: 120-150時間
- **開始予定**: 2025-12-16 (Phase 3完了後)
- **完了予定**: 2025-12-27
- **担当**: 開発チーム
- **優先度**: P0 (Critical) - MVP完成

### 目的
MCPサーバーの最終統合、E2Eテストの実施、パフォーマンスベンチマーク、ドキュメント整備を行い、Claude Codeと統合可能な完全なMVPを完成させる。

### 成果物
- ✅ MCP Server統合 (@modelcontextprotocol/sdk 1.18.1)
- ✅ StdioServerTransport設定
- ✅ ListToolsRequest/CallToolRequestハンドラ
- ✅ 4ツールのJSON Schema定義
- ✅ E2Eテストスイート (実際のTypeScriptプロジェクトで検証)
- ✅ パフォーマンスベンチマーク (NFR全項目検証)
- ✅ Claude Code設定ファイル
- ✅ 完全なドキュメント
- ✅ デプロイパッケージ

### 関連文書
- **アーキテクチャ**: [architecture.md](../design/code-analysis/architecture.md) - Section 1 (MCP Protocol Layer)
- **要件**: [requirements.md](../spec/code-analysis-requirements.md) - REQ-401〜REQ-405 (制約要件), NFR-001〜NFR-006
- **受け入れ基準**: [acceptance-criteria.md](../spec/code-analysis-acceptance-criteria.md) - 全機能テスト基準
- **技術スタック**: [tech-stack.md](../tech-stack.md) - MCP SDK 1.18.1
- **タスク概要**: [code-analysis-overview.md](./code-analysis-overview.md)

---

## 週次計画

### Week 1 (Days 51-55): MCP統合
**目標**: MCPサーバーの完全統合と動作確認

- **Day 51**: MCP Server基盤実装 (Server初期化、Transport設定)
- **Day 52**: Tool Registry + ListToolsRequestハンドラ
- **Day 53**: CallToolRequestハンドラ + ルーティング
- **Day 54**: エラーハンドリングとJSON Schema定義
- **Day 55**: MCPプロトコルテスト + Week 1完了確認

**マイルストーン**: MCPサーバーが起動し、4ツールが正常動作

---

### Week 2 (Days 56-60): テスト + デプロイ準備
**目標**: Milestone 4達成、MVP完成

- **Days 56-57**: E2Eテスト (実際のTypeScriptプロジェクトで検証)
- **Day 58**: パフォーマンスベンチマーク + 最適化
- **Day 59**: ドキュメント整備 + Claude Code統合ガイド
- **Day 60**: Milestone 4検証 + MVP完成確認

**マイルストーン**: MVP完成、全NFR達成、デプロイ可能

---

## 日次タスク詳細

### Week 1: MCP統合

---

#### Day 51: MCP Server基盤実装

##### - [ ] TASK-0401: MCP Server初期化実装 (TDD Red→Green)
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: Phase 3完了 (TASK-03XX series)
- **要件リンク**: REQ-401, REQ-402, NFR-001
- **信頼性レベル**: 🔵 (architecture.md Section 1, tech-stack.md完全準拠)

**実装詳細**:

**Red: テストケース** (`tests/mcp/server.test.ts`):
```typescript
import { describe, test, expect } from "bun:test";
import { MCPServer } from "../../src/index";

describe("MCP Server初期化", () => {
  test("Serverインスタンスを作成できる", () => {
    const server = new MCPServer();
    expect(server).toBeDefined();
    expect(server.name).toBe("koikoi-server-name");
    expect(server.version).toBe("0.1.0");
  });

  test("capabilities設定が正しい", () => {
    const server = new MCPServer();
    const capabilities = server.getCapabilities();

    expect(capabilities.tools).toBeDefined();
  });

  test("起動時間が1秒以内", async () => {
    const start = Date.now();
    const server = new MCPServer();
    await server.initialize();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000); // NFR-001
  });
});
```

**Green: 実装** (`src/index.ts`):
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * コード解析MCPサーバー
 * Claude Codeのコンテキスト消費を90%削減する高速コード解析システム
 */
export class MCPServer {
  private server: Server;
  private transport: StdioServerTransport;
  public readonly name: string = "koikoi-server-name";
  public readonly version: string = "0.1.0";

  constructor() {
    // MCP Server初期化
    this.server = new Server(
      {
        name: this.name,
        version: this.version,
      },
      {
        capabilities: {
          tools: {}, // Tool機能を有効化
        },
      }
    );

    this.transport = new StdioServerTransport();
  }

  /**
   * サーバーを初期化
   */
  async initialize(): Promise<void> {
    // リクエストハンドラの登録 (後続タスクで実装)
    this.registerHandlers();
  }

  /**
   * Capabilitiesを取得
   */
  getCapabilities() {
    return this.server.capabilities;
  }

  /**
   * リクエストハンドラを登録
   */
  private registerHandlers(): void {
    // TASK-0402で実装
  }

  /**
   * サーバーを起動
   */
  async start(): Promise<void> {
    await this.server.connect(this.transport);
    console.error("MCP Server running on stdio");
  }
}

/**
 * メインエントリーポイント
 */
async function main() {
  const server = new MCPServer();
  await server.initialize();
  await server.start();
}

// スクリプトとして実行された場合のみmainを呼ぶ
if (import.meta.main) {
  main().catch(console.error);
}
```

**完了条件**:
- [ ] テスト全通過
- [ ] MCP Serverインスタンスが正常作成
- [ ] 起動時間1秒以内 (NFR-001)
- [ ] TypeScript strict モードでエラーなし

**テスト要件**:
- Server初期化確認
- Capabilities設定確認
- 起動時間パフォーマンス (NFR-001)

---

##### - [ ] TASK-0402: StdioServerTransport設定とライフサイクル管理
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0401
- **要件リンク**: REQ-401, REQ-402
- **信頼性レベル**: 🔵 (tech-stack.md準拠)

**実装詳細**:

**テストケース**:
```typescript
import { describe, test, expect } from "bun:test";
import { MCPServer } from "../../src/index";

describe("Transport設定", () => {
  test("StdioServerTransportが設定される", () => {
    const server = new MCPServer();
    expect(server.hasTransport()).toBe(true);
  });

  test("サーバーが正常終了できる", async () => {
    const server = new MCPServer();
    await server.initialize();

    // 正常終了
    await expect(server.close()).resolves.not.toThrow();
  });

  test("エラー時も適切にクリーンアップ", async () => {
    const server = new MCPServer();

    // エラー発生時もクリーンアップされる
    try {
      throw new Error("Test error");
    } finally {
      await server.close();
    }

    expect(server.isClosed()).toBe(true);
  });
});
```

**実装** (継続):
```typescript
export class MCPServer {
  private closed: boolean = false;

  /**
   * Transportの存在確認
   */
  hasTransport(): boolean {
    return this.transport !== null;
  }

  /**
   * サーバーを終了
   */
  async close(): Promise<void> {
    if (!this.closed) {
      await this.server.close();
      this.closed = true;
      console.error("MCP Server closed");
    }
  }

  /**
   * クローズ状態を取得
   */
  isClosed(): boolean {
    return this.closed;
  }
}
```

**完了条件**:
- [ ] Transport設定が正しい
- [ ] サーバーが正常起動・終了
- [ ] エラー時のクリーンアップが機能

---

##### - [ ] TASK-0403: package.jsonスクリプトとエントリーポイント設定
- **タスクタイプ**: DIRECT
- **推定工数**: 1時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0402
- **要件リンク**: REQ-401
- **信頼性レベル**: 🔵 (tech-stack.md準拠)

**実装詳細**:

1. `package.json` 更新:
```json
{
  "name": "koikoi-server-name",
  "version": "0.1.0",
  "description": "コード解析MCPサーバー - Claude Codeのコンテキスト消費を90%削減",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "koikoi-server-name": "./dist/index.js"
  },
  "scripts": {
    "dev": "bun run src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist --target node --format esm",
    "start": "node dist/index.js",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "test:e2e": "bun test tests/e2e/",
    "benchmark": "bun run tests/performance/benchmark.ts",
    "lint": "tsc --noEmit",
    "prepublish": "bun run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.18.1"
  },
  "devDependencies": {
    "@types/node": "latest",
    "bun-types": "latest",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=20.0.0",
    "bun": ">=1.3.0"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "typescript",
    "code-analysis",
    "claude-code"
  ]
}
```

2. `dist/index.js` の shebang 追加:
```javascript
#!/usr/bin/env node
```

**完了条件**:
- [ ] package.json が正しく設定
- [ ] `bun run dev` で開発サーバー起動
- [ ] `bun run build` でビルド成功
- [ ] `bun run start` でビルド版起動

---

#### Day 52: Tool Registry + ListToolsRequestハンドラ

##### - [ ] TASK-0404: ToolRegistry実装 (TDD Red→Green)
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0403
- **要件リンク**: REQ-001〜REQ-043 (全ツール機能)
- **信頼性レベル**: 🔵 (architecture.md Section 1, api-specification.md準拠)

**実装詳細**:

**Red: テストケース** (`tests/mcp/tool-registry.test.ts`):
```typescript
import { describe, test, expect } from "bun:test";
import { ToolRegistry } from "../../src/mcp/ToolRegistry";

describe("ToolRegistry", () => {
  test("4つのツールが登録される", () => {
    const registry = new ToolRegistry();
    const tools = registry.getTools();

    expect(tools.length).toBe(4);
    expect(tools.map(t => t.name)).toEqual([
      "analyze_file",
      "search_symbol",
      "analyze_project",
      "get_dependencies",
    ]);
  });

  test("各ツールがJSON Schemaを持つ", () => {
    const registry = new ToolRegistry();
    const tools = registry.getTools();

    tools.forEach(tool => {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.inputSchema.properties).toBeDefined();
      expect(tool.inputSchema.required).toBeDefined();
    });
  });

  test("analyze_fileのSchema定義が正しい", () => {
    const registry = new ToolRegistry();
    const analyzeTool = registry.getTool("analyze_file");

    expect(analyzeTool).toBeDefined();
    expect(analyzeTool.inputSchema.properties.path).toBeDefined();
    expect(analyzeTool.inputSchema.properties.mode).toBeDefined();
    expect(analyzeTool.inputSchema.required).toContain("path");
  });
});
```

**Green: 実装** (`src/mcp/ToolRegistry.ts`):
```typescript
import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * MCPツールの登録と管理
 */
export class ToolRegistry {
  private tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map();
    this.registerTools();
  }

  /**
   * 全ツールを登録
   */
  private registerTools(): void {
    // 1. analyze_file
    this.tools.set("analyze_file", {
      name: "analyze_file",
      description: "TypeScriptファイルの構造を解析し、関数・クラス・型定義・依存関係を抽出します。簡潔モードでは90%以上のコンテキスト削減を実現します。",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "解析するファイルの絶対パスまたは相対パス",
          },
          mode: {
            type: "string",
            enum: ["concise", "detailed"],
            description: "出力モード。concise: シグネチャのみ、detailed: 関数本体を含む",
            default: "concise",
          },
          include: {
            type: "array",
            items: { type: "string" },
            description: "抽出する情報の種類 (functions, classes, types, dependencies, documentation)",
            default: ["functions", "classes", "types", "dependencies"],
          },
        },
        required: ["path"],
      },
    });

    // 2. search_symbol
    this.tools.set("search_symbol", {
      name: "search_symbol",
      description: "プロジェクト内でシンボル名を検索し、定義箇所を特定します。関数・クラス・型定義などを高速に検索できます。",
      inputSchema: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "検索するシンボル名",
          },
          type: {
            type: "string",
            enum: ["function", "class", "interface", "type", "enum", "all"],
            description: "検索する型の種類",
            default: "all",
          },
          matchType: {
            type: "string",
            enum: ["exact", "contains", "startsWith"],
            description: "マッチングの種類",
            default: "contains",
          },
          rootPath: {
            type: "string",
            description: "検索を開始するルートディレクトリ (省略時はワークスペースルート)",
          },
        },
        required: ["symbol"],
      },
    });

    // 3. analyze_project
    this.tools.set("analyze_project", {
      name: "analyze_project",
      description: "プロジェクト全体の構造を解析し、ファイル一覧・依存関係グラフ・プロジェクトサマリーを生成します。",
      inputSchema: {
        type: "object",
        properties: {
          rootPath: {
            type: "string",
            description: "プロジェクトのルートパス",
          },
          includePatterns: {
            type: "array",
            items: { type: "string" },
            description: "解析対象のファイルパターン (glob)",
            default: ["**/*.ts", "**/*.tsx"],
          },
          excludePatterns: {
            type: "array",
            items: { type: "string" },
            description: "除外するファイルパターン (glob)",
            default: ["node_modules/**", "dist/**", "**/*.test.ts"],
          },
          mode: {
            type: "string",
            enum: ["concise", "detailed"],
            description: "出力モード",
            default: "concise",
          },
        },
        required: ["rootPath"],
      },
    });

    // 4. get_dependencies
    this.tools.set("get_dependencies", {
      name: "get_dependencies",
      description: "ファイルの依存関係を解析し、import/exportの依存グラフを構築します。循環依存も検出します。",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "解析するファイルのパス",
          },
          depth: {
            type: "number",
            description: "依存関係を追跡する深さ (1: 直接依存のみ、2以上: 再帰的)",
            default: 1,
            minimum: 1,
            maximum: 5,
          },
          includeExternal: {
            type: "boolean",
            description: "外部ライブラリの依存も含めるか",
            default: false,
          },
        },
        required: ["path"],
      },
    });
  }

  /**
   * 全ツールを取得
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 特定のツールを取得
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * ツールが存在するか確認
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}
```

**完了条件**:
- [ ] テスト全通過
- [ ] 4ツールが正しく登録
- [ ] JSON Schemaが完全定義
- [ ] 各ツールのdescriptionが明確

---

##### - [ ] TASK-0405: ListToolsRequestハンドラ実装 (TDD Red→Green)
- **タスクタイプ**: TDD
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0404
- **要件リンク**: REQ-401, REQ-402
- **信頼性レベル**: 🔵 (MCP SDK準拠)

**実装詳細**:

**Red: テストケース** (`tests/mcp/handlers.test.ts`):
```typescript
import { describe, test, expect } from "bun:test";
import { MCPServer } from "../../src/index";

describe("ListToolsRequestハンドラ", () => {
  test("ツール一覧を返す", async () => {
    const server = new MCPServer();
    await server.initialize();

    const response = await server.handleListTools();

    expect(response.tools.length).toBe(4);
    expect(response.tools[0].name).toBe("analyze_file");
  });

  test("各ツールに必要な情報が含まれる", async () => {
    const server = new MCPServer();
    await server.initialize();

    const response = await server.handleListTools();

    response.tools.forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    });
  });
});
```

**Green: 実装** (`src/index.ts` に追加):
```typescript
import { ToolRegistry } from "./mcp/ToolRegistry.js";

export class MCPServer {
  private toolRegistry: ToolRegistry;

  constructor() {
    // ... 既存のコード
    this.toolRegistry = new ToolRegistry();
  }

  private registerHandlers(): void {
    // ListToolsRequestハンドラ
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.toolRegistry.getTools(),
      };
    });
  }

  /**
   * ツール一覧を取得 (テスト用)
   */
  async handleListTools() {
    return {
      tools: this.toolRegistry.getTools(),
    };
  }
}
```

**完了条件**:
- [ ] ListToolsRequestが正常動作
- [ ] 4ツール全てが返却される
- [ ] JSON Schemaが含まれる

---

##### - [ ] TASK-0406: Day 52振り返りと調整
- **タスクタイプ**: DIRECT
- **推定工数**: 1時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0405
- **信頼性レベル**: 🔵

**実装詳細**:
1. Day 52の成果物レビュー
2. ToolRegistry動作確認
3. 次の日のタスク準備確認

**完了条件**:
- [ ] すべてのDay 52タスクが完了
- [ ] ツール一覧取得が正常動作

---

#### Day 53: CallToolRequestハンドラ + ルーティング

##### - [ ] TASK-0407: ToolRouter実装 (TDD Red→Green)
- **タスクタイプ**: TDD
- **推定工数**: 5時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0405, Phase 3完了
- **要件リンク**: REQ-001〜REQ-043
- **信頼性レベル**: 🔵 (architecture.md Section 2準拠)

**実装詳細**:

**Red: テストケース** (`tests/mcp/tool-router.test.ts`):
```typescript
import { describe, test, expect } from "bun:test";
import { ToolRouter } from "../../src/mcp/ToolRouter";

describe("ToolRouter", () => {
  test("analyze_fileにルーティング", async () => {
    const router = new ToolRouter();

    const result = await router.route("analyze_file", {
      path: "./tests/fixtures/sample-simple.ts",
      mode: "concise",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("search_symbolにルーティング", async () => {
    const router = new ToolRouter();

    const result = await router.route("search_symbol", {
      symbol: "User",
      matchType: "contains",
    });

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  test("存在しないツールでエラー", async () => {
    const router = new ToolRouter();

    await expect(
      router.route("unknown_tool", {})
    ).rejects.toThrow("Unknown tool");
  });

  test("バリデーションエラー", async () => {
    const router = new ToolRouter();

    await expect(
      router.route("analyze_file", {}) // pathが必須
    ).rejects.toThrow("Missing required parameter");
  });
});
```

**Green: 実装** (`src/mcp/ToolRouter.ts`):
```typescript
import { AnalyzeFileTool } from "../tools/AnalyzeFileTool.js";
import { SearchSymbolTool } from "../tools/SearchSymbolTool.js";
import { AnalyzeProjectTool } from "../tools/AnalyzeProjectTool.js";
import { GetDependenciesTool } from "../tools/GetDependenciesTool.js";
import { ToolRegistry } from "./ToolRegistry.js";

/**
 * ツールリクエストのルーティング
 */
export class ToolRouter {
  private analyzeFileTool: AnalyzeFileTool;
  private searchSymbolTool: SearchSymbolTool;
  private analyzeProjectTool: AnalyzeProjectTool;
  private getDependenciesTool: GetDependenciesTool;
  private toolRegistry: ToolRegistry;

  constructor() {
    // Phase 3で実装済みのツールハンドラをインポート
    this.analyzeFileTool = new AnalyzeFileTool();
    this.searchSymbolTool = new SearchSymbolTool();
    this.analyzeProjectTool = new AnalyzeProjectTool();
    this.getDependenciesTool = new GetDependenciesTool();
    this.toolRegistry = new ToolRegistry();
  }

  /**
   * ツールリクエストをルーティング
   */
  async route(toolName: string, args: any): Promise<any> {
    // ツールの存在確認
    if (!this.toolRegistry.hasTool(toolName)) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    // 入力バリデーション
    this.validateInput(toolName, args);

    // ルーティング
    switch (toolName) {
      case "analyze_file":
        return await this.analyzeFileTool.execute(args);

      case "search_symbol":
        return await this.searchSymbolTool.execute(args);

      case "analyze_project":
        return await this.analyzeProjectTool.execute(args);

      case "get_dependencies":
        return await this.getDependenciesTool.execute(args);

      default:
        throw new Error(`Tool not implemented: ${toolName}`);
    }
  }

  /**
   * 入力バリデーション
   */
  private validateInput(toolName: string, args: any): void {
    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) return;

    const schema = tool.inputSchema;
    const required = schema.required || [];

    // 必須パラメータチェック
    for (const param of required) {
      if (!(param in args)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }

    // 型チェック (簡易)
    for (const [key, value] of Object.entries(args)) {
      const propSchema = schema.properties[key];
      if (!propSchema) continue;

      const actualType = typeof value;
      const expectedType = propSchema.type;

      if (expectedType === "array" && !Array.isArray(value)) {
        throw new Error(`Parameter '${key}' must be an array`);
      } else if (expectedType !== "array" && actualType !== expectedType) {
        throw new Error(
          `Parameter '${key}' must be of type ${expectedType}, got ${actualType}`
        );
      }
    }
  }
}
```

**完了条件**:
- [ ] テスト全通過
- [ ] 4ツール全てにルーティング可能
- [ ] バリデーションが機能
- [ ] エラーハンドリングが適切

---

##### - [ ] TASK-0408: CallToolRequestハンドラ実装 (TDD Red→Green)
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0407
- **要件リンク**: REQ-401, REQ-402
- **信頼性レベル**: 🔵 (MCP SDK準拠)

**実装詳細**:

**Red: テストケース** (`tests/mcp/handlers.test.ts` に追加):
```typescript
describe("CallToolRequestハンドラ", () => {
  test("analyze_fileを実行できる", async () => {
    const server = new MCPServer();
    await server.initialize();

    const response = await server.handleCallTool("analyze_file", {
      path: "./tests/fixtures/sample-simple.ts",
      mode: "concise",
    });

    expect(response.content).toBeDefined();
    expect(response.content[0].type).toBe("text");
  });

  test("JSONレスポンスが正しい形式", async () => {
    const server = new MCPServer();
    await server.initialize();

    const response = await server.handleCallTool("analyze_file", {
      path: "./tests/fixtures/sample-simple.ts",
    });

    const content = JSON.parse(response.content[0].text);
    expect(content.success).toBeDefined();
    expect(content.data).toBeDefined();
  });

  test("エラー時も適切なレスポンス", async () => {
    const server = new MCPServer();
    await server.initialize();

    const response = await server.handleCallTool("analyze_file", {
      path: "./nonexistent.ts",
    });

    const content = JSON.parse(response.content[0].text);
    expect(content.success).toBe(false);
    expect(content.error).toBeDefined();
  });
});
```

**Green: 実装** (`src/index.ts` に追加):
```typescript
import { ToolRouter } from "./mcp/ToolRouter.js";

export class MCPServer {
  private toolRouter: ToolRouter;

  constructor() {
    // ... 既存のコード
    this.toolRouter = new ToolRouter();
  }

  private registerHandlers(): void {
    // ... 既存のListToolsRequestハンドラ

    // CallToolRequestハンドラ
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // ツールを実行
        const result = await this.toolRouter.route(name, args || {});

        // JSON形式でレスポンス
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        // エラーレスポンス
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    message: error.message,
                    type: error.constructor.name,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * ツール実行 (テスト用)
   */
  async handleCallTool(name: string, args: any) {
    try {
      const result = await this.toolRouter.route(name, args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  type: error.constructor.name,
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
}
```

**完了条件**:
- [ ] CallToolRequestが正常動作
- [ ] JSON形式のレスポンス
- [ ] エラーハンドリングが適切
- [ ] テスト全通過

---

#### Day 54: エラーハンドリングとJSON Schema定義

##### - [ ] TASK-0409: エラーレスポンスフォーマッター実装
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0408
- **要件リンク**: REQ-101, REQ-102 (部分的成功)
- **信頼性レベル**: 🔵 (architecture.md Section 1準拠)

**実装詳細**:

**テストケース** (`tests/mcp/error-formatter.test.ts`):
```typescript
import { describe, test, expect } from "bun:test";
import { ErrorFormatter } from "../../src/mcp/ErrorFormatter";

describe("ErrorFormatter", () => {
  test("FileSystemErrorを適切にフォーマット", () => {
    const error = new FileSystemError(
      "File not found",
      "/test/file.ts",
      "ENOENT"
    );

    const formatted = ErrorFormatter.format(error);

    expect(formatted.success).toBe(false);
    expect(formatted.error.type).toBe("FileSystemError");
    expect(formatted.error.message).toBe("File not found");
    expect(formatted.error.code).toBe("ENOENT");
    expect(formatted.error.path).toBe("/test/file.ts");
  });

  test("部分的成功をフォーマット", () => {
    const partialResult = {
      success: true,
      partial: true,
      data: {
        functions: [{ name: "test" }],
      },
      errors: [
        {
          message: "Failed to parse class",
          line: 10,
        },
      ],
    };

    const formatted = ErrorFormatter.formatPartial(partialResult);

    expect(formatted.success).toBe(true);
    expect(formatted.partial).toBe(true);
    expect(formatted.errors).toBeDefined();
  });

  test("一般的なエラーをフォーマット", () => {
    const error = new Error("Unknown error");

    const formatted = ErrorFormatter.format(error);

    expect(formatted.success).toBe(false);
    expect(formatted.error.type).toBe("Error");
    expect(formatted.error.message).toBe("Unknown error");
  });
});
```

**実装** (`src/mcp/ErrorFormatter.ts`):
```typescript
import {
  FileSystemError,
  WorkspaceBoundaryError,
  CompilerError,
} from "../utils/errors.js";

/**
 * エラーレスポンスのフォーマッター
 */
export class ErrorFormatter {
  /**
   * エラーをフォーマット
   */
  static format(error: Error): any {
    if (error instanceof FileSystemError) {
      return {
        success: false,
        error: {
          type: "FileSystemError",
          message: error.message,
          path: error.path,
          code: error.code,
        },
      };
    }

    if (error instanceof WorkspaceBoundaryError) {
      return {
        success: false,
        error: {
          type: "WorkspaceBoundaryError",
          message: error.message,
          path: error.path,
        },
      };
    }

    if (error instanceof CompilerError) {
      return {
        success: false,
        error: {
          type: "CompilerError",
          message: error.message,
          diagnostics: error.diagnostics?.map((d) => ({
            message: d.messageText.toString(),
            file: d.file?.fileName,
            line: d.file?.getLineAndCharacterOfPosition(d.start || 0).line,
          })),
        },
      };
    }

    // 一般的なエラー
    return {
      success: false,
      error: {
        type: error.constructor.name,
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    };
  }

  /**
   * 部分的成功をフォーマット
   */
  static formatPartial(result: any): any {
    return {
      success: true,
      partial: result.partial,
      data: result.data,
      errors: result.errors,
      warnings: result.warnings,
    };
  }
}
```

**完了条件**:
- [ ] 各エラー型が適切にフォーマット
- [ ] 部分的成功のフォーマット機能
- [ ] テスト全通過

---

##### - [ ] TASK-0410: JSON Schema検証機能追加
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0409
- **要件リンク**: REQ-401, REQ-402
- **信頼性レベル**: 🔵 (JSON Schema標準準拠)

**実装詳細**:

**テストケース** (`tests/mcp/schema-validator.test.ts`):
```typescript
import { describe, test, expect } from "bun:test";
import { SchemaValidator } from "../../src/mcp/SchemaValidator";
import { ToolRegistry } from "../../src/mcp/ToolRegistry";

describe("SchemaValidator", () => {
  test("有効な入力を検証", () => {
    const registry = new ToolRegistry();
    const tool = registry.getTool("analyze_file");
    const validator = new SchemaValidator(tool.inputSchema);

    const input = {
      path: "./test.ts",
      mode: "concise",
    };

    const result = validator.validate(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test("必須パラメータ不足でエラー", () => {
    const registry = new ToolRegistry();
    const tool = registry.getTool("analyze_file");
    const validator = new SchemaValidator(tool.inputSchema);

    const input = { mode: "concise" }; // pathが不足

    const result = validator.validate(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: path");
  });

  test("型不一致でエラー", () => {
    const registry = new ToolRegistry();
    const tool = registry.getTool("analyze_file");
    const validator = new SchemaValidator(tool.inputSchema);

    const input = {
      path: 123, // 文字列であるべき
      mode: "concise",
    };

    const result = validator.validate(input);
    expect(result.valid).toBe(false);
  });
});
```

**実装** (`src/mcp/SchemaValidator.ts`):
```typescript
/**
 * JSON Schemaバリデーター
 */
export class SchemaValidator {
  private schema: any;

  constructor(schema: any) {
    this.schema = schema;
  }

  /**
   * 入力を検証
   */
  validate(input: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // 必須パラメータチェック
    const required = this.schema.required || [];
    for (const param of required) {
      if (!(param in input)) {
        errors.push(`Missing required parameter: ${param}`);
      }
    }

    // 型チェック
    for (const [key, value] of Object.entries(input)) {
      const propSchema = this.schema.properties[key];
      if (!propSchema) {
        errors.push(`Unknown parameter: ${key}`);
        continue;
      }

      const actualType = Array.isArray(value) ? "array" : typeof value;
      const expectedType = propSchema.type;

      if (actualType !== expectedType) {
        errors.push(
          `Parameter '${key}' must be of type ${expectedType}, got ${actualType}`
        );
      }

      // enum チェック
      if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.push(
          `Parameter '${key}' must be one of: ${propSchema.enum.join(", ")}`
        );
      }

      // 数値範囲チェック
      if (expectedType === "number") {
        if (propSchema.minimum !== undefined && value < propSchema.minimum) {
          errors.push(
            `Parameter '${key}' must be >= ${propSchema.minimum}`
          );
        }
        if (propSchema.maximum !== undefined && value > propSchema.maximum) {
          errors.push(
            `Parameter '${key}' must be <= ${propSchema.maximum}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
```

**完了条件**:
- [ ] JSON Schema検証が機能
- [ ] 各種バリデーションルールが動作
- [ ] エラーメッセージが明確

---

##### - [ ] TASK-0411: Day 54振り返りと統合テスト
- **タスクタイプ**: DIRECT
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0410
- **信頼性レベル**: 🔵

**実装詳細**:
1. エラーハンドリング統合確認
2. JSON Schema検証動作確認
3. MCPプロトコル準拠確認

**完了条件**:
- [ ] すべてのDay 54タスクが完了
- [ ] エラーレスポンスが適切

---

#### Day 55: MCPプロトコルテスト + Week 1完了確認

##### - [ ] TASK-0412: MCPプロトコル統合テスト
- **タスクタイプ**: TDD
- **推定工数**: 5時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0410
- **要件リンク**: REQ-401, REQ-402, NFR-203
- **信頼性レベル**: 🔵 (MCP SDK準拠)

**実装詳細**:

**統合テスト** (`tests/mcp/integration.test.ts`):
```typescript
import { describe, test, expect } from "bun:test";
import { MCPServer } from "../../src/index";

describe("MCPプロトコル統合テスト", () => {
  test("完全なフロー: ListTools → CallTool", async () => {
    const server = new MCPServer();
    await server.initialize();

    // 1. ツール一覧取得
    const listResponse = await server.handleListTools();
    expect(listResponse.tools.length).toBe(4);

    // 2. ツール実行
    const callResponse = await server.handleCallTool("analyze_file", {
      path: "./tests/fixtures/sample-simple.ts",
      mode: "concise",
    });

    expect(callResponse.content[0].type).toBe("text");
    const result = JSON.parse(callResponse.content[0].text);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("4ツール全てが実行可能", async () => {
    const server = new MCPServer();
    await server.initialize();

    // analyze_file
    const r1 = await server.handleCallTool("analyze_file", {
      path: "./tests/fixtures/sample-simple.ts",
    });
    expect(JSON.parse(r1.content[0].text).success).toBe(true);

    // search_symbol
    const r2 = await server.handleCallTool("search_symbol", {
      symbol: "User",
    });
    expect(JSON.parse(r2.content[0].text).success).toBe(true);

    // analyze_project
    const r3 = await server.handleCallTool("analyze_project", {
      rootPath: "./tests/fixtures/workspace",
    });
    expect(JSON.parse(r3.content[0].text).success).toBe(true);

    // get_dependencies
    const r4 = await server.handleCallTool("get_dependencies", {
      path: "./tests/fixtures/sample-simple.ts",
    });
    expect(JSON.parse(r4.content[0].text).success).toBe(true);
  });

  test("エラーハンドリングが機能", async () => {
    const server = new MCPServer();
    await server.initialize();

    const response = await server.handleCallTool("analyze_file", {
      path: "./nonexistent.ts",
    });

    const result = JSON.parse(response.content[0].text);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("起動から実行までが1秒以内", async () => {
    const start = Date.now();

    const server = new MCPServer();
    await server.initialize();
    await server.handleCallTool("analyze_file", {
      path: "./tests/fixtures/sample-simple.ts",
      mode: "concise",
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000); // NFR-001
  });
});
```

**完了条件**:
- [ ] MCPプロトコル統合テスト全通過
- [ ] 4ツール全て実行可能
- [ ] エラーハンドリング機能確認
- [ ] NFR-001 (起動時間1秒以内) 達成

---

##### - [ ] TASK-0413: Week 1完了確認とドキュメント更新
- **タスクタイプ**: DIRECT
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0412
- **信頼性レベル**: 🔵

**実装詳細**:
1. `bun test tests/mcp/` で全テスト実行
2. MCPサーバー手動起動確認
3. ドキュメント更新 (MCP統合完了)
4. Week 1レポート作成

**完了条件**:
- [ ] Week 1の全タスクが完了
- [ ] MCPサーバーが正常動作
- [ ] 4ツールが全て実行可能
- [ ] ドキュメント最新

---

### Week 2: テスト + デプロイ準備

---

#### Days 56-57: E2Eテスト

##### - [ ] TASK-0414: E2Eテスト基盤構築
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0413
- **要件リンク**: NFR-203 (E2Eテスト)
- **信頼性レベル**: 🔵 (acceptance-criteria.md準拠)

**実装詳細**:

**E2Eテスト環境構築** (`tests/e2e/setup.ts`):
```typescript
import { spawn } from "child_process";
import { MCPServer } from "../../src/index";

/**
 * E2Eテスト用のMCPサーバー起動
 */
export async function startTestServer(): Promise<{
  server: MCPServer;
  close: () => Promise<void>;
}> {
  const server = new MCPServer();
  await server.initialize();
  await server.start();

  return {
    server,
    close: async () => {
      await server.close();
    },
  };
}

/**
 * テスト用のTypeScriptプロジェクト準備
 */
export function prepareTestProject(): string {
  // tests/fixtures/e2e-project/ を使用
  return process.cwd() + "/tests/fixtures/e2e-project";
}
```

**完了条件**:
- [ ] E2Eテスト基盤が構築
- [ ] テストプロジェクトが準備

---

##### - [ ] TASK-0415: analyze_file E2Eテスト
- **タスクタイプ**: TDD
- **推定工数**: 4時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0414
- **要件リンク**: REQ-001〜REQ-007, acceptance-criteria.md
- **信頼性レベル**: 🔵

**実装詳細**:

**E2Eテスト** (`tests/e2e/analyze-file.test.ts`):
```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { startTestServer, prepareTestProject } from "./setup";

describe("analyze_file E2E", () => {
  let server;
  let projectPath;

  beforeAll(async () => {
    server = await startTestServer();
    projectPath = prepareTestProject();
  });

  afterAll(async () => {
    await server.close();
  });

  test("REQ-001: 関数一覧抽出 🔵", async () => {
    const response = await server.server.handleCallTool("analyze_file", {
      path: `${projectPath}/src/utils.ts`,
      mode: "concise",
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    expect(result.data.functions).toBeDefined();
    expect(result.data.functions.length).toBeGreaterThan(0);

    // 関数名とシグネチャが含まれる
    const func = result.data.functions[0];
    expect(func.name).toBeDefined();
    expect(func.parameters).toBeDefined();
    expect(func.returnType).toBeDefined();
  });

  test("REQ-002: クラスとメソッド抽出 🔵", async () => {
    const response = await server.server.handleCallTool("analyze_file", {
      path: `${projectPath}/src/UserService.ts`,
      mode: "concise",
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    expect(result.data.classes).toBeDefined();
    expect(result.data.classes.length).toBeGreaterThan(0);

    // クラス名とメンバーが含まれる
    const cls = result.data.classes[0];
    expect(cls.name).toBe("UserService");
    expect(cls.methods).toBeDefined();
    expect(cls.properties).toBeDefined();
  });

  test("REQ-003: interface/type抽出 🔵", async () => {
    const response = await server.server.handleCallTool("analyze_file", {
      path: `${projectPath}/src/types.ts`,
      mode: "concise",
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    expect(result.data.types).toBeDefined();
    expect(result.data.types.length).toBeGreaterThan(0);

    // 型定義が含まれる
    const type = result.data.types[0];
    expect(type.name).toBeDefined();
    expect(type.kind).toBeDefined(); // "interface" | "type" | "enum"
  });

  test("EDGE-001: 構文エラーファイルでも部分的成功 🔵", async () => {
    const response = await server.server.handleCallTool("analyze_file", {
      path: `${projectPath}/src/error.ts`,
      mode: "concise",
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    expect(result.partial).toBe(true); // 部分的成功
    expect(result.errors).toBeDefined();
    expect(result.data).toBeDefined(); // 解析可能な部分は返される
  });

  test("NFR-002: 小規模ファイル50ms以内 🔵", async () => {
    const start = Date.now();

    await server.server.handleCallTool("analyze_file", {
      path: `${projectPath}/src/small.ts`, // 100行以下
      mode: "concise",
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50); // NFR-002
  });

  test("コンテキスト削減90%達成 🔵", async () => {
    const filePath = `${projectPath}/src/large.ts`;

    // 元のファイルサイズ
    const originalSize = (await Bun.file(filePath).text()).length;

    // 解析結果のサイズ
    const response = await server.server.handleCallTool("analyze_file", {
      path: filePath,
      mode: "concise",
    });

    const resultSize = response.content[0].text.length;

    // 90%以上削減
    const reduction = 1 - resultSize / originalSize;
    expect(reduction).toBeGreaterThan(0.9); // 90%以上削減
  });
});
```

**完了条件**:
- [ ] analyze_file E2Eテスト全通過
- [ ] 受け入れ基準 (REQ-001〜007) 達成
- [ ] NFR-002 (50ms以内) 達成
- [ ] コンテキスト削減90%達成

---

##### - [ ] TASK-0416: search_symbol E2Eテスト
- **タスクタイプ**: TDD
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0415
- **要件リンク**: REQ-011〜REQ-013, acceptance-criteria.md
- **信頼性レベル**: 🔵

**実装詳細**:

**E2Eテスト** (`tests/e2e/search-symbol.test.ts`):
```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { startTestServer, prepareTestProject } from "./setup";

describe("search_symbol E2E", () => {
  let server;
  let projectPath;

  beforeAll(async () => {
    server = await startTestServer();
    projectPath = prepareTestProject();
  });

  afterAll(async () => {
    await server.close();
  });

  test("REQ-011: シンボル検索 (完全一致) 🔵", async () => {
    const response = await server.server.handleCallTool("search_symbol", {
      symbol: "UserService",
      matchType: "exact",
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);

    // ファイルパス、行番号、型が含まれる
    const match = result.data[0];
    expect(match.file).toBeDefined();
    expect(match.line).toBeGreaterThan(0);
    expect(match.type).toBeDefined(); // "class" | "function" | etc.
  });

  test("REQ-012: シンボル検索 (部分一致) 🔵", async () => {
    const response = await server.server.handleCallTool("search_symbol", {
      symbol: "User",
      matchType: "contains",
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(1); // 複数ヒット
  });

  test("REQ-013: 型フィルタ (関数のみ) 🔵", async () => {
    const response = await server.server.handleCallTool("search_symbol", {
      symbol: "get",
      matchType: "startsWith",
      type: "function",
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    result.data.forEach((match) => {
      expect(match.type).toBe("function");
    });
  });

  test("NFR-004: 並行処理で高速検索 🔵", async () => {
    const start = Date.now();

    await server.server.handleCallTool("search_symbol", {
      symbol: "Test",
      matchType: "contains",
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000); // 2秒以内
  });
});
```

**完了条件**:
- [ ] search_symbol E2Eテスト全通過
- [ ] 受け入れ基準 (REQ-011〜013) 達成
- [ ] 並行処理で高速検索

---

##### - [ ] TASK-0417: analyze_project + get_dependencies E2Eテスト
- **タスクタイプ**: TDD
- **推定工数**: 5時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0416
- **要件リンク**: REQ-021〜REQ-033, acceptance-criteria.md
- **信頼性レベル**: 🔵

**実装詳細**:

**E2Eテスト** (`tests/e2e/project-dependencies.test.ts`):
```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { startTestServer, prepareTestProject } from "./setup";

describe("analyze_project & get_dependencies E2E", () => {
  let server;
  let projectPath;

  beforeAll(async () => {
    server = await startTestServer();
    projectPath = prepareTestProject();
  });

  afterAll(async () => {
    await server.close();
  });

  test("REQ-031: プロジェクト構造解析 🔵", async () => {
    const response = await server.server.handleCallTool("analyze_project", {
      rootPath: projectPath,
      mode: "concise",
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    expect(result.data.files).toBeDefined();
    expect(result.data.summary).toBeDefined();
    expect(result.data.dependencies).toBeDefined();
  });

  test("REQ-021: 依存関係解析 🔵", async () => {
    const response = await server.server.handleCallTool("get_dependencies", {
      path: `${projectPath}/src/index.ts`,
      depth: 2,
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    expect(result.data.internal).toBeDefined();
    expect(result.data.external).toBeDefined();
  });

  test("REQ-022: 循環依存検出 🔵", async () => {
    const response = await server.server.handleCallTool("get_dependencies", {
      path: `${projectPath}/src/circular-a.ts`,
      depth: 3,
    });

    const result = JSON.parse(response.content[0].text);

    expect(result.success).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings.some((w) => w.type === "circular")).toBe(true);
  });

  test("NFR-004: 10ファイル並行解析2秒以内 🔵", async () => {
    const start = Date.now();

    await server.server.handleCallTool("analyze_project", {
      rootPath: projectPath,
      mode: "concise",
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000); // NFR-004
  });
});
```

**完了条件**:
- [ ] analyze_project E2Eテスト全通過
- [ ] get_dependencies E2Eテスト全通過
- [ ] 受け入れ基準 (REQ-021〜033) 達成
- [ ] 並行処理で高速解析

---

#### Day 58: パフォーマンスベンチマーク + 最適化

##### - [ ] TASK-0418: 包括的パフォーマンスベンチマーク
- **タスクタイプ**: DIRECT
- **推定工数**: 5時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0417
- **要件リンク**: NFR-001〜NFR-006 (全非機能要件)
- **信頼性レベル**: 🔵

**実装詳細**:

**ベンチマークスクリプト** (`tests/performance/benchmark.ts`):
```typescript
import { MCPServer } from "../../src/index";
import { prepareTestProject } from "../e2e/setup";

/**
 * パフォーマンスベンチマーク
 */
async function runBenchmark() {
  console.log("=== パフォーマンスベンチマーク開始 ===\n");

  const server = new MCPServer();
  const projectPath = prepareTestProject();

  // NFR-001: 起動時間1秒以内
  console.log("NFR-001: 起動時間測定");
  const startupStart = Date.now();
  await server.initialize();
  const startupTime = Date.now() - startupStart;
  console.log(`  起動時間: ${startupTime}ms`);
  console.log(`  目標: 1000ms以内`);
  console.log(`  結果: ${startupTime < 1000 ? "✅ PASS" : "❌ FAIL"}\n`);

  // NFR-002: 小規模ファイル50ms以内
  console.log("NFR-002: 小規模ファイル解析時間");
  const smallStart = Date.now();
  await server.handleCallTool("analyze_file", {
    path: `${projectPath}/src/small.ts`,
    mode: "concise",
  });
  const smallTime = Date.now() - smallStart;
  console.log(`  解析時間: ${smallTime}ms`);
  console.log(`  目標: 50ms以内`);
  console.log(`  結果: ${smallTime < 50 ? "✅ PASS" : "❌ FAIL"}\n`);

  // NFR-003: 中規模ファイル200ms以内
  console.log("NFR-003: 中規模ファイル解析時間");
  const mediumStart = Date.now();
  await server.handleCallTool("analyze_file", {
    path: `${projectPath}/src/medium.ts`,
    mode: "concise",
  });
  const mediumTime = Date.now() - mediumStart;
  console.log(`  解析時間: ${mediumTime}ms`);
  console.log(`  目標: 200ms以内`);
  console.log(`  結果: ${mediumTime < 200 ? "✅ PASS" : "❌ FAIL"}\n`);

  // NFR-004: 10ファイル並行解析2秒以内
  console.log("NFR-004: 並行処理性能");
  const parallelStart = Date.now();
  await server.handleCallTool("analyze_project", {
    rootPath: projectPath,
    mode: "concise",
  });
  const parallelTime = Date.now() - parallelStart;
  console.log(`  解析時間: ${parallelTime}ms`);
  console.log(`  目標: 2000ms以内`);
  console.log(`  結果: ${parallelTime < 2000 ? "✅ PASS" : "❌ FAIL"}\n`);

  // NFR-005: キャッシュヒット10ms以内
  console.log("NFR-005: キャッシュ性能");
  const path = `${projectPath}/src/small.ts`;

  // 初回 (キャッシュミス)
  await server.handleCallTool("analyze_file", { path, mode: "concise" });

  // 2回目 (キャッシュヒット)
  const cacheStart = Date.now();
  await server.handleCallTool("analyze_file", { path, mode: "concise" });
  const cacheTime = Date.now() - cacheStart;
  console.log(`  キャッシュヒット時間: ${cacheTime}ms`);
  console.log(`  目標: 10ms以内`);
  console.log(`  結果: ${cacheTime < 10 ? "✅ PASS" : "❌ FAIL"}\n`);

  // NFR-006: コンテキスト削減90%以上
  console.log("NFR-006: コンテキスト削減率");
  const largeFilePath = `${projectPath}/src/large.ts`;
  const originalSize = (await Bun.file(largeFilePath).text()).length;

  const response = await server.handleCallTool("analyze_file", {
    path: largeFilePath,
    mode: "concise",
  });
  const resultSize = response.content[0].text.length;

  const reduction = ((originalSize - resultSize) / originalSize) * 100;
  console.log(`  元のサイズ: ${originalSize} bytes`);
  console.log(`  結果のサイズ: ${resultSize} bytes`);
  console.log(`  削減率: ${reduction.toFixed(2)}%`);
  console.log(`  目標: 90%以上`);
  console.log(`  結果: ${reduction >= 90 ? "✅ PASS" : "❌ FAIL"}\n`);

  await server.close();

  console.log("=== パフォーマンスベンチマーク完了 ===");
}

runBenchmark().catch(console.error);
```

**完了条件**:
- [ ] NFR-001〜NFR-006 全て達成
- [ ] ベンチマーク結果をドキュメント化
- [ ] 性能改善の余地を特定

---

##### - [ ] TASK-0419: パフォーマンス最適化
- **タスクタイプ**: DIRECT
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0418
- **要件リンク**: NFR-001〜NFR-006
- **信頼性レベル**: 🟡 (ベンチマーク結果次第)

**実装詳細**:
1. ボトルネック特定
2. キャッシュ最適化
3. 並行処理チューニング
4. メモリ使用量削減

**完了条件**:
- [ ] NFR全項目が確実に達成
- [ ] 最適化後の再ベンチマーク通過

---

#### Day 59: ドキュメント整備 + Claude Code統合ガイド

##### - [ ] TASK-0420: 完全なREADME.md作成
- **タスクタイプ**: DIRECT
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0419
- **要件リンク**: NFR-302 (ドキュメント整備)
- **信頼性レベル**: 🔵

**実装詳細**:

**README.md** の内容:
1. プロジェクト概要
2. 特徴 (コンテキスト90%削減)
3. インストール方法
4. Claude Code統合手順
5. 4ツールの使い方と例
6. パフォーマンス指標
7. トラブルシューティング
8. 開発者向けガイド

**完了条件**:
- [ ] README.mdが完全
- [ ] 使用例が明確
- [ ] トラブルシューティングガイド完備

---

##### - [ ] TASK-0421: Claude Code設定ファイル作成
- **タスクタイプ**: DIRECT
- **推定工数**: 2時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0420
- **要件リンク**: REQ-402 (Claude Code統合)
- **信頼性レベル**: 🔵 (MCP Client仕様準拠)

**実装詳細**:

**Claude Code設定ファイル** (`.claude/mcp-servers.json`):
```json
{
  "mcpServers": {
    "koikoi-server-name": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/koikoi-server-name/src/index.ts"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**インストールガイド** (`docs/claude-code-setup.md`):
```markdown
# Claude Code統合ガイド

## 1. MCPサーバーのビルド

\`\`\`bash
bun run build
\`\`\`

## 2. Claude Codeの設定

1. Claude Codeを開く
2. Settings → MCP Servers
3. 以下の設定を追加:

\`\`\`json
{
  "koikoi-server-name": {
    "command": "node",
    "args": ["/path/to/koikoi-server-name/dist/index.js"]
  }
}
\`\`\`

## 3. 動作確認

Claude Codeで以下を試す:

- "このファイルの構造を解析してください"
- "Userクラスを検索してください"
- "このプロジェクト全体を解析してください"

## 4. トラブルシューティング

- サーバーが起動しない → ログ確認: `~/.claude/logs/mcp-server.log`
- ツールが表示されない → MCP設定を確認
```

**完了条件**:
- [ ] Claude Code設定ファイル完成
- [ ] セットアップガイド作成
- [ ] 動作確認手順明記

---

##### - [ ] TASK-0422: APIドキュメントとアーキテクチャ図更新
- **タスクタイプ**: DIRECT
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0421
- **要件リンク**: NFR-302
- **信頼性レベル**: 🔵

**実装詳細**:
1. `docs/api/mcp-api.md` - MCP API完全仕様
2. `docs/architecture.md` 更新 (Phase 4反映)
3. シーケンス図の更新
4. パフォーマンスベンチマーク結果の追記

**完了条件**:
- [ ] APIドキュメント完備
- [ ] アーキテクチャ図最新
- [ ] 全ドキュメントが一貫性保持

---

#### Day 60: Milestone 4検証 + MVP完成確認

##### - [ ] TASK-0423: Milestone 4完全検証
- **タスクタイプ**: DIRECT
- **推定工数**: 5時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0422
- **要件リンク**: 全要件 (REQ-001〜405, NFR-001〜006)
- **信頼性レベル**: 🔵

**実装詳細**:

**Milestone 4達成条件チェック**:
- [ ] MCPサーバーがClaude Codeと統合
- [ ] 全E2Eテストが通過
- [ ] パフォーマンス目標を達成
- [ ] ドキュメントが完備
- [ ] Claude Codeでの実用テストが成功

**検証コマンド**:
```bash
# 1. 全テスト実行
bun test

# 2. E2Eテスト実行
bun test tests/e2e/

# 3. パフォーマンスベンチマーク
bun run benchmark

# 4. ビルド確認
bun run build

# 5. 起動確認
bun run start
```

**Claude Code実用テスト**:
1. Claude Codeでサーバー設定
2. 実際のTypeScriptプロジェクトで4ツール実行
3. コンテキスト削減効果確認
4. エラーハンドリング確認

**完了条件**:
- [ ] Milestone 4完全達成
- [ ] 全テスト通過
- [ ] NFR全項目達成
- [ ] Claude Code統合成功

---

##### - [ ] TASK-0424: MVP完成レポートとデプロイパッケージ作成
- **タスクタイプ**: DIRECT
- **推定工数**: 3時間
- **要件名**: code-analysis
- **依存タスク**: TASK-0423
- **要件リンク**: 全要件
- **信頼性レベル**: 🔵

**実装詳細**:

**MVP完成レポート** (`docs/mvp-report.md`):
1. プロジェクト概要
2. 達成された機能一覧
3. パフォーマンス実測値
4. テストカバレッジ
5. 技術的課題と解決策
6. 今後の拡張計画

**デプロイパッケージ**:
```
koikoi-server-name/
├── dist/              # ビルド成果物
├── docs/              # ドキュメント
├── README.md
├── package.json
├── CHANGELOG.md       # 変更履歴
└── LICENSE            # ライセンス
```

**完了条件**:
- [ ] MVP完成レポート作成
- [ ] デプロイパッケージ準備完了
- [ ] 全ドキュメント最終確認
- [ ] Phase 4完全完了

---

## Phase 4完了チェックリスト

### 成果物チェック
- [ ] MCP Server統合完了 (Server, Transport)
- [ ] ToolRegistry実装完了 (4ツール登録)
- [ ] ListToolsRequestハンドラ実装完了
- [ ] CallToolRequestハンドラ実装完了
- [ ] ToolRouter実装完了 (ルーティング機能)
- [ ] ErrorFormatter実装完了 (エラーレスポンス)
- [ ] SchemaValidator実装完了 (JSON Schema検証)
- [ ] E2Eテストスイート完成 (4ツール全て)
- [ ] パフォーマンスベンチマーク完成
- [ ] 完全なドキュメント (README, API, Setup Guide)
- [ ] Claude Code設定ファイル
- [ ] デプロイパッケージ

### テストチェック
- [ ] MCPプロトコル統合テスト全通過
- [ ] E2Eテスト全通過 (4ツール)
- [ ] パフォーマンスベンチマーク全通過
- [ ] 受け入れ基準全達成 (REQ-001〜043)
- [ ] エッジケーステスト全通過
- [ ] Claude Code実用テスト成功

### 非機能要件チェック
- [ ] NFR-001: 起動時間1秒以内
- [ ] NFR-002: 小規模ファイル解析50ms以内
- [ ] NFR-003: 中規模ファイル解析200ms以内
- [ ] NFR-004: 10ファイル並行解析2秒以内
- [ ] NFR-005: キャッシュヒット10ms以内
- [ ] NFR-006: コンテキスト削減90%以上 (簡潔モード)
- [ ] NFR-006: コンテキスト削減70%以上 (詳細モード)
- [ ] NFR-203: E2Eテスト実装済み
- [ ] NFR-302: ドキュメント完備

### MVP受け入れ基準チェック
- [ ] 4ツール全て正常動作
- [ ] Claude Codeと統合可能
- [ ] パフォーマンス目標全達成
- [ ] エラーハンドリングが適切
- [ ] ドキュメントが完全
- [ ] デプロイ可能な状態

---

## パフォーマンス目標達成状況

| 指標 | 目標値 | 実測値 | 状態 |
|-----|-------|-------|------|
| 起動時間 | 1秒以内 | ___ ms | ⬜ |
| 小規模ファイル (100行) | 50ms以内 | ___ ms | ⬜ |
| 中規模ファイル (1000行) | 200ms以内 | ___ ms | ⬜ |
| 大規模ファイル (5000行) | 1秒以内 | ___ ms | ⬜ |
| キャッシュヒット | 10ms以内 | ___ ms | ⬜ |
| 10ファイル並行解析 | 2秒以内 | ___ ms | ⬜ |
| コンテキスト削減 (簡潔) | 90%以上 | ___% | ⬜ |
| コンテキスト削減 (詳細) | 70%以上 | ___% | ⬜ |

---

## タスク依存関係マトリックス

### Phase 4内の依存関係
```
TASK-0401 (Server初期化) → TASK-0402 (Transport) → TASK-0403 (package.json)
                ↓
TASK-0404 (ToolRegistry) → TASK-0405 (ListToolsRequest)
                ↓
TASK-0407 (ToolRouter) → TASK-0408 (CallToolRequest)
                ↓
TASK-0409 (ErrorFormatter) → TASK-0410 (SchemaValidator)
                ↓
TASK-0411 → TASK-0412 (MCP統合テスト) → TASK-0413 (Week 1完了)
                ↓
TASK-0414 (E2E基盤) → TASK-0415 (analyze_file E2E)
                ↓
TASK-0416 (search_symbol E2E) → TASK-0417 (project/dependencies E2E)
                ↓
TASK-0418 (ベンチマーク) → TASK-0419 (最適化)
                ↓
TASK-0420 (README) → TASK-0421 (Claude Code設定) → TASK-0422 (API Doc)
                ↓
TASK-0423 (Milestone 4検証) → TASK-0424 (MVP完成)
```

---

## リスク管理

### 高リスク課題

#### Claude Code統合の互換性
**リスク**: MCP SDK仕様変更による動作不良
**対策**:
- MCP SDK 1.18.1固定バージョン使用
- 公式サンプルコードとの整合性確認
- stdio transportの詳細テスト
**状態**: 🟡 対策実施中

#### E2Eテストの環境依存
**リスク**: テスト環境とClaude Code環境の差異
**対策**:
- 実際のClaude Codeでの手動テスト
- CI/CD環境での自動テスト
**状態**: 🟡 対策実施中

### 中リスク課題

#### パフォーマンス目標未達
**リスク**: NFR達成できない可能性
**対策**:
- 早期ベンチマーク実施
- ボトルネック特定と最適化
- キャッシュ戦略の調整
**状態**: 🟡 ベンチマーク実施予定

---

## 更新履歴

- **2025-12-16**: Phase 4タスクファイル作成
  - 総タスク数: 24タスク (TASK-0401 〜 TASK-0424)
  - 推定工数: 120-150時間
  - 期間: 8-10営業日
  - Week 1: MCP統合 (5日)
  - Week 2: テスト + デプロイ準備 (5日)
  - Milestone 4達成目標: MVP完成

---

**次のステップ**: TASK-0401 (MCP Server初期化) から開始

**関連文書**:
- アーキテクチャ: [architecture.md](../design/code-analysis/architecture.md)
- 要件: [requirements.md](../spec/code-analysis-requirements.md)
- 受け入れ基準: [acceptance-criteria.md](../spec/code-analysis-acceptance-criteria.md)
- 技術スタック: [tech-stack.md](../tech-stack.md)
- タスク概要: [code-analysis-overview.md](./code-analysis-overview.md)
