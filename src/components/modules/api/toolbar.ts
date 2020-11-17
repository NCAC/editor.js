import { Toolbar } from '../../../../types/api';
import { Module } from '../../__module';

/**
 * @class ToolbarAPI
 * Provides methods for working with the Toolbar
 */
export class ToolbarAPI extends Module {

  public static readonly displayName = 'ToolbarAPI';
  /**
   * Available methods
   *
   * @returns {Toolbar}
   */
  public get methods(): Toolbar {
    return {
      close: (): void => this.close(),
      open: (): void => this.open(),
    };
  }

  /**
   * Open toolbar
   */
  public open(): void {
    this.Editor.Toolbar.open();
  }

  /**
   * Close toolbar and all included elements
   */
  public close(): void {
    this.Editor.Toolbar.close();
  }
}
