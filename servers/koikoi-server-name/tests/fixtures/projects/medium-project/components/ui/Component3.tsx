/**
 * UI Component 3
 */

import { Entity3 } from "../../types/module3";

export interface Component3Props {
  data: Entity3[];
  onSelect?: (item: Entity3) => void;
  className?: string;
}

export class Component3 {
  private props: Component3Props;

  constructor(props: Component3Props) {
    this.props = props;
  }

  render(): string {
    return `Component3: ${this.props.data.length} items`;
  }

  handleClick(item: Entity3): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity3[] {
    return this.props.data;
  }
}
