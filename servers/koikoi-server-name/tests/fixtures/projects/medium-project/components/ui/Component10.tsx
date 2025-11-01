/**
 * UI Component 10
 */

import { Entity10 } from "../../types/module10";

export interface Component10Props {
  data: Entity10[];
  onSelect?: (item: Entity10) => void;
  className?: string;
}

export class Component10 {
  private props: Component10Props;

  constructor(props: Component10Props) {
    this.props = props;
  }

  render(): string {
    return `Component10: ${this.props.data.length} items`;
  }

  handleClick(item: Entity10): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity10[] {
    return this.props.data;
  }
}
