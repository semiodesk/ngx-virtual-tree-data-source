import { Component, Input } from "@angular/core";
import { TreeNode } from "../tree/tree-node";

@Component({
  selector: "ngx-tree-node-toggle",
  templateUrl: "tree-node-toggle.component.html",
  styleUrls: ["tree-node-toggle.component.scss"]
})
export class TreeNodeToggleComponent {
  @Input()
  node: TreeNode;
}
