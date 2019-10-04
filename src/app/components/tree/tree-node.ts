/**
 * A node in a tree view.
 */
export class TreeNode {
  /**
   * Node identifier.
   */
  id: string;

  /**
   * An object associated with the node.
   */
  data: any;

  /**
   * Number of parent nodes including the root node.
   */
  level: number = 0;

  /**
   * Node which this node is subordinated.
   */
  parent: TreeNode;

  /**
   * Number of child nodes.
   */
  childrenCount: number = -1;

  /**
   * Indicates if the node has any child nodes.
   */
  get expandable(): boolean {
    return this.childrenCount > 0;
  }

  /**
   * Indicates if the child nodes of this node are visible.
   */
  expanded: boolean = false;

  /**
   * Indicates if this node can be selected.
   */
  selectable: boolean = false;

  /**
   * Indicates if this node is selected.
   */
  selected: boolean = false;

  /**
   * Indicates if the data for this node is available.
   */
  get loaded(): boolean {
    return this.data ? true : false;
  }

  /**
   * Indicates if data for this node is being retrieved.
   */
  loading: boolean = false;

  /**
   * Index in the child node list of the parent node.
   */
  index: number = 0;

  /**
   *
   * @param parent Parent node.
   * @param init Additional node properties to be initialized.
   */
  constructor(parent?: TreeNode, init?: Partial<TreeNode>) {
    if (init) {
      Object.assign(this, init);
    }

    if (parent) {
      this.parent = parent;
      this.level = parent.level + 1;
    }
  }
}
