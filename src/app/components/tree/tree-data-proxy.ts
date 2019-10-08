import { ITreeNodeBase, ITreeNode } from "./tree-node";
import { ITreeDataProvider } from "./tree-data-provider";
import { Observable, of } from "rxjs";
import { tap, take } from "rxjs/operators";

/**
 * Provides cached access to tree data provider methods.
 */
export class TreeDataProxy {
  /**
   * Caches the child nodes for a node. These are organized in pages with a maximum size defined by pageSize.
   */
  private _nodes: { [key: string]: Observable<ITreeNode[]>[] } = {};

  /**
   * Caches child node data for a given parent node id.
   */
  private _nodeInfos: { [key: string]: Observable<ITreeNodeBase[]> } = {};

  /**
   * Caches the parent nodes for a node.
   */
  private _parentNodes: { [key: string]: Observable<ITreeNode[]> } = {};

  /**
   * Amount of items to retrieve from the data provider in a single request.
   */
  pageSize: number = 50;

  constructor(private _dataProvider: ITreeDataProvider) {}

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
   * @param parent Return child nodes of the node with the given id. Leave undefined to get root nodes.
   * @param pageIndex Index of the cache page to be laoded.
   */
  getNodes$(parent?: ITreeNode, pageIndex?: number): Observable<ITreeNode[]> {
    let key = parent ? parent.id : undefined;

    if (!this._nodes[key]) {
      this._nodes[key] = [];
    }

    let value = this._nodes[key][pageIndex];

    if (value === undefined) {
      value = this._dataProvider.getNodes$(parent, pageIndex * this.pageSize, this.pageSize).pipe(
        take(1),
        tap(v => (this._nodes[key][pageIndex] = of(v)))
      );

      this._nodes[key][pageIndex] = value;
    }

    return value;
  }

  /**
   * Get a minimum amount of information about tree nodes.
   * @param parent Return child nodes of the node with the given id. Leave undefined to get root nodes.
   * @param startIndex Offset index relative to the first child node.
   * @param itemCount Number of items to return.
   */
  getNodeChildrenStats(parent?: ITreeNode, startIndex?: number, itemCount?: number): Observable<ITreeNodeBase[]> {
    let key = parent ? parent.id : undefined;
    let value = this._nodeInfos[key];

    if (!value) {
      value = this._dataProvider.getNodeInfos$(parent).pipe(
        take(1),
        tap(v => (this._nodeInfos[key] = of(v)))
      );

      this._nodeInfos[key] = value;
    }

    return value;
  }

  /**
   * Get the parent nodes on a single path down to a root node.
   * @param node Return parent nodes of the node with the given id.
   */
  getParentNodes$(node: ITreeNode): Observable<ITreeNode[]> {
    let key = node ? node.id : undefined;
    let value = this._parentNodes[key];

    if (!value) {
      value = this._dataProvider.getParentNodes$(node).pipe(
        take(1),
        tap(v => (this._parentNodes[key] = of(v)))
      );

      this._parentNodes[key] = value;
    }

    return value;
  }
}
