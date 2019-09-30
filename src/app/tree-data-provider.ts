import { Observable, of, empty } from "rxjs";
import { TreeNode } from "./tree-node";
import { TreeNodeGenerator } from "./tree-node-generator";

export interface ITreeDataProvider {
  getRootNodesCount$(): Observable<number>;

  getParentNodeIds$(node: TreeNode): Observable<string[]>;

  getChildNodeCount$(node: TreeNode): Observable<number>;

  getNodes$(parent: TreeNode, startIndex?: number, itemCount?: number): Observable<TreeNode[]>;
}

interface TreeNodeMap {
  [id: string]: TreeNode[];
}

export class ExampleTreeDataProvider implements ITreeDataProvider {
  private _delayEnabled: boolean = false;

  private _data: TreeNode[];

  private _parentNodes: TreeNodeMap = {};

  private _childNodes: TreeNodeMap = {};

  constructor() {
    // Generate a total of 10.000 tree nodes with 100 root nodes.
    this._data = new TreeNodeGenerator((node, parent) => {
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
    }).generate(100, 10);
  }

  private _getDelay() {
    return this._delayEnabled ? Math.random() * 1000 + 200 : 0;
  }

  getNodes$(parent: TreeNode, startIndex?: number, itemCount?: number): Observable<TreeNode[]> {
    if (!parent) {
      return this.getRootNodes$(startIndex, itemCount);
    } else {
      return this.getChildNodes$(parent, startIndex, itemCount);
    }
  }

  getRootNodes$(startIndex: number = -1, itemCount: number = -1): Observable<TreeNode[]> {
    console.warn("getRootNodes$", startIndex, itemCount);

    return Observable.create(observer => {
      setTimeout(() => {
        if (startIndex > -1 && itemCount > -1) {
          observer.next(this._data.slice(startIndex, startIndex + itemCount));
        } else {
          observer.next(this._data);
        }

        observer.complete();
      }, this._getDelay());
    });
  }

  getChildNodes$(node: TreeNode, startIndex = -1, itemCount = -1): Observable<TreeNode[]> {
    console.warn("getChildNodes$", node, startIndex, itemCount);

    return Observable.create(observer => {
      setTimeout(() => {
        let children = this._childNodes[node.id];

        if (children) {
          if (startIndex > -1 && itemCount > -1) {
            observer.next(children.slice(startIndex, startIndex + itemCount));
          } else {
            observer.next(children);
          }
        }

        observer.complete();
      }, this._getDelay());
    });
  }

  getRootNodesCount$(): Observable<number> {
    console.warn("getRootNodesCount$");

    return Observable.create(observer => {
      setTimeout(() => {
        observer.next(this._data.length);
      }, this._getDelay());
    });
  }

  getParentNodeIds$(node: TreeNode): Observable<string[]> {
    console.warn("getParentNodeIds$", node);

    return Observable.create(observer => {
      setTimeout(() => {
        let parents = this._parentNodes[node.id];

        if (parents) {
          observer.next(parents.map(n => n.id));
        }

        observer.complete();
      }, this._getDelay());
    });
  }

  getChildNodeCount$(node: TreeNode): Observable<number> {
    console.warn("getChildNodeCount$", node);

    return Observable.create(observer => {
      setTimeout(() => {
        let children = this._childNodes[node.id];

        if (children) {
          observer.next(children.length);
        } else {
          observer.next(0);
        }
      }, this._getDelay());
    });
  }
}
