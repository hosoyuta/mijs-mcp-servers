/**
 * Sample type definitions for testing
 * Contains interface, type alias, enum, and union types
 */

/**
 * ユーザーインターフェース
 */
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * ユーザーロール列挙型
 */
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest"
}

/**
 * API応答型
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

/**
 * ページネーション情報
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

/**
 * ページネーション付きAPI応答
 */
export type PaginatedResponse<T> = ApiResponse<T> & {
  pagination: Pagination;
};

/**
 * 設定オプション型
 */
export type Config = {
  apiUrl: string;
  timeout: number;
  retryCount?: number;
  headers?: Record<string, string>;
};

/**
 * ステータス型（ユニオン型）
 */
export type Status = "pending" | "processing" | "completed" | "failed";

/**
 * 結果型（判別可能なユニオン）
 */
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * アクションタイプ（リテラル型）
 */
export type Action =
  | { type: "CREATE"; payload: IUser }
  | { type: "UPDATE"; payload: Partial<IUser> }
  | { type: "DELETE"; payload: string }
  | { type: "FETCH"; payload: null };

/**
 * Readonly型のエイリアス
 */
export type ReadonlyUser = Readonly<IUser>;

/**
 * Partial型のエイリアス
 */
export type PartialUser = Partial<IUser>;

/**
 * Pick型のエイリアス
 */
export type UserCredentials = Pick<IUser, "email" | "id">;

/**
 * Omit型のエイリアス
 */
export type UserWithoutDates = Omit<IUser, "createdAt" | "updatedAt">;

/**
 * ジェネリックインターフェース
 */
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: T): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

/**
 * ユーザーリポジトリ型
 */
export type UserRepository = Repository<IUser>;

/**
 * Mapped Types の例
 */
export type Optional<T> = {
  [K in keyof T]?: T[K];
};

/**
 * Conditional Types の例
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 関数型
 */
export type Validator<T> = (value: T) => boolean;
export type Transformer<T, U> = (value: T) => U;
export type AsyncOperation<T> = () => Promise<T>;
