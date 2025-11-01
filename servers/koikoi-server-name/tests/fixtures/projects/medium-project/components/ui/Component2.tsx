/**
 * UI Component 2
 */

import { Entity2 } from "../../types/module2";

export interface Component2Props {
  data: Entity2[];
  onSelect?: (item: Entity2) => void;
  className?: string;
}

export class Component2 {
  private props: Component2Props;

  constructor(props: Component2Props) {
    this.props = props;
  }

  render(): string {
    return `Component2: ${this.props.data.length} items`;
  }

  handleClick(item: Entity2): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity2[] {
    return this.props.data;
  }
}
