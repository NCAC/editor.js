import { Saver } from '../../../../types/api';
import { OutputData } from '../../../../types';
import { logLabeled } from '../../utils';
import { Module } from '../../__module';

/**
 * @class SaverAPI
 * provides with methods to save data
 */
export class SaverAPI extends Module {

  public static readonly displayName = 'SaverAPI';
  /**
   * Available methods
   *
   * @returns {Saver}
   */
  public get methods(): Saver {
    return {
      save: (): Promise<OutputData> => this.save(),
    };
  }

  /**
   * Return Editor's data
   *
   * @returns {OutputData}
   */
  public save(): Promise<OutputData> {
    const errorText = 'Editor\'s content can not be saved in read-only mode';

    if (this.Editor.ReadOnly.isEnabled) {
      logLabeled(errorText, 'warn');

      return Promise.reject(new Error(errorText));
    }

    return this.Editor.Saver.save();
  }
}
