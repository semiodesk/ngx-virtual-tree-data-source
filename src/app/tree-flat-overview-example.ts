import { FlatTreeControl } from "@angular/cdk/tree";
import { Component, ViewChild, OnDestroy, AfterViewInit } from "@angular/core";
import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { TreeNode } from "./tree-node";
import { ListRange } from "@angular/cdk/collections";
import { TreeDataSource } from "./tree-data-source";
import { ExampleTreeDataProvider } from "./tree-data-provider";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "tree-flat-overview-example",
  templateUrl: "tree-flat-overview-example.html",
  styleUrls: ["tree-flat-overview-example.css"]
})
export class TreeFlatOverviewExample implements OnDestroy, AfterViewInit {
  private _unsubscribe$: Subject<any> = new Subject<any>();

  treeControl: FlatTreeControl<TreeNode>;

  dataSource: TreeDataSource;

  /**
   * The Angular CDK virtual scroll viewport.
   */
  @ViewChild(CdkVirtualScrollViewport, { static: true })
  virtualScroll: CdkVirtualScrollViewport;

  range$: Subject<ListRange> = new Subject<ListRange>();

  constructor() {
    this.treeControl = new FlatTreeControl<TreeNode>(this._getLevel, this._isExpandable);
    this.dataSource = new TreeDataSource(this.treeControl, new ExampleTreeDataProvider(), this.range$);
  }

  private _getLevel = (node: TreeNode) => node.level;

  private _isExpandable = (node: TreeNode) => node.expandable;

  hasChild = (_: number, node: TreeNode) => node.expandable;

  getLabel = (node: TreeNode) => node.data;

  ngAfterViewInit() {
    console.warn(this.virtualScroll);

    this.virtualScroll.renderedRangeStream.subscribe(range => {
      this.range$.next(range);
    });
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
  }

  select(node: TreeNode) {
    node.selected = true;
  }
}
