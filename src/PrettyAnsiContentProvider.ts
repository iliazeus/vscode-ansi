import { posix as posixPath } from "path";

import * as ansicolor from "ansicolor";

import { EventEmitter, TextDocumentContentProvider, Uri, workspace } from "vscode";

import { extensionId } from "./extension";

export class PrettyAnsiContentProvider implements TextDocumentContentProvider {
  public static readonly scheme = `${extensionId}.pretty`;

  public static toProviderUri(actualUri: Uri): Uri {
    const tabName = "Preview: " + posixPath.basename(actualUri.path);

    const scheme = PrettyAnsiContentProvider.scheme;
    const path = encodeURIComponent(tabName);
    const query = encodeURIComponent(actualUri.toString());

    return Uri.parse(`${scheme}://show/${path}?${query}`, true);
  }

  public static toActualUri(providerUri: Uri): Uri {
    if (providerUri.scheme !== PrettyAnsiContentProvider.scheme) {
      throw new Error(`wrong uri scheme: ${providerUri.scheme}`);
    }

    return Uri.parse(providerUri.query, true);
  }

  private readonly _onDidChange = new EventEmitter<Uri>();
  public readonly onDidChange = this._onDidChange.event;

  private readonly _watchedUris = new Set<string>();

  public constructor() {
    this._disposables.push(
      workspace.onDidChangeTextDocument((event) => {
        const actualUri = event.document.uri;

        if (this._watchedUris.has(actualUri.toString())) {
          const providerUri = PrettyAnsiContentProvider.toProviderUri(actualUri);
          this._onDidChange.fire(providerUri);
        }
      })
    );

    this._disposables.push(
      workspace.onDidCloseTextDocument((document) => {
        this._watchedUris.delete(document.uri.toString());
      })
    );
  }

  public async provideTextDocumentContent(providerUri: Uri): Promise<string> {
    const actualUri = PrettyAnsiContentProvider.toActualUri(providerUri);

    this._watchedUris.add(actualUri.toString());

    const actualDocument = await workspace.openTextDocument(actualUri);

    // somehow, the behavior of ansicolor.strip() and ansicolor.parse() differ for incorrect escapes.
    // that is why we cannot just use this:

    // return ansicolor.strip(actualDocument.getText());

    // we'll have to do this the hard way
    // TODO: consider a different ANSI parser

    const spans = ansicolor.parse(actualDocument.getText()).spans;
    return spans.map((span) => span.text).join("");
  }

  private readonly _disposables: { dispose(): void }[] = [];
  private _isDisposed = false;

  public dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;

    for (const disposable of this._disposables) {
      disposable.dispose();
    }
  }
}
