import { ShortcutData } from './shortcuts'
import { ValuesType } from 'utility-types';
/**
 * @example
 * new Shortcut({
 *   name : 'CMD+S',
 *   on : document.body,
 *   handler : function(event) {
 *       // handle CMD+S
 *   }
 * });
 */

/**
 * @typedef {ShortcutConfig} ShortcutConfig
 * @property {String} name - shortcut name
 * @property {HTMLBodyElement} on - element that passed on shortcut creation
 * @property {Function} handler - custom user function
 */
interface ShortcutConfig extends Pick<ShortcutData, 'name' | 'handler'> {
  on: Document
}

/**
 * @class Shortcut
 * @classdesc Callback will be fired with two params:
 *   - event: standard keyDown param
 *   - target: element which registered on shortcut creation
 */


export class Shortcut {
  /**
   * @return {{SHIFT: string[], CMD: string[], ALT: string[]}}
   */
  static get supportedCommands() {
    return {
      'SHIFT': [ 'SHIFT' ],
      'CMD': ['CMD', 'CONTROL', 'COMMAND', 'WINDOWS', 'CTRL'],
      'ALT': ['ALT', 'OPTION'],
    };
  }

  /**
   * List of key codes
   */
  static get keyCodes() {
    return {
      '0' : 48,
      '1' : 49,
      '2' : 50,
      '3' : 51,
      '4' : 52,
      '5' : 53,
      '6' : 54,
      '7' : 55,
      '8' : 56,
      '9' : 57,
      'A' : 65,
      'B' : 66,
      'C' : 67,
      'D' : 68,
      'E' : 69,
      'F' : 70,
      'G' : 71,
      'H' : 72,
      'I' : 73,
      'J' : 74,
      'K' : 75,
      'L' : 76,
      'M' : 77,
      'N' : 78,
      'O' : 79,
      'P' : 80,
      'Q' : 81,
      'R' : 82,
      'S' : 83,
      'T' : 84,
      'U' : 85,
      'V' : 86,
      'W' : 87,
      'X' : 88,
      'Y' : 89,
      'Z' : 90,
      'BACKSPACE' : 8,
      'ENTER'     : 13,
      'ESCAPE'    : 27,
      'LEFT'      : 37,
      'UP'        : 38,
      'RIGHT'     : 39,
      'DOWN'      : 40,
      'INSERT'    : 45,
      'DELETE'    : 46
    };
  }

  public commands: {[key in keyof typeof Shortcut['supportedCommands']]?: boolean}
  public keys: {[key: string]: boolean}
  public name: string
  public element: Document
  public callback: ShortcutConfig['handler']

  public executeShortcut: ((event: KeyboardEvent) => void);

  /**
   * @constructor
   *
   * Create new shortcut
   * @param {ShortcutConfig} shortcut
   */
  constructor(shortcut: ShortcutConfig) {
    this.commands = {};
    this.keys = {};
    this.name = shortcut.name;

    this.parseShortcutName(shortcut.name);

    this.element = shortcut.on;
    this.callback = shortcut.handler;

    this.executeShortcut = (event) => {
      this.execute(event);
    };
    this.element.addEventListener('keydown', this.executeShortcut, false);
  }



  /**
   * Parses string to get shortcut commands in uppercase
   * @param {String} shortcut
   */
  parseShortcutName(shortcut: string) {
    const shortcutSplitted = shortcut.split('+');
    for (let key = 0; key < shortcutSplitted.length; key++) {
      shortcutSplitted[key] = shortcutSplitted[key].toUpperCase();

      let isCommand = false;

      for (const command in Shortcut.supportedCommands) {
        if (Shortcut.supportedCommands[command].includes(shortcutSplitted[key])) {
          this.commands[command] = true;
          isCommand = true;
          break;
        }
      }

      if (!isCommand) {
        this.keys[shortcutSplitted[key]] = true;
      }
    }

    for(const command in Shortcut.supportedCommands) {
      if (!this.commands[command]) {
        this.commands[command] = false;
      }
    }
  }

  /**
   * Check all passed commands and keys before firing callback
   * @param event
   */
  execute(event: KeyboardEvent) {
    const cmdKey = event.ctrlKey || event.metaKey,
      shiftKey = event.shiftKey,
      altKey = event.altKey,
      passed = {
        'CMD': cmdKey,
        'SHIFT': shiftKey,
        'ALT': altKey
      };

    let command,
      allCommandsPassed = true;

    for (command in this.commands) {
      if (this.commands[command] !== passed[command]) {
        allCommandsPassed = false;
      }
    }
    let allKeysPassed = true;

    Object.keys(this.keys).forEach((key) => {
      allKeysPassed = allKeysPassed && (event.keyCode === Shortcut.keyCodes[key])
    });

    if (allCommandsPassed && allKeysPassed) {
      this.callback(event);
    }
  }

  /**
   * Destroy shortcut: remove listener from element
   */
  remove() {
    this.element.removeEventListener('keydown', this.executeShortcut);
  }
}
