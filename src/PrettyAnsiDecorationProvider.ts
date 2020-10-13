import * as ansicolor from "ansicolor";

import {
  TextDocument,
  ProviderResult,
  DecorationOptions,
  TextEditorDecorationType,
  window,
  Range,
  workspace,
} from "vscode";

import { PrettyAnsiContentProvider } from "./PrettyAnsiContentProvider";
import { TextEditorDecorationProvider } from "./TextEditorDecorationProvider";

type AnsiDecorationOptions = Omit<ansicolor.ParsedSpan, "text">;

function upsert<K, V>(map: Map<K, V>, key: K, value: V): V {
  return map.get(key) ?? (map.set(key, value), value);
}

export class PrettyAnsiDecorationProvider implements TextEditorDecorationProvider {
  async provideDecorations(providerDocument: TextDocument): Promise<[string, DecorationOptions[]][] | undefined> {
    if (providerDocument.uri.scheme !== PrettyAnsiContentProvider.scheme) {
      return;
    }

    const actualUri = PrettyAnsiContentProvider.toActualUri(providerDocument.uri);
    const actualDocument = await workspace.openTextDocument(actualUri);

    const actualDocumentText = actualDocument.getText();

    let offset = 0;
    const result = new Map<string, DecorationOptions[]>();

    for (const span of ansicolor.parse(actualDocumentText).spans) {
      const { text, ...options } = span;

      const key = JSON.stringify(options);

      const endOffset = offset + text.length;

      const textRange = new Range(providerDocument.positionAt(offset), providerDocument.positionAt(endOffset));
      upsert(result, key, []).push({ range: textRange });

      offset = endOffset;
    }

    return [...result];
  }

  private _decorationTypes = new Map<string, TextEditorDecorationType>();

  resolveDecoration(key: string): ProviderResult<TextEditorDecorationType> {
    let decorationType = this._decorationTypes.get(key);

    if (decorationType) {
      return decorationType;
    }

    const options: AnsiDecorationOptions = JSON.parse(key);

    decorationType = window.createTextEditorDecorationType({
      textDecoration: options.css,
    });

    this._decorationTypes.set(key, decorationType);

    return decorationType;
  }

  private _isDisposed = false;

  dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;

    for (const decorationType of this._decorationTypes.values()) {
      decorationType.dispose();
    }

    this._decorationTypes.clear();
  }
}
