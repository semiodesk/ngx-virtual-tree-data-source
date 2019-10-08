import { Observable } from "rxjs";
import { ITreeNodeBase, ITreeNode } from "./tree-node";

/**
 * Exposes methods for retrieving tree nodes in a virtualized tree view.
 */
export interface ITreeDataProvider {
  /**
   * Get tree nodes with full node data.
   * @param parent Return child nodes of the node with the given id. Leave undefined to get root nodes.
   * @param startIndex Offset index relative to the first child node.
   * @param itemCount Number of items to return.
   */
  getNodes$(parent?: ITreeNode, startIndex?: number, itemCount?: number): Observable<ITreeNode[]>;

  /**
   * Get a minimum amount of information about tree nodes.
   * @param parent Return child nodes of the node with the given id. Leave undefined to get root nodes.
   * @param startIndex Offset index relative to the first child node.
   * @param itemCount Number of items to return.
   */
  getNodeInfos$(parent?: ITreeNode, startIndex?: number, itemCount?: number): Observable<ITreeNodeBase[]>;

  /**
   * Get the parent nodes on a single path down to a root node.
   * @param node Return parent nodes of the node with the given id.
   */
  getParentNodes$(node: ITreeNode): Observable<ITreeNode[]>;
}
