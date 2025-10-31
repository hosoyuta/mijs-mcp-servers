# コード解析MCP 設計ドキュメント

## 概要

このディレクトリには、コード解析MCPサーバーの詳細な設計ドキュメントが含まれています。本サーバーは**Claude Codeのコンテキスト消費を90%削減**することを目的とした、TypeScript Compiler APIを活用した高速なコード解析システムです。

## ドキュメント一覧

### 1. [システムアーキテクチャ](./architecture.md)

**内容**:
- レイヤードアーキテクチャの全体像
- 6層のコンポーネント設計
- データフローと処理フロー
- パフォーマンス最適化戦略
- エラーハンドリング戦略
- スケーラビリティ設計

**対象読者**: システムアーキテクト、開発リーダー、実装担当者

**重要なポイント**:
- MCP Protocol Layer → Tool Handler → Orchestration → Analyzer Engine → TypeScript Compiler API → File System の6層構造
- 3層キャッシュ（解析結果、SourceFile、ファイルシステム）
- 並行処理による高速化
- 部分的成功の実装

---

### 2. [データフロー図](./dataflow.md)

**内容**:
- 4つのMCPツールのデータフロー（Mermaid図）
- キャッシュヒット/ミスのフロー
- エラーリカバリのフロー
- 並行処理のフロー
- シンボル検索のフロー
- プロジェクト全体解析のフロー
- 依存関係解析のフロー

**対象読者**: 開発者、テスター、システム設計者

**重要なポイント**:
- 各ツールの詳細なシーケンス図
- キャッシュヒット時は10ms以内で返却
- 部分的エラー時の継続処理
- 循環依存の検出と警告

---

### 3. [TypeScriptインターフェース定義](./interfaces.ts)

**内容**:
- すべてのデータ構造の型定義
- 80以上のインターフェース定義
- ツール入力/出力の型定義
- キャッシュエントリの型定義

**対象読者**: 実装担当者、TypeScript開発者

**重要なポイント**:
- `FileAnalysis`: ファイル解析結果の型
- `Function`, `Class`, `TypeDefinition`: 構造情報の型
- `Import`, `Export`: 依存関係の型
- `SymbolSearchResult`, `ProjectAnalysis`, `DependencyGraph`: ツール出力の型
- strict モード対応の完全な型定義

**使用方法**:
```typescript
// 実装時は src/types/ にコピーして使用
import type { FileAnalysis, Function, Class } from "./types/analysis";
```

---

### 4. [キャッシュ設計](./cache-design.md)

**内容**:
- 3層キャッシュアーキテクチャ
- LRUアルゴリズムの実装
- キャッシュキーの生成ロジック
- エビクション戦略
- キャッシュ監視とデバッグ
- 増分解析の将来実装

**対象読者**: パフォーマンスチューニング担当者、実装担当者

**重要なポイント**:
- Layer 1: 解析結果キャッシュ（メモリ内LRU）
- Layer 2: SourceFileキャッシュ（TypeScript Compiler内部）
- Layer 3: ファイルシステムキャッシュ（OS）
- キャッシュヒット時10ms以内の目標
- `path:mtime:mode:include` によるキー生成
- 最大100エントリ、50MBのデフォルト設定

**主要なクラス**:
```typescript
class CacheManager {
  get(key: string): FileAnalysis | null;
  set(key: string, data: FileAnalysis, meta: FileMeta): void;
  clearFile(path: string): void;
  getStats(): CacheStats;
}
```

---

### 5. [API仕様書](./api-specification.md)

**内容**:
- 4つのMCPツールの詳細仕様
- 入力パラメータの定義
- 出力形式の定義
- エラーコードと対応方法
- 使用例とサンプルレスポンス

**対象読者**: API利用者、Claude Code統合担当者、テスター

**重要なポイント**:
- `analyze_file`: 単一ファイルの解析
- `search_symbol`: シンボル検索
- `analyze_project`: プロジェクト全体の解析
- `get_dependencies`: 依存関係の解析
- 部分的成功のレスポンス形式
- 共通エラーレスポンス形式

**ツール一覧**:

| ツール | 用途 | パフォーマンス目標 |
|-------|------|------------------|
| analyze_file | ファイルの構造解析 | 50-200ms（キャッシュヒット: 10ms） |
| search_symbol | シンボル検索 | 1-5秒 |
| analyze_project | プロジェクト解析 | 5-30秒 |
| get_dependencies | 依存関係解析 | 100-500ms |

---

## 設計の主要な特徴

### 1. レイヤードアーキテクチャ

6層のレイヤードアーキテクチャにより、各コンポーネントが明確な責務を持ちます:

```
MCP Protocol Layer
    ↓
Tool Handler Layer
    ↓
Analysis Orchestration Layer
    ↓
Analyzer Engine Layer
    ↓
TypeScript Compiler API Layer
    ↓
File System Layer
```

**メリット**:
- 関心の分離
- テストの容易性
- 拡張性の確保

---

### 2. パフォーマンス最適化

#### 3層キャッシュ

| レイヤー | 内容 | キャッシュヒット時 |
|---------|------|------------------|
| Layer 1 | 解析結果（FileAnalysis） | 10ms以内 |
| Layer 2 | SourceFile（TypeScript Compiler） | 自動管理 |
| Layer 3 | ファイル（OS） | 自動管理 |

#### 並行処理

- CPU コア数 × 2 の並行実行
- 複数ファイルの同時解析
- 10ファイルを2秒以内に解析

---

### 3. コンテキスト効率

| モード | 出力サイズ | 削減率 |
|-------|-----------|--------|
| 簡潔モード | 元の10%以下 | 90%削減 |
| 詳細モード | 元の30%以下 | 70%削減 |

**簡潔モード**: シグネチャのみ
**詳細モード**: 実装の一部、詳細なコメント含む

---

### 4. 堅牢なエラーハンドリング

#### 部分的成功の実装

構文エラーがあっても、解析可能な部分のみを返します:

```typescript
{
  success: false,
  partial: true,
  data: {
    imports: [...],      // 成功
    types: [...],        // 成功
    functions: []        // 失敗
  },
  errors: [...],
  fallback: {
    size: 5432,
    lines: 120
  }
}
```

#### エラー種別と対応

| エラー | 対応 |
|-------|------|
| 構文エラー | 部分的な結果を返却 |
| ファイル未存在 | エラーメッセージ |
| エンコーディングエラー | エラー通知 |
| タイムアウト | 途中結果を返却 |
| 循環依存 | 警告付きで結果返却 |

---

## 技術スタック

### コア技術

- **MCP SDK**: 1.18.1
- **TypeScript**: 5.9.3 (strict mode)
- **Bun**: 1.3.1
- **TypeScript Compiler API**: コード解析の中核

### 主要ライブラリ

- `@modelcontextprotocol/sdk`: MCPプロトコル実装
- `typescript`: TypeScript Compiler API
- `glob`: ファイルパターンマッチング

---

## パフォーマンス目標

| 指標 | 目標値 |
|-----|-------|
| 起動時間 | 1秒以内 |
| 小規模ファイル (100行) | 50ms以内 |
| 中規模ファイル (1000行) | 200ms以内 |
| 大規模ファイル (5000行) | 1秒以内 |
| キャッシュヒット | 10ms以内 |
| 10ファイル並行解析 | 2秒以内 |
| コンテキスト削減（簡潔） | 90%以上 |
| コンテキスト削減（詳細） | 70%以上 |

---

## 実装フェーズ

### Phase 1: MVP (1-2ヶ月)

**必須機能**:
- ✅ コード構造解析（関数、クラス）
- ✅ シンボル検索
- ✅ 依存関係解析
- ✅ ファイルサマリー
- ✅ 型情報抽出
- ✅ ドキュメント抽出
- ✅ 簡潔/詳細モード
- ✅ エラーハンドリング
- ✅ キャッシュ機能
- ✅ 基本的なテスト

### Phase 2: 機能拡張 (2-3ヶ月目)

**追加機能**:
- 増分解析
- 並行処理の深化
- Markdown/JSON/HTML解析
- 統合テスト
- パフォーマンスチューニング

### Phase 3: 本番化 (3ヶ月目以降)

**本番対応**:
- E2Eテスト
- ドキュメント充実
- CI/CD導入
- モニタリング

---

## テスト戦略

### 単体テスト

**対象**: 各Analyzerコンポーネント

```bash
bun test src/analyzers/*.test.ts
```

### 統合テスト

**対象**: Tool Handler → Analyzer Engine

```bash
bun test src/tools/*.test.ts
```

### E2Eテスト

**対象**: MCPプロトコル全体

```bash
bun test tests/e2e/*.test.ts
```

---

## セキュリティ

### ワークスペース制限

- Claude Code から提供される workspace パスを信頼
- すべてのファイルアクセスでワークスペース境界をチェック
- ワークスペース外へのアクセスは即座にエラー

### サンドボックス実行

- ファイル読み取り専用（書き込み不可）
- シンボリックリンクの追跡制限
- パスインジェクション対策

---

## 拡張性

### 新しい言語の追加 (Phase 2以降)

```typescript
interface LanguageAnalyzer {
  supportedExtensions: string[];
  analyze(file: string, mode: AnalysisMode): FileAnalysis;
}

// TypeScript用
class TypeScriptAnalyzer implements LanguageAnalyzer { }

// 将来: Markdown, JSON, HTML, CSS
class MarkdownAnalyzer implements LanguageAnalyzer { }
```

---

## 次のステップ

設計フェーズが完了しました。次は実装フェーズに進みます:

1. **ディレクトリ構造の作成** (`src/`, `tests/`)
2. **TypeScript設定** (`tsconfig.json`)
3. **MCP Serverの基本実装** (`src/index.ts`)
4. **Analyzerの実装** (`src/analyzers/`)
5. **キャッシュの実装** (`src/cache/`)
6. **テストの作成** (`tests/`)

### 実装の推奨順序

1. File System Layer → TypeScript Compiler API Layer
2. Analyzer Engine Layer (Structure, Type, Dependency)
3. Cache Manager
4. Analysis Orchestration Layer
5. Tool Handler Layer
6. MCP Protocol Layer
7. テスト作成とデバッグ

---

## 関連ドキュメント

### 要件定義

- [要件定義書](../../spec/code-analysis-requirements.md)
- [ユーザストーリー](../../spec/code-analysis-user-stories.md)
- [受け入れ基準](../../spec/code-analysis-acceptance-criteria.md)

### 技術仕様

- [技術スタック](../../tech-stack.md)

---

## 貢献者

このドキュメントは、要件定義書とユーザヒアリング（2025-10-29）に基づいて作成されました。

**作成日**: 2025-10-29
**バージョン**: 1.0.0
**ステータス**: 設計完了、実装準備完了

---

## フィードバックと改善

設計に関する質問や改善提案がある場合は、以下を確認してください:

1. **アーキテクチャの疑問** → `architecture.md` を参照
2. **データフローの疑問** → `dataflow.md` を参照
3. **型定義の疑問** → `interfaces.ts` を参照
4. **キャッシュの疑問** → `cache-design.md` を参照
5. **API仕様の疑問** → `api-specification.md` を参照

すべてのドキュメントは実装と共に更新されます。
