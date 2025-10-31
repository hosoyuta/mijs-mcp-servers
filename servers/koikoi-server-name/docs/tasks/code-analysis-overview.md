# コード解析MCP タスク管理概要

## プロジェクト概要

### 基本情報
- **プロジェクト名**: koikoi-server-name (コード解析MCP)
- **プロジェクトタイプ**: MCPサーバー
- **開発期間**: 1-2ヶ月 (MVPフェーズ)
- **開発スタイル**: TypeScript strict モード、TDD推奨
- **技術スタック**: TypeScript 5.9.3, Bun 1.3.1, MCP SDK 1.18.1

### プロジェクト目的
Claude Codeのコンテキスト消費を90%削減することを目的とした、TypeScript Compiler APIを活用した高速なコード解析システムの構築。ファイルの生の内容を送信する代わりに、必要な情報（関数構造、型定義、依存関係等）のみを抽出・構造化して提供する。

### 総合見積もり
- **総期間**: 45-60営業日 (約2ヶ月)
- **総工数見積もり**: 約540-720時間
- **総タスク数**: 4フェーズ、約60-80タスク
- **平均工数/日**: 8-12時間

---

## フェーズ構成

### Phase 1: 基盤レイヤー (File System + TypeScript Compiler API)
- **期間**: 12-15営業日
- **推定工数**: 120-150時間
- **成果物**:
  - ファイルシステム抽象化層
  - TypeScript Compiler API統合
  - 基本的なエラーハンドリング
- **タスク数**: 約15-20タスク
- **ファイルリンク**: [phase-01-foundation.md](./phase-01-foundation.md)

### Phase 2: 解析エンジンレイヤー (Analyzer Engine)
- **期間**: 15-20営業日
- **推定工数**: 180-240時間
- **成果物**:
  - Structure Analyzer (関数・クラス抽出)
  - Type Analyzer (interface/type/enum抽出)
  - Dependency Analyzer (import/export解析)
  - Documentation Extractor (JSDoc抽出)
- **タスク数**: 約20-25タスク
- **ファイルリンク**: [phase-02-analyzers.md](./phase-02-analyzers.md)

### Phase 3: オーケストレーションレイヤー (Orchestration + Cache + Tool Handler)
- **期間**: 10-15営業日
- **推定工数**: 120-180時間
- **成果物**:
  - Analysis Orchestrator
  - Cache Manager (3層キャッシュ)
  - 4つのMCPツールハンドラ
  - モード切り替え機能
- **タスク数**: 約15-20タスク
- **ファイルリンク**: [phase-03-orchestration.md](./phase-03-orchestration.md)

### Phase 4: MCPプロトコルレイヤー + 統合テスト
- **期間**: 8-10営業日
- **推定工数**: 120-150時間
- **成果物**:
  - MCPサーバー統合
  - E2Eテスト
  - パフォーマンステスト
  - ドキュメント整備
- **タスク数**: 約10-15タスク
- **ファイルリンク**: [phase-04-integration.md](./phase-04-integration.md)

---

## フェーズ詳細テーブル

| フェーズ | 期間 | 工数 | タスク数 | 主要成果物 | 信頼性 | 進捗 |
|---------|------|------|---------|-----------|--------|------|
| Phase 1: 基盤レイヤー | 12-15日 | 120-150h | 15-20 | File System, TS Compiler統合 | 🔵 | ⬜ 0% |
| Phase 2: 解析エンジン | 15-20日 | 180-240h | 20-25 | 4つのAnalyzer実装 | 🔵 | ⬜ 0% |
| Phase 3: オーケストレーション | 10-15日 | 120-180h | 15-20 | Cache, Tool Handler, Orchestrator | 🟡 | ⬜ 0% |
| Phase 4: MCP統合+テスト | 8-10日 | 120-150h | 10-15 | MCPサーバー完成、E2Eテスト | 🔵 | ⬜ 0% |
| **合計** | **45-60日** | **540-720h** | **60-80** | **MVP完成** | - | ⬜ 0% |

**信頼性レベル凡例**:
- 🔵 **青信号**: 設計文書で詳細に定義済み、実装可能
- 🟡 **黄信号**: 設計文書で概要定義、詳細は実装時に決定
- 🔴 **赤信号**: 設計文書になし、調査・設計が必要

---

## 全体進捗チェックボックス

### Phase 1: 基盤レイヤー
- [ ] ファイルシステム抽象化層の実装
- [ ] TypeScript Compiler API統合
- [ ] CompilerHost実装
- [ ] ProgramManager実装
- [ ] 基本的なエラーハンドリング
- [ ] 単体テスト作成

### Phase 2: 解析エンジンレイヤー
- [ ] Structure Analyzer実装
- [ ] Type Analyzer実装
- [ ] Dependency Analyzer実装
- [ ] Documentation Extractor実装
- [ ] Symbol Extractor実装
- [ ] 各Analyzerの単体テスト

### Phase 3: オーケストレーションレイヤー
- [ ] Analysis Orchestrator実装
- [ ] Cache Manager実装 (3層キャッシュ)
- [ ] Tool Handler: analyze_file実装
- [ ] Tool Handler: search_symbol実装
- [ ] Tool Handler: analyze_project実装
- [ ] Tool Handler: get_dependencies実装
- [ ] モード切り替え機能 (concise/detailed)
- [ ] エラーリカバリ実装

### Phase 4: MCPプロトコルレイヤー + テスト
- [ ] MCPサーバー統合
- [ ] stdio transport設定
- [ ] E2Eテスト作成
- [ ] パフォーマンステスト
- [ ] ドキュメント整備
- [ ] Claude Code統合テスト
- [ ] デプロイ準備

---

## マイルストーン定義

### Milestone 1: 基盤完成 (Day 15)
**達成条件**:
- ✅ TypeScript Compiler APIが正常に動作
- ✅ ファイル読み込みが機能
- ✅ 基本的なAST解析が可能
- ✅ 単体テストが全て通過

**検証方法**:
```bash
bun test tests/compiler/
bun test tests/fs/
```

**成果物**:
- `src/compiler/CompilerHost.ts`
- `src/compiler/ProgramManager.ts`
- `src/fs/FileReader.ts`
- `src/fs/PathResolver.ts`

---

### Milestone 2: 解析エンジン完成 (Day 35)
**達成条件**:
- ✅ 4つのAnalyzer (Structure, Type, Dependency, Documentation) が実装完了
- ✅ 各Analyzerが正確に情報を抽出
- ✅ エラー時も部分的な結果を返却
- ✅ 統合テストが通過

**検証方法**:
```bash
bun test tests/analyzers/
```

**成果物**:
- `src/analyzers/StructureAnalyzer.ts`
- `src/analyzers/TypeAnalyzer.ts`
- `src/analyzers/DependencyAnalyzer.ts`
- `src/analyzers/DocumentationExtractor.ts`
- `src/analyzers/SymbolExtractor.ts`

**性能目標**:
- 小規模ファイル (100行): 50ms以内
- 中規模ファイル (1000行): 200ms以内

---

### Milestone 3: ツール統合完成 (Day 50)
**達成条件**:
- ✅ 4つのMCPツールが全て実装完了
- ✅ キャッシュが正常に動作 (ヒット時10ms以内)
- ✅ 簡潔モード/詳細モードが機能
- ✅ エラーハンドリングが適切に動作
- ✅ 統合テストが通過

**検証方法**:
```bash
bun test tests/tools/
bun test tests/orchestration/
```

**成果物**:
- `src/tools/AnalyzeFileTool.ts`
- `src/tools/SearchSymbolTool.ts`
- `src/tools/AnalyzeProjectTool.ts`
- `src/tools/GetDependenciesTool.ts`
- `src/orchestration/AnalysisOrchestrator.ts`
- `src/orchestration/CacheManager.ts`

**性能目標**:
- キャッシュヒット: 10ms以内
- 10ファイル並行解析: 2秒以内

---

### Milestone 4: MVP完成 (Day 60)
**達成条件**:
- ✅ MCPサーバーがClaude Codeと統合
- ✅ 全E2Eテストが通過
- ✅ パフォーマンス目標を達成
- ✅ ドキュメントが完備
- ✅ Claude Codeでの実用テストが成功

**検証方法**:
```bash
bun test tests/e2e/
bun run performance-test
```

**成果物**:
- `src/index.ts` (MCPサーバーエントリーポイント)
- 完全なドキュメント
- Claude Code設定ファイル
- デプロイ手順書

**性能目標**:
- 起動時間: 1秒以内
- コンテキスト削減 (簡潔モード): 90%以上
- コンテキスト削減 (詳細モード): 70%以上

---

## タスク番号管理

### 使用済み番号
なし (初回作成)

### 次回開始番号
TASK-0001

### タスクID命名規則
```
TASK-{Phase番号}{連番}
例: TASK-0101, TASK-0102, ... (Phase 1)
    TASK-0201, TASK-0202, ... (Phase 2)
```

### タスク優先度
- **P0 (Critical)**: MVP必須、ブロッカー
- **P1 (High)**: MVP必須、重要
- **P2 (Medium)**: MVP推奨、あると良い
- **P3 (Low)**: Phase 2以降、将来対応

---

## 主要機能とタスクマッピング

### 1. analyze_file ツール
**関連タスク**:
- Phase 1: ファイル読み込み、Compiler統合
- Phase 2: 全Analyzer実装
- Phase 3: AnalyzeFileTool実装、キャッシュ統合
- Phase 4: E2Eテスト

**信頼性**: 🔵 (API仕様、データフロー図で詳細定義済み)

---

### 2. search_symbol ツール
**関連タスク**:
- Phase 2: Symbol Extractor実装
- Phase 3: SearchSymbolTool実装、並行処理
- Phase 4: E2Eテスト

**信頼性**: 🔵 (API仕様、シーケンス図で定義済み)

---

### 3. analyze_project ツール
**関連タスク**:
- Phase 1: ファイルパターンマッチング
- Phase 2: 全Analyzer実装
- Phase 3: AnalyzeProjectTool実装、バッチ処理
- Phase 4: E2Eテスト

**信頼性**: 🔵 (API仕様、データフロー図で定義済み)

---

### 4. get_dependencies ツール
**関連タスク**:
- Phase 2: Dependency Analyzer実装
- Phase 3: GetDependenciesTool実装、循環依存検出
- Phase 4: E2Eテスト

**信頼性**: 🔵 (API仕様、シーケンス図で定義済み)

---

## 技術的課題とリスク管理

### 高リスク課題

#### 1. TypeScript Compiler API起動時間
**リスク**: `ts.createProgram()` の初期化が遅い (数百ms)
**対策**:
- プログラムインスタンスの再利用 (ProgramManager)
- 必要最小限の `compilerOptions`
- `skipLibCheck: true` で型定義ファイルをスキップ

**関連タスク**: TASK-01xx (Phase 1)
**信頼性**: 🔵 (architecture.mdで対策定義済み)

---

#### 2. 大規模プロジェクトのメモリ消費
**リスク**: 数千ファイルのプロジェクトで数GBのメモリ消費
**対策**:
- オンデマンド解析 (必要なファイルのみ)
- LRUキャッシュによる自動削除
- 定期的なガベージコレクション

**関連タスク**: TASK-03xx (Phase 3)
**信頼性**: 🟡 (cache-design.mdで対策定義、実装時に調整)

---

#### 3. キャッシュ整合性
**リスク**: ファイル更新時にキャッシュが古くなる
**対策**:
- `mtime` (更新日時) ベースのキャッシュ無効化
- キャッシュキーに `mtime` を含める
- ファイルウォッチャー (Phase 2以降)

**関連タスク**: TASK-03xx (Phase 3)
**信頼性**: 🔵 (cache-design.mdで詳細設計済み)

---

### 中リスク課題

#### 4. 並行処理のデッドロック
**リスク**: 複数ファイルの並行解析時にリソース競合
**対策**:
- Worker Poolによる並行数制限
- タイムアウト設定
- メモリ監視、閾値超過時は直列実行

**関連タスク**: TASK-03xx (Phase 3)
**信頼性**: 🟡 (dataflow.mdで方針定義、実装時に検証)

---

#### 5. 構文エラーのあるファイル
**リスク**: 構文エラーで解析が完全失敗
**対策**:
- 部分的成功の実装 (ErrorRecoveryManager)
- 解析可能な部分 (import, 型定義) のみ返却
- フォールバック情報 (サイズ、行数) の提供

**関連タスク**: TASK-02xx, TASK-03xx (Phase 2-3)
**信頼性**: 🔵 (architecture.md、requirements.mdで詳細定義済み)

---

## 非機能要件の達成目標

### パフォーマンス目標

| 指標 | 目標値 | 検証方法 | 関連Phase |
|-----|-------|---------|----------|
| 起動時間 | 1秒以内 | `time bun run src/index.ts` | Phase 4 |
| 小規模ファイル (100行) | 50ms以内 | パフォーマンステスト | Phase 2 |
| 中規模ファイル (1000行) | 200ms以内 | パフォーマンステスト | Phase 2 |
| 大規模ファイル (5000行) | 1秒以内 | パフォーマンステスト | Phase 2 |
| キャッシュヒット | 10ms以内 | パフォーマンステスト | Phase 3 |
| 10ファイル並行解析 | 2秒以内 | パフォーマンステスト | Phase 3 |
| コンテキスト削減 (簡潔) | 90%以上 | 出力サイズ測定 | Phase 3 |
| コンテキスト削減 (詳細) | 70%以上 | 出力サイズ測定 | Phase 3 |

---

### 品質目標

| 指標 | 目標値 | 検証方法 | 関連Phase |
|-----|-------|---------|----------|
| 単体テストカバレッジ | 主要機能70%以上 | `bun test --coverage` | Phase 1-4 |
| 統合テスト | 全ツールで正常系・異常系 | `bun test tests/tools/` | Phase 3 |
| E2Eテスト | Claude Code統合成功 | 手動テスト | Phase 4 |
| 型安全性 | TypeScript strict モード | `tsc --noEmit` | Phase 1-4 |

---

## 依存関係マトリックス

### Phase間の依存関係

```
Phase 1 (基盤)
    ↓
Phase 2 (解析エンジン) ← 完全依存
    ↓
Phase 3 (オーケストレーション) ← 完全依存
    ↓
Phase 4 (MCP統合+テスト) ← 完全依存
```

### タスク間の主要な依存関係

**Phase 1内**:
- PathResolver → FileReader
- CompilerHost → ProgramManager

**Phase 1 → Phase 2**:
- ProgramManager → 全Analyzer (必須)
- FileReader → 全Analyzer (必須)

**Phase 2 → Phase 3**:
- 全Analyzer → AnalysisOrchestrator (必須)
- AnalysisOrchestrator → 全ToolHandler (必須)

**Phase 3 → Phase 4**:
- 全ToolHandler → MCPサーバー統合 (必須)

---

## 開発プロセスとベストプラクティス

### TDD (Test-Driven Development) 推奨

**Redフェーズ**:
1. 失敗するテストケースを作成
2. 実装すべき機能を明確に定義

**Greenフェーズ**:
3. テストを通す最小限の実装
4. テストが成功することを確認

**Refactorフェーズ**:
5. コード品質の改善
6. リファクタリング後もテストが通過

### コードレビュー基準
- [ ] TypeScript strict モードでエラーなし
- [ ] 単体テストが全て通過
- [ ] エラーハンドリングが適切
- [ ] JSDocコメントが記述済み
- [ ] 型定義が明確

### Git運用
**ブランチ戦略**:
- `main`: 本番相当、安定版
- `develop`: 統合ブランチ
- `feature/TASK-xxxx`: 各タスク用フィーチャーブランチ

**コミットメッセージ**:
```
[TASK-0101] TypeScript Compiler API統合

- CompilerHost実装
- 基本的なcompilerOptions設定
- 単体テスト追加
```

---

## ドキュメント構成

### 要件・仕様
- [code-analysis-requirements.md](../spec/code-analysis-requirements.md) - EARS記法による要件定義
- [code-analysis-user-stories.md](../spec/code-analysis-user-stories.md) - ユーザーストーリー
- [code-analysis-acceptance-criteria.md](../spec/code-analysis-acceptance-criteria.md) - 受け入れ基準

### 設計
- [architecture.md](../design/code-analysis/architecture.md) - システムアーキテクチャ
- [dataflow.md](../design/code-analysis/dataflow.md) - データフロー図
- [cache-design.md](../design/code-analysis/cache-design.md) - キャッシュ詳細設計
- [api-specification.md](../design/code-analysis/api-specification.md) - API仕様

### タスク管理
- [code-analysis-overview.md](./code-analysis-overview.md) - 本ファイル (タスク全体概要)
- [phase-01-foundation.md](./phase-01-foundation.md) - Phase 1詳細タスク
- [phase-02-analyzers.md](./phase-02-analyzers.md) - Phase 2詳細タスク
- [phase-03-orchestration.md](./phase-03-orchestration.md) - Phase 3詳細タスク
- [phase-04-integration.md](./phase-04-integration.md) - Phase 4詳細タスク

### 技術
- [tech-stack.md](../tech-stack.md) - 技術スタック定義

---

## 次のステップ

### 即座に実施
1. ✅ Phase 1タスクファイルの作成 → `phase-01-foundation.md`
2. ⬜ Phase 1の最初のタスク (TASK-0101) に着手
3. ⬜ 開発環境のセットアップ確認

### 週次レビュー
- 毎週金曜: 進捗確認、リスク評価
- マイルストーン達成時: 成果物レビュー
- Phase完了時: ふりかえり、次Phase計画調整

### 定期更新
- タスク完了時: 進捗チェックボックスを更新
- 新しい課題発見時: リスク管理セクションに追記
- 見積もり乖離時: 工数・期間を見直し

---

## 更新履歴

- **2025-10-31**: 初回作成
  - 4フェーズ構成の定義
  - 総工数見積もり: 540-720時間
  - マイルストーン定義
  - リスク管理マトリックス
  - 非機能要件の達成目標
  - 次回タスク番号: TASK-0001

---

**関連文書**:
- 要件: [requirements](../spec/code-analysis-requirements.md)
- 設計: [architecture](../design/code-analysis/architecture.md)
- 技術: [tech-stack](../tech-stack.md)
