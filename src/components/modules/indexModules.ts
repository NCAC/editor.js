import { Listeners } from './listeners';
import { ModificationsObserver } from './modificationsObserver';
import { Notifier } from './notifier';
import { Paste } from './paste';
import { ReadOnly } from './readonly';
import { RectangleSelection } from './rectangleSelection_problem';
import { Renderer } from './renderer';
import { Sanitizer } from './sanitizer';
import { Saver } from './saver';
import { Tools } from './tools'
import { Shortcuts } from './shortcuts';
import { Tooltip } from './tooltip';
import { UI } from './ui';
import {Events} from './events';
import { DragNDrop } from './dragNDrop';
import { CrossBlockSelection } from './crossBlockSelection';
import { Caret } from './caret';
import { BlockSelection } from './blockSelection';
import {BlockManager} from './blockManager';
import { BlockEvents } from './blockEvents';

export const RootModules = [ Listeners, ModificationsObserver, Notifier, Paste, ReadOnly, RectangleSelection, Renderer, Sanitizer, Saver, Tools, Shortcuts, Tooltip, UI, Events, DragNDrop, CrossBlockSelection, Caret, BlockSelection, BlockManager, BlockEvents ];
