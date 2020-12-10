import { Dom } from '../dom';
import { InlineTool, SanitizerConfig } from '../../../types';

/**
 * Bold Tool
 *
 * Inline Toolbar Tool
 *
 * Makes selected text bolder
 */
export class NbspInlineTool implements InlineTool {
  /**
   * Specifies Tool as Inline Toolbar Tool
   *
   * @returns {boolean}
   */
  public static isInline = true;

  /**
   * Title for hover-tooltip
   */
  public static title = 'Insecable';

  /**
   * Sanitizer Rule
   * Leave <b> tags
   *
   * @returns {object}
   */
  public static get sanitize(): SanitizerConfig {
    return {
      b: {},
    } as SanitizerConfig;
  }

  /**
   * Native Document's command that uses for Nbsp
   */
  private readonly commandName: string = 'insertText';

  /**
   * Styles
   */
  private readonly CSS = {
    button: 'ce-inline-tool',
    buttonActive: 'ce-inline-tool--active',
    buttonModifier: 'ce-inline-tool--bold',
  };

  /**
   * Elements
   */
  private nodes: {button: HTMLButtonElement} = {
    button: undefined,
  };

  /**
   * Create button for Inline Toolbar
   */
  public render(): HTMLElement {
    this.nodes.button = document.createElement('button') as HTMLButtonElement;
    this.nodes.button.type = 'button';
    this.nodes.button.classList.add(this.CSS.button, this.CSS.buttonModifier);
    this.nodes.button.appendChild(Dom.svg('bold', 12, 14)); // to be updated to NBSP

    return this.nodes.button;
  }

  /**
   * replace selection with '
   *
   * @param {Range} range - range to wrap
   */
  public surround(range: Range): void {
    document.execCommand(this.commandName, true, '\u00A0');
  }

  /**
   * Check selection and set activated state to button if there are '&#160;' character
   *
   * @param {Selection} selection - selection to check
   *
   * @returns {boolean}
   */
  public checkState(selection: Selection): boolean {
    const isActive = document.queryCommandState(this.commandName);

    this.nodes.button.classList.toggle(this.CSS.buttonActive, isActive);

    return isActive;
  }

  /**
   * Set a shortcut
   *
   * @returns {boolean}
   */
  public get shortcut(): string {
    return 'CMD+ ';
  }
}
