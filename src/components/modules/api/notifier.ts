import { Notifier } from '../../../../types/api';
import { ConfirmNotifierOptions, NotifierOptions, PromptNotifierOptions } from 'codex-notifier';
import { Module } from '../../__module';

/**
 *
 */
export class NotifierAPI extends Module {

  public static readonly displayName = 'NotifierAPI';
  /**
   * Available methods
   */
  public get methods(): Notifier {
    return {
      show: (options: NotifierOptions | ConfirmNotifierOptions | PromptNotifierOptions): void => this.show(options),
    };
  }

  /**
   * Show notification
   *
   * @param {NotifierOptions} options - message option
   */
  public show(options: NotifierOptions | ConfirmNotifierOptions | PromptNotifierOptions): void {
    return this.Editor.Notifier.show(options);
  }
}
