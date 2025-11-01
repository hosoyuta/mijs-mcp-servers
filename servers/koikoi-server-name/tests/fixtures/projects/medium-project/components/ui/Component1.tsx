/**
 * UI Component 1
 */

import { Entity1 } from "../../types/module1";

export interface Component1Props {
  data: Entity1[];
  onSelect?: (item: Entity1) => void;
  className?: string;
}

export class Component1 {
  private props: Component1Props;

  constructor(props: Component1Props) {
    this.props = props;
  }

  render(): string {
    return `Component1: ${this.props.data.length} items`;
  }

  handleClick(item: Entity1): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity1[] {
    return this.props.data;
  }
}
