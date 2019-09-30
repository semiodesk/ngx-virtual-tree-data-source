import { BehaviorSubject, Observable, Subject, merge, timer } from "rxjs";
import { map, take, takeUntil, debounce } from "rxjs/operators";
import { DataSource, CollectionViewer, ListRange } from "@angular/cdk/collections";
import { TreeNode } from "./tree-node";
import { ITreeDataProvider } from "./tree-data-provider";

class TreeRange {
  parent: TreeNode = null;

  nodes: TreeNode[] = [];

  start: number = 0;

  get end(): number {
    return this.start + this.nodes.length;
  }

  constructor(node: TreeNode = null) {
    if (node) {
      this.parent = node.parent;
      this.start = node.index;
    }
  }
}

export class TreeDataSource extends DataSource<TreeNode> {
  private _unsubscribe$: Subject<any> = new Subject<any>();

  private _range: ListRange;

  get nodes(): TreeNode[] {
    return this.nodes$ ? this.nodes$.value : [];
  }

  set nodes(data: TreeNode[]) {
    this.nodes$.next(data);

    if (this._range) {
      this.load$.next(this._range);
    }
  }

  /**
   * Observable which allows to subscribe to change events in the data.
   */
  nodes$: BehaviorSubject<TreeNode[]> = new BehaviorSubject<TreeNode[]>(this.nodes);

  /**
   * Observable which is emits the data range when nodes need to be loaded.
   */
  load$: Subject<ListRange> = new Subject<ListRange>();

  selectedNode: TreeNode;

  /**
   * Create a new instance of the class.
   * @param dataProvider A tree node data provider.
   * @param treeControl The tree control presenting the data.
   */
  constructor(protected dataProvider: ITreeDataProvider) {
    super();

    if (dataProvider) {
      dataProvider
        .getRootNodesCount$()
        .pipe(take(1))
        .subscribe(count => {
          this.nodes = this._createDummyNodes(count);
        });
    }
  }

  connect(collectionViewer: CollectionViewer): Observable<TreeNode[]> {
    // Load new nodes when load$ is emitted..
    this.load$.pipe(takeUntil(this._unsubscribe$)).subscribe(range => this._loadNodes(range));

    // After a debounce period, load new nodes when the viewed data range has changed..
    collectionViewer.viewChange.pipe(debounce(() => timer(200))).subscribe(range => {
      this._range = range;
      this.load$.next(range);
    });

    return this.nodes$;
  }

  disconnect() {
    this._unsubscribe$.next();
  }

  /**
   * Select the given node and deselect the currently selected one.
   * @param node Node to be selected.
   */
  select(node) {
    if (this.selectedNode) {
      this.selectedNode.selected = false;
    }

    this.selectedNode = node;

    if (this.selectedNode) {
      this.selectedNode.selected = true;
    }
  }

  /**
   * Switch between the selected- or deselected state of a tree view node.
   * @param node Node to be selected or deselected.
   * @param expand Indicates if the node should be expanded.
   */
  toggle(node: TreeNode) {
    if (!node.expandable) {
      return;
    }

    const index = this.nodes.indexOf(node);

    if (index < 0) {
      return;
    }

    let expand = !node.expanded;
    let i = index + 1;

    if (expand && !node.expanded) {
      this._insertChildNodes$(i, node, true)
        .pipe(take(1))
        .subscribe();
    } else if (!expand && node.expanded) {
      this._removeChildNodes$(i, node, true)
        .pipe(take(1))
        .subscribe();
    }
  }

  /**
   * Load the nodes in the visible range.
   * @param range Range of visible tree nodes.
   */
  private _loadNodes(range: ListRange) {
    // Get all the unloaded nodes in the visible range.
    let nodes = this.nodes.slice(range.start, range.end).filter(node => !node.loaded);

    if (nodes.length > 0) {
      // If there are any, load them.
      this.__loadNodes(new TreeRange(nodes[0]), nodes);
    }
  }

  /**
   * Load the nodes in the given range which have a common parent. Recursively process
   * all nodes with a different parent.
   * @param range Range of tree nodes.
   * @param nodes Array of nodes to be processed.
   *
   * @returns Number of processed nodes.
   */
  private __loadNodes(range: TreeRange, nodes: TreeNode[]): number {
    // Iterate over the given nodes.
    let i = 0;

    while (i < nodes.length) {
      let n = nodes[i];

      if (n.parent == range.parent) {
        // If we are handling the same parent node, append the node
        // to the array and proceed until the end.
        range.nodes.push(n);

        i += 1;
      } else {
        // Otherwise recurse into the new parent and advance the index
        // by the number of processed nodes.
        i += this.__loadNodes(new TreeRange(n), nodes.slice(i));
      }
    }

    if (range.nodes.length > 0) {
      // Load all the nodes in the given range from the data provider
      // and update the target nodes in the tree.
      this.dataProvider
        .getNodes$(range.parent, range.start, range.nodes.length)
        .pipe(take(1))
        .subscribe(data => {
          data.forEach((node, i) => {
            let n = range.nodes[i];

            if (n) {
              Object.assign(n, node);
            }
          });

          this.nodes$.next(this.nodes);
        });
    }

    // Return the number of handled nodes.
    return range.nodes.length;
  }

  /**
   * Load children of a given node and insert them at a given position in the data array.
   * @param index Position in the data array where the child nodes should be inserted.
   * @param node Parent node for which to the chilrden should be loaded.
   * @param emitDataChange Indicates if the data change event should be emitted.
   */
  private _insertChildNodes$(index: number, node: TreeNode, emitDataChange: boolean): Observable<number> {
    node.loading = true;

    return Observable.create(observer => {
      this.nodes.splice(index, 0, ...this._createDummyNodes(node.childrenCount, node));

      node.loading = false;
      node.expanded = true;

      if (emitDataChange) {
        this.nodes$.next(this.nodes);
        this.load$.next(this._range);
      }

      observer.next(node.childrenCount);
      observer.complete();
    });
  }

  /**
   * Create a given amount of empty, unloaded tree nodes.
   * @param count Number of created nodes.
   * @param parent Parent node of the newly created nodes.
   */
  private _createDummyNodes(count: number, parent?: TreeNode): TreeNode[] {
    let nodes = new Array<TreeNode>(count);

    for (let i = 0; i < count; i++) {
      nodes[i] = new TreeNode(parent, { index: i });
    }

    return nodes;
  }

  /**
   * Remove the children of a given tree node.
   * @param index Position in the data array where the child nodes should be removed.
   * @param node Parent node whose children should be removed.
   * @param emitDataChange Indicates if the data change event should be emitted.
   */
  private _removeChildNodes$(index: number, node: TreeNode, emitDataChange: boolean): Observable<number> {
    node.loading = true;

    return Observable.create(observer => {
      let n = 0;
      let i = index;

      while (i < this.nodes.length && this.nodes[i].level > node.level) {
        n++;
        i++;
      }

      if (n > 0) {
        this.nodes.splice(index, n);
      }

      node.loading = false;
      node.expanded = false;

      if (emitDataChange) {
        this.nodes$.next(this.nodes);
        this.load$.next(this._range);
      }

      observer.next(n);
      observer.complete();
    });
  }
}
