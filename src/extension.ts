import * as vscode from "vscode";
import { DropEditorProvider } from "./dropEditorProvider";
import { ActivityBar } from "./activityBar";
import { SearchViewProvider } from "./views/searchView";

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = { language: "typescript" };
  context.subscriptions.push(
    vscode.languages.registerDocumentDropEditProvider(selector, new DropEditorProvider())
  );
  new ActivityBar(context);
  vscode.window.registerWebviewViewProvider(
    SearchViewProvider.viewId,
    new SearchViewProvider(context),
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }
  );
}

export function deactivate() {}
