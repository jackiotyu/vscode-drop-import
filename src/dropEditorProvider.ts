import * as vscode from 'vscode';
import path from 'path';

const uriListMime = 'text/uri-list';
const symbolListMime = 'application/vnd.code.tree.easyImportSymbol';

function checkSameDir(from: string, to: string) {
    const fromDir = path.parse(from).dir.trim();
    const toDir = path.parse(to).dir.trim();

    return from === to || fromDir.includes(toDir);
}

export class DropEditorProvider implements vscode.DocumentDropEditProvider {
    async provideDocumentDropEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken,
    ): Promise<vscode.DocumentDropEdit | null | undefined> {
        let dataTransferItem = dataTransfer.get(uriListMime);
        const symbolItems = dataTransfer.get(symbolListMime);
        console.log(dataTransferItem, 'item', symbolItems);

        if(symbolItems) {
            let list = (JSON.parse(symbolItems.value) || []) as vscode.SymbolInformation[];
            console.log(list);
            dataTransferItem = new vscode.DataTransferItem(list.map(item => item.location.uri.path).join('\n'));
            // return undefined;
        }


        if (!dataTransferItem) return undefined;

        const urlList = await dataTransferItem.asString();
        if (token.isCancellationRequested) return undefined;

        const uris: vscode.Uri[] = [];
        const docPath = document.uri.fsPath;
        for (const resource of urlList.split('\n')) {
            try {
                let uri = vscode.Uri.parse(resource);
                if(uri.fsPath === docPath) continue;
                uris.push(uri);
            } catch (err){
                console.log(err, 'err');
            }
        }

        if (!uris.length) return undefined;

        let textList: string[] = [];
        uris.forEach((uri, index) => {
            let filePath = path.relative(path.dirname(docPath), uri.fsPath).replace(/^.*?\/node_modules\/@types\/([^\/]+)\/([\s\S]+)/, '$1');
            const prefix = checkSameDir(uri.fsPath, docPath) ? '.' + path.sep : '';
            let basePath = prefix + filePath;// .slice(0, filePath.lastIndexOf('.'));
            textList.push(`import { $\{${index + 1}} } from "${basePath.trim()}"\n`);
        });

        const snippet = new vscode.SnippetString(textList.join(''));
        return new vscode.DocumentDropEdit(snippet);
    }
}