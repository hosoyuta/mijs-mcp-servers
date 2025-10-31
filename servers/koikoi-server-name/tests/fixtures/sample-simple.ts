/**
 * Sample simple TypeScript file for testing
 * Contains basic function definitions
 */

/**
 * ユーザー情報
 */
interface User {
  id: string;
  name: string;
  email?: string;
}

/**
 * ユーザーを取得する
 * @param id ユーザーID
 * @returns ユーザー情報
 */
export function getUser(id: string): User {
  return {
    id,
    name: "Test User",
    email: "test@example.com"
  };
}

/**
 * 2つの数値を加算する
 * @param a 数値A
 * @param b 数値B
 * @returns 合計
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * 配列の合計を計算する
 * @param numbers 数値の配列
 * @returns 合計値
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
