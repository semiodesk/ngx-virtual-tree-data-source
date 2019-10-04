import { Observable } from "rxjs";
import { TreeNode } from "./tree-node";

/**
 * Exposes a minimal set of tree node data which is required to identify and render tree nodes.
 */
export interface TreeNodeInfo {
  /**
   * Node identifier.
   */
  id: string;

  /**
   * Number of child nodes.
   */
  childrenCount: number;
}

/**
 * Exposes methods for retrieving tree nodes in a virtualized tree view.
 */
export interface TreeDataProvider {
  /**
   * Get tree nodes with full node data.
   * @param parentId Return child nodes of the node with the given id. Leave undefined to get root nodes.
   * @param startIndex Offset index relative to the first child node.
   * @param itemCount Number of items to return.
   */
  getNodes$(parentId?: string, startIndex?: number, itemCount?: number): Observable<TreeNode[]>;

  /**
   * Get a minimum amount of information about tree nodes.
   * @param parentId Return child nodes of the node with the given id. Leave undefined to get root nodes.
   * @param startIndex Offset index relative to the first child node.
   * @param itemCount Number of items to return.
   */
  getNodeInfos$(parentId?: string, startIndex?: number, itemCount?: number): Observable<TreeNodeInfo[]>;

  /**
   * Get the number of child nodes for a given parent.
   * @param parentId Return child nodes of the node with the given id. Leave undefined to get root nodes.
   */
  getNodeCount$(parentId?: string): Observable<number>;

  /**
   * Get the parent nodes on a single path down to a root node.
   * @param nodeId Return parent nodes of the node with the given id.
   */
  getParentNodes$(nodeId: string): Observable<TreeNode[]>;
}
