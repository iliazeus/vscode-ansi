import { TextDocument, ProviderResult, TextEditorDecorationType, window, Range, workspace, ThemeColor, DecorationRangeBehavior } from "vscode";

import * as ansi from "./ansi";
import { PrettyAnsiContentProvider } from "./PrettyAnsiContentProvider";
import { TextEditorDecorationProvider } from "./TextEditorDecorationProvider";

function upsert<K, V>(map: Map<K, V>, key: K, value: V): V {
  return map.get(key) ?? (map.set(key, value), value);
}

export type EscapeSequenceDisplayMode = "show" | "dim" | "hide";

function readEscapeSequenceDisplayMode(): EscapeSequenceDisplayMode {
  const value = workspace.getConfiguration("ansiColors").get<string>("escapeSequenceDisplay", "dim");
  return value === "show" || value === "hide" ? value : "dim";
}

function createEscapeDecorationType(mode: EscapeSequenceDisplayMode): TextEditorDecorationType {
  switch (mode) {
    case "hide":
      return window.createTextEditorDecorationType({
        textDecoration: "none; font-size: 0; letter-spacing: 0",
        opacity: "0",
        rangeBehavior: DecorationRangeBehavior.ClosedClosed,
      });

    case "show":
      return window.createTextEditorDecorationType({});

    default:
      return window.createTextEditorDecorationType({ opacity: "50%" });
  }
}

const ansiThemeColors: Record<ansi.NamedColor, ThemeColor | undefined> = {
  [ansi.NamedColor.DefaultBackground]: undefined,
  [ansi.NamedColor.DefaultForeground]: undefined,

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

const ansiExplicitThemeColors: Record<ansi.NamedColor, ThemeColor | undefined> = {
  ...ansiThemeColors,
  [ansi.NamedColor.DefaultBackground]: new ThemeColor("editor.background"),
  [ansi.NamedColor.DefaultForeground]: new ThemeColor("editor.foreground"),
};

function convertColor(color: ansi.Color, explicitDefaults: boolean): ThemeColor | string | undefined {
  if (color & ansi.ColorFlags.Named) {
    const record = explicitDefaults ? ansiExplicitThemeColors : ansiThemeColors;
    return record[color as ansi.NamedColor];
  }
  return "#" + color.toString(16).padStart(6, "0");
}

export class AnsiDecorationProvider implements TextEditorDecorationProvider {
  provideDecorationRanges(document: TextDocument): ProviderResult<[string, Range[]][]> {
    if (document.uri.scheme === PrettyAnsiContentProvider.scheme) {
      return this._provideDecorationsForPrettifiedAnsi(document);
    }

    if (document.languageId === "ansi") {
      return this._provideDecorationsForAnsiLanguageType(document);
    }

    return undefined;
  }

  private _provideDecorationsForAnsiLanguageType(document: TextDocument): ProviderResult<[string, Range[]][]> {
    const result = new Map<string, Range[]>();
    for (const key of this._decorationTypes.keys()) {
      result.set(key, []);
    }

    const escapeDecorations: Range[] = [];
    result.set("escape", escapeDecorations);

    const parser = new ansi.Parser();

    for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber += 1) {
      const line = document.lineAt(lineNumber);
      const spans = parser.appendLine(line.text);

      for (const span of spans) {
        const { offset, length, ...style } = span;
        const range = new Range(lineNumber, offset, lineNumber, offset + length);

        if (style.attributeFlags & ansi.AttributeFlags.EscapeSequence) {
          escapeDecorations.push(range);
          continue;
        }

        const key = JSON.stringify(style);
        upsert(result, key, []).push(range);
      }
    }

    return [...result];
  }

  private async _provideDecorationsForPrettifiedAnsi(providerDocument: TextDocument): Promise<[string, Range[]][]> {
    const actualUri = PrettyAnsiContentProvider.toActualUri(providerDocument.uri);
    const actualDocument = await workspace.openTextDocument(actualUri);

    const result = new Map<string, Range[]>();
    for (const key of this._decorationTypes.keys()) {
      result.set(key, []);
    }

    const parser = new ansi.Parser();

    for (let lineNumber = 0; lineNumber < actualDocument.lineCount; lineNumber += 1) {
      let totalEscapeLength = 0;

      const line = actualDocument.lineAt(lineNumber);
      const spans = parser.appendLine(line.text);

      for (const span of spans) {
        const { offset, length, ...style } = span;

        if (style.attributeFlags & ansi.AttributeFlags.EscapeSequence) {
          totalEscapeLength += length;
          continue;
        }

        const range = new Range(
          lineNumber,
          offset - totalEscapeLength,
          lineNumber,
          offset + length - totalEscapeLength
        );

        const key = JSON.stringify(style);

        upsert(result, key, []).push(range);
      }
    }

    return [...result];
  }

  private _decorationTypes = new Map<string, TextEditorDecorationType>([
    ["escape", createEscapeDecorationType(readEscapeSequenceDisplayMode())],
  ]);

  refreshEscapeDecorationType(): void {
    const previousType = this._decorationTypes.get("escape");

    this._decorationTypes.set("escape", createEscapeDecorationType(readEscapeSequenceDisplayMode()));

    previousType?.dispose();
  }

  resolveDecoration(key: string): ProviderResult<TextEditorDecorationType> {
    let decorationType = this._decorationTypes.get(key);

    if (decorationType) {
      return decorationType;
    }

    const style: ansi.Style = JSON.parse(key);

    const inverse = (style.attributeFlags & ansi.AttributeFlags.Inverse) !== 0;
    const background = inverse ? style.foregroundColor : style.backgroundColor;
    const foreground = inverse ? style.backgroundColor : style.foregroundColor;

    decorationType = window.createTextEditorDecorationType({
      backgroundColor: convertColor(background, inverse),
      color: convertColor(foreground, inverse),

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
