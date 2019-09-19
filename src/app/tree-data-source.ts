import { BehaviorSubject, Observable, merge, Subject, of, Subscription } from "rxjs";
import { map, take, takeUntil } from "rxjs/operators";
import { CollectionViewer, SelectionChange, DataSource, ListRange } from "@angular/cdk/collections";
import { FlatTreeControl } from "@angular/cdk/tree";
import { TreeNode } from "./tree-node";
import { ITreeDataProvider } from "./tree-data-provider";

export class TreeDataSource extends DataSource<TreeNode> {
  private _unsubscribe$: Subject<any> = new Subject<any>();

  private _connected: boolean;

  private _subscription = new Subscription();

  private _length: number = 0;
  private _pageSize = 10;
  public CachedData: Array<TreeNode>;
  private _fetchedPages = new Set<number>();
  private _dataProvider: ITreeDataProvider;
  public dataChange: BehaviorSubject<TreeNode[] | undefined>;

  get data(): TreeNode[] {
    if( this.dataChange != null )
      return this.dataChange.value;
    return [];
  }

  set data(data: TreeNode[]) {
    this.treeControl.dataNodes = data;

    if( this.dataChange != null )
      this.dataChange.next(data);
  }

  selectedNode: TreeNode;


  /**
   * Create a new instance of the class.
   * @param dataProvider A tree node data provider.
   * @param treeControl The tree control presenting the data.
   */
  constructor(protected treeControl: FlatTreeControl<TreeNode>, protected dataProvider: ITreeDataProvider, protected range$: Subject<ListRange>) {
    super();

    this._dataProvider = dataProvider;
    dataProvider
      .getRootNodeCount$()
      .pipe(take(1))
      .subscribe(count => {
        this._length = count; 
        this.CachedData = new Array<TreeNode>(count);
        this.CachedData.fill(new TreeNode({expandable: false, loaded: false}))
        this.dataChange = new BehaviorSubject<TreeNode[] | undefined>(this.CachedData);
      });

      this.range$.subscribe(range => {
        console.log(range.start, range.end);
         const startPage = this._getPageForIndex(range.start);
         const endPage = this._getPageForIndex(range.end - 1);
         for (let i = startPage; i <= endPage; i++) {
           this._fetchPage(i);
         }
      });

  }

  connect(collectionViewer: CollectionViewer): Observable<TreeNode[] | undefined> {
    console.warn("connect", collectionViewer);

    if (!this._connected) {
      this._connected = true;

      this._subscription.add(this.treeControl.expansionModel.onChange.subscribe(change => {
        let c = change as SelectionChange<TreeNode>;

        if (c.added || c.removed) {
          this.selectionChanged(c);
        }
      }));

      
    }
    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));

  }

  private _getPageForIndex(index: number): number {
    return Math.floor(index / this._pageSize);
  }

  private _fetchPage(page: number) {
    console.log("fetch: ", page);
    if (this._fetchedPages.has(page)) {
      return;
    }
    this._fetchedPages.add(page);
   
    this._dataProvider.getRootNodes$(page * this._pageSize, this._pageSize).pipe(map(nodes => {
      console.log(nodes);
       this.CachedData.splice(page * this._pageSize, this._pageSize,
         ...nodes);
         this.dataChange.next(this.CachedData);
        })).subscribe();
     ;
  
  }

  disconnect() {
    console.warn("disconnect");
    this._subscription.unsubscribe();
    this._unsubscribe$.next();
  }

  select(node) {
    console.warn("select", node);
    
    if(this.selectedNode) {
      this.selectedNode.selected = false;
    }

    this.selectedNode = this.data.filter(n => n == node)[0];

    if(this.selectedNode) {
      this.selectedNode.selected = true;
    }
  }

  /**
   * Handle changes in the selection state of the tree view's nodes.
   * @param change Selection change data.
   */
  selectionChanged(change: SelectionChange<TreeNode>) {
    console.warn("selectionChanged", change);

    if (change.added) {
      change.added.forEach(node => this._toggleNode(node, true));
    }

    if (change.removed) {
      change.removed
        .slice()
        .reverse()
        .forEach(node => this._toggleNode(node, false));
    }
  }

  /**
   * Switch between the selected- or deselected state of a tree view node.
   * @param node Node to be selected or deselected.
   * @param expand Indicates if the node should be expanded.
   */
  private _toggleNode(node: TreeNode, expand: boolean) {
    console.warn("_toggleNode", node, expand);

    if (!node.expandable) {
      return;
    }

    const index = this.data.indexOf(node);

    if (index < 0) {
      return;
    }

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
   * Load children of a given node and insert them at a given position in the data array.
   * @param index Position in the data array where the child nodes should be inserted.
   * @param node Parent node for which to the chilrden should be loaded.
   * @param emitDataChange Indicates if the data change event should be emitted.
   */
  private _insertChildNodes$(index: number, node: TreeNode, emitDataChange: boolean): Observable<number> {
    console.warn("_insertChildNodes$", index, node);

    node.loading = true;

    return this.dataProvider.getChildNodes$(node).pipe(
      take(1),
      map(nodes => {
        this.data.splice(index, 0, ...nodes);

        node.loading = false;
        node.expanded = true;

        if (emitDataChange) {
          this.dataChange.next(this.data);
        }

        return nodes.length;
      })
    );
  }

  /**
   * Remove the children of a given tree node.
   * @param index Position in the data array where the child nodes should be removed.
   * @param node Parent node whose children should be removed.
   * @param emitDataChange Indicates if the data change event should be emitted.
   */
  private _removeChildNodes$(index: number, node: TreeNode, emitDataChange: boolean): Observable<number> {
    console.warn("_removeChildNodes$", index, node);

    node.loading = true;

    return this.dataProvider.getChildNodeCount$(node).pipe(
      map(n => {
        this.data.splice(index, n);

        node.loading = false;
        node.expanded = false;

        if (emitDataChange) {
          this.dataChange.next(this.data);
        }

        return n;
      })
    );
  }
}
