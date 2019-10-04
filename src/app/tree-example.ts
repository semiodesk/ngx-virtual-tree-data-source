import { Component, ViewChild, OnDestroy, AfterViewInit, ChangeDetectionStrategy } from "@angular/core";
import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { ListRange } from "@angular/cdk/collections";
import { TreeNode, TreeDataSource } from "./components/tree";
import { ExampleTreeDataProvider } from "./tree-example-data-provider";
import { Subject } from "rxjs";

@Component({
  selector: "tree-example",
  templateUrl: "tree-example.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeExample implements OnDestroy, AfterViewInit {
  private _unsubscribe$: Subject<any> = new Subject<any>();

  dataProvider: ExampleTreeDataProvider = new ExampleTreeDataProvider();

  dataSource: TreeDataSource;

  /**
   * The Angular CDK virtual scroll viewport.
   */
  @ViewChild(CdkVirtualScrollViewport, { static: true })
  virtualScroll: CdkVirtualScrollViewport;

  range$: Subject<ListRange> = new Subject<ListRange>();

  constructor() {
    let node = this.dataProvider.getRandomNode();

    this.dataSource = new TreeDataSource(this.dataProvider);
    this.dataSource.initialize$(node).subscribe(n => {
      let i = this.dataSource.nodes.findIndex(m => m.id == n.id);

      if (i > -1) {
        this.dataSource.selectNode(n);
        this.virtualScroll.scrollToIndex(Math.max(0, i));
      }
    });
  }

  ngAfterViewInit() {
    this.virtualScroll.renderedRangeStream.subscribe(range => {
      this.range$.next(range);
    });
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
  }

  select(node: TreeNode) {
    this.dataSource.selectNode(node);
  }

  toggle(node: TreeNode) {
    this.dataSource.toggleNode(node);
  }
}