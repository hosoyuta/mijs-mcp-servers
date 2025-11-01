/**
 * UI Component 6
 */

import { Entity6 } from "../../types/module6";

export interface Component6Props {
  data: Entity6[];
  onSelect?: (item: Entity6) => void;
  className?: string;
}

export class Component6 {
  private props: Component6Props;

  constructor(props: Component6Props) {
    this.props = props;
  }

  render(): string {
    return `Component6: ${this.props.data.length} items`;
  }

  handleClick(item: Entity6): void {
    if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  getData(): Entity6[] {
    return this.props.data;
  }
}
