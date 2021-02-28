import { posix as posixPath } from "path";

import { EventEmitter, FileSystemWatcher, TextDocumentContentProvider, Uri, workspace } from "vscode";

import * as ansi from "./ansi";
import { extensionId } from "./extension";
import { EditorRedrawWatcher } from "./EditorRedrawWatcher";

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
  private readonly _fileSystemWatcher: FileSystemWatcher;

  private readonly _editorRedrawWatcher: EditorRedrawWatcher;

  public constructor(editorRedrawWatcher: EditorRedrawWatcher) {
    this._editorRedrawWatcher = editorRedrawWatcher;

    this._disposables.push(
      workspace.onDidChangeTextDocument((event) => {
        const actualUri = event.document.uri;

        if (this._watchedUris.has(actualUri.toString())) {
          const providerUri = PrettyAnsiContentProvider.toProviderUri(actualUri);
          this._onDidChange.fire(providerUri);
        }
      })
    );

    this._fileSystemWatcher = workspace.createFileSystemWatcher("**/*", false, false, true);
    this._disposables.push(this._fileSystemWatcher);

    this._disposables.push(
      this._fileSystemWatcher.onDidChange((actualUri) => {
        if (this._watchedUris.has(actualUri.toString())) {
          const providerUri = PrettyAnsiContentProvider.toProviderUri(actualUri);
          this._onDidChange.fire(providerUri);
        }
      })
    );

    this._disposables.push(
      this._fileSystemWatcher.onDidCreate((actualUri) => {
        if (this._watchedUris.has(actualUri.toString())) {
          const providerUri = PrettyAnsiContentProvider.toProviderUri(actualUri);
          this._onDidChange.fire(providerUri);
        }
      })
    );
  }

  public async provideTextDocumentContent(providerUri: Uri): Promise<string> {
    // VS Code does not emit `workspace.onDidChangeTextDocument` for the provided document
    // if the content is identical to the current one, despite us emitting `onDidChange`.

    // it means that we have to force-emit `onEditorRedraw` to correctly handle situations
    // when the escapes change, but the content itself remains the same.
    setImmediate(() => this._editorRedrawWatcher.forceEmitForUri(providerUri));

    const actualUri = PrettyAnsiContentProvider.toActualUri(providerUri);

    this._watchedUris.add(actualUri.toString());

    const actualDocument = await workspace.openTextDocument(actualUri);

    const parser = new ansi.Parser();

    const textChunks: string[] = [];

    for (let lineNumber = 0; lineNumber < actualDocument.lineCount; lineNumber += 1) {
      const line = actualDocument.lineAt(lineNumber);
      const spans = parser.appendLine(line.text);
      const textSpans = spans.filter((span) => !(span.attributeFlags & ansi.AttributeFlags.EscapeSequence));
      textChunks.push(...textSpans.map(({ offset, length }) => line.text.substr(offset, length)), "\n");
    }

    return textChunks.join("");
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
