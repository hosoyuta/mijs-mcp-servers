/**
 * Service - Business Logic 6
 */

import { Model6 } from "../models/Model6";
import { Entity6, Status6 } from "../../types/module6";

export class Service6 {
  private model: Model6;

  constructor() {
    this.model = new Model6();
  }

  async create(data: Omit<Entity6, "id">): Promise<Entity6> {
    return this.model.create(data);
  }

  async getById(id: string): Promise<Entity6 | undefined> {
    return this.model.findById(id);
  }

  async getAll(): Promise<Entity6[]> {
    return this.model.findAll();
  }

  async update(
    id: string,
    updates: Partial<Entity6>
  ): Promise<Entity6 | undefined> {
    return this.model.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.model.delete(id);
  }

  async count(): Promise<number> {
    return this.model.findAll().length;
  }
}
