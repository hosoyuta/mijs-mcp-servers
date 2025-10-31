# コード解析MCP システムアーキテクチャ

## 概要

このドキュメントは、コード解析MCPサーバーのシステムアーキテクチャを定義します。本システムは、**Claude Codeのコンテキスト消費を90%削減**することを目的とした、TypeScript Compiler APIを活用した高速なコード解析システムです。

## アーキテクチャパターン

### レイヤードアーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│           Claude Code (MCP Client)                   │
└─────────────────────────────────────────────────────┘
                        ↕ stdio transport
┌─────────────────────────────────────────────────────┐
│              MCP Protocol Layer                      │
│  (Request/Response handling, Tool registry)          │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│              Tool Handler Layer                      │
│  - analyze_file        - search_symbol               │
│  - analyze_project     - get_dependencies            │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│           Analysis Orchestration Layer               │
│  - Mode selection (concise/detailed)                 │
│  - Cache management                                  │
│  - Error recovery                                    │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│             Analyzer Engine Layer                    │
│  - Structure Analyzer  - Symbol Extractor            │
│  - Type Analyzer       - Dependency Analyzer         │
│  - Documentation Extractor                           │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│        TypeScript Compiler API Layer                 │
│  (createProgram, SourceFile, TypeChecker)            │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│              File System Layer                       │
│  (Bun.file, fs/promises)                             │
└─────────────────────────────────────────────────────┘
```

## コンポーネント設計

### 1. MCP Protocol Layer

**責務**: MCPプロトコルの実装、リクエスト/レスポンスのハンドリング

**主要コンポーネント**:
- `MCPServer`: MCP Serverインスタンス
- `ToolRegistry`: 利用可能なツールの登録と管理
- `TransportHandler`: stdio transportの管理

**技術スタック**:
- `@modelcontextprotocol/sdk` 1.18.1
- `StdioServerTransport` for Claude Code integration

**実装ファイル**: `src/index.ts`

**主な機能**:
- ツール一覧の提供 (`ListToolsRequest`)
- ツール実行のルーティング (`CallToolRequest`)
- エラーハンドリングと適切なレスポンス生成

---

### 2. Tool Handler Layer

**責務**: 各MCPツールの入力バリデーション、実行、レスポンス生成

**主要コンポーネント**:

#### AnalyzeFileTool
- **入力**: `{ path: string, mode?: "concise" | "detailed", include?: string[] }`
- **出力**: `FileAnalysis` (JSON)
- **処理フロー**:
  1. パスのバリデーション (ワークスペース内チェック)
  2. キャッシュチェック
  3. Analyzer Engineへ委譲
  4. モードに応じた出力変換
  5. エラー時の部分成功ハンドリング

#### SearchSymbolTool
- **入力**: `{ symbol: string, type?: string, matchType?: string }`
- **出力**: `SymbolSearchResult[]` (JSON)
- **処理フロー**:
  1. シンボル名のバリデーション
  2. プロジェクト内のファイルをスキャン
  3. 並行解析で高速検索
  4. マッチング結果の集約

#### AnalyzeProjectTool
- **入力**: `{ rootPath: string, includePatterns?: string[], excludePatterns?: string[], mode?: string }`
- **出力**: `ProjectAnalysis` (JSON)
- **処理フロー**:
  1. パターンマッチングでファイル収集
  2. 並行解析
  3. 依存関係グラフの構築
  4. プロジェクトサマリーの生成

#### GetDependenciesTool
- **入力**: `{ path: string, depth?: number }`
- **出力**: `DependencyGraph` (JSON)
- **処理フロー**:
  1. ファイルのimport文解析
  2. 内部/外部依存の分類
  3. 再帰的に依存ファイルを追跡 (depth制限)
  4. 循環依存の検出

**実装ファイル**: `src/tools/`

---

### 3. Analysis Orchestration Layer

**責務**: 解析の統合制御、キャッシュ管理、エラーリカバリ

**主要コンポーネント**:

#### AnalysisOrchestrator
- **機能**:
  - モード選択 (concise/detailed) に応じた解析深度の調整
  - 複数のAnalyzerの協調実行
  - 部分的成功のハンドリング
  - タイムアウト管理

#### CacheManager
- **機能**:
  - ファイルのmtime (更新日時) ベースのキャッシュ管理
  - キャッシュヒット時の即座の結果返却 (10ms以内)
  - メモリ効率的なLRUキャッシュ
  - キャッシュの無効化処理

**キャッシュキー設計**:
```typescript
cacheKey = `${filePath}:${mtime.getTime()}:${mode}:${includeOptions}`
```

#### ErrorRecoveryManager
- **機能**:
  - 構文エラー時の部分解析
  - 解析失敗時のフォールバック (基本情報のみ返却)
  - エラー詳細の構造化

**実装ファイル**: `src/orchestration/`

---

### 4. Analyzer Engine Layer

**責務**: TypeScript Compiler APIを使用した実際のコード解析

**主要コンポーネント**:

#### StructureAnalyzer
- **役割**: ファイルの構造 (関数、クラス、メソッド) を抽出
- **使用API**:
  - `ts.forEachChild()` でASTをトラバース
  - `ts.isFunctionDeclaration()`, `ts.isClassDeclaration()` で識別
- **出力**: `Function[]`, `Class[]`

#### TypeAnalyzer
- **役割**: 型定義 (interface, type, enum) を抽出
- **使用API**:
  - `ts.isInterfaceDeclaration()`
  - `ts.isTypeAliasDeclaration()`
  - `ts.isEnumDeclaration()`
- **出力**: `TypeDefinition[]`, `EnumDefinition[]`

#### SymbolExtractor
- **役割**: シンボル情報の抽出 (名前、位置、型)
- **使用API**:
  - `typeChecker.getSymbolAtLocation()`
  - `symbol.getDeclarations()`
- **出力**: `Symbol[]` with location info

#### DependencyAnalyzer
- **役割**: import/export文の解析、依存関係の構築
- **使用API**:
  - `ts.isImportDeclaration()`
  - `ts.isExportDeclaration()`
  - `moduleSpecifier` の解決
- **出力**: `Import[]`, `Export[]`

#### DocumentationExtractor
- **役割**: JSDocコメントとインラインコメントの抽出
- **使用API**:
  - `ts.getJSDocCommentsAndTags()`
  - `sourceFile.getFullText()` でコメント取得
- **出力**: `Documentation` with structured JSDoc

**実装ファイル**: `src/analyzers/`

---

### 5. TypeScript Compiler API Layer

**責務**: TypeScriptコンパイラの初期化と管理

**主要コンポーネント**:

#### CompilerHost
- **機能**:
  - `ts.createProgram()` でプログラムオブジェクトを作成
  - `compilerOptions` の設定 (厳密な型チェック)
  - SourceFileのキャッシュ管理

**CompilerOptions設定**:
```typescript
const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  strict: true,
  esModuleInterop: true,
  skipLibCheck: true,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  jsx: ts.JsxEmit.React, // TSX対応
};
```

#### ProgramManager
- **機能**:
  - プログラムインスタンスの再利用
  - 増分コンパイル (変更されたファイルのみ再解析)
  - TypeCheckerの取得

**実装ファイル**: `src/compiler/`

---

### 6. File System Layer

**責務**: ファイル入出力の抽象化

**主要コンポーネント**:

#### FileReader
- **機能**:
  - `Bun.file()` を使用した高速ファイル読み込み
  - エンコーディングの自動検出
  - 大きなファイルのストリーム読み込み

#### PathResolver
- **機能**:
  - 相対パス/絶対パスの解決
  - ワークスペース内チェック
  - ファイルパターンマッチング (glob)

**実装ファイル**: `src/fs/`

---

## データフロー

### analyze_file ツールの実行フロー

```
Claude Code
    ↓ 1. analyze_file({ path: "src/index.ts", mode: "concise" })
MCP Server (Tool Handler)
    ↓ 2. Validate input & workspace check
    ↓ 3. Check cache (key: path + mtime + mode)
    ├─→ Cache Hit → Return cached result (10ms)
    └─→ Cache Miss
            ↓ 4. Read file (Bun.file)
        Analysis Orchestrator
            ↓ 5. Create TS Program
        TypeScript Compiler API
            ↓ 6. Get SourceFile & TypeChecker
        Analyzer Engine (parallel execution)
            ├─→ Structure Analyzer → Functions/Classes
            ├─→ Type Analyzer → Interfaces/Types/Enums
            ├─→ Dependency Analyzer → Imports/Exports
            └─→ Documentation Extractor → JSDoc
            ↓ 7. Collect all results
        Analysis Orchestrator
            ↓ 8. Apply mode (concise: filter, detailed: include body)
            ↓ 9. Store in cache
    ↓ 10. Format as JSON
MCP Server
    ↓ 11. Return response
Claude Code
```

---

## パフォーマンス最適化戦略

### 1. キャッシュ戦略

**3層キャッシュ設計**:

1. **SourceFileキャッシュ** (TypeScript Compiler内部)
   - `ts.createProgram()` がSourceFileをキャッシュ
   - 同じファイルの再解析を回避

2. **解析結果キャッシュ** (メモリ内LRU)
   - キー: `${path}:${mtime}:${mode}`
   - 値: `FileAnalysis` オブジェクト
   - サイズ制限: 100ファイル (約50MB)
   - TTL: ファイル更新まで無期限

3. **型情報キャッシュ** (TypeChecker結果)
   - `symbol.getType()` の結果をキャッシュ
   - 型推論の繰り返しを回避

### 2. 並行処理

**Bun の Worker Threads 活用**:
```typescript
// 複数ファイルの並行解析
const results = await Promise.all(
  files.map(file => analyzeFileAsync(file))
);
```

**最大並行数制限**:
- CPU コア数 × 2 (例: 8コアなら16並行)
- メモリ使用量監視、閾値超過時は直列実行にフォールバック

### 3. 増分解析

**実装方針** (Phase 2):
- ファイルのdiffを取得
- 変更された関数/クラスのみ再解析
- 未変更部分はキャッシュから取得

---

## エラーハンドリング戦略

### 部分的成功の実装

```typescript
interface FileAnalysis {
  success: boolean;
  partial: boolean; // 部分的成功フラグ
  data: {
    functions?: Function[];  // 解析成功した部分
    classes?: Class[];
    types?: TypeDefinition[];
    // ...
  };
  errors?: ParseError[];     // エラー詳細
  fallback?: {               // 最低限返す情報
    size: number;
    lines: number;
  };
}
```

### エラー種別と対応

| エラー種別 | 対応方法 |
|-----------|---------|
| 構文エラー | 解析可能な部分 (import, 型定義) のみ返却、エラー詳細を併記 |
| ファイル未存在 | 明確なエラーメッセージ、suggestions提供 |
| エンコーディングエラー | UTF-8以外を検出した場合、エラー通知 |
| タイムアウト | 途中結果を返却、timeout警告 |
| メモリ不足 | ストリーム処理にフォールバック |
| 循環依存 | 警告付きで結果返却、依存グラフは表示 |

---

## セキュリティ設計

### ワークスペース制限

**実装**:
```typescript
function isWithinWorkspace(filePath: string, workspace: string): boolean {
  const resolvedPath = path.resolve(filePath);
  const resolvedWorkspace = path.resolve(workspace);
  return resolvedPath.startsWith(resolvedWorkspace);
}
```

**動作**:
- Claude Codeから渡される workspace パスを信頼
- すべてのファイルアクセスで境界チェック
- ワークスペース外へのアクセスは即座にエラー

### サンドボックス実行

- ファイル読み取り専用 (書き込み不可)
- シンボリックリンクの追跡制限
- パスインジェクション対策 (正規化、検証)

---

## スケーラビリティ設計

### 大規模プロジェクト対応

**段階的解析**:
1. **初回**: プロジェクト構造のスキャン (ファイル一覧のみ)
2. **必要時**: 特定ファイルの詳細解析
3. **バックグラウンド**: 未解析ファイルを徐々にキャッシュ化

**メモリ管理**:
- 大きなファイル (10,000行以上) は簡潔モード強制
- SourceFileの解放 (使用後は参照を破棄)
- キャッシュサイズの動的調整

---

## 拡張性設計

### 新しい言語の追加 (Phase 2以降)

**抽象化インターフェース**:
```typescript
interface LanguageAnalyzer {
  supportedExtensions: string[];
  analyze(file: string, mode: AnalysisMode): FileAnalysis;
}

class TypeScriptAnalyzer implements LanguageAnalyzer {
  // TypeScript用実装
}

class MarkdownAnalyzer implements LanguageAnalyzer {
  // Markdown用実装 (将来)
}
```

### プラグインシステム (Phase 3)

- カスタムAnalyzerの登録
- ユーザー定義の解析ルール
- 出力フォーマットのカスタマイズ

---

## 技術的課題と解決策

### 課題1: TypeScript Compiler APIの起動時間

**問題**: `ts.createProgram()` の初期化が遅い (数百ms)

**解決策**:
- プログラムインスタンスの再利用
- 必要最小限の `compilerOptions`
- `skipLibCheck: true` で型定義ファイルの解析をスキップ

### 課題2: 大きなプロジェクトのメモリ消費

**問題**: 数千ファイルのプロジェクトで数GBのメモリ消費

**解決策**:
- 必要なファイルのみ解析 (オンデマンド)
- 定期的なガベージコレクション
- キャッシュのLRU方式による自動削除

### 課題3: JSDocの不完全性

**問題**: JSDocがない関数の説明生成

**解決策**:
- 関数名と型情報から説明を推測
- 例: `getUserById(id: string): User` → "Gets a user by their ID"
- シンプルなテンプレートベースの生成

---

## テスト戦略

### 単体テスト

**対象**: 各Analyzerコンポーネント

**テストケース例**:
- `StructureAnalyzer.test.ts`: 関数/クラス抽出の正確性
- `TypeAnalyzer.test.ts`: interface/type/enum抽出
- `DependencyAnalyzer.test.ts`: import/export解析
- `CacheManager.test.ts`: キャッシュの保存/取得/無効化

### 統合テスト

**対象**: Tool Handler → Analyzer Engineの統合

**テストケース例**:
- 実際のTypeScriptファイルを使用した解析
- 構文エラーのあるファイルの部分的成功
- 大規模ファイル (5000行) のパフォーマンステスト

### E2Eテスト

**対象**: MCPプロトコル全体

**テストケース例**:
- モックMCPクライアントからのツール呼び出し
- 並行リクエストの処理
- エラー時のレスポンス形式

---

## デプロイメント

### 開発環境

```bash
bun run src/index.ts
```

### 本番環境 (Claude Code統合)

**Claude Code設定** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "code-analysis": {
      "command": "bun",
      "args": ["run", "/path/to/koikoi-server-name/src/index.ts"]
    }
  }
}
```

### Docker化 (オプション)

```dockerfile
FROM oven/bun:1.3.1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "run", "src/index.ts"]
```

---

## パフォーマンス目標

| 指標 | 目標値 | 実装戦略 |
|-----|-------|---------|
| 起動時間 | 1秒以内 | プログラム遅延初期化 |
| 小規模ファイル (100行) | 50ms以内 | シンプルなAST走査 |
| 中規模ファイル (1000行) | 200ms以内 | キャッシュ活用 |
| 大規模ファイル (5000行) | 1秒以内 | 並行処理 |
| キャッシュヒット | 10ms以内 | メモリ内LRUキャッシュ |
| 10ファイル並行解析 | 2秒以内 | Workerスレッド |
| コンテキスト削減 (簡潔) | 90%以上 | シグネチャのみ出力 |
| コンテキスト削減 (詳細) | 70%以上 | 重要部分のみ出力 |

---

## まとめ

本システムは、**レイヤードアーキテクチャ**と**TypeScript Compiler API**を活用し、Claude Codeのコンテキスト効率を大幅に改善します。

**主要な設計原則**:
1. **関心の分離**: 各レイヤーが明確な責務を持つ
2. **パフォーマンス最適化**: 3層キャッシュ + 並行処理
3. **堅牢なエラーハンドリング**: 部分的成功の実装
4. **拡張性**: 新しい言語やAnalyzerの追加が容易
5. **型安全性**: TypeScript strict モードの活用

**次のステップ**:
- データフロー図の詳細化 → `dataflow.md`
- TypeScriptインターフェース定義 → `interfaces.ts`
- キャッシュ設計の詳細 → `cache-design.md`
- API仕様の詳細 → `api-specification.md`

---

**作成日**: 2025-10-29
**対応要件**: REQ-001〜REQ-405, NFR-001〜NFR-403
**関連文書**: [requirements](../../spec/code-analysis-requirements.md), [tech-stack](../../tech-stack.md)
