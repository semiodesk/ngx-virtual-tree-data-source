import { BehaviorSubject, Observable, merge, Subject, of } from "rxjs";
import { map, take, takeUntil } from "rxjs/operators";
import { CollectionViewer, SelectionChange, DataSource } from "@angular/cdk/collections";
import { FlatTreeControl } from "@angular/cdk/tree";
import { TreeNode } from "./tree-node";
import { ITreeDataProvider } from "./tree-data-provider";

export class TreeDataSource extends DataSource<TreeNode> {
  private _unsubscribe$: Subject<any> = new Subject<any>();

  private _connected: boolean;

  get data(): TreeNode[] {
    return this.dataChange.value;
  }

  set data(data: TreeNode[]) {
    this.treeControl.dataNodes = data;

    this.dataChange.next(data);
  }

  /**
   * An observable that allows to subscribe to change events in the data.
   */
  dataChange = new BehaviorSubject<TreeNode[]>([]);

  /**
   * Create a new instance of the class.
   * @param dataProvider A tree node data provider.
   * @param treeControl The tree control presenting the data.
   */
  constructor(protected dataProvider: ITreeDataProvider, protected treeControl: FlatTreeControl<TreeNode>) {
    super();

    dataProvider
      .getRootNodes$()
      .pipe(take(1))
      .subscribe(nodes => (this.data = nodes));
  }

  connect(collectionViewer: CollectionViewer): Observable<TreeNode[]> {
    console.warn("connect", collectionViewer);

    if (!this._connected) {
      this._connected = true;

      this.treeControl.expansionModel.onChange.pipe(takeUntil(this._unsubscribe$)).subscribe(change => {
        let c = change as SelectionChange<TreeNode>;

        if (c.added || c.removed) {
          this.selectionChanged(c);
        }
      });
    }

    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  disconnect() {
    console.warn("disconnect");

    this._unsubscribe$.next();
  }

  select(id) {
    console.warn("select", id);
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
