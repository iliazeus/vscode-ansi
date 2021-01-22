import {
  TextDocument,
  ProviderResult,
  DecorationOptions,
  TextEditorDecorationType,
  window,
  Range,
  workspace,
  ThemeColor,
} from "vscode";

import * as ansi from "./ansi";
import { PrettyAnsiContentProvider } from "./PrettyAnsiContentProvider";
import { TextEditorDecorationProvider } from "./TextEditorDecorationProvider";

function upsert<K, V>(map: Map<K, V>, key: K, value: V): V {
  return map.get(key) ?? (map.set(key, value), value);
}

const ansiThemeColors: Record<ansi.NamedColor, ThemeColor> = {
  [ansi.NamedColor.DefaultBackground]: new ThemeColor("editor.background"),
  [ansi.NamedColor.DefaultForeground]: new ThemeColor("editor.foreground"),

  [ansi.NamedColor.Black]: new ThemeColor("terminal.ansiBlack"),
  [ansi.NamedColor.BrightBlack]: new ThemeColor("terminal.ansiBrightBlack"),

  [ansi.NamedColor.White]: new ThemeColor("terminal.ansiWhite"),
  [ansi.NamedColor.BrightWhite]: new ThemeColor("terminal.ansiBrightWhite"),

  [ansi.NamedColor.Red]: new ThemeColor("terminal.ansiRed"),
  [ansi.NamedColor.BrightRed]: new ThemeColor("terminal.ansiBrightRed"),

  [ansi.NamedColor.Green]: new ThemeColor("terminal.ansiGreen"),
  [ansi.NamedColor.BrightGreen]: new ThemeColor("terminal.ansiBrightGreen"),

  [ansi.NamedColor.Yellow]: new ThemeColor("terminal.ansiYellow"),
  [ansi.NamedColor.BrightYellow]: new ThemeColor("terminal.ansiBrightYellow"),

  [ansi.NamedColor.Blue]: new ThemeColor("terminal.ansiBlue"),
  [ansi.NamedColor.BrightBlue]: new ThemeColor("terminal.ansiBrightBlue"),

  [ansi.NamedColor.Magenta]: new ThemeColor("terminal.ansiMagenta"),
  [ansi.NamedColor.BrightMagenta]: new ThemeColor("terminal.ansiBrightMagenta"),

  [ansi.NamedColor.Cyan]: new ThemeColor("terminal.ansiCyan"),
  [ansi.NamedColor.BrightCyan]: new ThemeColor("terminal.ansiBrightCyan"),
};

function convertColor(color: ansi.Color): ThemeColor | string {
  if (color & ansi.ColorFlags.Named) return ansiThemeColors[color];
  return "#" + color.toString(16).padStart(6, "0");
}

export class AnsiDecorationProvider implements TextEditorDecorationProvider {
  provideDecorations(document: TextDocument): ProviderResult<[string, DecorationOptions[]][]> {
    if (document.uri.scheme === PrettyAnsiContentProvider.scheme) {
      return this._provideDecorationsForPrettifiedAnsi(document);
    }

    if (document.languageId === "ansi") {
      return this._provideDecorationsForAnsiLanguageType(document);
    }

    return undefined;
  }

  private _provideDecorationsForAnsiLanguageType(
    document: TextDocument
  ): ProviderResult<[string, DecorationOptions[]][]> {
    const documentText = document.getText();

    const result = new Map<string, DecorationOptions[]>();
    for (const key of this._decorationTypes.keys()) {
      result.set(key, []);
    }

    const escapeDecorations: DecorationOptions[] = [];
    result.set("escape", escapeDecorations);

    let lastSpanOffset = 0;
    let lastSpanLength = 0;

    for (const span of new ansi.Parser().chunk(documentText, true)) {
      const { offset, length, ...style } = span;

      const escapeRange = new Range(document.positionAt(lastSpanOffset + lastSpanLength), document.positionAt(offset));

      escapeDecorations.push({ range: escapeRange });

      const key = JSON.stringify(style);
      const range = new Range(document.positionAt(offset), document.positionAt(offset + length));

      upsert(result, key, []).push({ range });

      lastSpanOffset = offset;
      lastSpanLength = length;
    }

    const escapeRange = new Range(
      document.positionAt(lastSpanOffset + lastSpanLength),
      document.positionAt(documentText.length)
    );

    escapeDecorations.push({ range: escapeRange });

    return [...result];
  }

  private async _provideDecorationsForPrettifiedAnsi(
    providerDocument: TextDocument
  ): Promise<[string, DecorationOptions[]][]> {
    const actualUri = PrettyAnsiContentProvider.toActualUri(providerDocument.uri);
    const actualDocument = await workspace.openTextDocument(actualUri);

    const actualDocumentText = actualDocument.getText();

    let providerOffset = 0;

    const result = new Map<string, DecorationOptions[]>();
    for (const key of this._decorationTypes.keys()) {
      result.set(key, []);
    }

    for (const span of new ansi.Parser().chunk(actualDocumentText, true)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { offset, length, ...style } = span;

      const key = JSON.stringify(style);
      const range = new Range(
        providerDocument.positionAt(providerOffset),
        providerDocument.positionAt(providerOffset + length)
      );

      upsert(result, key, []).push({ range });

      providerOffset += length;
    }

    return [...result];
  }

  private _decorationTypes = new Map<string, TextEditorDecorationType>([
    ["escape", window.createTextEditorDecorationType({ opacity: "50%" })],
  ]);

  resolveDecoration(key: string): ProviderResult<TextEditorDecorationType> {
    let decorationType = this._decorationTypes.get(key);

    if (decorationType) {
      return decorationType;
    }

    const style: ansi.Style = JSON.parse(key);

    decorationType = window.createTextEditorDecorationType({
      backgroundColor: convertColor(style.backgroundColor),
      color: convertColor(style.foregroundColor),

      fontWeight: style.attributeFlags & ansi.AttributeFlags.Bold ? "bold" : undefined,
      fontStyle: style.attributeFlags & ansi.AttributeFlags.Italic ? "italic" : undefined,
      textDecoration: style.attributeFlags & ansi.AttributeFlags.Underline ? "underline" : undefined,
      opacity: style.attributeFlags & ansi.AttributeFlags.Faint ? "50%" : undefined,
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
