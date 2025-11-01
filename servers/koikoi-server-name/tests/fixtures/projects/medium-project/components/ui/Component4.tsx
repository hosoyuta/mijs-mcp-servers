/**
 * UI Component 4
 */

import { Entity4 } from "../../types/module4";

export interface Component4Props {
  data: Entity4[];
  onSelect?: (item: Entity4) => void;
  className?: string;
}

export class Component4 {
  private props: Component4Props;

  constructor(props: Component4Props) {
    this.props = props;
  }

  render(): string {
    return `Component4: ${this.props.data.length} items`;
  }

  handleClick(item: Entity4): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity4[] {
    return this.props.data;
  }
}
