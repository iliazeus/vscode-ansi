[![GitHub](https://flat.badgen.net/github/release/iliazeus/vscode-ansi?icon=github)](https://github.com/iliazeus/vscode-ansi)
[![Issues](https://flat.badgen.net/github/open-issues/iliazeus/vscode-ansi?icon=github)](https://github.com/iliazeus/vscode-ansi/issues)
[![Visual Studio Marketplace](https://flat.badgen.net/vs-marketplace/i/iliazeus.vscode-ansi?icon=visualstudio)](https://marketplace.visualstudio.com/items?itemName=iliazeus.vscode-ansi)
[![MIT License](https://flat.badgen.net/badge/license/MIT/blue)](LICENSE)

# ANSI Colors

ANSI Color styling for your text editor.

## Basic usage

Select the `ANSI Text` language mode to highlight text marked up with ANSI escapes. Files with the `.ans` and `.ansi` extensions will be highlighted by default.

![ANSI Text language mode; Quiet Light theme](images/screenshot-ansi-quietLight.png)

Run the `ANSI Text: Preview` command for the prettified read-only preview.

![ANSI Text preview; Quiet Light theme](images/screenshot-pretty-quietLight.png)

Clicking the preview icon in the editor title will open the preview in a new tab. `Alt`-click to open in the current tab.

![Preview icon](images/screenshot-editor-title-button.png)

The extension fetches the colors from the current theme and aims to look as good as the built-in terminal.

![ANSI Text preview; Solarized Light theme](images/screenshot-pretty-solarizedLight.png)

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
