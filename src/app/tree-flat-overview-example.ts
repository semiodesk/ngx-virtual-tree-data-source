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
  @ViewChild(CdkVirtualScrollViewport)
  virtualScroll: CdkVirtualScrollViewport;

  range: ListRange;

  constructor() {
    let dataProvider = new ExampleTreeDataProvider();

    this.treeControl = new FlatTreeControl<TreeNode>(this._getLevel, this._isExpandable);
    this.dataSource = new TreeDataSource(dataProvider, this.treeControl);
  }

  private _getLevel = (node: TreeNode) => node.level;

  private _isExpandable = (node: TreeNode) => node.expandable;

  hasChild = (_: number, node: TreeNode) => node.expandable;

  getLabel = (node: TreeNode) => node.data;

  ngAfterViewInit() {
    this.virtualScroll.renderedRangeStream.pipe(takeUntil(this._unsubscribe$)).subscribe(range => {
      this.range = range;
    });
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
  }
}
