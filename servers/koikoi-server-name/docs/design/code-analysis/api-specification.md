# コード解析MCP API仕様書

## 概要

このドキュメントは、コード解析MCPサーバーが提供する4つのMCPツールの詳細なAPI仕様を定義します。各ツールの入力パラメータ、出力形式、エラーハンドリング、使用例を記載します。

---

## 共通仕様

### エラーレスポンス形式

すべてのツールは、エラー発生時に以下の形式でエラーを返します:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "file": "path/to/file.ts",
      "reason": "Specific reason for the error"
    }
  }
}
```

### 部分的成功のレスポンス

解析中に一部エラーが発生した場合、部分的な成功として結果を返します:

```json
{
  "success": false,
  "partial": true,
  "data": {
    "functions": [...],
    "classes": [...]
  },
  "errors": [
    {
      "code": "PARSE_ERROR",
      "message": "Syntax error in function",
      "severity": "error",
      "location": {...}
    }
  ],
  "fallback": {
    "size": 5432,
    "lines": 120
  }
}
```

---

## 1. analyze_file ツール

### 説明

単一のTypeScript/JavaScriptファイルを解析し、構造化された情報を返します。

### 入力パラメータ

```typescript
{
  path: string;                     // 必須: ファイルパス
  mode?: "concise" | "detailed";    // オプション: 解析モード (デフォルト: "concise")
  include?: string[];               // オプション: 含める情報 (デフォルト: すべて)
}
```

**パラメータ詳細**:

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| `path` | string | ✓ | - | 解析対象ファイルの絶対パスまたはワークスペースからの相対パス |
| `mode` | "concise" \| "detailed" | - | "concise" | 簡潔モード（シグネチャのみ）または詳細モード（実装の一部含む） |
| `include` | string[] | - | すべて | 含める情報の種類: "structure", "types", "docs", "dependencies" |

**include オプションの値**:
- `"structure"`: 関数とクラスの構造
- `"types"`: 型定義 (interface, type, enum)
- `"docs"`: JSDocドキュメント
- `"dependencies"`: import/export文

**例**:
```typescript
// 簡潔モードですべて含む（デフォルト）
{
  "path": "src/index.ts"
}

// 詳細モードで型定義のみ
{
  "path": "src/types/User.ts",
  "mode": "detailed",
  "include": ["types"]
}
```

### 出力形式

```typescript
{
  success: boolean;                 // 解析が成功したか
  partial: boolean;                 // 部分的な成功か
  file: {
    path: string;
    size: number;
    lines: number;
  };
  summary: string;                  // ファイルの要約（1-2文）
  exports: Export[];                // エクスポートされた関数/クラス
  imports: Import[];                // import文の一覧
  functions: Function[];            // 関数一覧
  classes: Class[];                 // クラス一覧
  types: TypeDefinition[];          // 型定義一覧
  enums: EnumDefinition[];          // enum定義一覧
  errors?: ParseError[];            // エラー（あれば）
  fallback?: {                      // フォールバック情報
    size: number;
    lines: number;
  };
}
```

### 出力例

**簡潔モード**:
```json
{
  "success": true,
  "partial": false,
  "file": {
    "path": "src/services/UserService.ts",
    "size": 5432,
    "lines": 120
  },
  "summary": "User service that handles user authentication and management operations",
  "exports": [
    {
      "name": "UserService",
      "type": "class",
      "default": false,
      "reExport": false
    }
  ],
  "imports": [
    {
      "source": "./types/User",
      "type": "internal",
      "imported": [{ "name": "User" }],
      "default": false,
      "namespace": false,
      "typeOnly": false,
      "dynamic": false
    }
  ],
  "functions": [
    {
      "name": "validateUser",
      "exported": false,
      "async": false,
      "generator": false,
      "parameters": [
        {
          "name": "user",
          "type": "User",
          "optional": false,
          "rest": false
        }
      ],
      "returnType": "boolean",
      "location": {
        "file": "src/services/UserService.ts",
        "start": { "line": 10, "column": 1 },
        "end": { "line": 15, "column": 2 }
      }
    }
  ],
  "classes": [
    {
      "name": "UserService",
      "exported": true,
      "abstract": false,
      "extends": null,
      "implements": [],
      "methods": [
        {
          "name": "getUser",
          "accessModifier": "public",
          "static": false,
          "abstract": false,
          "async": true,
          "parameters": [
            {
              "name": "id",
              "type": "string",
              "optional": false,
              "rest": false
            }
          ],
          "returnType": "Promise<User | null>",
          "location": {
            "file": "src/services/UserService.ts",
            "start": { "line": 20, "column": 3 },
            "end": { "line": 25, "column": 4 }
          }
        }
      ]
    }
  ],
  "types": [],
  "enums": []
}
```

### パフォーマンス

| ファイルサイズ | 目標時間 | キャッシュヒット時 |
|--------------|----------|------------------|
| 100行以下 | 50ms | 10ms |
| 1000行以下 | 200ms | 10ms |
| 5000行以下 | 1000ms | 10ms |

### エラーコード

| コード | 説明 | 対応 |
|-------|------|------|
| `FILE_NOT_FOUND` | ファイルが存在しない | ファイルパスを確認 |
| `OUTSIDE_WORKSPACE` | ワークスペース外のファイル | ワークスペース内のファイルのみ指定 |
| `PARSE_ERROR` | 構文エラー | 部分的な結果を返却 |
| `ENCODING_ERROR` | 文字エンコーディングエラー | UTF-8ファイルのみ対応 |
| `TIMEOUT` | タイムアウト | ファイルが大きすぎる場合、簡潔モードを使用 |

---

## 2. search_symbol ツール

### 説明

プロジェクト内で指定されたシンボル（関数名、クラス名、変数名）を検索し、定義位置を返します。

### 入力パラメータ

```typescript
{
  symbol: string;                                         // 必須: 検索するシンボル名
  type?: "function" | "class" | "type" | "variable" | "all";  // オプション: シンボルの種類
  matchType?: "exact" | "prefix" | "suffix" | "contains";     // オプション: マッチング方法
}
```

**パラメータ詳細**:

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| `symbol` | string | ✓ | - | 検索するシンボル名 |
| `type` | string | - | "all" | シンボルの種類でフィルタ |
| `matchType` | string | - | "exact" | マッチング方法 |

**matchType の動作**:
- `"exact"`: 完全一致（例: "User" → "User" のみ）
- `"prefix"`: 前方一致（例: "User" → "UserService", "UserRepository"）
- `"suffix"`: 後方一致（例: "Service" → "UserService", "AuthService"）
- `"contains"`: 部分一致（例: "User" → "UserService", "getCurrentUser"）

### 出力形式

```typescript
{
  results: Array<{
    symbol: string;             // シンボル名
    type: string;               // シンボルの種類
    file: string;               // ファイルパス
    line: number;               // 行番号
    column: number;             // 列番号
    signature?: string;         // シグネチャ（関数/メソッドの場合）
    exported?: boolean;         // エクスポートされているか
    context?: string;           // コンテキスト（前後数行）
  }>;
  searchTime: number;           // 検索にかかった時間 (ms)
  filesScanned: number;         // 検索対象ファイル数
}
```

### 出力例

```json
{
  "results": [
    {
      "symbol": "UserService",
      "type": "class",
      "file": "src/services/UserService.ts",
      "line": 5,
      "column": 14,
      "exported": true,
      "context": "export class UserService {\n  private users: User[] = [];\n"
    },
    {
      "symbol": "getUserById",
      "type": "function",
      "file": "src/utils/userHelper.ts",
      "line": 12,
      "column": 17,
      "signature": "getUserById(id: string): User | undefined",
      "exported": true
    },
    {
      "symbol": "User",
      "type": "interface",
      "file": "src/types/User.ts",
      "line": 1,
      "column": 18,
      "exported": true
    }
  ],
  "searchTime": 150,
  "filesScanned": 45
}
```

### パフォーマンス

| プロジェクトサイズ | 目標時間 |
|------------------|----------|
| 100ファイル以下 | 1秒以内 |
| 500ファイル以下 | 3秒以内 |
| 1000ファイル以下 | 5秒以内 |

### エラーコード

| コード | 説明 |
|-------|------|
| `INVALID_SYMBOL` | シンボル名が空または無効 |
| `NO_RESULTS` | 検索結果が見つからない（エラーではなく空の結果） |
| `TIMEOUT` | 検索タイムアウト |

---

## 3. analyze_project ツール

### 説明

プロジェクト全体を解析し、構造、依存関係、統計情報を返します。

### 入力パラメータ

```typescript
{
  rootPath: string;               // 必須: プロジェクトルートパス
  includePatterns?: string[];     // オプション: 含めるファイルパターン
  excludePatterns?: string[];     // オプション: 除外するパターン
  mode?: "concise" | "detailed";  // オプション: 解析モード
}
```

**パラメータ詳細**:

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| `rootPath` | string | ✓ | - | プロジェクトのルートディレクトリ |
| `includePatterns` | string[] | - | `["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]` | 含めるファイルパターン（glob形式） |
| `excludePatterns` | string[] | - | `["node_modules/**", "dist/**", "build/**"]` | 除外するパターン（glob形式） |
| `mode` | string | - | "concise" | 各ファイルの解析モード |

### 出力形式

```typescript
{
  project: {
    rootPath: string;
    totalFiles: number;
    totalLines: number;
    analyzedAt: number;           // Unix timestamp
  };
  summary: string;                // プロジェクト全体の要約
  structure: FileNode[];          // ディレクトリ構造
  dependencies: {
    external: string[];           // 外部ライブラリ
    internal: string[];           // 内部モジュール
  };
  exports: Record<string, Export[]>;  // ファイル別のエクスポート一覧
  statistics: {
    totalFunctions: number;
    totalClasses: number;
    totalInterfaces: number;
    totalTypes: number;
    totalEnums: number;
    filesByLanguage: Record<string, number>;
    averageFileSize: number;
    averageLines: number;
  };
}
```

### 出力例

```json
{
  "project": {
    "rootPath": "/workspace/my-project",
    "totalFiles": 120,
    "totalLines": 15000,
    "analyzedAt": 1730188800000
  },
  "summary": "A TypeScript MCP server project with 120 files, featuring user authentication, data management, and API integration",
  "structure": [
    {
      "name": "src",
      "path": "src",
      "type": "directory",
      "children": [
        {
          "name": "index.ts",
          "path": "src/index.ts",
          "type": "file",
          "size": 5432,
          "lines": 120
        },
        {
          "name": "services",
          "path": "src/services",
          "type": "directory",
          "children": [...]
        }
      ]
    }
  ],
  "dependencies": {
    "external": [
      "@modelcontextprotocol/sdk",
      "typescript",
      "react"
    ],
    "internal": [
      "./types/User",
      "./utils/helpers",
      "./services/AuthService"
    ]
  },
  "exports": {
    "src/index.ts": [
      {
        "name": "startServer",
        "type": "function",
        "default": false
      }
    ],
    "src/services/UserService.ts": [
      {
        "name": "UserService",
        "type": "class",
        "default": false
      }
    ]
  },
  "statistics": {
    "totalFunctions": 250,
    "totalClasses": 35,
    "totalInterfaces": 50,
    "totalTypes": 30,
    "totalEnums": 10,
    "filesByLanguage": {
      "typescript": 100,
      "javascript": 15,
      "tsx": 5
    },
    "averageFileSize": 4500,
    "averageLines": 125
  }
}
```

### パフォーマンス

| プロジェクトサイズ | 目標時間 | キャッシュヒット時 |
|------------------|----------|------------------|
| 100ファイル以下 | 5秒以内 | 1秒以内 |
| 500ファイル以下 | 15秒以内 | 3秒以内 |
| 1000ファイル以下 | 30秒以内 | 5秒以内 |

### エラーコード

| コード | 説明 |
|-------|------|
| `INVALID_ROOT_PATH` | ルートパスが無効 |
| `NO_FILES_FOUND` | 指定されたパターンに一致するファイルが見つからない |
| `PARTIAL_ANALYSIS` | 一部のファイルの解析に失敗（部分的な結果を返却） |

---

## 4. get_dependencies ツール

### 説明

指定されたファイルの依存関係を解析し、依存グラフを返します。

### 入力パラメータ

```typescript
{
  path: string;     // 必須: ファイルパス
  depth?: number;   // オプション: 依存関係の深さ (デフォルト: 1)
}
```

**パラメータ詳細**:

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| `path` | string | ✓ | - | 解析対象ファイルのパス |
| `depth` | number | - | 1 | 依存関係をたどる深さ（1 = 直接の依存のみ、2 = 依存の依存まで） |

**depth の動作**:
- `depth: 1`: ファイルが直接インポートしているファイルのみ
- `depth: 2`: 依存ファイルが更にインポートしているファイルも含む
- `depth: 0`: 無制限（循環依存の検出あり）

### 出力形式

```typescript
{
  file: string;
  imports: Array<{
    source: string;
    type: "external" | "internal";
    imported: string[];
    resolvedPath?: string;
    dependencies?: DependencyNode[];  // depth > 1 の場合
  }>;
  dependents?: string[];              // このファイルに依存しているファイル（逆引き）
  circularDependencies?: Array<{
    cycle: string[];
    message: string;
  }>;
  depth: number;
}
```

### 出力例

```json
{
  "file": "src/services/UserService.ts",
  "imports": [
    {
      "source": "react",
      "type": "external",
      "imported": ["useState", "useEffect"]
    },
    {
      "source": "./types/User",
      "type": "internal",
      "imported": ["User", "UserRole"],
      "resolvedPath": "src/types/User.ts",
      "dependencies": [
        {
          "source": "./enums/Role",
          "type": "internal",
          "imported": ["Role"],
          "resolvedPath": "src/enums/Role.ts"
        }
      ]
    },
    {
      "source": "./utils/validator",
      "type": "internal",
      "imported": ["validateUser"],
      "resolvedPath": "src/utils/validator.ts"
    }
  ],
  "dependents": [
    "src/controllers/UserController.ts",
    "src/api/userRoutes.ts"
  ],
  "circularDependencies": [],
  "depth": 2
}
```

**循環依存が検出された場合**:
```json
{
  "file": "src/services/A.ts",
  "imports": [...],
  "circularDependencies": [
    {
      "cycle": [
        "src/services/A.ts",
        "src/services/B.ts",
        "src/services/C.ts",
        "src/services/A.ts"
      ],
      "message": "Circular dependency detected: A -> B -> C -> A"
    }
  ],
  "depth": 3
}
```

### パフォーマンス

| 条件 | 目標時間 |
|------|----------|
| depth: 1 | 100ms以内 |
| depth: 2 | 500ms以内 |
| depth: 3以上 | 2秒以内 |

### エラーコード

| コード | 説明 |
|-------|------|
| `FILE_NOT_FOUND` | ファイルが存在しない |
| `CIRCULAR_DEPENDENCY` | 循環依存を検出（警告として含まれる） |
| `DEPTH_LIMIT_EXCEEDED` | 深さの制限を超えた |

---

## 使用例

### Claude Code からの呼び出し例

#### 例1: ファイルの構造を簡潔に把握

```typescript
// Claude Code からの質問:
// "src/services/UserService.ts の構造を教えて"

// MCPツール呼び出し:
analyze_file({
  path: "src/services/UserService.ts",
  mode: "concise"
})

// レスポンス: 関数とクラスのシグネチャのみ（90%削減）
```

#### 例2: 特定の関数を探す

```typescript
// Claude Code からの質問:
// "getUserById 関数はどこで定義されている?"

// MCPツール呼び出し:
search_symbol({
  symbol: "getUserById",
  type: "function",
  matchType: "exact"
})

// レスポンス: 定義位置とシグネチャ
```

#### 例3: プロジェクト全体の把握

```typescript
// Claude Code からの質問:
// "このプロジェクトの構造を教えて"

// MCPツール呼び出し:
analyze_project({
  rootPath: "/workspace/my-project",
  mode: "concise"
})

// レスポンス: プロジェクトサマリーと統計情報
```

#### 例4: 依存関係の確認

```typescript
// Claude Code からの質問:
// "src/services/UserService.ts の依存関係を教えて"

// MCPツール呼び出し:
get_dependencies({
  path: "src/services/UserService.ts",
  depth: 2
})

// レスポンス: 依存グラフ（2階層）
```

---

## まとめ

本API仕様により、Claude Code は効率的にコードベースを理解できます:

1. **analyze_file**: ファイルの詳細な構造を取得
2. **search_symbol**: シンボルの定義位置を瞬時に検索
3. **analyze_project**: プロジェクト全体の構造を把握
4. **get_dependencies**: 依存関係を可視化

すべてのツールが**構造化されたJSON**を返し、**部分的成功**をサポートし、**高速なレスポンス**（キャッシュヒット時10ms）を実現します。

---

**作成日**: 2025-10-29
**対応要件**: REQ-001〜REQ-405
**関連文書**: [architecture](./architecture.md), [interfaces](./interfaces.ts)
