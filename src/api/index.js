import { getData, patchRequest } from './global';
import {
  initLayout,
  getAttributesInstance,
  topActionsRequest,
  getZoomIntoWindow,
  discardNewRow,
  discardNewDocument,
  getTab,
  startProcess,
  getProcessData,
} from './window';
import {
  getViewLayout,
  getViewRowsByIds,
  browseViewRequest,
  locationSearchRequest,
  locationConfigRequest,
  deleteView,
  createViewRequest,
  filterViewRequest,
  deleteStaticFilter,
  quickActionsRequest,
} from './view';
import {
  loginRequest,
  localLoginRequest,
  loginCompletionRequest,
  logoutRequest,
  resetPasswordRequest,
  getResetPasswordInfo,
  resetPasswordComplete,
  resetPasswordGetAvatar,
  getAvatar,
  getUserSession,
  getUserLang,
  setUserLang,
  getAvailableLang,
} from './login';

export {
  getData,
  patchRequest,
  initLayout,
  getAttributesInstance,
  topActionsRequest,
  getZoomIntoWindow,
  discardNewRow,
  discardNewDocument,
  getTab,
  startProcess,
  getProcessData,
  getViewLayout,
  getViewRowsByIds,
  browseViewRequest,
  locationSearchRequest,
  locationConfigRequest,
  deleteView,
  createViewRequest,
  filterViewRequest,
  deleteStaticFilter,
  quickActionsRequest,
  loginRequest,
  localLoginRequest,
  loginCompletionRequest,
  logoutRequest,
  resetPasswordRequest,
  getResetPasswordInfo,
  resetPasswordComplete,
  resetPasswordGetAvatar,
  getAvatar,
  getUserSession,
  getUserLang,
  setUserLang,
  getAvailableLang,
};
