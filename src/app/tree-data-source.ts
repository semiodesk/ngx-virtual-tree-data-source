import { BehaviorSubject, Observable, Subject, merge, timer } from "rxjs";
import { map, take, takeUntil, debounce } from "rxjs/operators";
import { DataSource, CollectionViewer, ListRange } from "@angular/cdk/collections";
import { TreeNode } from "./tree-node";
import { ITreeDataProvider } from "./tree-data-provider";

interface ITreeRange {
  [key: number]: {
    parent: TreeNode;
    nodes: TreeNode[];
    range: {
      start: number;
      end: number;
    };
  };
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

  // Todo: Do not fetch by node level, but by parent id instead.
  // Todo: Load nodes recursively.
  private _loadNodes(range: ListRange) {
    let result: ITreeRange = {};

    let currentLevel = Number.MAX_VALUE;

    // Iterate the visible nodes and return the visible ranges, grouped by node level.
    this.nodes
      .slice(range.start, range.end)
      .filter(n => !n.loaded)
      .forEach((n, i, nodes) => {
        let r = result[n.level];

        if (r) {
          r.nodes.push(n);
          r.range.end = n.index;
        } else {
          r = { parent: n.parent, nodes: [n], range: { start: n.index, end: n.index } };

          result[n.level] = r;
        }

        if (currentLevel < n.level || nodes.length - 1 == i) {
          console.warn(r.range);

          this._getNodes(r.nodes, n.parent, r.range.start, r.range.end);
        } else {
          currentLevel = n.level;
        }
      });
  }

  private _getNodes(nodes: TreeNode[], parent: TreeNode, startIndex: number, endIndex: number) {
    let count = Math.max(1, endIndex - startIndex);

    this.dataProvider
      .getNodes$(parent, startIndex, count)
      .pipe(take(1))
      .subscribe(data => {
        data.forEach((node, i) => {
          let n = nodes[i];

          if (n) {
            n.id = node.id;
            n.data = node.data;
            n.childrenCount = node.childrenCount;
            n.expandable = node.childrenCount > 0;
            n.loaded = true;
          }
        });

        this.nodes$.next(this.nodes);
      });
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
   * @param nodeCount Number of created nodes.
   * @param parentNode Parent node of the newly created nodes.
   */
  private _createDummyNodes(nodeCount: number, parentNode?: TreeNode): TreeNode[] {
    let nodes = new Array<TreeNode>(nodeCount);

    for (let i = 0; i < nodeCount; i++) {
      nodes[i] = new TreeNode(parentNode, { index: i });
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
