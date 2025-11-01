/**
 * Type definitions - Module 2
 */

export interface Entity2 {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Status2 = "active" | "inactive" | "pending";

export interface Config2 {
  enabled: boolean;
  value: number;
}
