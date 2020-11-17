/**
 * Require Editor modules places in components/modules dir
 */

import { APIModules } from './modules/api/apimodules';
import { ToolbarModules } from './modules/toolbar/toolbarModules';
import { RootModules } from './modules/indexModules';
export const Modules = [
  ...APIModules, ...ToolbarModules, ...RootModules
]
