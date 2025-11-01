/**
 * Type definitions - Module 3
 */

export interface Entity3 {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Status3 = "active" | "inactive" | "pending";

export interface Config3 {
  enabled: boolean;
  value: number;
}
