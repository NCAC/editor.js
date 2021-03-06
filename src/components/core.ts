import { Dom } from './dom';
import { EditorConfig, OutputData, SanitizerConfig } from '../../types';
import { EditorModules } from '../types-internal/editor-modules';
import { I18nConstructor } from './i18n';
import { CriticalError } from './errors/critical';
import { Modules } from './modules';
import { deprecationAssert, isEmpty, log, logLabeled, LogLevels, setLogLevel  } from './utils';

/**
 * @typedef {Core} Core - editor core class
 */


/**
 * @class Core
 *
 * @classdesc Editor.js core class
 *
 * @property {EditorConfig} config - all settings
 * @property {EditorModules} moduleInstances - constructed editor components
 *
 * @type {Core}
 */
export class Core {
  /**
   * Editor configuration passed by user to the constructor
   */
  public config: EditorConfig;

  /**
   * Object with core modules instances
   */
  public moduleInstances: EditorModules = {} as EditorModules;

  /**
   * Promise that resolves when all core modules are prepared and UI is rendered on the page
   */
  public isReady: Promise<void>;

  /**
   * @param {EditorConfig} config - user configuration
   *
   */
  constructor(config?: EditorConfig|string) {
    /**
     * Ready promise. Resolved if Editor.js is ready to work, rejected otherwise
     */
    let onReady, onFail;

    this.isReady = new Promise((resolve, reject) => {
      onReady = resolve;
      onFail = reject;
    });

    Promise.resolve()
      .then(async () => {
        this.configuration = config;

        await this.validate();
        await this.init();
        await this.start();

        logLabeled('I\'m ready! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', 'log', '', 'color: #E24A75');

        setTimeout(async () => {
          await this.render();

          if ((this.configuration as EditorConfig).autofocus) {
            const { BlockManager, Caret } = this.moduleInstances;

            Caret.setToBlock(BlockManager.blocks[0], Caret.positions.START);
            BlockManager.highlightCurrentNode();
          }

          /**
           * Remove loader, show content
           */
          this.moduleInstances.UI.removeLoader();

          /**
           * Resolve this.isReady promise
           */
          onReady();
        }, 500);
      })
      .catch((error) => {
        log(`Editor.js is not ready because of ${error}`, 'error');

        /**
         * Reject this.isReady promise
         */
        onFail(error);
      });
  }

  /**
   * Setting for configuration
   *
   * @param {EditorConfig|string} config - Editor's config to set
   */
  public set configuration(config: EditorConfig|string) {
    /**
     * Process zero-configuration or with only holderId
     * Make config object
     */
    if (typeof config !== 'object') {
      config = {
        holder: config,
      };
    }

    /**
     * If holderId is preset, assign him to holder property and work next only with holder
     */
    deprecationAssert(!!config.holderId, 'config.holderId', 'config.holder');
    if (config.holderId && !config.holder) {
      config.holder = config.holderId;
      config.holderId = null;
    }

    /**
     * Place config into the class property
     *
     * @type {EditorConfig}
     */
    this.config = config;

    /**
     * If holder is empty then set a default value
     */
    if (this.config.holder == null) {
      this.config.holder = 'editorjs';
    }

    if (!this.config.logLevel) {
      this.config.logLevel = LogLevels.VERBOSE;
    }

    setLogLevel(this.config.logLevel);

    /**
     * If default Block's Tool was not passed, use the Paragraph Tool
     */
    deprecationAssert(Boolean(this.config.initialBlock), 'config.initialBlock', 'config.defaultBlock');
    this.config.defaultBlock = this.config.defaultBlock || this.config.initialBlock || 'paragraph';

    /**
     * Height of Editor's bottom area that allows to set focus on the last Block
     *
     * @type {number}
     */
    this.config.minHeight = this.config.minHeight !== undefined ? this.config.minHeight : '300';

    /**
     * Default block type
     * Uses in case when there is no blocks passed
     *
     * @type {{type: (*), data: {text: null}}}
     */
    const defaultBlockData = {
      type: this.config.defaultBlock,
      data: {},
    };

    this.config.placeholder = this.config.placeholder || false;
    this.config.sanitizer = this.config.sanitizer || {
      p: true,
      b: true,
      a: true,
    } as SanitizerConfig;

    this.config.hideToolbar = this.config.hideToolbar ? this.config.hideToolbar : false;
    this.config.tools = this.config.tools || {};
    this.config.i18n = this.config.i18n || {};
    this.config.data = this.config.data || {} as OutputData;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.config.onReady = this.config.onReady || ((): void => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.config.onChange = this.config.onChange || ((): void => {});
    this.config.inlineToolbar = this.config.inlineToolbar !== undefined ? this.config.inlineToolbar : true;

    /**
     * Initialize default Block to pass data to the Renderer
     */
    if (isEmpty(this.config.data)) {
      this.config.data = {} as OutputData;
      this.config.data.blocks = [ defaultBlockData ];
    } else {
      if (!this.config.data.blocks || this.config.data.blocks.length === 0) {
        this.config.data.blocks = [ defaultBlockData ];
      }
    }

    this.config.readOnly = this.config.readOnly as boolean || false;

    /**
     * Adjust i18n
     */
    if (config.i18n?.messages) {
      I18nConstructor.setDictionary(config.i18n.messages);
    }

    /**
     * Text direction. If not set, uses ltr
     */
    this.config.i18n.direction = config.i18n?.direction || 'ltr';
  }

  /**
   * Returns private property
   *
   * @returns {EditorConfig}
   */
  public get configuration(): EditorConfig|string {
    return this.config;
  }

  /**
   * Checks for required fields in Editor's config
   *
   * @returns {Promise<void>}
   */
  public async validate(): Promise<void> {
    const { holderId, holder } = this.config;

    if (holderId && holder) {
      throw Error('«holderId» and «holder» param can\'t assign at the same time.');
    }

    /**
     * Check for a holder element's existence
     */
    if (typeof holder === 'string' && !Dom.get(holder)) {
      throw Error(`element with ID «${holder}» is missing. Pass correct holder's ID.`);
    }

    if (holder && typeof holder === 'object' && !Dom.isElement(holder)) {
      throw Error('holder as HTMLElement if provided must be inherit from Element class.');
    }
  }

  /**
   * Initializes modules:
   *  - make and save instances
   *  - configure
   */
  public init(): void {
    /**
     * Make modules instances and save it to the @property this.moduleInstances
     */
    this.constructModules();

    /**
     * Modules configuration
     */
    this.configureModules();
  }

  /**
   * Start Editor!
   *
   * Get list of modules that needs to be prepared and return a sequence (Promise)
   *
   * @returns {Promise<void>}
   */
  public async start(): Promise<void> {
    const modulesToPrepare = [
      'Tools',
      'UI',
      'BlockManager',
      'Paste',
      'BlockSelection',
      'RectangleSelection',
      'CrossBlockSelection',
      'ReadOnly',
    ];

    await modulesToPrepare.reduce(
      (promise, module) => promise.then(async () => {
        // log(`Preparing ${module} module`, 'time');

        try {
          await this.moduleInstances[module].prepare();
        } catch (e) {
          /**
           * CriticalError's will not be caught
           * It is used when Editor is rendering in read-only mode with unsupported plugin
           */
          if (e instanceof CriticalError) {
            throw new Error(e.message);
          }
          log(`Module ${module} was skipped because of %o`, 'warn', e);
        }
        // log(`Preparing ${module} module`, 'timeEnd');
      }),
      Promise.resolve()
    );
  }

  /**
   * Render initial data
   */
  private render(): Promise<void> {
    return this.moduleInstances.Renderer.render(this.config.data.blocks);
  }

  /**
   * Make modules instances and save it to the @property this.moduleInstances
   */
  private constructModules(): void {
    Modules.forEach((Module) => {

      try {
        /**
         * We use class name provided by displayName property
         *
         * On build, Babel will transform all Classes to the Functions so, name will always be 'Function'
         * To prevent this, we use 'babel-plugin-class-display-name' plugin
         *
         * @see  https://www.npmjs.com/package/babel-plugin-class-display-name
         */
        this.moduleInstances[(Module as any).displayName] = new Module({
          config: this.configuration as EditorConfig,
        });
      } catch (e) {
        log(`Module ${(Module as any).displayName} skipped because`, 'warn', e);
      }
    });
  }

  /**
   * Modules instances configuration:
   *  - pass other modules to the 'state' property
   *  - ...
   */
  private configureModules(): void {
    for (const name in this.moduleInstances) {
      if (Object.prototype.hasOwnProperty.call(this.moduleInstances, name)) {
        /**
         * Module does not need self-instance
         */
        this.moduleInstances[name].state = this.getModulesDiff(name);
      }
    }
  }

  /**
   * Return modules without passed name
   *
   * @param {string} name - module for witch modules difference should be calculated
   */
  private getModulesDiff(name: string): EditorModules {
    const diff = {} as EditorModules;

    for (const moduleName in this.moduleInstances) {
      /**
       * Skip module with passed name
       */
      if (moduleName === name) {
        continue;
      }
      diff[moduleName] = this.moduleInstances[moduleName];
    }

    return diff;
  }
}
