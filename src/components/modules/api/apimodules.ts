import { BlocksAPI } from './blocks';
import { CaretAPI } from './caret';
import { EventsAPI } from './events';
import { I18nAPI } from './i18n';
import { API } from './index';
import { InlineToolbarAPI } from './inlineToolbar';
import { ListenersAPI } from './listeners';
import { NotifierAPI } from './notifier';
import { ReadOnlyAPI } from './readonly';
import { SanitizerAPI } from './sanitizer';
import { SaverAPI } from './saver';
import { SelectionAPI } from './selection';
import { StylesAPI } from './styles';
import { ToolbarAPI } from './toolbar';
import { TooltipAPI } from './tooltip';

export const APIModules = [
  BlocksAPI, CaretAPI, EventsAPI, I18nAPI, API, InlineToolbarAPI, ListenersAPI, NotifierAPI, ReadOnlyAPI, SanitizerAPI, SaverAPI, SelectionAPI, StylesAPI, ToolbarAPI, TooltipAPI
]
