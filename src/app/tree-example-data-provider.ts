import { ITreeNodeBase, ITreeNode, TreeNode } from "./components/tree/tree-node";
import { ITreeDataProvider } from "./components/tree/tree-data-provider";
import { TreeNodeGenerator } from "./tree-node-generator";
import { Observable } from "rxjs";

interface TreeNodeMap {
  [id: string]: ITreeNode[];
}

export class ExampleTreeDataProvider implements ITreeDataProvider {
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

  getNodes$(parent?: ITreeNode, startIndex?: number, itemCount?: number): Observable<ITreeNode[]> {
    if (!parent) {
      return this.getRootNodes$(startIndex, itemCount);
    } else {
      return this.getChildNodes$(parent, startIndex, itemCount);
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

  getChildNodes$(parent?: ITreeNode, startIndex = -1, itemCount = -1): Observable<ITreeNode[]> {
    let delay = this._getDelay();

    console.warn("getChildNodes$", parent, startIndex, itemCount, delay.toFixed(0) + "ms");

    return Observable.create(observer => {
      setTimeout(() => {
        let children = this._childNodes[parent ? parent.id : undefined];

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

  getNodeInfos$(parent?: ITreeNode, startIndex?: number, itemCount?: number): Observable<ITreeNodeBase[]> {
    let delay = this._getDelay();

    console.warn("getNodeInfos$", parent ? parent.id : undefined, startIndex, itemCount, delay.toFixed(0) + "ms");

    return Observable.create(observer => {
      setTimeout(() => {
        if (parent) {
          let children = this._childNodes[parent ? parent.id : undefined];

          if (children) {
            observer.next(children.map(n => ({ id: n.id, expandable: n.expandable })));
          }
        } else if (this._rootNodes) {
          observer.next(this._rootNodes.map(n => ({ id: n.id, expandable: n.expandable })));
        }

        observer.complete();
      }, delay);
    });
  }

  getParentNodes$(node: ITreeNode): Observable<ITreeNode[]> {
    let delay = this._getDelay();

    console.warn("getParentNodes$", node, delay.toFixed(0) + "ms");

    return Observable.create(observer => {
      setTimeout(() => {
        observer.next(this._getParentNodes(node));
        observer.complete();
      }, delay);
    });
  }

  _getParentNodes(node: ITreeNode): ITreeNode[] {
    let parents = this._parentNodes[node.id];

    if (parents && parents.length > 0) {
      return this._getParentNodes(parents[0]).concat(parents[0]);
    } else {
      return [];
    }
  }
}
