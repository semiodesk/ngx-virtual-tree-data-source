import { TreeNode } from "./tree-node";

/**
 * Generate large amounts of tree nodes for testing.
 */
export class TreeNodeGenerator {
  /**
   * Amount of generated nodes.
   */
  nodeCount: number = 0;

  _nodeCreated: (node: TreeNode, parent?: TreeNode) => void;

  constructor(nodeCreated: (node: TreeNode, parent?: TreeNode) => void) {
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
      let n = this._createNode(this.nodeCount++);

      for (let j = 0; j < childrenCount; j++) {
        let m = this._createNode(this.nodeCount++, n, 1);

        for (let k = 0; k < childrenCount; k++) {
          this._createNode(this.nodeCount++, m, 2);
        }
      }

      result.push(n);
    }

    return result;
  }

  private _createNode(id: number, parentNode?: TreeNode, level?: number): TreeNode {
    let node = new TreeNode();
    node.id = "node:" + id;
    node.data = "Node " + id;
    node.level = level;

    if (parentNode) {
      parentNode.children.push(node);
      parentNode.expandable = true;
    }

    if (this._nodeCreated) {
      this._nodeCreated(node, parentNode);
    }

    return node;
  }
}
