import { Component, Input } from "@angular/core";
import { TreeNode } from "../tree/tree-node";

@Component({
  selector: "ngx-tree-node",
  templateUrl: "tree-node.component.html",
  styleUrls: ["tree-node.component.scss"]
})
export class TreeNodeComponent {
  @Input()
  node: TreeNode;

  @Input()
  indent: number = 16;
}
