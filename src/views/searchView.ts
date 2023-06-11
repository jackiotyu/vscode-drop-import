import * as vscode from 'vscode';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { searchViewEvent } from '../events';

export class SearchViewProvider implements vscode.WebviewViewProvider {
    static readonly viewId = 'easy-import.searchView';
    private _context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._context.extensionUri, 'dist'),
                vscode.Uri.joinPath(this._context.extensionUri, 'dist-web'),
            ]
        };
        webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._context.extensionUri);
        webviewView.webview.onDidReceiveMessage(e => {
          if(e.method === 'search') {
            searchViewEvent.fire(e.params as string);
          }
        });
        webviewView.show();
    }

      /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the Vue webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    let stylesUri: vscode.Uri | string = getUri(webview, extensionUri, ["dist-web", "assets", "index.css"]);
    let scriptUri: vscode.Uri | string = getUri(webview, extensionUri, ["dist-web", "assets", "index.js"]);
    let connectScp = ';';
    let hotScript: string = '';
    let nonce = webview.cspSource;

    if(process.env.NODE_ENV !== 'production') {
        const scriptHost = `http://localhost:5173`;
        scriptUri = `${scriptHost}/src/main.ts`;
        hotScript = `<script type="module" src="${scriptHost}/@vite/client"></script>`;
        nonce = 'http://localhost:5173';
        connectScp = 'connect-src \'self\'';
        stylesUri = '';
    }

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src *; style-src 'self' 'unsafe-inline' ${webview.cspSource}; script-src ${nonce}; ">
          ${hotScript}
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
        </head>
        <body>
          <div id="app"></div>
          <script type="module" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}