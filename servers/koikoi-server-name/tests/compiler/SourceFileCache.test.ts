/**
 * SourceFileCache tests
 * TDD Red Phase: Test cases for SourceFileCache implementation
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { SourceFileCache } from "../../src/compiler/SourceFileCache";
import { resolve } from "path";
import { writeFile, unlink } from "fs/promises";

describe("SourceFileCache", () => {
  const testWorkspace = resolve(process.cwd(), "tests/fixtures");

  test("SourceFileをキャッシュ", async () => {
    const cache = new SourceFileCache();
    const filePath = resolve(testWorkspace, "sample-simple.ts");

    const sourceFile1 = await cache.get(filePath);
    const sourceFile2 = await cache.get(filePath);

    // 同じインスタンスが返される
    expect(sourceFile1).toBe(sourceFile2);
  });

  test("異なるファイルは異なるSourceFileを返す", async () => {
    const cache = new SourceFileCache();
    const file1 = resolve(testWorkspace, "sample-simple.ts");
    const file2 = resolve(testWorkspace, "sample-class.ts");

    const sourceFile1 = await cache.get(file1);
    const sourceFile2 = await cache.get(file2);

    expect(sourceFile1).not.toBe(sourceFile2);
    expect(sourceFile1.fileName).toContain("sample-simple.ts");
    expect(sourceFile2.fileName).toContain("sample-class.ts");
  });

  test("キャッシュヒットが10ms以内", async () => {
    const cache = new SourceFileCache();
    const filePath = resolve(testWorkspace, "sample-simple.ts");

    // 初回読み込み (キャッシュミス)
    await cache.get(filePath);

    // 2回目 (キャッシュヒット)
    const start = Date.now();
    await cache.get(filePath);
    const elapsed = Date.now() - start;

    // キャッシュヒットは非常に高速
    expect(elapsed).toBeLessThan(10);
  });

  test("キャッシュを無効化できる", async () => {
    const cache = new SourceFileCache();
    const filePath = resolve(testWorkspace, "sample-simple.ts");

    const sourceFile1 = await cache.get(filePath);

    // キャッシュ無効化
    await cache.invalidate(filePath);

    const sourceFile2 = await cache.get(filePath);

    // 新しいインスタンスが作成される
    expect(sourceFile1).not.toBe(sourceFile2);
  });

  test("全キャッシュをクリアできる", async () => {
    const cache = new SourceFileCache();
    const file1 = resolve(testWorkspace, "sample-simple.ts");
    const file2 = resolve(testWorkspace, "sample-class.ts");

    const sourceFile1 = await cache.get(file1);
    const sourceFile2 = await cache.get(file2);

    // 全クリア
    cache.clear();

    const sourceFile3 = await cache.get(file1);
    const sourceFile4 = await cache.get(file2);

    // 新しいインスタンスが作成される
    expect(sourceFile1).not.toBe(sourceFile3);
    expect(sourceFile2).not.toBe(sourceFile4);
  });

  test("LRUキャッシュが機能する", async () => {
    // サイズ3のキャッシュを作成
    const cache = new SourceFileCache(3);
    const file1 = resolve(testWorkspace, "sample-simple.ts");
    const file2 = resolve(testWorkspace, "sample-class.ts");
    const file3 = resolve(testWorkspace, "sample-types.ts");
    const file4 = resolve(testWorkspace, "sample-error.ts");

    const sourceFile1 = await cache.get(file1);
    const sourceFile2 = await cache.get(file2);
    const sourceFile3 = await cache.get(file3);

    // file4を追加 → file1が削除されるはず（最も古いエントリ）
    await cache.get(file4);

    // file1を再取得 → 新しいインスタンスになる（キャッシュから削除されている）
    const sourceFile1New = await cache.get(file1);
    expect(sourceFile1).not.toBe(sourceFile1New);

    // file2とfile3は残っているはず（ただしfile1追加でfile2が削除される）
    const sourceFile3Same = await cache.get(file3);
    expect(sourceFile3).toBe(sourceFile3Same);
  });

  test("複数回呼び出してもパフォーマンスが良好", async () => {
    const cache = new SourceFileCache();
    const filePath = resolve(testWorkspace, "sample-simple.ts");

    // 初回読み込み
    await cache.get(filePath);

    // 100回連続で呼び出してもキャッシュが効く
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      await cache.get(filePath);
    }
    const elapsed = Date.now() - start;

    // 100回でも1秒以内（キャッシュが効いている）
    expect(elapsed).toBeLessThan(1000);
  });

  test("TypeScript SourceFileが正しく作成される", async () => {
    const cache = new SourceFileCache();
    const filePath = resolve(testWorkspace, "sample-simple.ts");

    const sourceFile = await cache.get(filePath);

    expect(sourceFile).toBeDefined();
    expect(sourceFile.fileName).toBeDefined();
    expect(sourceFile.text).toBeDefined();
    expect(typeof sourceFile.getLineAndCharacterOfPosition).toBe("function");
  });

  test("存在しないファイルでエラー", async () => {
    const cache = new SourceFileCache();
    const filePath = resolve(testWorkspace, "non-existent-file.ts");

    // 存在しないファイルへのアクセスでエラー
    await expect(cache.get(filePath)).rejects.toThrow();
  });
});
