/**
 * UI Component 9
 */

import { Entity9 } from "../../types/module9";

export interface Component9Props {
  data: Entity9[];
  onSelect?: (item: Entity9) => void;
  className?: string;
}

export class Component9 {
  private props: Component9Props;

  constructor(props: Component9Props) {
    this.props = props;
  }

  render(): string {
    return `Component9: ${this.props.data.length} items`;
  }

  handleClick(item: Entity9): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity9[] {
    return this.props.data;
  }
}
