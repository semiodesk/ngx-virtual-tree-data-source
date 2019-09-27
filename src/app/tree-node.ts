export class TreeNode {
  id: string;
  data: any = null;
  level: number = 0;
  expandable: boolean;
  expanded: boolean = false;
  selected: boolean = false;
  loaded: boolean = false;
  loading: boolean = false;
  childrenCount: number = 0;
}