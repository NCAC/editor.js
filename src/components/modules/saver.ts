/**
 * Editor.js Saver
 *
 * @module Saver
 * @author Codex Team
 * @version 2.0.0
 */
import { Module } from '../__module';
import { OutputData } from '../../../types';
import { ValidatedData } from '../../../types/data-formats';
import { Block } from '../block';
import { log } from '../utils';


/**
 * @classdesc This method reduces all Blocks asyncronically and calls Block's save method to extract data
 *
 * @typedef {Saver} Saver
 * @property {Element} html - Editor HTML content
 * @property {string} json - Editor JSON output
 */
export class Saver extends Module {

  public static readonly displayName = 'Saver';
  /**
   * Composes new chain of Promises to fire them alternatelly
   *
   * @returns {OutputData}
   */
  public async save(): Promise<OutputData> {
    const { BlockManager, Sanitizer, ModificationsObserver } = this.Editor;
    const blocks = BlockManager.blocks,
        chainData = [];

    /**
     * Disable modifications observe while saving
     */
    ModificationsObserver.disable();

    try {
      blocks.forEach((block: Block) => {
        chainData.push(this.getSavedData(block));
      });

      const extractedData = await Promise.all(chainData);
      const sanitizedData = await Sanitizer.sanitizeBlocks(extractedData);

      return this.makeOutput(sanitizedData);
    } finally {
      ModificationsObserver.enable();
    }
  }

  /**
   * Saves and validates
   *
   * @param {Block} block - Editor's Tool
   * @returns {ValidatedData} - Tool's validated data
   */
  private async getSavedData(block: Block): Promise<ValidatedData> {
    const blockData = await block.save();
    const isValid = blockData && await block.validate(blockData.data);

    return {
      ...blockData,
      isValid,
    };
  }

  /**
   * Creates output object with saved data, time and version of editor
   *
   * @param {ValidatedData} allExtractedData - data extracted from Blocks
   * @returns {OutputData}
   */
  private makeOutput(allExtractedData): OutputData {
    let totalTime = 0;
    const blocks = [];

    log('[Editor.js saving]:', 'groupCollapsed');

    allExtractedData.forEach(({ tool, data, time, isValid }) => {
      totalTime += time;

      /**
       * Capitalize Tool name
       */
      log(`${tool.charAt(0).toUpperCase() + tool.slice(1)}`, 'group');

      if (isValid) {
        /** Group process info */
        log(data);
        log(undefined, 'groupEnd');
      } else {
        log(`Block «${tool}» skipped because saved data is invalid`);
        log(undefined, 'groupEnd');

        return;
      }

      /** If it was stub Block, get original data */
      if (tool === this.Editor.Tools.stubTool) {
        blocks.push(data);

        return;
      }

      blocks.push({
        type: tool,
        data,
      });
    });

    log('Total', 'log', totalTime);
    log(undefined, 'groupEnd');

    return {
      time: +new Date(),
      blocks,
      version: '2.19.1',
    };
  }
}
