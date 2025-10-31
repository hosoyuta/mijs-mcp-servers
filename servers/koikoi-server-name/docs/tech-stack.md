# プロジェクト技術スタック定義

## 🔧 生成情報
- **生成日**: 2025-10-29
- **生成ツール**: /tsumiki:init-tech-stack
- **プロジェクトタイプ**: MCPサーバー (Model Context Protocol Server)
- **チーム規模**: 個人開発
- **開発期間**: プロトタイプ/MVP（1-2ヶ月）

## 🎯 プロジェクト要件サマリー
- **実装言語**: TypeScript/Node.js
- **主な機能**: ツール提供（ファイル操作）
- **テストレベル**: 基本的なテスト（主要機能の単体テスト）
- **パッケージマネージャ**: Bun 1.3.1
- **開発スタイル**: TypeScript strictモード、型安全性重視

## 🚀 コア技術

### MCP SDK
- **パッケージ**: `@modelcontextprotocol/sdk`
- **バージョン**: 1.18.1 (最新安定版)
- **役割**: Model Context Protocol の実装
- **主要機能**:
  - ツール（Tools）の定義と提供
  - リソース（Resources）の管理
  - プロンプト（Prompts）テンプレート
  - stdio / HTTP transport 対応

### 選択理由
- Anthropic公式SDK、最新の仕様に準拠
- TypeScript完全対応、型定義が充実
- 豊富な公式ドキュメントとサンプル
- 活発なコミュニティ（npm上で12,698プロジェクトが利用）

### 使用例
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "koikoi-server-name",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
```

## ⚙️ ランタイム・言語

### TypeScript
- **バージョン**: 5.9.3 (最新安定版)
- **設定**: strict モード有効

#### tsconfig.json 推奨設定
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 選択理由
- TypeScript 5.9の新機能（deferred imports）で起動時間改善
- strict モードで型安全性を最大化、バグを早期発見
- 優れた開発体験とIntelliSense
- MCPサーバー開発に最適な型推論

### Bun
- **バージョン**: 1.3.1
- **役割**: JavaScriptランタイム＆パッケージマネージャ

### 選択理由
- **超高速**: npmの10倍以上高速なパッケージインストール
- **ビルトインTypeScript**: tscなしでTypeScriptを直接実行
- **組み込みテストランナー**: `bun test` でJest互換のテスト実行
- **Node.js互換**: Node.js APIとの高い互換性
- **オールインワン**: ランタイム、パッケージマネージャ、バンドラー、テストランナーを統合

### 注意点
- 本番環境で問題がある場合はNode.js 20 LTSにフォールバック可能
- 一部のnpmパッケージで互換性問題の可能性（稀）

## 💾 ファイル操作

### Bun標準API
- **メインAPI**: `Bun.file`
- **役割**: 高速なファイル読み書き

### 選択理由
- Bunのネイティブファイル操作は超高速
- 同期/非同期両対応
- ストリーミング対応
- `fs`よりシンプルなAPI

### 使用例
```typescript
// ファイル読み込み
const file = Bun.file("./example.txt");
const text = await file.text();

// ファイル書き込み
await Bun.write("./output.txt", "Hello World");

// ストリーミング
const stream = file.stream();
```

### フォールバック: Node.js fs/promises
本番環境でBunが使えない場合:
```typescript
import { readFile, writeFile } from "fs/promises";
```

### パターンマッチング（オプション）
- **パッケージ**: `glob` または `globby`
- **用途**: 複数ファイルの一括操作
- **インストール**: `bun add glob`

## 🧪 テスト・品質管理

### Bun Test（組み込み）
- **コマンド**: `bun test`
- **API**: Jest互換

### 選択理由
- Bun標準のテストランナー、別途インストール不要
- Jest互換のAPI（`describe`, `test`, `expect`）
- 超高速実行
- TypeScriptネイティブサポート

### テストファイル例
```typescript
// tests/tools/fileOperations.test.ts
import { describe, test, expect } from "bun:test";
import { readFileContent } from "../../src/tools/fileOperations";

describe("File Operations", () => {
  test("should read file successfully", async () => {
    const content = await readFileContent("./test-data/sample.txt");
    expect(content).toBeDefined();
    expect(typeof content).toBe("string");
  });

  test("should handle non-existent file", async () => {
    await expect(readFileContent("./nonexistent.txt")).rejects.toThrow();
  });
});
```

### テスト方針（基本レベル）
- **カバレッジ目標**: 主要機能の単体テスト
- **テスト対象**:
  - ファイル操作ツールの正常系・異常系
  - バリデーション関数
  - エラーハンドリング

### ESLint + Prettier（任意）
プロトタイプ段階では必須ではないが、コード品質向上のため推奨:

```bash
bun add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier
```

## 🛠️ 開発ツール

### TypeScript実行
- **Bun推奨**: `bun run src/index.ts`（コンパイル不要）
- **Node.js用**: `tsx` または `ts-node`

### スクリプト（package.json）
```json
{
  "scripts": {
    "dev": "bun run src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist --target node",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

## 📁 推奨ディレクトリ構造

```
koikoi-server-name/
├── src/
│   ├── index.ts              # MCPサーバーエントリーポイント
│   ├── tools/                # ツール実装
│   │   ├── fileOperations.ts # ファイル操作ツール
│   │   └── index.ts          # ツール集約・エクスポート
│   ├── types/                # 型定義
│   │   ├── tool.ts           # ツール関連の型
│   │   └── index.ts          # 型集約
│   ├── utils/                # ユーティリティ
│   │   ├── validation.ts     # 入力バリデーション
│   │   └── error.ts          # エラーハンドリング
│   └── config/               # 設定
│       └── server.ts         # サーバー設定
├── tests/                    # テストファイル
│   ├── tools/
│   │   └── fileOperations.test.ts
│   └── utils/
│       └── validation.test.ts
├── docs/                     # ドキュメント
│   ├── tech-stack.md         # 本ファイル
│   └── README.md             # プロジェクト概要
├── dist/                     # ビルド成果物（.gitignore対象）
├── node_modules/             # 依存パッケージ（.gitignore対象）
├── package.json              # プロジェクト設定
├── tsconfig.json             # TypeScript設定
├── .eslintrc.json            # ESLint設定（任意）
├── .prettierrc               # Prettier設定（任意）
├── .gitignore                # Git除外設定
└── README.md                 # メインドキュメント
```

## 🚀 セットアップ手順

### 1. プロジェクト初期化
```bash
# Bunがインストールされていない場合
curl -fsSL https://bun.sh/install | bash

# プロジェクト初期化
bun init
```

### 2. 依存パッケージインストール
```bash
# MCP SDK
bun add @modelcontextprotocol/sdk

# 型定義（必要に応じて）
bun add -D @types/node

# テスト・品質管理（任意）
bun add -D eslint prettier
```

### 3. 基本的なMCPサーバー実装
`src/index.ts` を作成し、最小限のMCPサーバーを実装:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "koikoi-server-name",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧を返す
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_file",
        description: "Read the contents of a file",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the file to read",
            },
          },
          required: ["path"],
        },
      },
    ],
  };
});

// ツール実行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "read_file") {
    const file = Bun.file(args.path as string);
    const content = await file.text();
    return {
      content: [
        {
          type: "text",
          text: content,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch(console.error);
```

### 4. 実行
```bash
bun run src/index.ts
```

## 📊 品質基準（プロトタイプ版）

### コード品質
- **TypeScript**: strict モード必須
- **型安全性**: any型の使用を最小限に
- **エラーハンドリング**: 適切なtry-catch、エラーメッセージ

### テスト
- **カバレッジ**: 主要機能のテストを作成
- **テスト実行**: `bun test` でエラーなく完了
- **継続的改善**: バグ発見時にテストケース追加

### パフォーマンス
- **起動時間**: 1秒以内
- **ファイル読み込み**: 大きなファイルでもメモリ効率的に処理
- **レスポンス**: ツール実行は適切なタイムアウト設定

## 🔄 今後の拡張方針

### Phase 2（機能拡張時）
- より多くのファイル操作ツール追加
- バリデーション強化
- エラーハンドリングの洗練
- ロギング機能

### Phase 3（本番化時）
- E2Eテストの追加（Vitest等）
- パフォーマンス最適化
- ドキュメント充実
- CI/CD導入（GitHub Actions等）

### 代替技術の検討ポイント
- **Bunで問題が発生した場合**: Node.js 20 LTS + npm/pnpm
- **テストをより充実させたい場合**: Vitest（高機能なテストフレームワーク）
- **本番デプロイ**: Docker化して安定したランタイムで実行

## 📝 カスタマイズ方法

このファイルはプロジェクトの進行に応じて更新してください：

1. **技術の追加**: 新しいライブラリ・ツールを追加した際に記録
2. **バージョン更新**: 依存パッケージの更新時にバージョン番号を更新
3. **方針変更**: テスト戦略や開発方針の変更を反映
4. **学び**: 開発中に得た知見や注意点を追記

## 🔗 参考リンク

### 公式ドキュメント
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### チュートリアル
- [How to build MCP servers with TypeScript SDK](https://dev.to/shadid12/how-to-build-mcp-servers-with-typescript-sdk-1c28)
- [Writing an MCP Server with Typescript](https://medium.com/@dogukanakkaya/writing-an-mcp-server-with-typescript-b1caf1b2caf1)

## 🔄 更新履歴
- **2025-10-29**: 初回生成 (/tsumiki:init-tech-stack により自動生成)
  - プロジェクトタイプ: MCPサーバー（ファイル操作ツール提供）
  - コア技術: MCP SDK 1.18.1, TypeScript 5.9.3, Bun 1.3.1
  - 開発方針: 個人開発、プロトタイプ、型安全性重視
