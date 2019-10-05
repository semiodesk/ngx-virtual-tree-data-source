import { BehaviorSubject, Observable, Subject, timer, concat, of } from "rxjs";
import { takeUntil, debounce, switchMap, map, concatAll, filter, tap } from "rxjs/operators";
import { DataSource, CollectionViewer, ListRange } from "@angular/cdk/collections";
import { TreeNode } from "./tree-node";
import { TreeDataProvider } from "./tree-data-provider";
import { TreeDataProxy } from "./tree-data-proxy";

/**
 * Data source for a virtualized tree view.
 */
export class TreeDataSource extends DataSource<TreeNode> {
  private _unsubscribe$: Subject<any> = new Subject<any>();

  private _initialized: boolean = false;

  private _range: ListRange;

  /**
   * All rendered nodes in the tree.
   */
  get nodes(): TreeNode[] {
    return this.nodes$ ? this.nodes$.value : [];
  }

  set nodes(data: TreeNode[]) {
    this.nodes$.next(data);

    if (this._range) {
      this.loadNodes$.next(this._range);
    }
  }

  /**
   * Observable which allows to subscribe to change events in the nodes.
   */
  nodes$: BehaviorSubject<TreeNode[]> = new BehaviorSubject<TreeNode[]>(this.nodes);

  /**
   * Observable which is emits the data range when nodes need to be loaded.
   */
  loadNodes$: Subject<ListRange> = new Subject<ListRange>();

  /**
   * Currently selected node.
   */
  selectedNode: TreeNode;

  /**
   * Node data cache.
   */
  proxy: TreeDataProxy;

  /**
   * Create a new instance of the class.
   * @param dataProvider A tree node data provider.
   * @param treeControl The tree control presenting the data.
   */
  constructor(dataProvider: TreeDataProvider) {
    super();

    this.proxy = new TreeDataProxy(dataProvider);
  }

  /**
   * Initialize the data source.
   * @param node If provided, loads the all parents and child nodes in the context of the given node.
   */
  initialize$(): Observable<TreeNode[]> {
    return Observable.create(observer => {
      if (this._initialized) {
        observer.error({ message: "Data source already initialized." });
        observer.complete();
      } else {
        this._initialized = true;

        this.proxy.getNodeCount$().subscribe(count => {
          this.nodes = this._createDummyNodes(count);

          observer.next(this.nodes);
          observer.complete();
        });
      }
    });
  }

  connect(collectionViewer: CollectionViewer): Observable<TreeNode[]> {
    // Load new nodes when load$ is emitted..
    this.loadNodes$.pipe(takeUntil(this._unsubscribe$)).subscribe(range => this._loadNodesInRange(range));

    // After a debounce period, load new nodes when the viewed data range has changed..
    collectionViewer.viewChange.pipe(debounce(() => timer(200))).subscribe(range => {
      this._range = range;
      this.loadNodes$.next(range);
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
  selectNode(node) {
    if (this.selectedNode) {
      this.selectedNode.selected = false;
    }

    this.selectedNode = node;

    if (this.selectedNode) {
      this.selectedNode.selected = true;
    }
  }

  /**
   * Switch between the expanded and collapsed state of a tree view node.
   * @param node Node to be toggled.
   */
  toggleNode(node: TreeNode) {
    if (!node.expandable) {
      return;
    }

    const i = this.nodes.indexOf(node);

    if (i < 0) {
      return;
    }

    if (!node.expanded) {
      this._insertChildNodes$(i + 1, node, true, true).subscribe();
    } else if (node.expanded) {
      this._removeChildNodes$(i + 1, node, true, true).subscribe();
    }
  }

  /**
   * Load the nodes in the visible range.
   * @param range Range of visible tree nodes.
   */
  private _loadNodesInRange(range: ListRange) {
    let _parentId = "";
    let _pageIndex = -1;

    this.nodes
      .slice(range.start, range.end)
      .filter(n => !n.loaded)
      .map(n => {
        let parentId = n.parent ? n.parent.id : undefined;
        let pageIndex = this.proxy.getPageIndex(n.index);

        if (parentId != _parentId || pageIndex != _pageIndex) {
          _parentId = parentId;
          _pageIndex = pageIndex;

          this.proxy.getNodes$(parentId, pageIndex).subscribe(nodes => {
            if (nodes.length > 0) {
              let offset = this.proxy.getPageOffset(n.index);

              this._updateNodes(n.parent, offset, nodes);

              this.nodes$.next(this.nodes);
            }
          });
        }
      });
  }

  /**
   * Apply the data from a set of given set of loaded nodes to dummy nodes.
   * @param parent Parent node whose children should be updated.
   * @param offset Index of the first child to be updated, relative to the first child of the parent.
   * @param data Tree nodes which data should be transferred to the dummy nodes.
   */
  private _updateNodes(parent: TreeNode, offset: number, data: TreeNode[]) {
    let nodes = this.nodes.filter(n => n.parent == parent).slice(offset, offset + data.length);

    nodes.forEach((n, i) => {
      let m = data[i];

      if (m) {
        Object.assign(n, {
          id: m.id,
          data: m.data,
          childrenCount: m.childrenCount
        });
      }
    });
  }

  /**
   * Create dummy nodes for all parent and child nodes in the context of a given node.
   * @param node A tree node.
   */
  loadNodeContext$(node: TreeNode): Observable<TreeNode> {
    return Observable.create(observer => {
      let i = this.nodes.indexOf(node);

      if (i == -1) {
        concat(
          this.proxy.getParentNodes$(node.id).pipe(
            map(parents => parents.concat(node)),
            switchMap(parents =>
              parents.map(n =>
                this.proxy.getNodeInfos$(n.parent ? n.parent.id : undefined).pipe(
                  map(infos => {
                    let x = -1;
                    let y = n.parent ? this.nodes.findIndex(m => m.id == n.parent.id) + 1 : 0;

                    infos.forEach((info, z) => {
                      let m = this.nodes[y + z];

                      m.id = info.id;
                      m.childrenCount = info.childrenCount;

                      if (m.id == n.id) {
                        x = y + z;
                      }
                    });

                    return x;
                  }),
                  filter(x => x > -1),
                  switchMap(x => this._insertChildNodes$(x + 1, this.nodes[x], false, false))
                )
              )
            ),
            concatAll()
          )
        ).subscribe({
          complete: () => {
            this.nodes$.next(this.nodes);

            observer.next(this.nodes.filter(n => n.id == node.id)[0]);
            observer.complete();
          }
        });
      } else {
        observer.next(this.nodes[i]);
        observer.complete();
      }
    });
  }

  /**
   * Load children of a given node and insert them at a given position in the data array.
   * @param index Position in the node array where the child nodes should be inserted.
   * @param parent Parent node for which to the chilrden should be loaded.
   * @param emitNodes Indicates if the this.nodes$ should be emitted.
   * @param emitLoad Inidcates if the this.load$ should be emitted.
   */
  private _insertChildNodes$(
    index: number,
    parent: TreeNode,
    emitNodes: boolean,
    emitLoad: boolean
  ): Observable<number> {
    parent.loading = true;

    let parentId = parent ? parent.id : undefined;

    // Either take the children count from the chached tree node or retrieve it from the data provider.
    let n$ = parent.childrenCount > -1 ? of(parent.childrenCount) : this.proxy.getNodeCount$(parentId);

    // Insert unloaded dummy nodes for the number of children.
    return n$.pipe(
      tap(n => {
        this.nodes.splice(index, 0, ...this._createDummyNodes(n, parent));

        parent.loading = false;
        parent.expanded = true;

        if (emitNodes) {
          this.nodes$.next(this.nodes);
        }

        if (emitLoad) {
          this.loadNodes$.next(this._range);
        }
      })
    );
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
   * @param index Position in the node array where the child nodes should be removed.
   * @param parent Parent node whose children should be removed.
   * @param emitNodes Indicates if the this.nodes$ should be emitted.
   * @param emitLoad Inidcates if the this.load$ should be emitted.
   */
  private _removeChildNodes$(
    index: number,
    parent: TreeNode,
    emitNodes: boolean,
    emitLoad: boolean
  ): Observable<number> {
    parent.loading = true;

    return Observable.create(observer => {
      let n = 0;
      let i = index;

      while (i < this.nodes.length && this.nodes[i].level > parent.level) {
        n++;
        i++;
      }

      if (n > 0) {
        this.nodes.splice(index, n);
      }

      parent.loading = false;
      parent.expanded = false;

      if (emitNodes) {
        this.nodes$.next(this.nodes);
      }

      if (emitLoad) {
        this.loadNodes$.next(this._range);
      }

      observer.next(n);
      observer.complete();
    });
  }
}
