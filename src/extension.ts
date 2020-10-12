import { ExtensionContext, CancellationTokenSource } from "vscode";
import { AnsiDecorationProvider } from "./AnsiDecorationProvider";
import { EditorRedrawWatcher } from "./EditorRedrawWatcher";
import {
  executeRegisteredTextEditorDecorationProviders,
  registerTextEditorDecorationProvider,
} from "./TextEditorDecorationProvider";

export async function activate(context: ExtensionContext) {
  const editorRedrawWatcher = new EditorRedrawWatcher();
  context.subscriptions.push(editorRedrawWatcher);

  const provider = new AnsiDecorationProvider();
  context.subscriptions.push(provider);

  context.subscriptions.push(registerTextEditorDecorationProvider(provider));

  context.subscriptions.push(
    editorRedrawWatcher.onEditorRedraw(async (editor) => {
      const tokenSource = new CancellationTokenSource();
      await executeRegisteredTextEditorDecorationProviders(editor, tokenSource.token);
      tokenSource.dispose();
    })
  );
}

export function deactivate() {}
