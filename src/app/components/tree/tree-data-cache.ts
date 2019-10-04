import { TreeNode } from "./tree-node";
import { TreeNodeInfo, TreeDataProvider } from "./tree-data-provider";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Provides cached access to tree node data provider methods.
 */
export class TreeDataCache {
  /**
   * Caches the child nodes for a node. These are organized in pages with a maximum size defined by pageSize.
   */
  nodes: { [key: string]: TreeNode[][] } = {};

  /**
   * Caches child node data for a given parent node id.
   */
  nodeInfos: { [key: string]: TreeNodeInfo[] } = {};

  /**
   * Caches the number of children for a node id.
   */
  nodeCount: { [key: string]: number } = {};

  /**
   * Caches the parent nodes for a node.
   */
  parentNodes: { [key: string]: TreeNode[] } = {};

  /**
   * Amount of items to retrieve from the data provider in a single request.
   */
  pageSize: number = 50;

  constructor(private _dataProvider: TreeDataProvider) {}

  /**
   * Get the cache page index for a node.
   * @param nodeIndex Offset from the first node in a set of child nodes.
   */
  getPageIndex(nodeIndex: number) {
    return Math.floor(nodeIndex / this.pageSize);
  }

  /**
   * Get the index of the first node in the cache page of a node.
   * @param nodeIndex Offset from the first node in a set of child nodes.
   */
  getPageOffset(nodeIndex: number) {
    return Math.floor(nodeIndex / this.pageSize) * this.pageSize;
  }

  /**
   * Get tree nodes with full node data.
   * @param parentId Return child nodes of the node with the given id. Leave undefined to get root nodes.
   * @param pageIndex Index of the cache page to be laoded.
   */
  getNodes$(parentId?: string, pageIndex?: number): Observable<TreeNode[]> {
    if (!this.nodes[parentId]) {
      this.nodes[parentId] = [];
    }

    let nodes = this.nodes[parentId][pageIndex];

    if (nodes === undefined) {
      this.nodes[parentId][pageIndex] = [];

      return this._dataProvider.getNodes$(parentId, pageIndex * this.pageSize, this.pageSize).pipe(
        tap(data => {
          this.nodes[parentId][pageIndex] = data;
        })
      );
    } else {
      return of(nodes);
    }
  }

  /**
   * Get a minimum amount of information about tree nodes.
   * @param parentId Return child nodes of the node with the given id. Leave undefined to get root nodes.
   * @param startIndex Offset index relative to the first child node.
   * @param itemCount Number of items to return.
   */
  getNodeInfos$(parentId?: string, startIndex?: number, itemCount?: number): Observable<TreeNodeInfo[]> {
    let infos = this.nodeInfos[parentId];

    return infos ? of(infos) : this._dataProvider.getNodeInfos$(parentId);
  }

  /**
   * Get the number of child nodes for a given parent.
   * @param parentId Return child nodes of the node with the given id. Leave undefined to get root nodes.
   */
  getNodeCount$(parentId?: string): Observable<number> {
    let count = this.nodeCount[parentId];

    return count ? of(count) : this._dataProvider.getNodeCount$(parentId);
  }

  /**
   * Get the parent nodes on a single path down to a root node.
   * @param nodeId Return parent nodes of the node with the given id.
   */
  getParentNodes$(nodeId: string): Observable<TreeNode[]> {
    let nodes = this.parentNodes[nodeId];

    return nodes ? of(nodes) : this._dataProvider.getParentNodes$(nodeId);
  }
}
