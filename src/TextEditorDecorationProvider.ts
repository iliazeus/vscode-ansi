import {
  TextDocument,
  CancellationToken,
  ProviderResult,
  DecorationOptions,
  TextEditorDecorationType,
  TextEditor,
} from "vscode";

export interface TextEditorDecorationProvider {
  provideDecorations(document: TextDocument, token: CancellationToken): ProviderResult<[string, DecorationOptions[]][]>;
  resolveDecoration(key: string, token: CancellationToken): ProviderResult<TextEditorDecorationType>;
}

const registeredProviders = new Set<TextEditorDecorationProvider>();

export function registerTextEditorDecorationProvider(provider: TextEditorDecorationProvider): { dispose(): void } {
  registeredProviders.add(provider);
  return { dispose: () => registeredProviders.delete(provider) };
}

export async function executeRegisteredTextEditorDecorationProviders(
  editor: TextEditor,
  token: CancellationToken
): Promise<void> {
  for (const provider of registeredProviders) {
    let decorations;

    try {
      decorations = await provider.provideDecorations(editor.document, token);
    } catch (error) {
      console.error(`error providing decorations`, error);
      return;
    }

    if (token.isCancellationRequested) {
      return;
    }

    if (!decorations) {
      return;
    }

    const decorationTypes = new Map<string, TextEditorDecorationType>();

    for (const [key, options] of decorations) {
      let decorationType: ProviderResult<TextEditorDecorationType> = decorationTypes.get(key);

      if (!decorationType) {
        try {
          decorationType = await provider.resolveDecoration(key, token);
        } catch (error) {
          console.error(`error providing decorations for key ${key}`, error);
          continue;
        }

        if (token.isCancellationRequested) {
          return;
        }

        if (!decorationType) {
          console.error(`no decoration resolved for key ${key}`);
          continue;
        }

        decorationTypes.set(key, decorationType);
      }

      editor.setDecorations(decorationType, options);
    }
  }
}
