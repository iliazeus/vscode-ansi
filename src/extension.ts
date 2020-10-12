import { ExtensionContext, CancellationTokenSource, workspace, commands, window } from "vscode";

import { AnsiDecorationProvider } from "./AnsiDecorationProvider";
import { EditorRedrawWatcher } from "./EditorRedrawWatcher";
import { PrettyAnsiContentProvider } from "./PrettyAnsiContentProvider";
import { PrettyAnsiDecorationProvider } from "./PrettyAnsiDecorationProvider";
import {
  executeRegisteredTextEditorDecorationProviders,
  registerTextEditorDecorationProvider,
} from "./TextEditorDecorationProvider";

export const extensionId = "iliazeus.vscode-ansi" as const;

export async function activate(context: ExtensionContext) {
  const prettyAnsiContentProvider = new PrettyAnsiContentProvider();
  context.subscriptions.push(prettyAnsiContentProvider);

  context.subscriptions.push(
    workspace.registerTextDocumentContentProvider(PrettyAnsiContentProvider.scheme, prettyAnsiContentProvider)
  );

  context.subscriptions.push(
    commands.registerCommand(`${extensionId}.showPretty`, async () => {
      const actualUri = window.activeTextEditor?.document.uri;

      if (!actualUri) {
        return;
      }

      const providerUri = PrettyAnsiContentProvider.toProviderUri(actualUri);

      await window.showTextDocument(providerUri);
    })
  );

  const editorRedrawWatcher = new EditorRedrawWatcher();
  context.subscriptions.push(editorRedrawWatcher);

  const ansiDecorationProvider = new AnsiDecorationProvider();
  context.subscriptions.push(ansiDecorationProvider);

  const prettyAnsiDecorationProvider = new PrettyAnsiDecorationProvider();
  context.subscriptions.push(prettyAnsiDecorationProvider);

  context.subscriptions.push(registerTextEditorDecorationProvider(ansiDecorationProvider));
  context.subscriptions.push(registerTextEditorDecorationProvider(prettyAnsiDecorationProvider));

  context.subscriptions.push(
    editorRedrawWatcher.onEditorRedraw(async (editor) => {
      const tokenSource = new CancellationTokenSource();
      await executeRegisteredTextEditorDecorationProviders(editor, tokenSource.token);
      tokenSource.dispose();
    })
  );
}

export function deactivate() {}
