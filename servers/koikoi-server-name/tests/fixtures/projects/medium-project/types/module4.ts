/**
 * Type definitions - Module 4
 */

export interface Entity4 {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Status4 = "active" | "inactive" | "pending";

export interface Config4 {
  enabled: boolean;
  value: number;
}
