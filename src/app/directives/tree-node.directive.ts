// ./app/shared/hidden.directive.ts
import { Directive, ElementRef, Renderer, Input, OnInit } from "@angular/core";
import { TreeNode } from "../tree-node";

// Directive decorator
@Directive({ selector: "[treeNode]" })
// Directive class
export class TreeNodeDirective implements OnInit {
  @Input()
  treeNode: TreeNode;

  constructor(public element: ElementRef, public renderer: Renderer) {}

  ngOnInit() {
    this.setPadding(this.treeNode);
  }

  ngOnChanges() {
    this.setPadding(this.treeNode);
  }

  setPadding(node: TreeNode) {
    if (node) {
      // Use renderer to render the element with styles
      this.renderer.setElementStyle(this.element.nativeElement, "padding-left", this.treeNode.level * 20 + "px");
    }
  }
}
