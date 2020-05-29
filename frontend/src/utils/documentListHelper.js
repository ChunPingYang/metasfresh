import PropTypes from 'prop-types';
import { Map as iMap } from 'immutable';
import Moment from 'moment-timezone';
import currentDevice from 'current-device';

import { getItemsByProperty, nullToEmptyStrings } from './index';
import { getSelectionInstant } from '../reducers/windowHandler';
import { viewState, getView } from '../reducers/viewHandler';
import { TIME_REGEX_TEST } from '../constants/Constants';

/**
 * @typedef {object} Props Component props
 * @prop {object} DLpropTypes
 */
const DLpropTypes = {
  // from parent
  windowId: PropTypes.string.isRequired,
  viewId: PropTypes.string,
  updateParentSelectedIds: PropTypes.func,
  page: PropTypes.number,
  sort: PropTypes.string,
  defaultViewId: PropTypes.string,

  // TODO: Eventually this should be renamed to `refWindowId`
  refType: PropTypes.string,
  refId: PropTypes.string,
  refTabId: PropTypes.string,

  // from @connect
  selections: PropTypes.object.isRequired,
  childSelected: PropTypes.array.isRequired,
  parentSelected: PropTypes.array.isRequired,
  selected: PropTypes.array.isRequired,
  isModal: PropTypes.bool,
  inModal: PropTypes.bool,
  modal: PropTypes.object,
  rawModalVisible: PropTypes.bool,
};

/**
 * @typedef {object} Props Component context
 * @prop {object} DLcontextTypes
 */
const DLmapStateToProps = (state, props) => {
  const {
    page: queryPage,
    sort: querySort,
    viewId: queryViewId,
    isModal,
    defaultViewId,
    windowType,
    refType: queryRefType,
    refId: queryRefId,
    refTabId: queryRefTabId,
  } = props;
  const identifier = isModal ? defaultViewId : windowType;
  let master = getView(state, identifier);

  if (!master) {
    master = viewState;
  }

  const sort = master.sort ? master.sort : querySort;
  const page = master.page ? master.page : parseInt(queryPage);
  let viewId = master.viewId ? master.viewId : queryViewId;

  // used for modals
  if (props.defaultViewId) {
    viewId = props.defaultViewId;
  }

  if (location.hash === '#notification') {
    viewId = null;
  }

  return {
    page,
    sort,
    viewId,
    reduxData: master,
    layout: master.layout,
    layoutPending: master.layoutPending,
    refType: queryRefType,
    refId: queryRefId,
    refTabId: queryRefTabId,
    selections: state.windowHandler.selections,
    selected: getSelectionInstant(
      state,
      { ...props, windowId: props.windowType, viewId },
      state.windowHandler.selectionsHash
    ),
    childSelected:
      props.includedView && props.includedView.windowType
        ? getSelectionInstant(
            state,
            {
              ...props,
              windowId: props.includedView.windowType,
              viewId: props.includedView.viewId,
            },
            state.windowHandler.selectionsHash
          )
        : NO_SELECTION,
    parentSelected: props.parentWindowType
      ? getSelectionInstant(
          state,
          {
            ...props,
            windowId: props.parentWindowType,
            viewId: props.parentDefaultViewId,
          },
          state.windowHandler.selectionsHash
        )
      : NO_SELECTION,
    modal: state.windowHandler.modal,
    rawModalVisible: state.windowHandler.rawModal.visible,
    filters: state.filters,
    table: state.table,
  };
};

const NO_SELECTION = [];
const NO_VIEW = {};
const PANEL_WIDTHS = ['1', '.2', '4'];
const GEO_PANEL_STATES = ['grid', 'all', 'map'];

// for mobile devices we only want to show either map or grid
if (currentDevice.type === 'mobile' || currentDevice.type === 'tablet') {
  GEO_PANEL_STATES.splice(1, 1);
}

const filtersToMap = function(filtersArray) {
  let filtersMap = iMap();

  if (filtersArray && filtersArray.length) {
    filtersArray.forEach((filter) => {
      filtersMap = filtersMap.set(filter.filterId, filter);
    });
  }
  return filtersMap;
};

// TODO: This can probably be removed
const doesSelectionExist = function({
  data,
  selected,
  hasIncluded = false,
} = {}) {
  // When the rows are changing we should ensure
  // that selection still exist
  if (hasIncluded) {
    return true;
  }

  if (selected && selected[0] === 'all') {
    return true;
  }

  let rows = [];

  data &&
    data.length &&
    data.map((item) => {
      rows = rows.concat(mapIncluded(item));
    });

  return (
    data &&
    data.length &&
    selected &&
    selected[0] &&
    getItemsByProperty(rows, 'id', selected[0]).length
  );
};

const getSortingQuery = (asc, field) => (asc ? '+' : '-') + field;

export {
  DLpropTypes,
  DLmapStateToProps,
  NO_SELECTION,
  NO_VIEW,
  PANEL_WIDTHS,
  GEO_PANEL_STATES,
  getSortingQuery,
  filtersToMap,
  doesSelectionExist,
};

// ROWS UTILS

export function mergeColumnInfosIntoViewRows(columnInfosByFieldName, rows) {
  if (!columnInfosByFieldName) {
    return rows;
  }

  return rows.map((row) =>
    mergeColumnInfosIntoViewRow(columnInfosByFieldName, row)
  );
}

function mergeColumnInfosIntoViewRow(columnInfosByFieldName, row) {
  const fieldsByName = Object.values(row.fieldsByName)
    .map((viewRowField) =>
      mergeColumnInfoIntoViewRowField(
        columnInfosByFieldName[viewRowField.field],
        viewRowField
      )
    )
    .reduce((acc, viewRowField) => {
      acc[viewRowField.field] = viewRowField;
      return acc;
    }, {});

  return Object.assign({}, row, { fieldsByName });
}

function mergeColumnInfoIntoViewRowField(columnInfo, viewRowField) {
  if (!columnInfo) {
    return viewRowField;
  }

  if (columnInfo.widgetType) {
    viewRowField['widgetType'] = columnInfo.widgetType;
  }

  // NOTE: as discussed with @metas-mk, at the moment we cannot apply the maxPrecision per page,
  // because it would puzzle the user.
  // if (columnInfo.maxPrecision && columnInfo.maxPrecision > 0) {
  //   viewRowField["precision"] = columnInfo.maxPrecision;
  // }

  return viewRowField;
}

function indexRows(rows, map) {
  for (const row of rows) {
    const { id, includedDocuments } = row;

    map[id] = row;

    if (includedDocuments) {
      indexRows(includedDocuments, map);
    }
  }

  return map;
}

function mapRows(rows, map, columnInfosByFieldName) {
  return rows.map((row) => {
    const { id, includedDocuments } = row;

    if (includedDocuments) {
      row.includedDocuments = mapRows(
        includedDocuments,
        map,
        columnInfosByFieldName
      );
    }

    const entry = map[id];

    if (entry) {
      return mergeColumnInfosIntoViewRow(columnInfosByFieldName, entry);
    } else {
      return row;
    }
  });
}

export function removeRows(rowsList, changedRows) {
  const removedRows = [];

  changedRows.forEach((id) => {
    const idx = rowsList.findIndex((row) => row.id === id);

    if (idx !== -1) {
      rowsList = rowsList.delete(idx);
      removedRows.push(id);
    }
  });

  return {
    rows: rowsList,
    removedRows,
  };
}

export function mergeRows({
  toRows,
  fromRows,
  columnInfosByFieldName = {},
  changedIds,
}) {
  if (!fromRows && !changedIds) {
    return {
      rows: toRows,
      removedRows: [],
    };
  } else if (!fromRows.length) {
    return removeRows(toRows, changedIds);
  }

  const fromRowsById = indexRows(fromRows, {});

  return {
    rows: mapRows(toRows, fromRowsById, columnInfosByFieldName),
    removedRows: [],
  };
}

export function getScope(isModal) {
  return isModal ? 'modal' : 'master';
}

export function parseToDisplay(fieldsByName) {
  return parseDateToReadable(nullToEmptyStrings(fieldsByName));
}

export function convertTimeStringToMoment(value) {
  if (value.match(TIME_REGEX_TEST)) {
    return Moment(value, 'hh:mm');
  }
  return value;
}

// This doesn't set the TZ anymore, as we're handling this globally/in datepicker
export function parseDateWithCurrentTimezone(value) {
  if (value) {
    if (Moment.isMoment(value)) {
      return value;
    }

    value = convertTimeStringToMoment(value);
    return Moment(value);
  }
  return '';
}

function parseDateToReadable(fieldsByName) {
  const dateParse = ['Date', 'ZonedDateTime', 'Time', 'Timestamp'];

  return Object.keys(fieldsByName).reduce((acc, fieldName) => {
    const field = fieldsByName[fieldName];
    const isDateField = dateParse.indexOf(field.widgetType) > -1;

    acc[fieldName] =
      isDateField && field.value
        ? {
            ...field,
            value: parseDateWithCurrentTimezone(field.value),
          }
        : field;
    return acc;
  }, {});
}

/**
 * flatten array with 1 level deep max(with fieldByName)
 * from includedDocuments data
 */
export function flattenRows(rowData) {
  let data = [];
  rowData &&
    rowData.map((item) => {
      data = data.concat(mapIncluded(item));
    });

  return data;
}

export function mapIncluded(node, indent, isParentLastChild = false) {
  let ind = indent ? indent : [];
  let result = [];

  const nodeCopy = {
    ...node,
    indent: ind,
  };

  result = result.concat([nodeCopy]);

  if (isParentLastChild) {
    ind[ind.length - 2] = false;
  }

  if (node.includedDocuments) {
    for (let i = 0; i < node.includedDocuments.length; i++) {
      let copy = node.includedDocuments[i];
      copy.fieldsByName = parseToDisplay(copy.fieldsByName);
      if (i === node.includedDocuments.length - 1) {
        copy = {
          ...copy,
          lastChild: true,
        };
      }

      result = result.concat(
        mapIncluded(copy, ind.concat([true]), node.lastChild)
      );
    }
  }
  return result;
}

/**
 * Create a flat array of collapsed rows ids including parents and children
 * @todo rewrite this to not modify `initialMap`.
 */
export function createCollapsedMap(node, isCollapsed, initialMap) {
  let collapsedMap = [];
  if (initialMap) {
    if (!isCollapsed) {
      initialMap.splice(
        initialMap.indexOf(node.includedDocuments[0]),
        node.includedDocuments.length
      );
      collapsedMap = initialMap;
    } else {
      initialMap.map((item) => {
        collapsedMap.push(item);
        if (item.id === node.id) {
          collapsedMap = collapsedMap.concat(node.includedDocuments);
        }
      });
    }
  } else {
    if (node.includedDocuments) {
      collapsedMap.push(node);
    }
  }

  return collapsedMap;
}
