/**
 * Small Project - Type Definitions
 * Demonstrates basic TypeScript types and interfaces
 */

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export type UserRole = "admin" | "user" | "guest";

export interface AuthToken {
  token: string;
  expiresAt: Date;
  userId: string;
  role: UserRole;
}
