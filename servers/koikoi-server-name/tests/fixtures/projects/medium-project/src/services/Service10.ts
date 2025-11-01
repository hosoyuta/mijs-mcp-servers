/**
 * Service - Business Logic 10
 */

import { Model10 } from "../models/Model10";
import { Entity10, Status10 } from "../../types/module10";

export class Service10 {
  private model: Model10;

  constructor() {
    this.model = new Model10();
  }

  async create(data: Omit<Entity10, "id">): Promise<Entity10> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity10 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity10[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity10>
  ): Promise<Entity10 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
