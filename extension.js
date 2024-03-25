const vscode = require("vscode");
let outputChannel;

function fetchSequences() {
  const config = vscode.workspace.getConfiguration(
    "run-commands-as-code-actions"
  );

  const { get, has, inspect, update, ...sequences } = config;
  delete sequences["*"];
  return sequences;
}

class UnifiedActionProvider {
  provideCodeActions(document, range, context, token) {
    const sequences = fetchSequences();
    const actions = [];

    // Iterate over each user-defined sequence to create a code action
    for (const [sequenceName, commands] of Object.entries(sequences)) {
      if (!sequenceName || typeof sequenceName !== "string") {
        outputChannel.appendLine(
          `Ignoring sequence because it has an invalid name: ${sequenceName}`
        );
        continue;
      }

      if (!Array.isArray(commands) || commands.length === 0) {
        outputChannel.appendLine(
          `Ignoring sequence '${sequenceName}' because it has no commands`
        );
        continue;
      }

      const actionKind = vscode.CodeActionKind.Source.append(
        `runCommandsAsCodeActions.${sequenceName}`
      );
      const title = `Run ${sequenceName} Commands`;
      const action = new vscode.CodeAction(title, actionKind);

      action.command = {
        command: "run-commands-as-code-actions.runCommandSequence",
        title: title,
        arguments: [sequenceName],
      };

      actions.push(action);
    }

    return actions;
  }
}

function activate(context) {
  outputChannel = vscode.window.createOutputChannel(
    "Run Commands as Code Actions"
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      "*",
      new UnifiedActionProvider(),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.Source],
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "run-commands-as-code-actions.runCommandSequence",
      async (sequenceName) => {
        const sequences = fetchSequences();

        if (!sequenceName) {
          // No sequenceName provided, show Quick Pick to select a sequence
          const sequenceNames = Object.keys(sequences).map((name) => ({
            label: name,
            description: `Run the ${name} sequence of commands`,
          }));

          const selectedSequence = await vscode.window.showQuickPick(
            sequenceNames,
            {
              placeHolder: "Select a command sequence to run",
            }
          );

          if (selectedSequence) {
            sequenceName = selectedSequence.label;
          } else {
            // User cancelled the Quick Pick, so exit the command
            return;
          }
        }

        // Execute the selected or provided sequence of commands
        if (sequenceName && sequences[sequenceName]) {
          const commandsToRun = sequences[sequenceName];

          for (const { command, delay } of commandsToRun) {
            try {
              if (delay) {
                outputChannel.appendLine(
                  `Suspending for ${delay}ms before executing '${command}'`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
              }
              outputChannel.appendLine(`Executing command '${command}'`);
              await vscode.commands.executeCommand(command);
              outputChannel.appendLine(`Command '${command}' executed`);
            } catch (err) {
              vscode.window.showErrorMessage(
                `Error executing command '${command}': ${err}`
              );
              break; // Stop executing further commands in the sequence if an error occurs
            }
          }
        } else {
          vscode.window.showErrorMessage(
            `No commands found for the sequence '${sequenceName}'`
          );
        }
      }
    )
  );
}

exports.activate = activate;
exports.deactivate = () => {
  if (outputChannel) {
    outputChannel.dispose();
  }
};
