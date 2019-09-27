import { BehaviorSubject, Observable, Subject, merge } from "rxjs";
import { map, take } from "rxjs/operators";
import { DataSource, CollectionViewer, ListRange } from "@angular/cdk/collections";
import { TreeNode } from "./tree-node";
import { ITreeDataProvider } from "./tree-data-provider";

export class TreeDataSource extends DataSource<TreeNode> {
  private _unsubscribe$: Subject<any> = new Subject<any>();

  get nodes(): TreeNode[] {
    return this.nodes$ ? this.nodes$.value : [];
  }

  set nodes(data: TreeNode[]) {
    this.nodes$.next(data);
  }

  /**
   * An observable that allows to subscribe to change events in the data.
   */
  nodes$ = new BehaviorSubject<TreeNode[]>(this.nodes);

  selectedNode: TreeNode;

  /**
   * Create a new instance of the class.
   * @param dataProvider A tree node data provider.
   * @param treeControl The tree control presenting the data.
   */
  constructor(protected dataProvider: ITreeDataProvider, protected range$: Subject<ListRange>) {
    super();

    if (dataProvider) {
      dataProvider
        .getRootNodes$()
        .pipe(take(1))
        .subscribe(nodes => (this.nodes = nodes));
    }

    if(range$) {
    }
  }

  connect(collectionViewer: CollectionViewer): Observable<TreeNode[]> {
    return merge(collectionViewer.viewChange, this.nodes$).pipe(map(() => this.nodes));
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

  /**
   * Load children of a given node and insert them at a given position in the data array.
   * @param index Position in the data array where the child nodes should be inserted.
   * @param node Parent node for which to the chilrden should be loaded.
   * @param emitDataChange Indicates if the data change event should be emitted.
   */
  private _insertChildNodes$(index: number, node: TreeNode, emitDataChange: boolean): Observable<number> {
    node.loading = true;

    return this.dataProvider.getChildNodes$(node).pipe(
      take(1),
      map(nodes => {
        this.nodes.splice(index, 0, ...nodes);

        node.loading = false;
        node.expanded = true;

        if (emitDataChange) {
          this.nodes$.next(this.nodes);
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
      }

      observer.next(n);
      observer.complete();
    });
  }
}
