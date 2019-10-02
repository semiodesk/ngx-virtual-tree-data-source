import { BehaviorSubject, Observable, Subject, merge, timer } from "rxjs";
import { map, take, takeUntil, debounce } from "rxjs/operators";
import { DataSource, CollectionViewer, ListRange } from "@angular/cdk/collections";
import { TreeNode } from "./tree-node";
import { ITreeDataProvider } from "./tree-data-provider";

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

  cache: { [key: string]: TreeNode[][] } = {};

  pageSize: number = 30;

  /**
   * Create a new instance of the class.
   * @param dataProvider A tree node data provider.
   * @param treeControl The tree control presenting the data.
   */
  constructor(protected dataProvider: ITreeDataProvider) {
    super();

    if (dataProvider) {
      dataProvider
        .getNodeCount$()
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

    const i = this.nodes.indexOf(node);

    if (i < 0) {
      return;
    }

    if (!node.expanded) {
      this._insertChildNodes$(i + 1, node, true)
        .pipe(take(1))
        .subscribe();
    } else if (node.expanded) {
      this._removeChildNodes$(i + 1, node, true)
        .pipe(take(1))
        .subscribe();
    }
  }

  /**
   * Load the nodes in the visible range.
   * @param range Range of visible tree nodes.
   */
  private _loadNodes(range: ListRange) {
    let _parentId = "";
    let _pageIndex = -1;

    this.nodes
      .slice(range.start, range.end)
      .filter(n => !n.loaded)
      .map(n => {
        let parentId = n.getParentId();

        if (!this.cache[parentId]) {
          this.cache[parentId] = [];
        }

        let pageIndex = n.getPageIndex(this.pageSize);

        if (parentId != _parentId || pageIndex != _pageIndex) {
          _parentId = parentId;
          _pageIndex = pageIndex;

          let dataOffset = n.getDataOffset(this.pageSize);
          let page = this.cache[parentId][pageIndex];

          if (page === undefined) {
            this.cache[parentId][pageIndex] = [];

            this.dataProvider
              .getNodes$(n.parent, dataOffset, this.pageSize)
              .pipe(take(1))
              .subscribe(data => {
                this.cache[parentId][pageIndex] = data;

                this.__updateNodes(n.parent, dataOffset, data);
              });
          } else if (page.length > 0) {
            this.__updateNodes(n.parent, dataOffset, page);
          }
        }
      });
  }

  private __updateNodes(parent: TreeNode, offset: number, data: TreeNode[]) {
    let nodes = this.nodes.filter(n => n.parent == parent).slice(offset, offset + data.length);
    let modified = false;

    console.warn(nodes);

    nodes.forEach((n, i) => {
      let m = data[i];

      if (m) {
        this.nodes[this.nodes.indexOf(n)] = m;

        modified = true;
      }
    });

    if (modified) {
      this.nodes$.next(this.nodes);
    }
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
      // Call getNodeCount$ here..
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
        console.warn("Removing nodes:", n);
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
