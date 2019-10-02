export class TreeNode {
  id: string;
  data: any;
  level: number = 0;
  index: number = 0;
  expandable: boolean;
  expanded: boolean = false;
  selectable: boolean = false;
  selected: boolean = false;
  loaded: boolean = false;
  loading: boolean = false;
  parent: TreeNode;
  childrenCount: number = 0;

  constructor(parent?: TreeNode, init?: Partial<TreeNode>) {
    if (parent) {
      this.parent = parent;
      this.level = parent.level + 1;
    }

    if (init) {
      Object.assign(this, init);
    }
  }

  getParentId() {
    return this.parent ? this.parent.id : 'undefined';
  }
  
  getPageIndex(pageSize: number) {
    return Math.floor(this.index / pageSize);
  }

  getDataOffset(pageSize: number) {
    return this.getPageIndex(pageSize) * pageSize;
  }
}
