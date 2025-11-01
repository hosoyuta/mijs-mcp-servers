/**
 * Service - Business Logic 4
 */

import { Model4 } from "../models/Model4";
import { Entity4, Status4 } from "../../types/module4";

export class Service4 {
  private model: Model4;

  constructor() {
    this.model = new Model4();
  }

  async create(data: Omit<Entity4, "id">): Promise<Entity4> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity4 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity4[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity4>
  ): Promise<Entity4 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
