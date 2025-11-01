# テスト実行手順書（Test Execution Guide）

**プロジェクト**: Code Analysis MCP Server - Phase 1
**バージョン**: 1.0.0
**最終更新日**: 2025-11-01
**ステータス**: ✅ Phase 1完成

---

## 📋 目次

1. [はじめに](#はじめに)
2. [前提条件](#前提条件)
3. [基本的なテスト実行](#基本的なテスト実行)
4. [高度なテスト実行](#高度なテスト実行)
5. [カバレッジレポート生成](#カバレッジレポート生成)
6. [トラブルシューティング](#トラブルシューティング)
7. [CI/CD統合](#cicd統合)

---

## はじめに

本ガイドは、Code Analysis MCP Server Phase 1のテストを実行するための包括的な手順書です。

### 対象読者

- 開発者（新規参加メンバー含む）
- QAエンジニア
- CI/CDパイプライン構築者

### テストツール

- **Bun Test**: 組み込みテストランナー（Jest互換API）
- **TypeScript**: 型チェック機能
- **Bun Runtime**: 超高速実行環境

---

## 前提条件

### 1. 環境要件

| 項目 | 要件 | 確認方法 |
|-----|------|---------|
| **Bun** | v1.3.1以上 | `bun --version` |
| **Node.js** | v18.0.0以上（オプション） | `node --version` |
| **OS** | Windows/Linux/macOS | - |
| **メモリ** | 4GB以上推奨 | - |
| **ディスク** | 1GB以上の空き容量 | - |

### 2. 環境セットアップ

#### Bunのインストール

**macOS/Linux**:
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows**:
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

#### プロジェクトセットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd koikoi-server-name

# 依存関係インストール
bun install

# TypeScriptコンパイルチェック（オプション）
bun run tsc --noEmit
```

### 3. セットアップ確認

```bash
# Bunバージョン確認
bun --version
# 期待: 1.3.1以上

# 依存関係確認
bun pm ls
# 期待: typescript, glob等が表示される

# 簡易テスト実行
bun test tests/fixtures/workspace/tests/sample.test.ts
# 期待: 1 pass
```

---

## 基本的なテスト実行

### 1. 全テスト実行

#### コマンド

```bash
bun test
```

#### 期待される出力

```
bun test v1.3.1

tests\fs\FileReader.test.ts:
(pass) FileReader > ファイル内容を正しく読み込める
(pass) FileReader > メタデータが正確
...

tests\compiler\CompilerHost.test.ts:
(pass) CompilerHost > TypeScript Programを作成できる
...

 150 pass
 0 fail
 337 expect() calls
Ran 150 tests across 14 files. [~50s]
```

#### 実行時間

- **通常**: 45-55秒
- **初回実行**: 60-70秒（キャッシュ構築）
- **2回目以降**: 45秒前後

---

### 2. 特定カテゴリのテスト実行

#### File System Layerのみ

```bash
bun test tests/fs/
```

**期待**: 77テスト通過

#### Compiler Layerのみ

```bash
bun test tests/compiler/
```

**期待**: 49テスト通過

#### 統合テストのみ

```bash
bun test tests/integration/
```

**期待**: 10テスト通過

#### E2Eテストのみ

```bash
bun test tests/e2e/
```

**期待**: 13テスト通過

---

### 3. 特定ファイルのテスト実行

#### 単一ファイル

```bash
bun test tests/fs/FileReader.test.ts
```

**期待**: 14テスト通過

#### 複数ファイル指定

```bash
bun test tests/fs/FileReader.test.ts tests/fs/PathResolver.test.ts
```

**期待**: 31テスト通過

---

### 4. パターンマッチングでテスト実行

#### 特定パターンのテスト

```bash
# "performance"を含むテストファイル
bun test tests/**/performance.test.ts

# "integration"を含むテストファイル
bun test tests/**/integration.test.ts

# "edge-cases"を含むテストファイル
bun test tests/**/edge-cases.test.ts
```

---

## 高度なテスト実行

### 1. Watchモードでテスト実行

ファイル変更を監視して自動再実行：

```bash
bun test --watch
```

**使用例**:
1. コマンド実行
2. ファイルを編集・保存
3. 自動的にテスト再実行

**終了**: `Ctrl+C`

---

### 2. 詳細出力モード

#### Verboseモード

```bash
bun test --verbose
```

**出力内容**:
- 各テストの開始・終了時刻
- 詳細なエラースタックトレース
- メモリ使用量情報

---

### 3. 特定テストのみ実行

#### テスト名でフィルタリング

```typescript
// テストファイル内で test.only() を使用
test.only("このテストだけ実行", () => {
  // ...
});
```

```bash
bun test tests/fs/FileReader.test.ts
```

**期待**: `test.only()`のテストのみ実行

#### describeブロックのみ実行

```typescript
describe.only("このブロックだけ実行", () => {
  test("テスト1", () => { /* ... */ });
  test("テスト2", () => { /* ... */ });
});
```

**注意**: `test.only()`や`describe.only()`はコミット前に削除すること

---

### 4. テストのスキップ

```typescript
// 一時的にスキップ
test.skip("このテストはスキップ", () => {
  // ...
});

describe.skip("このブロックはスキップ", () => {
  // ...
});
```

```bash
bun test
```

**出力**: スキップされたテストは実行されない

---

### 5. タイムアウト設定

#### デフォルト（5000ms）

```typescript
test("通常のテスト", async () => {
  // 5秒以内に完了する必要がある
});
```

#### カスタムタイムアウト

```typescript
test("長時間テスト", async () => {
  // 30秒以内に完了
}, 30000);
```

---

## カバレッジレポート生成

### 1. 基本的なカバレッジ測定

```bash
bun test --coverage
```

**出力**:
```
┌──────────────────┬──────────┬──────────┬──────────┐
│ File             │ % Stmts  │ % Branch │ % Funcs  │
├──────────────────┼──────────┼──────────┼──────────┤
│ src/fs/          │ 90%+     │ 88%+     │ 100%     │
│ src/compiler/    │ 80%+     │ 78%+     │ 100%     │
│ All files        │ 85%+     │ 82%+     │ 95%+     │
└──────────────────┴──────────┴──────────┴──────────┘
```

---

### 2. HTMLカバレッジレポート

```bash
bun test --coverage --coverage-reporter=html
```

**出力先**: `coverage/index.html`

**レポートを開く**:
```bash
# macOS
open coverage/index.html

# Windows
start coverage/index.html

# Linux
xdg-open coverage/index.html
```

**レポート内容**:
- ファイル別カバレッジ
- 未カバー行の強調表示
- ブランチカバレッジの詳細

---

### 3. カバレッジ閾値チェック

```bash
# 85%以上のカバレッジを要求
bun test --coverage --coverage-threshold=85
```

**動作**:
- カバレッジが85%未満の場合、テストが失敗（exit code 1）
- CI/CDで品質ゲートとして使用可能

---

### 4. 特定ファイルのカバレッジ

```bash
# FileReaderのみ
bun test tests/fs/FileReader.test.ts --coverage

# Compiler Layer全体
bun test tests/compiler/ --coverage
```

---

## トラブルシューティング

### 問題1: テストが実行されない

**症状**:
```
No tests found
```

**原因**:
- テストファイル名が `*.test.ts` ではない
- `tests/` ディレクトリ外にテストファイルがある

**解決方法**:
```bash
# テストファイルを確認
ls tests/**/*.test.ts

# 正しいパスで実行
bun test tests/fs/FileReader.test.ts
```

---

### 問題2: タイムアウトエラー

**症状**:
```
Error: Test timeout of 5000ms exceeded
```

**原因**:
- テストが5秒以内に完了しない
- 無限ループやデッドロック

**解決方法**:
```typescript
// タイムアウトを延長
test("長時間テスト", async () => {
  // ...
}, 30000); // 30秒
```

---

### 問題3: メモリ不足エラー

**症状**:
```
FATAL ERROR: Reached heap limit
```

**原因**:
- 大規模なテストデータ
- メモリリーク

**解決方法**:
```bash
# Bunのメモリ制限を増やす
bun --max-old-space-size=4096 test
```

---

### 問題4: ファイルアクセスエラー

**症状**:
```
ENOENT: no such file or directory
```

**原因**:
- テストフィクスチャが存在しない
- パスが間違っている

**解決方法**:
```bash
# フィクスチャを確認
ls tests/fixtures/

# 相対パスを確認
pwd
```

---

### 問題5: TypeScriptコンパイルエラー

**症状**:
```
error TS2304: Cannot find name 'expect'
```

**原因**:
- `bun-types`がインストールされていない

**解決方法**:
```bash
# 依存関係を再インストール
bun install

# tsconfig.jsonを確認
cat tsconfig.json
```

---

## CI/CD統合

### GitHub Actions

#### `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.3.1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test

      - name: Generate coverage
        run: bun test --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

### GitLab CI

#### `.gitlab-ci.yml`

```yaml
test:
  image: oven/bun:1.3.1
  script:
    - bun install
    - bun test
    - bun test --coverage
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

---

### ローカルCI実行

#### Actを使用（GitHub Actionsをローカルで実行）

```bash
# Actのインストール（macOS）
brew install act

# ワークフローを実行
act -j test
```

---

## ベストプラクティス

### 1. テスト実行前のチェックリスト

- [ ] 依存関係が最新か確認（`bun install`）
- [ ] TypeScriptコンパイルが通るか確認（`bun run tsc --noEmit`）
- [ ] テストフィクスチャが存在するか確認

### 2. テスト実行頻度

| タイミング | 実行内容 | 推奨頻度 |
|-----------|---------|---------|
| コード変更時 | 関連テストのみ | 毎回 |
| コミット前 | 全テスト | 必須 |
| プッシュ前 | 全テスト + カバレッジ | 必須 |
| マージ前 | 全テスト + 統合テスト | 必須 |

### 3. パフォーマンス最適化

#### 並列実行

```bash
# Bunはデフォルトで並列実行
bun test
```

#### キャッシュ活用

```bash
# テストフィクスチャのキャッシュ
# Bunが自動的にキャッシュを管理
```

---

## クイックリファレンス

### よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `bun test` | 全テスト実行 |
| `bun test --watch` | Watchモード |
| `bun test --coverage` | カバレッジ測定 |
| `bun test tests/fs/` | FSレイヤーのみ |
| `bun test tests/compiler/` | Compilerレイヤーのみ |
| `bun test tests/e2e/` | E2Eテストのみ |

### テスト結果の見方

```
 150 pass      ← 通過したテスト数
 0 fail        ← 失敗したテスト数
 337 expect()  ← アサーション数
Ran 150 tests across 14 files. [50.14s]
                                  ↑実行時間
```

---

## 付録

### A. テストファイル命名規則

- **ユニットテスト**: `<ClassName>.test.ts`
- **統合テスト**: `integration.test.ts`
- **E2Eテスト**: `scenarios.test.ts`
- **パフォーマンステスト**: `performance.test.ts`
- **エッジケーステスト**: `edge-cases.test.ts`

### B. テストデータの配置

```
tests/
├── fixtures/           # テストフィクスチャ
│   ├── sample-*.ts     # サンプルファイル
│   └── projects/       # テスト用プロジェクト
├── fs/                 # FSレイヤーテスト
├── compiler/           # Compilerレイヤーテスト
├── integration/        # 統合テスト
└── e2e/                # E2Eテスト
```

### C. 環境変数

| 変数名 | 説明 | デフォルト |
|-------|------|-----------|
| `DEBUG` | デバッグモード | `false` |
| `NODE_ENV` | 実行環境 | `test` |
| `CI` | CI環境判定 | `false` |

---

## サポート

### 問題が解決しない場合

1. **トラブルシューティングガイド**: `docs/troubleshooting.md`
2. **GitHub Issues**: プロジェクトのIssuesを確認
3. **開発チーム**: Slack #code-analysis-support

---

**作成日**: 2025-11-01
**作成者**: Code Analysis Team
**レビュー**: ✅ 完了
**承認**: ✅ Phase 1完成
