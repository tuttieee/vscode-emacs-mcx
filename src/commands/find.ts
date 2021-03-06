import * as vscode from "vscode";
import { TextEditor } from "vscode";
import { EmacsCommand } from ".";
import { IEmacsCommandRunner, IMarkModeController } from "../emulator";
import { MessageManager } from "../message";

export interface SearchState {
  startSelections: vscode.Selection[] | undefined;
}

abstract class IsearchCommand extends EmacsCommand {
  protected searchState: SearchState;

  public constructor(
    afterExecute: () => void,
    emacsController: IMarkModeController & IEmacsCommandRunner,
    searchState: SearchState
  ) {
    super(afterExecute, emacsController);

    this.searchState = searchState;
  }
}

export class IsearchForward extends IsearchCommand {
  public readonly id = "isearchForward";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    this.searchState.startSelections = textEditor.selections;
    return vscode.commands
      .executeCommand("actions.find")
      .then(() => vscode.commands.executeCommand<void>("editor.action.nextMatchFindAction"));
  }
}

export class IsearchBackward extends IsearchCommand {
  public readonly id = "isearchBackward";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    this.searchState.startSelections = textEditor.selections;
    return vscode.commands
      .executeCommand("actions.find")
      .then(() => vscode.commands.executeCommand<void>("editor.action.previousMatchFindAction"));
  }
}

/**
 * C-g
 */
export class IsearchAbort extends IsearchCommand {
  public readonly id = "isearchAbort";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    if (this.searchState.startSelections) {
      textEditor.selections = this.searchState.startSelections;
    }
    MessageManager.showMessage("Quit");
    return vscode.commands.executeCommand("closeFindWidget");
  }
}

/**
 * Enter, etc
 */
export class IsearchExit extends IsearchCommand {
  public readonly id = "isearchExit";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    if (this.searchState.startSelections) {
      this.emacsController.pushMark(this.searchState.startSelections.map((selection) => selection.anchor));
      MessageManager.showMessage("Mark saved where search started");
    }
    return vscode.commands.executeCommand("closeFindWidget");
  }
}
