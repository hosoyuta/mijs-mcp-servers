/**
 * UI Component 7
 */

import { Entity7 } from "../../types/module7";

export interface Component7Props {
  data: Entity7[];
  onSelect?: (item: Entity7) => void;
  className?: string;
}

export class Component7 {
  private props: Component7Props;

  constructor(props: Component7Props) {
    this.props = props;
  }

  render(): string {
    return `Component7: ${this.props.data.length} items`;
  }

  handleClick(item: Entity7): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity7[] {
    return this.props.data;
  }
}
