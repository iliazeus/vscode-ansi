import {
  ExtensionContext,
  CancellationTokenSource,
  workspace,
  commands,
  window,
  ViewColumn,
  TextEditor,
  TextDocumentShowOptions,
} from "vscode";

import { AnsiDecorationProvider } from "./AnsiDecorationProvider";
import { EditorRedrawWatcher } from "./EditorRedrawWatcher";
import { PrettyAnsiContentProvider } from "./PrettyAnsiContentProvider";
import {
  executeRegisteredTextEditorDecorationProviders,
  registerTextEditorDecorationProvider,
} from "./TextEditorDecorationProvider";

export const extensionId = "iliazeus.vscode-ansi" as const;

export async function activate(context: ExtensionContext): Promise<void> {
  const editorRedrawWatcher = new EditorRedrawWatcher();
  context.subscriptions.push(editorRedrawWatcher);

  const prettyAnsiContentProvider = new PrettyAnsiContentProvider(editorRedrawWatcher);
  context.subscriptions.push(prettyAnsiContentProvider);

  context.subscriptions.push(
    workspace.registerTextDocumentContentProvider(PrettyAnsiContentProvider.scheme, prettyAnsiContentProvider)
  );

  const showPretty = async (forcePreview: boolean = false, options: TextDocumentShowOptions = { viewColumn: ViewColumn.Active}) => {
    if (forcePreview || workspace.getConfiguration(`${extensionId}`).autoPreview) {
      const editor = window.activeTextEditor
      if (editor && editor.document && editor.document.languageId === 'ansi' && editor.document.uri.scheme === 'file') {
        const providerUri = PrettyAnsiContentProvider.toProviderUri(editor.document.uri);

        const autoPreviewToSide = workspace.getConfiguration(`${extensionId}`).autoPreviewToSide;
        let viewColumnOptions = (!forcePreview && autoPreviewToSide) ? { viewColumn: ViewColumn.Beside } : options;

        await window.showTextDocument(providerUri, viewColumnOptions);
      }
    }
  };

  context.subscriptions.push(
    commands.registerCommand(`${extensionId}.showPretty`, () => showPretty(true))
  );
  context.subscriptions.push(
    commands.registerCommand(`${extensionId}.showPrettyToSide`, () => showPretty(true, { viewColumn: ViewColumn.Beside }))
  );

  const ansiDecorationProvider = new AnsiDecorationProvider();
  context.subscriptions.push(ansiDecorationProvider);

  context.subscriptions.push(registerTextEditorDecorationProvider(ansiDecorationProvider));

  context.subscriptions.push(
    editorRedrawWatcher.onEditorRedraw(async (editor) => {
      const tokenSource = new CancellationTokenSource();
      await executeRegisteredTextEditorDecorationProviders(editor, tokenSource.token);
      tokenSource.dispose();
    })
  );

  context.subscriptions.push(
    commands.registerTextEditorCommand(`${extensionId}.insertEscapeCharacter`, (editor, edit) => {
      edit.delete(editor.selection);
      edit.insert(editor.selection.end, "\x1b");
    })
  );

  window.onDidChangeActiveTextEditor((textEditor: TextEditor | undefined) => {
    showPretty();
  });

  showPretty();
}

export function deactivate(): void {
  // sic
}
