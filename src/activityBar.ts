import * as vscode from "vscode";
import { searchViewEvent } from "./events";
import { IExpression, resolvePatterns } from "./utils";

class SymbolItem extends vscode.TreeItem {
  info: vscode.SymbolInformation;
  constructor(
    name: string,
    info: vscode.SymbolInformation,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(name, collapsibleState);
    this.iconPath = new vscode.ThemeIcon(`symbol-${vscode.SymbolKind[info.kind].toLowerCase()}`);
    this.info = info;
    const location = this.info.location;
    const options: vscode.TextDocumentShowOptions = {
      selection: location.range,
      // viewColumn: vscode.ViewColumn.Beside
    };
    this.command = {
      command: "vscode.open",
      arguments: [location.uri, options],
      title: "open file",
    };
  }
}

export class SymbolSearchData
  implements vscode.TreeDataProvider<SymbolItem>, vscode.TreeDragAndDropController<SymbolItem>
{
  static readonly viewId = "easy-import.symbolSearch";
  dropMimeTypes = ["application/vnd.code.tree.easyImportSymbol"];
  dragMimeTypes = ["text/uri-list"];
  private data: vscode.SymbolInformation[] = [];
  private _onDidChangeTreeData = new vscode.EventEmitter<SymbolItem | void>();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  private stopSearchToken: vscode.CancellationTokenSource = new vscode.CancellationTokenSource();
  constructor() {
    searchViewEvent.event((keyword) => {
      this.refreshData(keyword);
    });
  }

  async refreshData(keyword: string) {
    this.data = [];
    console.log("refreshData");
    // let files = await this.getFiles();
    // console.log(files, 'files');
    // for (const file of files) {
    //     let res = ((await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', file)) ||
    //         []) as vscode.SymbolInformation[];
    //     console.log(res, 'res');
    //     this.data.push(...res);
    //     this._onDidChangeTreeData.fire();
    // }
    // await vscode.workspace.findFiles('');
    // await new Promise(resolve => setTimeout(resolve, 3000));
    this.data = await vscode.commands.executeCommand(
      "vscode.executeWorkspaceSymbolProvider",
      keyword
    );
    this._onDidChangeTreeData.fire();
    console.log(this.data, "data");
  }

  async getFiles() {
    let excludePatternList: string[] = resolvePatterns(
      vscode.workspace.getConfiguration("files").get<IExpression>("exclude"),
      vscode.workspace.getConfiguration("search").get<IExpression>("exclude")
    );
    let pattern = "**/{" + excludePatternList.map((i) => i.replace("**/", "")).join(",") + "}";
    const MAX_RESULT = 3000000;
    this.stopSearchToken.cancel();
    this.stopSearchToken = new vscode.CancellationTokenSource();
    return vscode.workspace.findFiles(
      "**/*.{ts,js}",
      pattern,
      MAX_RESULT,
      this.stopSearchToken.token
    );
  }

  getChildren(element?: SymbolItem | undefined): vscode.ProviderResult<SymbolItem[]> {
    if (!element) {
      return this.data.map((item) => {
        return new SymbolItem(item.name, item, vscode.TreeItemCollapsibleState.None);
      });
    }
  }
  getTreeItem(element: SymbolItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public async handleDrag(
    source: SymbolItem[],
    treeDataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    treeDataTransfer.set(
      "application/vnd.code.tree.easyImportSymbol",
      new vscode.DataTransferItem(source.map(item => item.info))
    );
  }
}

export class ActivityBar {
  constructor(context: vscode.ExtensionContext) {
    const provider = new SymbolSearchData();
    const symbolView = vscode.window.createTreeView(SymbolSearchData.viewId, {
      treeDataProvider: provider,
      showCollapseAll: true,
      dragAndDropController: provider,
      canSelectMany: true
    });
    context.subscriptions.push(symbolView);
  }
}
