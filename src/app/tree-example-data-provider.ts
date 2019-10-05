import { ITreeNodeBase, ITreeNode, TreeNode } from "./components/tree/tree-node";
import { TreeDataProvider } from "./components/tree/tree-data-provider";
import { TreeNodeGenerator } from "./tree-node-generator";
import { Observable } from "rxjs";

interface TreeNodeMap {
  [id: string]: ITreeNode[];
}

export class ExampleTreeDataProvider implements TreeDataProvider {
  private _delayEnabled: boolean = true;

  private _nodes: ITreeNode[] = [];

  private _rootNodes: ITreeNode[];
  
  private _parentNodes: TreeNodeMap = {};

  private _childNodes: TreeNodeMap = {};

  nodeCount: number = 0;

  constructor() {
    const rootCount = 1000;
    const childCount = 10;

    this.nodeCount = rootCount * childCount * childCount;

    this._rootNodes = new TreeNodeGenerator((node, parent) => {
      this._nodes.push(node);

      if (parent) {
        if (!this._parentNodes[node.id]) {
          this._parentNodes[node.id] = [parent];
        } else {
          this._parentNodes[node.id].push(parent);
        }

        if (!this._childNodes[parent.id]) {
          this._childNodes[parent.id] = [node];
        } else {
          this._childNodes[parent.id].push(node);
        }
      }
    }).generate(rootCount, childCount);
  }

  public getRandomNode(): ITreeNode {
    return this._nodes[Math.floor(Math.random() * this._nodes.length)];
  }

  private _getDelay() {
    return this._delayEnabled ? Math.random() * 1000 : 0;
  }

  getNodes$(parentId: string, startIndex?: number, itemCount?: number): Observable<ITreeNode[]> {
    if (!parentId) {
      return this.getRootNodes$(startIndex, itemCount);
    } else {
      return this.getChildNodes$(parentId, startIndex, itemCount);
    }
  }

  getRootNodes$(startIndex: number = -1, itemCount: number = -1): Observable<ITreeNode[]> {
    let delay = this._getDelay();

    console.warn("getRootNodes$", startIndex, itemCount, delay.toFixed(0) + "ms");

    return Observable.create(observer => {
      setTimeout(() => {
        if (startIndex > -1 && itemCount > -1) {
          observer.next(this._rootNodes.slice(startIndex, startIndex + itemCount));
        } else {
          observer.next(this._rootNodes);
        }

        observer.complete();
      }, delay);
    });
  }

  getChildNodes$(parentId: string, startIndex = -1, itemCount = -1): Observable<ITreeNode[]> {
    let delay = this._getDelay();

    console.warn("getChildNodes$", parentId, startIndex, itemCount, delay.toFixed(0) + "ms");

    return Observable.create(observer => {
      setTimeout(() => {
        let children = this._childNodes[parentId];

        if (children) {
          if (startIndex > -1 && itemCount > -1) {
            observer.next(children.slice(startIndex, startIndex + itemCount));
          } else {
            observer.next(children);
          }
        }

        observer.complete();
      }, delay);
    });
  }

  getNodeInfos$(parentId: string, startIndex: number = -1, itemCount: number = -1): Observable<ITreeNodeBase[]> {
    let delay = this._getDelay();

    console.warn("getNodeInfos$", parentId, startIndex, itemCount, delay.toFixed(0) + "ms");

    return Observable.create(observer => {
      setTimeout(() => {
        if (parentId) {
          let children = this._childNodes[parentId];

          if (children) {
            observer.next(children.map(n => ({ id: n.id, childrenCount: n.childrenCount })));
          }
        } else if (this._rootNodes) {
          observer.next(this._rootNodes.map(n => ({ id: n.id, childrenCount: n.childrenCount })));
        }

        observer.complete();
      }, delay);
    });
  }

  getNodeCount$(parentId: string): Observable<number> {
    if (!parentId) {
      return this._getRootNodeCount$();
    } else {
      return this._getChildNodeCount$(parentId);
    }
  }

  _getRootNodeCount$(): Observable<number> {
    let delay = this._getDelay();

    console.warn("getRootNodesCount$", delay.toFixed(0) + "ms");

    return Observable.create(observer => {
      setTimeout(() => {
        observer.next(this._rootNodes.length);
        observer.complete();
      }, delay);
    });
  }

  _getChildNodeCount$(parendId: string): Observable<number> {
    let delay = this._getDelay();

    console.warn("getChildNodeCount$", parendId, delay.toFixed(0) + "ms");

    return Observable.create(observer => {
      setTimeout(() => {
        let children = this._childNodes[parendId];

        if (children) {
          observer.next(children.length);
        } else {
          observer.next(0);
        }

        observer.complete();
      }, delay);
    });
  }

  getParentNodes$(nodeId: string): Observable<ITreeNode[]> {
    let delay = this._getDelay();

    console.warn("getParentNodes$", nodeId, delay.toFixed(0) + "ms");

    return Observable.create(observer => {
      setTimeout(() => {
        observer.next(this._getParentNodes(nodeId));
        observer.complete();
      }, delay);
    });
  }

  _getParentNodes(nodeId: string): ITreeNode[] {
    let parents = this._parentNodes[nodeId];

    if (parents && parents.length > 0) {
      return this._getParentNodes(parents[0].id).concat(parents[0]);
    } else {
      return [];
    }
  }
}
