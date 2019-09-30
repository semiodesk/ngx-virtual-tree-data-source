export class TreeNode {
  id: string;
  data: any = null;
  level: number = 0;
  index: number = 0;
  expandable: boolean;
  expanded: boolean = false;
  selectable: boolean = false;
  selected: boolean = false;
  loaded: boolean = false;
  loading: boolean = false;
  parent: TreeNode = null;
  childrenCount: number = 0;

  public constructor(parent?: TreeNode, init?: Partial<TreeNode>) {
    if (parent) {
      this.parent = parent;
      this.level = parent.level + 1;
    }
    
    if (init) {
      Object.assign(this, init);
    }
  }
}
