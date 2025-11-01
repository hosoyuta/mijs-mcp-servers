# Phase 1 API 仕様書

**バージョン**: 1.0.0
**最終更新**: 2025-11-01
**ステータス**: 完成

---

## 📋 目次

1. [概要](#概要)
2. [File System Layer API](#file-system-layer-api)
   - [FileReader](#filereader)
   - [PathResolver](#pathresolver)
   - [WorkspaceValidator](#workspacevalidator)
3. [Compiler Layer API](#compiler-layer-api)
   - [CompilerHost](#compilerhost)
   - [ProgramManager](#programmanager)
   - [SourceFileCache](#sourcefilecache)
4. [型定義](#型定義)
5. [エラーハンドリング](#エラーハンドリング)
6. [使用例](#使用例)
7. [パフォーマンス考慮事項](#パフォーマンス考慮事項)

---

## 概要

Phase 1 APIは、TypeScript Compiler APIとファイルシステムの抽象化層を提供します。
2つの主要レイヤーで構成されています：

- **File System Layer**: ファイル読み込み、パス解決、ワークスペース検証
- **Compiler Layer**: TypeScript Program管理、SourceFileキャッシング

---

## File System Layer API

### FileReader

高速なファイル読み込みを提供します（Bun.file使用）。

#### クラスシグネチャ

```typescript
class FileReader {
  readFile(filePath: string): Promise<FileReadResult>
}
```

#### メソッド

##### `readFile(filePath: string): Promise<FileReadResult>`

ファイルを読み込み、内容とメタデータを返します。

**パラメータ**:
- `filePath` (string): 読み込むファイルのパス（相対または絶対パス）

**戻り値**: `Promise<FileReadResult>`
```typescript
interface FileReadResult {
  content: string;        // ファイルの内容（UTF-8）
  metadata: FileMetadata; // ファイルメタデータ
}

interface FileMetadata {
  path: string;      // 絶対パス
  size: number;      // バイトサイズ
  mtime: Date;       // 最終更新日時
  lines: number;     // 行数
  encoding: string;  // エンコーディング（常に "utf-8"）
}
```

**エラー**:
- `FileSystemError`: ファイルが存在しない場合（code: "ENOENT"）
- `FileSystemError`: ファイルが大きすぎる場合（10MB超過）
- `FileSystemError`: 読み込み権限がない場合

**使用例**:
```typescript
import { FileReader } from "./fs/FileReader";

const reader = new FileReader();

try {
  const result = await reader.readFile("./src/index.ts");

  console.log(`Content: ${result.content.substring(0, 100)}...`);
  console.log(`Size: ${result.metadata.size} bytes`);
  console.log(`Lines: ${result.metadata.lines}`);
  console.log(`Last modified: ${result.metadata.mtime}`);
} catch (error) {
  if (error instanceof FileSystemError) {
    console.error(`File error: ${error.message}`);
  }
}
```

**パフォーマンス**:
- 小規模ファイル（<1KB）: <1ms
- 中規模ファイル（~100KB）: <5ms
- 大規模ファイル（~1MB）: <50ms
- 並行読み込み（10ファイル）: <10ms

**セキュリティ**:
- 最大ファイルサイズ: 10MB
- パストラバーサル保護: 内蔵
- シンボリックリンク: 追跡

---

### PathResolver

パス解決とワークスペース境界チェックを提供します。

#### クラスシグネチャ

```typescript
class PathResolver {
  constructor(workspaceRoot: string)
  resolve(filePath: string): ResolvedPath
  getWorkspaceRoot(): string
  matchFiles(patterns: string[], exclude?: string[]): Promise<string[]>
}
```

#### コンストラクタ

##### `constructor(workspaceRoot: string)`

**パラメータ**:
- `workspaceRoot` (string): ワークスペースのルートディレクトリ

**使用例**:
```typescript
import { PathResolver } from "./fs/PathResolver";

const resolver = new PathResolver("/path/to/workspace");
```

#### メソッド

##### `resolve(filePath: string): ResolvedPath`

相対パスまたは絶対パスを解決し、ワークスペース境界をチェックします。

**パラメータ**:
- `filePath` (string): 解決するパス

**戻り値**: `ResolvedPath`
```typescript
interface ResolvedPath {
  absolutePath: string;      // 解決された絶対パス
  relativePath: string;      // ワークスペースからの相対パス
  isWithinWorkspace: boolean; // ワークスペース内かどうか
}
```

**エラー**:
- `WorkspaceBoundaryError`: パスがワークスペース外の場合

**使用例**:
```typescript
const resolver = new PathResolver("/workspace");

// 相対パス解決
const resolved1 = resolver.resolve("./src/index.ts");
console.log(resolved1.absolutePath); // "/workspace/src/index.ts"
console.log(resolved1.relativePath); // "src/index.ts"
console.log(resolved1.isWithinWorkspace); // true

// ワークスペース外パスは拒否
try {
  resolver.resolve("../../../etc/passwd");
} catch (error) {
  console.error("Access denied!"); // WorkspaceBoundaryError
}
```

##### `getWorkspaceRoot(): string`

ワークスペースのルートパスを返します。

**戻り値**: `string` - ワークスペースルートパス

##### `matchFiles(patterns: string[], exclude?: string[]): Promise<string[]>`

Globパターンに一致するファイルを検索します。

**パラメータ**:
- `patterns` (string[]): Globパターン配列（例: `["**/*.ts", "**/*.tsx"]`）
- `exclude` (string[], optional): 除外パターン配列（デフォルト: `["node_modules/**", "dist/**"]`）

**戻り値**: `Promise<string[]>` - マッチしたファイルパスの配列（ソート済み）

**使用例**:
```typescript
const resolver = new PathResolver("/workspace");

// TypeScriptファイルをすべて検索
const tsFiles = await resolver.matchFiles(["**/*.ts"]);
console.log(`Found ${tsFiles.length} TypeScript files`);

// カスタム除外パターン
const srcFiles = await resolver.matchFiles(
  ["src/**/*.ts"],
  ["**/*.test.ts", "**/*.spec.ts"]
);
```

**パフォーマンス**:
- パス解決: <0.1ms
- 1000回連続解決: <50ms
- Globマッチング（100ファイル）: <100ms

---

### WorkspaceValidator

ワークスペースとファイルの検証を提供します。

#### クラスシグネチャ

```typescript
class WorkspaceValidator {
  validateWorkspace(path: string): Promise<boolean>
  fileExists(path: string): Promise<boolean>
}
```

#### メソッド

##### `validateWorkspace(path: string): Promise<boolean>`

パスが有効なディレクトリかどうかを検証します。

**パラメータ**:
- `path` (string): 検証するパス

**戻り値**: `Promise<boolean>` - ディレクトリであれば `true`

**使用例**:
```typescript
import { WorkspaceValidator } from "./fs/WorkspaceValidator";

const validator = new WorkspaceValidator();

const isValid = await validator.validateWorkspace("/workspace");
if (isValid) {
  console.log("Valid workspace");
} else {
  console.log("Invalid workspace");
}
```

##### `fileExists(path: string): Promise<boolean>`

ファイルが存在するかチェックします。

**パラメータ**:
- `path` (string): チェックするファイルパス

**戻り値**: `Promise<boolean>` - 存在すれば `true`

**使用例**:
```typescript
const validator = new WorkspaceValidator();

const exists = await validator.fileExists("./src/index.ts");
if (exists) {
  console.log("File exists");
}
```

**パフォーマンス**:
- ファイル存在確認: <0.5ms
- 100回連続確認: <30ms

---

## Compiler Layer API

### CompilerHost

TypeScript Compiler APIの初期化と管理を提供します。

#### クラスシグネチャ

```typescript
class CompilerHost {
  constructor(config: CompilerConfig)
  createProgram(fileNames: string[]): ts.Program
  getDiagnostics(program: ts.Program): ts.Diagnostic[]
}
```

#### コンストラクタ

##### `constructor(config: CompilerConfig)`

**パラメータ**:
```typescript
interface CompilerConfig {
  rootPath: string;                    // プロジェクトルート
  compilerOptions: ts.CompilerOptions; // TypeScript設定
}
```

**使用例**:
```typescript
import { CompilerHost } from "./compiler/CompilerHost";
import * as ts from "typescript";

const host = new CompilerHost({
  rootPath: "/workspace",
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    strict: true,
  },
});
```

#### メソッド

##### `createProgram(fileNames: string[]): ts.Program`

TypeScript Programを作成します。

**パラメータ**:
- `fileNames` (string[]): 解析するファイルパスの配列

**戻り値**: `ts.Program` - TypeScript Program

**エラー**:
- `CompilerError`: Program作成に失敗した場合

**使用例**:
```typescript
const program = host.createProgram([
  "/workspace/src/index.ts",
  "/workspace/src/types.ts",
]);

// SourceFile取得
const sourceFile = program.getSourceFile("/workspace/src/index.ts");

// TypeChecker取得
const typeChecker = program.getTypeChecker();
```

##### `getDiagnostics(program: ts.Program): ts.Diagnostic[]`

構文エラーと意味エラーを取得します。

**パラメータ**:
- `program` (ts.Program): TypeScript Program

**戻り値**: `ts.Diagnostic[]` - 診断情報の配列

**使用例**:
```typescript
const program = host.createProgram(["/workspace/src/error.ts"]);
const diagnostics = host.getDiagnostics(program);

diagnostics.forEach((diagnostic) => {
  const message = ts.flattenDiagnosticMessageText(
    diagnostic.messageText,
    "\n"
  );
  console.error(`Error ${diagnostic.code}: ${message}`);
});
```

**デフォルトCompilerOptions**:
```typescript
{
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  strict: true,
  esModuleInterop: true,
  skipLibCheck: true,        // パフォーマンス最適化
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  jsx: ts.JsxEmit.React,     // TSX対応
  allowJs: true,             // JavaScript対応
  noEmit: true,              // 出力不要
}
```

---

### ProgramManager

TypeScript Programインスタンスの再利用とキャッシュ管理を提供します。

#### クラスシグネチャ

```typescript
class ProgramManager {
  constructor(config: CompilerConfig, maxCacheSize?: number)
  getProgram(fileNames: string[]): ts.Program
  getTypeChecker(fileNames: string[]): ts.TypeChecker
  getSourceFile(fileName: string): ts.SourceFile | undefined
  clearCache(): void
}
```

#### コンストラクタ

##### `constructor(config: CompilerConfig, maxCacheSize?: number)`

**パラメータ**:
- `config` (CompilerConfig): Compiler設定
- `maxCacheSize` (number, optional): LRUキャッシュサイズ（デフォルト: 100）

**使用例**:
```typescript
import { ProgramManager } from "./compiler/ProgramManager";

const manager = new ProgramManager(
  {
    rootPath: "/workspace",
    compilerOptions: { strict: true },
  },
  200 // キャッシュサイズ200エントリ
);
```

#### メソッド

##### `getProgram(fileNames: string[]): ts.Program`

Programを取得（キャッシュから再利用）します。

**パラメータ**:
- `fileNames` (string[]): ファイルパス配列

**戻り値**: `ts.Program` - キャッシュされたまたは新規のProgram

**使用例**:
```typescript
const files = ["/workspace/src/index.ts"];

// 1回目: キャッシュミス → 新規作成
const program1 = manager.getProgram(files);

// 2回目: キャッシュヒット → 同じインスタンス
const program2 = manager.getProgram(files);

console.log(program1 === program2); // true
```

##### `getTypeChecker(fileNames: string[]): ts.TypeChecker`

TypeCheckerを取得します。

**パラメータ**:
- `fileNames` (string[]): ファイルパス配列

**戻り値**: `ts.TypeChecker`

**使用例**:
```typescript
const typeChecker = manager.getTypeChecker(["/workspace/src/index.ts"]);

// 型情報を取得（Phase 2で使用）
// const type = typeChecker.getTypeAtLocation(node);
```

##### `getSourceFile(fileName: string): ts.SourceFile | undefined`

SourceFileを取得します。

**パラメータ**:
- `fileName` (string): ファイルパス

**戻り値**: `ts.SourceFile | undefined`

**使用例**:
```typescript
const sourceFile = manager.getSourceFile("/workspace/src/index.ts");

if (sourceFile) {
  console.log(`File: ${sourceFile.fileName}`);
  console.log(`Statements: ${sourceFile.statements.length}`);
}
```

##### `clearCache(): void`

キャッシュをクリアします。

**使用例**:
```typescript
manager.clearCache();
console.log("Cache cleared");
```

**パフォーマンス**:
- キャッシュヒット: <1ms
- キャッシュミス（初回Program作成）: 100-1000ms
- LRUキャッシュオーバーヘッド: <1ms

**キャッシュ戦略**:
- LRU（Least Recently Used）アルゴリズム
- キャッシュキー: ファイルパス配列（ソート済み）
- 最大サイズ: デフォルト100エントリ（設定可能）

---

### SourceFileCache

SourceFileのキャッシング（mtime-based）を提供します。

#### クラスシグネチャ

```typescript
class SourceFileCache {
  constructor(maxSize?: number)
  get(filePath: string): Promise<ts.SourceFile>
  invalidate(filePath: string): Promise<void>
  clear(): void
}
```

#### コンストラクタ

##### `constructor(maxSize?: number)`

**パラメータ**:
- `maxSize` (number, optional): LRUキャッシュサイズ（デフォルト: 100）

**使用例**:
```typescript
import { SourceFileCache } from "./compiler/SourceFileCache";

const cache = new SourceFileCache(150); // 150エントリ
```

#### メソッド

##### `get(filePath: string): Promise<ts.SourceFile>`

SourceFileを取得（キャッシュから）します。mtimeが変更されていない場合はキャッシュを返します。

**パラメータ**:
- `filePath` (string): ファイルパス

**戻り値**: `Promise<ts.SourceFile>`

**エラー**:
- ファイルが存在しない場合

**使用例**:
```typescript
const cache = new SourceFileCache();

// 1回目: キャッシュミス → ファイル読み込み
const sourceFile1 = await cache.get("/workspace/src/index.ts");

// 2回目: キャッシュヒット（mtimeが同じ）
const sourceFile2 = await cache.get("/workspace/src/index.ts");

console.log(sourceFile1 === sourceFile2); // true
```

##### `invalidate(filePath: string): Promise<void>`

特定ファイルのキャッシュを無効化します。

**パラメータ**:
- `filePath` (string): 無効化するファイルパス

**使用例**:
```typescript
// ファイル更新後にキャッシュ無効化
await cache.invalidate("/workspace/src/index.ts");

// 次回は新しいSourceFileが作成される
const sourceFile = await cache.get("/workspace/src/index.ts");
```

##### `clear(): void`

全キャッシュをクリアします。

**使用例**:
```typescript
cache.clear();
console.log("All cache cleared");
```

**パフォーマンス**:
- キャッシュヒット: <1ms（NFR-005: 10ms以内を達成）
- キャッシュミス: 1-10ms
- mtimeチェック: <0.5ms

**キャッシュ戦略**:
- mtime-based無効化
- LRUエビクション
- 自動キャッシュ更新

---

## 型定義

### File System Types

```typescript
/**
 * ファイルメタデータ
 */
export interface FileMetadata {
  path: string;      // 絶対パス
  size: number;      // バイトサイズ
  mtime: Date;       // 最終更新日時
  lines: number;     // 行数
  encoding: string;  // エンコーディング
}

/**
 * ファイル読み込み結果
 */
export interface FileReadResult {
  content: string;
  metadata: FileMetadata;
}

/**
 * ワークスペース情報
 */
export interface WorkspaceInfo {
  rootPath: string;              // ワークスペースルート
  excludePatterns?: string[];    // 除外パターン
}

/**
 * パス解決結果
 */
export interface ResolvedPath {
  absolutePath: string;          // 絶対パス
  relativePath: string;          // 相対パス
  isWithinWorkspace: boolean;    // ワークスペース内か
}
```

### Compiler Types

```typescript
import * as ts from "typescript";

/**
 * Compiler設定
 */
export interface CompilerConfig {
  compilerOptions: ts.CompilerOptions;
  rootPath: string;
}

/**
 * TypeScript Program情報
 */
export interface ProgramInfo {
  program: ts.Program;
  typeChecker: ts.TypeChecker;
  sourceFiles: Map<string, ts.SourceFile>;
}
```

---

## エラーハンドリング

### エラークラス階層

```typescript
Error
├── FileSystemError
│   └── WorkspaceBoundaryError
└── CompilerError
```

### FileSystemError

ファイルシステム操作のエラー。

```typescript
class FileSystemError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly code?: string
  )
}
```

**プロパティ**:
- `message` (string): エラーメッセージ
- `path` (string): 問題のあるファイルパス
- `code` (string, optional): エラーコード（例: "ENOENT"）

**使用例**:
```typescript
try {
  await reader.readFile("./nonexistent.ts");
} catch (error) {
  if (error instanceof FileSystemError) {
    console.error(`File: ${error.path}`);
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
  }
}
```

### WorkspaceBoundaryError

ワークスペース境界違反のエラー。

```typescript
class WorkspaceBoundaryError extends FileSystemError {
  constructor(path: string, workspace: string)
}
```

**使用例**:
```typescript
try {
  resolver.resolve("../../etc/passwd");
} catch (error) {
  if (error instanceof WorkspaceBoundaryError) {
    console.error("Access denied: outside workspace");
  }
}
```

### CompilerError

TypeScript Compiler操作のエラー。

```typescript
class CompilerError extends Error {
  constructor(
    message: string,
    public readonly diagnostics?: ts.Diagnostic[]
  )
}
```

**プロパティ**:
- `message` (string): エラーメッセージ
- `diagnostics` (ts.Diagnostic[], optional): TypeScript診断情報

**使用例**:
```typescript
try {
  const program = host.createProgram(["/invalid/path.ts"]);
} catch (error) {
  if (error instanceof CompilerError) {
    console.error(`Compiler error: ${error.message}`);
    if (error.diagnostics) {
      error.diagnostics.forEach((d) => {
        console.error(`  - ${d.messageText}`);
      });
    }
  }
}
```

---

## 使用例

### 基本的な使用例

#### ファイル読み込みとTypeScript解析

```typescript
import { FileReader } from "./fs/FileReader";
import { PathResolver } from "./fs/PathResolver";
import { ProgramManager } from "./compiler/ProgramManager";

async function analyzeFile(workspace: string, filePath: string) {
  // 1. PathResolverでパス解決
  const resolver = new PathResolver(workspace);
  const resolved = resolver.resolve(filePath);

  // 2. FileReaderでファイル読み込み
  const reader = new FileReader();
  const fileResult = await reader.readFile(resolved.absolutePath);
  console.log(`Read ${fileResult.metadata.lines} lines`);

  // 3. ProgramManagerでTypeScript解析
  const manager = new ProgramManager({
    rootPath: workspace,
    compilerOptions: { strict: true },
  });
  const program = manager.getProgram([resolved.absolutePath]);

  // 4. SourceFile取得
  const sourceFile = manager.getSourceFile(resolved.absolutePath);
  if (sourceFile) {
    console.log(`Statements: ${sourceFile.statements.length}`);
  }

  // 5. TypeChecker取得
  const typeChecker = manager.getTypeChecker([resolved.absolutePath]);
  console.log("Type checking ready");
}

// 使用
await analyzeFile("/workspace", "./src/index.ts");
```

#### 複数ファイルの並行処理

```typescript
import { FileReader } from "./fs/FileReader";
import { PathResolver } from "./fs/PathResolver";

async function readMultipleFiles(workspace: string, files: string[]) {
  const resolver = new PathResolver(workspace);
  const reader = new FileReader();

  // パス解決
  const resolvedPaths = files.map((f) => resolver.resolve(f));

  // 並行読み込み
  const results = await Promise.all(
    resolvedPaths.map((r) => reader.readFile(r.absolutePath))
  );

  // 結果処理
  results.forEach((result, index) => {
    console.log(`File ${files[index]}: ${result.metadata.size} bytes`);
  });
}

await readMultipleFiles("/workspace", [
  "./src/index.ts",
  "./src/types.ts",
  "./src/utils.ts",
]);
```

#### Globパターンでファイル検索

```typescript
import { PathResolver } from "./fs/PathResolver";
import { ProgramManager } from "./compiler/ProgramManager";

async function analyzeProject(workspace: string) {
  const resolver = new PathResolver(workspace);
  const manager = new ProgramManager({
    rootPath: workspace,
    compilerOptions: {},
  });

  // TypeScriptファイルをすべて検索
  const tsFiles = await resolver.matchFiles(
    ["src/**/*.ts", "lib/**/*.ts"],
    ["**/*.test.ts", "**/*.spec.ts"]
  );

  console.log(`Found ${tsFiles.length} files`);

  // すべてのファイルでProgramを作成
  const program = manager.getProgram(tsFiles);
  const sourceFiles = program.getSourceFiles();

  console.log(`Compiled ${sourceFiles.length} files`);
}

await analyzeProject("/workspace");
```

#### エラーハンドリング付き完全例

```typescript
import { FileReader } from "./fs/FileReader";
import { PathResolver } from "./fs/PathResolver";
import { WorkspaceValidator } from "./fs/WorkspaceValidator";
import { ProgramManager } from "./compiler/ProgramManager";
import { CompilerHost } from "./compiler/CompilerHost";
import {
  FileSystemError,
  WorkspaceBoundaryError,
  CompilerError,
} from "./utils/errors";

async function safeAnalyzeFile(workspace: string, filePath: string) {
  try {
    // 1. ワークスペース検証
    const validator = new WorkspaceValidator();
    const isValid = await validator.validateWorkspace(workspace);
    if (!isValid) {
      throw new Error("Invalid workspace");
    }

    // 2. パス解決（ワークスペース境界チェック）
    const resolver = new PathResolver(workspace);
    const resolved = resolver.resolve(filePath);

    // 3. ファイル存在確認
    const exists = await validator.fileExists(resolved.absolutePath);
    if (!exists) {
      throw new FileSystemError(
        "File not found",
        resolved.absolutePath,
        "ENOENT"
      );
    }

    // 4. ファイル読み込み
    const reader = new FileReader();
    const fileResult = await reader.readFile(resolved.absolutePath);

    // 5. TypeScript解析
    const host = new CompilerHost({
      rootPath: workspace,
      compilerOptions: { strict: true },
    });
    const program = host.createProgram([resolved.absolutePath]);

    // 6. Diagnostics取得
    const diagnostics = host.getDiagnostics(program);
    if (diagnostics.length > 0) {
      console.warn(`Found ${diagnostics.length} issues`);
      diagnostics.forEach((d) => {
        console.warn(`  - ${d.messageText}`);
      });
    }

    return {
      success: true,
      content: fileResult.content,
      metadata: fileResult.metadata,
      program,
      diagnostics,
    };
  } catch (error) {
    if (error instanceof WorkspaceBoundaryError) {
      console.error("Security error: Path outside workspace");
      return { success: false, error: "SECURITY_ERROR" };
    } else if (error instanceof FileSystemError) {
      console.error(`File error: ${error.message} (${error.code})`);
      return { success: false, error: "FILE_ERROR" };
    } else if (error instanceof CompilerError) {
      console.error(`Compiler error: ${error.message}`);
      return { success: false, error: "COMPILER_ERROR" };
    } else {
      console.error(`Unknown error: ${error}`);
      return { success: false, error: "UNKNOWN_ERROR" };
    }
  }
}

// 使用
const result = await safeAnalyzeFile("/workspace", "./src/index.ts");
if (result.success) {
  console.log("Analysis complete!");
} else {
  console.error(`Failed: ${result.error}`);
}
```

#### キャッシュの活用

```typescript
import { SourceFileCache } from "./compiler/SourceFileCache";
import { ProgramManager } from "./compiler/ProgramManager";

async function cachedAnalysis(workspace: string, files: string[]) {
  const cache = new SourceFileCache(100);
  const manager = new ProgramManager(
    {
      rootPath: workspace,
      compilerOptions: {},
    },
    100
  );

  // 1回目: キャッシュミス
  console.time("First run");
  for (const file of files) {
    await cache.get(file);
  }
  manager.getProgram(files);
  console.timeEnd("First run");

  // 2回目: キャッシュヒット（高速）
  console.time("Second run (cached)");
  for (const file of files) {
    await cache.get(file);
  }
  manager.getProgram(files);
  console.timeEnd("Second run (cached)");

  // ファイル更新シミュレーション
  await cache.invalidate(files[0]);

  // 3回目: 部分的キャッシュヒット
  console.time("Third run (partial cache)");
  for (const file of files) {
    await cache.get(file);
  }
  manager.getProgram(files);
  console.timeEnd("Third run (partial cache)");
}

await cachedAnalysis("/workspace", [
  "/workspace/src/index.ts",
  "/workspace/src/types.ts",
  "/workspace/src/utils.ts",
]);
```

---

## パフォーマンス考慮事項

### ベンチマーク結果

| 操作 | 目標 | 実績 | 評価 |
|-----|------|------|------|
| 小規模ファイル読み込み | <50ms | <1ms | ✅ 優秀 |
| 中規模ファイル読み込み | <200ms | <5ms | ✅ 優秀 |
| 10ファイル並行読み込み | <500ms | <10ms | ✅ 優秀 |
| パス解決 | <5ms | <0.1ms | ✅ 優秀 |
| 1000回パス解決 | <100ms | <50ms | ✅ 優秀 |
| Globマッチング | <1000ms | <100ms | ✅ 優秀 |
| SourceFileCacheヒット | <10ms | <1ms | ✅ 優秀 |
| ProgramManagerキャッシュヒット | - | <1ms | ✅ 優秀 |
| 完全統合フロー | <5000ms | <800ms | ✅ 優秀 |

### 最適化のヒント

#### 1. キャッシュを積極的に活用

```typescript
// ✅ Good: キャッシュを活用
const manager = new ProgramManager(config, 200); // サイズ大きめ
const cache = new SourceFileCache(200);

// ❌ Bad: 毎回新規作成
for (const file of files) {
  new ProgramManager(config).getProgram([file]); // 非効率
}
```

#### 2. 並行処理を活用

```typescript
// ✅ Good: 並行読み込み
await Promise.all(files.map((f) => reader.readFile(f)));

// ❌ Bad: 逐次読み込み
for (const file of files) {
  await reader.readFile(file); // 遅い
}
```

#### 3. CompilerOptionsを最適化

```typescript
// ✅ Good: 必要最小限の設定
const compilerOptions = {
  strict: true,
  skipLibCheck: true,  // 型定義ファイルをスキップ
  noEmit: true,        // 出力不要
};

// ❌ Bad: 不要な設定
const compilerOptions = {
  strict: true,
  declaration: true,   // 不要（出力しないため）
  sourceMap: true,     // 不要（出力しないため）
};
```

#### 4. Globパターンを効率的に

```typescript
// ✅ Good: 具体的なパターン
await resolver.matchFiles(["src/**/*.ts"], ["**/*.test.ts"]);

// ❌ Bad: 過度に広いパターン
await resolver.matchFiles(["**/*"]); // node_modules等も含まれる
```

#### 5. メモリ使用量の監視

```typescript
const memBefore = process.memoryUsage().heapUsed;

// 大量ファイル処理
await processFiles(files);

const memAfter = process.memoryUsage().heapUsed;
const memIncrease = (memAfter - memBefore) / 1024 / 1024;

if (memIncrease > 100) {
  console.warn(`High memory usage: ${memIncrease}MB`);
  manager.clearCache(); // キャッシュクリア
}
```

---

## まとめ

Phase 1 APIは以下を提供します：

- ✅ **高速なファイル読み込み**（Bun.file使用）
- ✅ **セキュアなパス解決**（ワークスペース境界チェック）
- ✅ **効率的なTypeScript解析**（Program再利用、キャッシング）
- ✅ **包括的なエラーハンドリング**
- ✅ **優れたパフォーマンス**（すべてのNFR達成）

次のPhaseでは、このAPIを基盤として高度なコード解析機能を実装します。

---

**関連ドキュメント**:
- [アーキテクチャ設計書](../design/code-analysis/architecture.md)
- [要件定義書](../spec/code-analysis-requirements.md)
- [技術スタック](../tech-stack.md)
- [テストドキュメント](./phase1-tests.md) (作成予定)

**バージョン履歴**:
- **1.0.0** (2025-11-01): 初版リリース - Phase 1完成
