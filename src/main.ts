import "./polyfills";

import { CdkTableModule } from "@angular/cdk/table";
import { CdkTreeModule } from "@angular/cdk/tree";
import { ScrollDispatchModule } from "@angular/cdk/scrolling";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTreeModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule } from "@angular/material";
import { BrowserModule } from "@angular/platform-browser";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { TreeFlatOverviewExample } from "./app/tree-flat-overview-example";
import { TreeNodeDirective } from "./app/directives/tree-node.directive";
import { TreeNodeToggleDirective } from "./app/directives/tree-node-toggle.directive";

@NgModule({
  exports: [
    CdkTableModule,
    CdkTreeModule,
    MatButtonModule,
    MatTreeModule,
    MatIconModule,
    ScrollDispatchModule,
    MatProgressSpinnerModule
  ]
})
export class DemoMaterialModule {}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    DemoMaterialModule,
    ReactiveFormsModule
  ],
  entryComponents: [TreeFlatOverviewExample],
  declarations: [TreeFlatOverviewExample, TreeNodeDirective, TreeNodeToggleDirective],
  bootstrap: [TreeFlatOverviewExample],
  providers: [TreeNodeDirective, TreeNodeToggleDirective]
})
export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);

/**  Copyright 2018 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */
