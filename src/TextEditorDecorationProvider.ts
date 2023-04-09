import { TextDocument, CancellationToken, ProviderResult, TextEditorDecorationType, TextEditor, Range } from "vscode";

export interface TextEditorDecorationProvider {
  provideDecorationRanges(document: TextDocument, token: CancellationToken): ProviderResult<[string, Range[]][]>;
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
    let decorations: [string, Range[]][] | null | undefined;

    try {
      decorations = await provider.provideDecorationRanges(editor.document, token);
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

    for (const [key, ranges] of decorations) {
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

      editor.setDecorations(decorationType, ranges);
    }
  }
}
