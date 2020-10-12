import { EventEmitter, TextEditor, window, workspace } from "vscode";

export class EditorRedrawWatcher {
  private readonly _onEditorRedraw = new EventEmitter<TextEditor>();
  public readonly onEditorRedraw = this._onEditorRedraw.event;

  private _visibleEditorSubscriptions: { dispose(): void }[] = [];

  public constructor() {
    this._disposables.push(
      window.onDidChangeVisibleTextEditors((editors) => {
        for (const subscription of this._visibleEditorSubscriptions) {
          subscription.dispose();
        }

        this._visibleEditorSubscriptions = editors.map((editor) =>
          workspace.onDidChangeTextDocument((event) => {
            if (event.document !== editor.document) {
              return;
            }

            this._onEditorRedraw.fire(editor);
          })
        );

        for (const editor of editors) {
          this._onEditorRedraw.fire(editor);
        }
      })
    );

    setImmediate(() => {
      for (const editor of window.visibleTextEditors) {
        this._onEditorRedraw.fire(editor);
      }
    });
  }

  private readonly _disposables: { dispose(): void }[] = [];
  private _isDisposed: boolean = false;

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
