import { Observable, of, empty } from "rxjs";
import { TreeNode } from "./tree-node";
import { TreeNodeGenerator } from "./tree-node-generator";

export interface ITreeDataProvider {
  /**
   * Load the top-level nodes of a tree control.
   * @param startIndex Index of the first node in the data set.
   * @param itemCount Number of nodes to fetch.
   */
  getRootNodes$(startIndex?: number, itemCount?: number): Observable<TreeNode[]>;

  getParentNodeIds$(node: TreeNode): Observable<string[]>;

  getChildNodes$(node: TreeNode): Observable<TreeNode[]>;

  getChildNodeCount$(node: TreeNode): Observable<number>;
}

interface TreeNodeMap {
  [id: string]: TreeNode[];
}

export class ExampleTreeDataProvider implements ITreeDataProvider {
  private _delay: number = 500;

  private _data: TreeNode[];

  private _parentNodes: TreeNodeMap = {};

  private _childNodes: TreeNodeMap = {};

  constructor() {
    // Generate a total of 10.000 tree nodes with 100 root nodes.
    this._data = new TreeNodeGenerator((node, parent, children) => {
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

  getRootNodes$(startIndex: number, itemCount: number): Observable<TreeNode[]> {
    console.warn("getRootNodes$", startIndex, itemCount);

    return Observable.create(observer => {
      setTimeout(() => {
        observer.next(this._data);
      }, this._delay);
    });
  }

  getParentNodeIds$(node: TreeNode): Observable<string[]> {
    console.warn("getParentNodeIds$", node);

    return Observable.create(observer => {
      setTimeout(() => {
        let parents = this._parentNodes[node.id];

        if (parents) {
          observer.next(parents.map(n => n.id));
        } else {
          observer.empty();
        }
      }, this._delay);
    });
  }

  getChildNodes$(node: TreeNode): Observable<TreeNode[]> {
    console.warn("getChildNodes$", node);

    return Observable.create(observer => {
      setTimeout(() => {
        let children = this._childNodes[node.id];

        if (children) {
          observer.next(children);
        } else {
          observer.empty();
        }
      }, this._delay);
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
      }, this._delay);
    });
  }
}
