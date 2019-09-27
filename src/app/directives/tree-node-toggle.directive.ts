// ./app/shared/hidden.directive.ts
import { Directive, ElementRef, Renderer, Input, OnInit } from "@angular/core";

// Directive decorator
@Directive({ selector: "[treeNodeToggle]" })
// Directive class
export class TreeNodeToggleDirective implements OnInit {
  @Input()
  treeNodeToggle: boolean;

  constructor(public element: ElementRef, public renderer: Renderer) {}

  ngOnInit() {
    this.setVisibility(this.treeNodeToggle);
  }

  ngOnChanges() {
    this.setVisibility(this.treeNodeToggle);
  }

  setVisibility(visible: boolean) {
    // Use renderer to render the element with styles
    this.renderer.setElementStyle(this.element.nativeElement, "visibility", visible ? "visible" : "hidden");
  }
}
