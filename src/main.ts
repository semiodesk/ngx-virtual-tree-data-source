import "./polyfills";
import { ScrollDispatchModule } from "@angular/cdk/scrolling";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatRippleModule, MatProgressBarModule } from "@angular/material";
import { BrowserModule } from "@angular/platform-browser";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { TreeExample } from "./app/tree-example";
import { components } from "./app/components";

@NgModule({
  exports: [
    ScrollDispatchModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatProgressBarModule
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
  entryComponents: [TreeExample],
  declarations: [TreeExample, ...components],
  bootstrap: [TreeExample],
  providers: []
})
export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule);
