/**
 * Service - Business Logic 5
 */

import { Model5 } from "../models/Model5";
import { Entity5, Status5 } from "../../types/module5";

export class Service5 {
  private model: Model5;

  constructor() {
    this.model = new Model5();
  }

  async create(data: Omit<Entity5, "id">): Promise<Entity5> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity5 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity5[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity5>
  ): Promise<Entity5 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
