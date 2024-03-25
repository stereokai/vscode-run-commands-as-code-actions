# VSCode: Run Commands as Code Actions

This VSCode extension allows to define and execute sequences of commands as code actions.
It is basically glue between the commands and code actions in VSCode.

## Features

- **Flexible:** Execute any command sequences directly from the editor as code actions! (Or through the command palette for quick on-demand access)
- **Straightforward:** Define a sequence of commands, complete with optional delays, to automate & fine tune repetitive tasks.

## Usage

Define command sequences in your `settings.json` file using the pattern `run-commands-as-code-actions.<sequenceName>`. Each sequence is an array of command objects.

Example (customize Prettier import formatting - no more multi line imports!):

```jsonc
  "run-commands-as-code-actions.formatAndSave": [{
    "command": "prettier.forceFormatDocument",
    "delay": 0
  }, {
    "command": "tsImportSorter.command.sortImports", // Check out the JS/TS Import/Export Sorter extension!
    "delay": 400
  }, {
    "command": "workbench.action.files.saveWithoutFormatting",
    "delay": 400
  }],

  // Automatically format and save the current document:
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": [
    "source.organizeImports",
    "source.runCommandsAsCodeActions.formatAndSave" // Magic!
  ],
```
