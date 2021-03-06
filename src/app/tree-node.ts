export class TreeNode {
  id: string;
  data: any;
  level: number;
  expandable: boolean;
  expanded: boolean = false;
  selected: boolean = false;
  loaded: boolean = false;
  loading: boolean = false;
  children: TreeNode[] = [];

  public constructor(init?:Partial<TreeNode>) {
    Object.assign(this, init);
}
}