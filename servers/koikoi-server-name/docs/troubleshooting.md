# トラブルシューティングガイド

Phase 1 コード解析システムの一般的な問題と解決方法

**バージョン**: 1.0.0
**最終更新**: 2025-11-01

---

## 📋 目次

1. [インストールとセットアップ](#インストールとセットアップ)
2. [ファイル読み込みエラー](#ファイル読み込みエラー)
3. [パス解決エラー](#パス解決エラー)
4. [TypeScript Compilerエラー](#typescript-compilerエラー)
5. [パフォーマンス問題](#パフォーマンス問題)
6. [メモリ問題](#メモリ問題)
7. [テスト実行エラー](#テスト実行エラー)
8. [その他の問題](#その他の問題)

---

## インストールとセットアップ

### 問題: `bun: command not found`

**症状**:
```bash
$ bun install
bash: bun: command not found
```

**原因**: Bunがインストールされていない

**解決方法**:
```bash
# Bunをインストール
curl -fsSL https://bun.sh/install | bash

# パスを再読み込み
source ~/.bashrc  # または ~/.zshrc

# 確認
bun --version  # 1.3.1 以上
```

---

### 問題: TypeScript型エラーが大量に発生

**症状**:
```
error TS2307: Cannot find module './fs/FileReader' or its corresponding type declarations.
```

**原因**: 依存関係がインストールされていない

**解決方法**:
```bash
# 依存関係を再インストール
bun install

# node_modulesをクリア
rm -rf node_modules
bun install

# TypeScriptの型チェック
bun run tsc --noEmit
```

---

## ファイル読み込みエラー

### 問題: `FileSystemError: File not found`

**症状**:
```typescript
FileSystemError: File not found: /path/to/file.ts
    code: "ENOENT"
```

**原因**: ファイルが存在しないか、パスが間違っている

**解決方法**:

1. **ファイルの存在確認**:
```typescript
import { WorkspaceValidator } from './src/fs';

const validator = new WorkspaceValidator();
const exists = await validator.fileExists('/path/to/file.ts');
console.log('Exists:', exists);
```

2. **絶対パスの使用**:
```typescript
import { resolve } from 'path';

const absolutePath = resolve('./relative/path/file.ts');
console.log('Absolute:', absolutePath);
```

3. **PathResolverを使用**:
```typescript
import { PathResolver } from './src/fs';

const resolver = new PathResolver(process.cwd());
const resolved = resolver.resolve('./src/index.ts');
console.log('Resolved:', resolved.absolutePath);
```

---

### 問題: `FileSystemError: File too large`

**症状**:
```
FileSystemError: File exceeds maximum size (10MB)
```

**原因**: ファイルが10MB制限を超えている

**解決方法**:

ファイルサイズを確認し、必要に応じて制限を回避：

```typescript
import { stat } from 'fs/promises';

const stats = await stat('./large-file.ts');
const sizeMB = stats.size / 1024 / 1024;

if (sizeMB > 10) {
  console.warn(`File is ${sizeMB.toFixed(2)}MB (>10MB limit)`);
  // 代替案: ストリーミング読み込み（将来実装予定）
}
```

**推奨**: 大きなファイルは分割するか、除外パターンで無視する

---

## パス解決エラー

### 問題: `WorkspaceBoundaryError`

**症状**:
```
WorkspaceBoundaryError: Path '/etc/passwd' is outside workspace '/workspace'
```

**原因**: パスがワークスペース外を指している（セキュリティ保護）

**解決方法**:

これは**意図的なセキュリティ機能**です。ワークスペース外のファイルにはアクセスできません。

```typescript
// ❌ NG: ワークスペース外
const resolver = new PathResolver('/workspace');
resolver.resolve('../../../etc/passwd');  // エラー！

// ✅ OK: ワークスペース内
resolver.resolve('./src/index.ts');  // OK
```

**回避策**: 必要なファイルをワークスペース内に配置する

---

### 問題: Windowsパス区切り文字のエラー

**症状**:
```
Error: Cannot resolve path with backslashes
```

**原因**: Windows形式のパス（`\`）が使用されている

**解決方法**:

PathResolverは自動的にパスを正規化しますが、明示的に変換することも可能：

```typescript
// ❌ NG（Windowsパス）
const path = "C:\\workspace\\src\\index.ts";

// ✅ OK（正規化）
const normalizedPath = path.replace(/\\/g, '/');
// または
import { normalize } from 'path';
const resolved = normalize(path);
```

---

## TypeScript Compilerエラー

### 問題: `CompilerError: Failed to create TypeScript Program`

**症状**:
```
CompilerError: Failed to create TypeScript Program
```

**原因**:
1. ファイルが存在しない
2. CompilerOptionsが不正
3. TypeScriptバージョンの不一致

**解決方法**:

1. **ファイルの確認**:
```typescript
const files = ['/path/to/file.ts'];

// 存在確認
for (const file of files) {
  const exists = await validator.fileExists(file);
  if (!exists) {
    console.error(`Missing: ${file}`);
  }
}
```

2. **CompilerOptionsの確認**:
```typescript
import { CompilerHost } from './src/compiler';
import * as ts from 'typescript';

const host = new CompilerHost({
  rootPath: '/workspace',
  compilerOptions: {
    strict: true,
    skipLibCheck: true,  // 推奨
    noEmit: true,        // 必須（出力不要）
  },
});
```

3. **TypeScriptバージョン確認**:
```bash
bun run tsc --version  # 5.9.3 を推奨
```

---

### 問題: 大量のDiagnosticsエラー

**症状**:
```
Found 100+ diagnostic errors
```

**原因**:
1. TypeScript設定が厳しすぎる
2. 型定義が不足
3. 構文エラーがある

**解決方法**:

1. **Diagnosticsを確認**:
```typescript
import { CompilerHost } from './src/compiler';

const host = new CompilerHost({
  rootPath: '/workspace',
  compilerOptions: { strict: true },
});

const program = host.createProgram(['/path/to/file.ts']);
const diagnostics = host.getDiagnostics(program);

// エラーの内容を表示
diagnostics.forEach((d) => {
  const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  console.error(`Error ${d.code}: ${message}`);
});
```

2. **設定を緩和**:
```typescript
const compilerOptions = {
  strict: false,         // 一時的に緩和
  skipLibCheck: true,
  noUnusedLocals: false,
  noUnusedParameters: false,
};
```

---

## パフォーマンス問題

### 問題: ファイル読み込みが遅い

**症状**:
```
File read took 5000ms (expected <50ms)
```

**原因**:
1. ファイルが大きすぎる
2. ディスクI/Oが遅い
3. キャッシュが利用されていない

**解決方法**:

1. **並行読み込みを活用**:
```typescript
// ❌ NG: 逐次読み込み
for (const file of files) {
  await reader.readFile(file);  // 遅い
}

// ✅ OK: 並行読み込み
await Promise.all(
  files.map(f => reader.readFile(f))
);
```

2. **キャッシュを活用**:
```typescript
import { SourceFileCache } from './src/compiler';

const cache = new SourceFileCache(200);  // サイズ大きめ

// 1回目: キャッシュミス
const sf1 = await cache.get('/path/to/file.ts');

// 2回目: キャッシュヒット（超高速）
const sf2 = await cache.get('/path/to/file.ts');
```

3. **ファイルサイズを確認**:
```bash
# 大きなファイルを特定
find . -name "*.ts" -size +1M
```

---

### 問題: Program作成が遅い

**症状**:
```
Program creation took 10000ms
```

**原因**:
1. キャッシュが利用されていない
2. 毎回新しいProgramManagerを作成している
3. CompilerOptionsが重すぎる

**解決方法**:

1. **ProgramManagerを再利用**:
```typescript
// ❌ NG: 毎回新規作成
for (const files of fileSets) {
  const manager = new ProgramManager(config);  // 遅い
  manager.getProgram(files);
}

// ✅ OK: 再利用
const manager = new ProgramManager(config);
for (const files of fileSets) {
  manager.getProgram(files);  // キャッシュヒット
}
```

2. **CompilerOptionsを最適化**:
```typescript
const compilerOptions = {
  strict: true,
  skipLibCheck: true,   // ✅ 型定義をスキップ
  noEmit: true,          // ✅ 出力なし
  // ❌ 不要な設定は削除
  // declaration: true,
  // sourceMap: true,
};
```

---

## メモリ問題

### 問題: メモリ使用量が増加し続ける

**症状**:
```
Memory usage: 500MB -> 1GB -> 2GB...
```

**原因**:
1. キャッシュが無限に増加
2. Program/SourceFileが解放されない
3. メモリリークの可能性

**解決方法**:

1. **キャッシュサイズを制限**:
```typescript
// LRUキャッシュでサイズ制限
const manager = new ProgramManager(config, 100);  // 100エントリ
const cache = new SourceFileCache(100);
```

2. **定期的にクリア**:
```typescript
// メモリ使用量を監視
const memBefore = process.memoryUsage().heapUsed;

// 処理...

const memAfter = process.memoryUsage().heapUsed;
const memIncrease = (memAfter - memBefore) / 1024 / 1024;

if (memIncrease > 100) {
  console.warn(`High memory usage: ${memIncrease}MB`);
  manager.clearCache();
  cache.clear();
}
```

3. **不要なデータを解放**:
```typescript
// 処理完了後
manager.clearCache();
cache.clear();

// ガベージコレクション（Bunの場合）
if (global.gc) {
  global.gc();
}
```

---

## テスト実行エラー

### 問題: テストがタイムアウトする

**症状**:
```
Test timed out after 5000ms
```

**原因**:
1. テストが重すぎる
2. 無限ループ
3. Promiseが resolve/reject されない

**解決方法**:

1. **タイムアウトを延長**:
```typescript
import { describe, test, expect } from 'bun:test';

test('heavy test', async () => {
  // 処理...
}, { timeout: 30000 });  // 30秒
```

2. **並行実行を避ける**:
```typescript
// ❌ NG: Promise.allで並行実行（タイムアウトリスク）
await Promise.all([
  heavyOperation1(),
  heavyOperation2(),
  heavyOperation3(),
]);

// ✅ OK: 逐次実行
await heavyOperation1();
await heavyOperation2();
await heavyOperation3();
```

---

### 問題: テストが不安定（flaky）

**症状**:
```
Test passes sometimes, fails sometimes
```

**原因**:
1. タイミング依存
2. ファイルシステムの状態依存
3. キャッシュの影響

**解決方法**:

1. **テストの独立性を確保**:
```typescript
import { beforeEach, afterEach } from 'bun:test';

let manager: ProgramManager;
let cache: SourceFileCache;

beforeEach(() => {
  // 各テストで新しいインスタンス
  manager = new ProgramManager(config);
  cache = new SourceFileCache();
});

afterEach(() => {
  // クリーンアップ
  manager.clearCache();
  cache.clear();
});
```

2. **パフォーマンステストの基準を緩和**:
```typescript
// ❌ NG: 厳しすぎる
expect(elapsed).toBeLessThan(10);

// ✅ OK: システム負荷を考慮
expect(elapsed).toBeLessThan(100);
```

---

## その他の問題

### 問題: `EMFILE: too many open files`

**症状**:
```
Error: EMFILE: too many open files
```

**原因**: 大量のファイルを同時に開いている

**解決方法**:

1. **並行数を制限**:
```typescript
// ❌ NG: 無制限の並行処理
await Promise.all(
  manyFiles.map(f => reader.readFile(f))
);

// ✅ OK: チャンクごとに処理
const chunkSize = 10;
for (let i = 0; i < manyFiles.length; i += chunkSize) {
  const chunk = manyFiles.slice(i, i + chunkSize);
  await Promise.all(chunk.map(f => reader.readFile(f)));
}
```

2. **OS設定を変更**（macOS/Linux）:
```bash
# 現在の上限を確認
ulimit -n

# 上限を増やす
ulimit -n 4096
```

---

### 問題: Globパターンが期待通りに動作しない

**症状**:
```
Expected 100 files, got 0
```

**原因**:
1. パターンが間違っている
2. 除外パターンが強すぎる
3. ワークスペースパスが間違っている

**解決方法**:

1. **パターンをテスト**:
```typescript
import { PathResolver } from './src/fs';

const resolver = new PathResolver('/workspace');

// デバッグ用: 除外なしで検索
const allFiles = await resolver.matchFiles(['**/*.ts'], []);
console.log(`Found ${allFiles.length} files`);

// 除外パターンを追加
const filtered = await resolver.matchFiles(
  ['**/*.ts'],
  ['node_modules/**', 'dist/**']
);
console.log(`After exclusion: ${filtered.length} files`);
```

2. **パターンの確認**:
```typescript
// ✅ 正しいパターン
['src/**/*.ts']      // src配下すべて
['**/*.{ts,tsx}']    // TSとTSX
['src/*/index.ts']   // src直下の各ディレクトリのindex.ts

// ❌ 間違ったパターン
['src/**.ts']        // ** は /**/ の意味
['*.ts']             // ルートのみ（サブディレクトリ含まず）
```

---

## 📞 サポート

上記で解決しない場合：

1. **GitHub Issues**: バグ報告や質問
2. **ログの確認**: `console.error()` でデバッグ情報を出力
3. **最小再現コード**: 問題を再現する最小限のコードを作成

---

## 🔍 デバッグのヒント

### 詳細ログを有効化

```typescript
// FileReaderのデバッグ
const reader = new FileReader();
try {
  const result = await reader.readFile(path);
  console.log('Success:', result.metadata);
} catch (error) {
  console.error('Error:', error);
  if (error instanceof FileSystemError) {
    console.error('Path:', error.path);
    console.error('Code:', error.code);
  }
}
```

### パフォーマンス測定

```typescript
console.time('Operation');
// 処理...
console.timeEnd('Operation');

// または
const start = performance.now();
// 処理...
const elapsed = performance.now() - start;
console.log(`Took ${elapsed.toFixed(2)}ms`);
```

### メモリ使用量の監視

```typescript
const formatMemory = (bytes: number) => {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
};

const mem = process.memoryUsage();
console.log('Heap Used:', formatMemory(mem.heapUsed));
console.log('Heap Total:', formatMemory(mem.heapTotal));
console.log('External:', formatMemory(mem.external));
```

---

## 📚 関連ドキュメント

- [Phase 1 API仕様書](api/phase1-api.md)
- [README](../README.md)
- [技術スタック](tech-stack.md)

---

**最終更新**: 2025-11-01
**バージョン**: 1.0.0
