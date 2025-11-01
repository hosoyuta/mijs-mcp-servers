/**
 * UI Component 8
 */

import { Entity8 } from "../../types/module8";

export interface Component8Props {
  data: Entity8[];
  onSelect?: (item: Entity8) => void;
  className?: string;
}

export class Component8 {
  private props: Component8Props;

  constructor(props: Component8Props) {
    this.props = props;
  }

  render(): string {
    return `Component8: ${this.props.data.length} items`;
  }

  handleClick(item: Entity8): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity8[] {
    return this.props.data;
  }
}
