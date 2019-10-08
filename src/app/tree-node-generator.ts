import { TreeNode } from "./components/tree/tree-node";

/**
 * Generate large amounts of tree nodes for testing.
 */
export class TreeNodeGenerator {
  /**
   * Amount of generated nodes.
   */
  nodeCount: number = 0;

  _nodeCreated: (node: TreeNode, parent?: TreeNode) => void;

  constructor(nodeCreated: (node: TreeNode, parent?: TreeNode, children?: TreeNode[]) => void) {
    this._nodeCreated = nodeCreated;
  }

  /**
   * Generates a tree node structure with a depth of 3 nodes.
   * @param rootCount Amount of root nodes to generate.
   * @param childrenCount Amount of child nodes to generate for each parent node.
   */
  public generate(rootCount: number, childrenCount: number): TreeNode[] {
    let result = [];

    for (let i = 0; i < rootCount; i++) {
      let n = this._createNode(this.nodeCount++, childrenCount);

      for (let j = 0; j < childrenCount; j++) {
        let m = this._createNode(this.nodeCount++, childrenCount, n, 1);

        for (let k = 0; k < childrenCount; k++) {
          this._createNode(this.nodeCount++, 0, m, 2);
        }
      }

      result.push(n);
    }

    return result;
  }

  private _createNode(id: number, childrenCount: number, parentNode?: TreeNode, level: number = 0): TreeNode {
    let node = new TreeNode();
    node.id = "node:" + id;
    node.data = "Node " + id;
    node.level = level;
    node.parent = parentNode;
    node.expandable = childrenCount > 0;
    node.loading = false;
    node.expanded = false;

    if (this._nodeCreated) {
      this._nodeCreated(node, parentNode);
    }

    return node;
  }
}
