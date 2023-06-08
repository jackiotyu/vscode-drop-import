import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    const uriListMime = 'text/uri-list';
    class DropEditorProvider implements vscode.DocumentDropEditProvider {
        async provideDocumentDropEdits(
            document: vscode.TextDocument,
            position: vscode.Position,
            dataTransfer: vscode.DataTransfer,
            token: vscode.CancellationToken,
        ): Promise<vscode.DocumentDropEdit | null | undefined> {
            const dataTransferItem = dataTransfer.get(uriListMime);
            if (!dataTransferItem) return undefined;

            const urlList = await dataTransferItem.asString();
            if (token.isCancellationRequested) return undefined;

            const uris: vscode.Uri[] = [];
            const docPath = document.uri.fsPath;
            for (const resource of urlList.split('\n')) {
                try {
                    let uri = vscode.Uri.parse(resource);
                    if(uri.fsPath === docPath) continue;
                    // if(fs.statSync(uri.fsPath).isDirectory()) continue;
                    uris.push(uri);
                } catch (err){
                    console.log(err, 'err');
                }
            }

            if (!uris.length) return undefined;

            let textList: string[] = [];
            uris.forEach((uri, index) => {
                let filePath = path.relative(path.dirname(docPath), uri.fsPath);
                let basePath = '.' + path.sep + filePath.slice(0, filePath.lastIndexOf('.'));
                textList.push(`import { $\{${index + 1}} } from "${basePath}"`);
            });

            const snippet = new vscode.SnippetString(textList.join('\n'));
            snippet.appendTabstop(1);
            return new vscode.DocumentDropEdit(snippet);
        }
    }
    const selector: vscode.DocumentSelector = { language: 'typescript' };
    context.subscriptions.push(vscode.languages.registerDocumentDropEditProvider(selector, new DropEditorProvider()));
}

export function deactivate() {}
