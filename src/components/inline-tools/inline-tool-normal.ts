import { Dom } from '../dom';
import { InlineTool, SanitizerConfig } from '../../../types';

/**
 * Normal Tool
 *
 * Inline Toolbar Tool
 *
 * Makes selected text normal (remove <b> or <i>)
 */
export class NormalInlineTool implements InlineTool {
  /**
   * Specifies Tool as Inline Toolbar Tool
   *
   * @returns {boolean}
   */
  public static isInline = true;

  /**
   * Title for hover-tooltip
   */
  public static title = 'Normal';

  /**
   * Sanitizer Rule
   * Leave <b> tags
   *
   * @returns {object}
   */
  public static get sanitize(): SanitizerConfig {
    return {
      strong: {},
    } as SanitizerConfig;
  }

  /**
   * Native Document's command that uses for Normal
   */
  private readonly commandName: string = 'removeFormat';

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
    this.nodes.button.appendChild(Dom.svg('normal', 12, 14));

    return this.nodes.button;
  }

  /**
   * Wrap range with <b> tag
   *
   * @param {Range} range - range to wrap
   */
  public surround(range: Range): void {
    document.execCommand(this.commandName);
  }

  /**
   * Check selection and set activated state to button if there are <b> tag
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
    return 'CMD+MAJ+N';
  }
}