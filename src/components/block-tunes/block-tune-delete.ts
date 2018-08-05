/**
 * @class DeleteTune
 * @classdesc Editor's default tune that moves up selected block
 *
 * @copyright <CodeX Team> 2018
 */
import IBlockTune from '../interfaces/block-tune';

declare var $: any;
declare var _: any;

export default class DeleteTune implements IBlockTune {

  /**
   * Property that contains CodeX Editor API methods
   * @see {docs/api.md}
   */
  private readonly api: any;

  /**
   * Styles
   * @type {{wrapper: string}}
   */
  private CSS = {
    wrapper: 'ass',
    button: 'ce-settings__button',
    buttonDelete: 'ce-settings__button--delete',
    buttonConfirm: 'ce-settings__button--confirm',
  };

  /**
   * Delete confirmation
   */
  private needConfirmation: boolean;

  /**
   * set false confirmation state
   */
  private resetConfirmation: () => void;

  /**
   * Tune nodes
   */
  private nodes = {
    button: null,
  };

  /**
   * DeleteTune constructor
   *
   * @param {Object} api
   */
  constructor({api}) {
    this.api = api;

    this.resetConfirmation = () => {
      this.setConfirmation(false);
    };
  }

  /**
   * Create "Delete" button and add click event listener
   * @returns [Element}
   */
  public render() {
    this.nodes.button = $.make('div', [this.CSS.button, this.CSS.buttonDelete], {});
    this.nodes.button.appendChild($.svg('cross', 12, 12));
    this.api.listener.on(this.nodes.button, 'click', (event) => this.handleClick(event), false);
    return this.nodes.button;
  }

  /**
   * Delete block conditions passed
   * @param {MouseEvent} event
   */
  public handleClick(event: MouseEvent): void {

    /**
     * if block is not waiting the confirmation, subscribe on block-settings-closing event to reset
     * otherwise delete block
     */
    if (!this.needConfirmation) {
      this.setConfirmation(true);

      /**
       * Subscribe on event.
       * When toolbar block settings is closed but block deletion is not confirmed,
       * then reset confirmation state
       */
      this.api.events.on('block-settings-closed', this.resetConfirmation);

    } else {

      /**
       * Unsubscribe from block-settings closing event
       */
      this.api.events.off('block-settings-closed', this.resetConfirmation);

      this.api.blocks.delete();

      /**
       * Prevent firing ui~documentClicked that can drop currentBlock pointer
       */
      event.stopPropagation();
    }
  }

  /**
   * change tune state
   */
  private setConfirmation(state): void {
    this.needConfirmation = state;
    this.nodes.button.classList.add(this.CSS.buttonConfirm);
  }

}
