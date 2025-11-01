/**
 * UI Component 5
 */

import { Entity5 } from "../../types/module5";

export interface Component5Props {
  data: Entity5[];
  onSelect?: (item: Entity5) => void;
  className?: string;
}

export class Component5 {
  private props: Component5Props;

  constructor(props: Component5Props) {
    this.props = props;
  }

  render(): string {
    return `Component5: ${this.props.data.length} items`;
  }

  handleClick(item: Entity5): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity5[] {
    return this.props.data;
  }
}
