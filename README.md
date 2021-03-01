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

## Supported ANSI escape codes

Basic colors and formatting:

![Basic formatting](images/screenshot-basic-darkPlus.png)

8-bit colors:

![8-bit colors](images/screenshot-8bitColor-darkPlus.png)

24-bit colors:

![24-bit colors](images/screenshot-24bitColor-darkPlus.png)

## Custom file icon

You can add an icon to the ANSI text files by using the [`vscode-icons`] extension:

```javascript
{
  // add this to your settings file
  "vsicons.associations.files": [
    {
      "icon": "text", // or any other icon from vscode-icons
      "extensions": ["ans", "ansi"],
      "format": "svg"
    }
  ]
}
```

[`vscode-icons`]: https://marketplace.visualstudio.com/items?itemName=vscode-icons-team.vscode-icons
