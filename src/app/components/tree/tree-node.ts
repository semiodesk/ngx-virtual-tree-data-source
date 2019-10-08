/**
 * Exposes basic data which is required to identify and render tree nodes.
 */
export interface ITreeNodeBase {
  /**
   * Node identifier.
   */
  id: string;

  /**
   * Indicates if the node has any child nodes.
   */
  expandable: boolean;
}

/**
 * Exposes data which is required to render, manage and interact with tree nodes.
 */
export interface ITreeNode extends ITreeNodeBase {
  /**
   * An object associated with the node.
   */
  data: any;

  /**
   * Number of parent nodes including the root node.
   */
  level: number;

  /**
   * Node which this node is subordinated.
   */
  parent: ITreeNode;

  /**
   * Indicates if the child nodes of this node are visible.
   */
  expanded: boolean;

  /**
   * Indicates if this node can be selected.
   */
  selectable: boolean;

  /**
   * Indicates if this node is selected.
   */
  selected: boolean;

  /**
   * Indicates if the data for this node is available.
   */
  loaded: boolean;

  /**
   * Indicates if data for this node is being retrieved.
   */
  loading: boolean;

  /**
   * Index in the child node list of the parent node.
   */
  index: number;
}

/**
 * A node in a tree view.
 */
export class TreeNode implements ITreeNode {
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
   * Indicates if the node has any child nodes.
   */
  expandable: boolean = false;

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
  constructor(parent?: ITreeNode, init?: Partial<ITreeNode>) {
    if (init) {
      Object.assign(this, init);
    }

    if (parent) {
      this.parent = parent;
      this.level = parent.level + 1;
    }
  }
}
