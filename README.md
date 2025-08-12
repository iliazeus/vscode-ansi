[![Visual Studio Marketplace](https://flat.badgen.net/vs-marketplace/i/iliazeus.vscode-ansi?icon=visualstudio)](https://marketplace.visualstudio.com/items?itemName=iliazeus.vscode-ansi)
[![GitHub](https://flat.badgen.net/github/release/iliazeus/vscode-ansi?icon=github)](https://github.com/iliazeus/vscode-ansi)
[![MIT License](https://flat.badgen.net/badge/license/MIT/blue)](LICENSE)
[![Open Issues](https://flat.badgen.net/github/open-issues/iliazeus/vscode-ansi?icon=github)](https://github.com/iliazeus/vscode-ansi/issues)
[![Closed Issues](https://flat.badgen.net/github/closed-issues/iliazeus/vscode-ansi?icon=github)](https://github.com/iliazeus/vscode-ansi/issues?q=is%3Aissue+is%3Aclosed)

# ANSI Colors

ANSI Color styling for your text editor.

## Basic usage

Select the `ANSI Text` language mode to highlight text marked up with ANSI escapes. Files with the `.ans` and `.ansi` extensions will be highlighted by default.

![ANSI Text language mode; Dark Plus theme](images/screenshot-editor-darkPlus.png)

Run the `ANSI Text: Open Preview` command for the prettified read-only preview.

![ANSI Text preview; Dark Plus theme](images/screenshot-preview-darkPlus.png)

Clicking the preview icon in the editor title will open the preview in a new tab. `Alt`-click to open in the current tab.

![Preview icon](images/screenshot-editorTitleButton-darkPlus.png)

The extension fetches the colors from the current theme and aims to look as good as the built-in terminal.

![ANSI Text preview; various themes](images/screenshot-themes.gif)

## FAQ

- How do I enable this extension for files other than `.ans` and `.ansi`?

  This can be done using the VS Code "language mode" feature. For example, to enable it for all `.log` filesd, open a `.log` file, then do `F1 - Change Language Mode - Configure File Association for '.log' - ANSI Text`.

- Can the "preview mode" be opened automatically?

  No, it can't, not with the way the extension is currently designed, at least.

  `vscode-ansi` uses VSCode's built-in text editors in readonly mode (via [`TextDocumentContentProvider`](https://code.visualstudio.com/api/references/vscode-api#TextDocumentContentProvider)) for preview display. The only custom editors allowed to open files "by default" (e.g. by double-click) are [webview-based custom editors](https://code.visualstudio.com/api/extension-guides/custom-editors). But building such an editor means reimplementing all the default functionality from scratch - navigation, searching, line wrap, interaction with other extensions (e.g. spell check).

## Supported ANSI escape codes

Basic colors and formatting:

![Basic formatting](images/screenshot-basic-darkPlus.png)

8-bit colors:

![8-bit colors](images/screenshot-8bitColor-darkPlus.png)

24-bit colors:

![24-bit colors](images/screenshot-24bitColor-darkPlus.png)
