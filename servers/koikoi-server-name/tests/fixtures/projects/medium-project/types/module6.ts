/**
 * Type definitions - Module 6
 */

export interface Entity6 {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Status6 = "active" | "inactive" | "pending";

export interface Config6 {
  enabled: boolean;
  value: number;
}
