/**
 * Service - Business Logic 9
 */

import { Model9 } from "../models/Model9";
import { Entity9, Status9 } from "../../types/module9";

export class Service9 {
  private model: Model9;

  constructor() {
    this.model = new Model9();
  }

  async create(data: Omit<Entity9, "id">): Promise<Entity9> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity9 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity9[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity9>
  ): Promise<Entity9 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
