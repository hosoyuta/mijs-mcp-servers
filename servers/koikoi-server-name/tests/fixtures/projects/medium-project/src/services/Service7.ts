/**
 * Service - Business Logic 7
 */

import { Model7 } from "../models/Model7";
import { Entity7, Status7 } from "../../types/module7";

export class Service7 {
  private model: Model7;

  constructor() {
    this.model = new Model7();
  }

  async create(data: Omit<Entity7, "id">): Promise<Entity7> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity7 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity7[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity7>
  ): Promise<Entity7 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
