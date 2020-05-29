import { reduce, cloneDeep } from 'lodash';

import * as types from '../constants/ActionTypes';
import { getView } from '../reducers/viewHandler';
import { getTable } from '../reducers/tables';
import { createCollapsedMap, flattenRows } from '../utils/documentListHelper';

/**
 * @method createTable
 * @summary Add a new table entry to the redux store
 */
function createTable(id, data) {
  return {
    type: types.CREATE_TABLE,
    payload: { id, data },
  };
}

/**
 * @method updateTable
 * @summary Perform a major update (many values at once) of a table entry. Think
 * initial load
 */
function updateTable(id, data) {
  return {
    type: types.UPDATE_TABLE,
    payload: { id, data },
  };
}

/**
 * @method deleteTable
 * @summary Remove the table with specified `id` from the store
 */
export function deleteTable(id) {
  return {
    type: types.DELETE_TABLE,
    payload: { id },
  };
}

/**
 * @method setActiveSort
 * @summary Change the value of the `activeSort` setting for specified table
 * @todo rename to `setActiveSort` once we switch to tables driven by redux
 */
export function setActiveSort(id, active) {
  return {
    type: types.SET_ACTIVE_SORT,
    payload: { id, active },
  };
}

/**
 * Update table selection - select items
 */
export function updateTableSelection({ tableId, ids }) {
  return {
    type: types.UPDATE_TABLE_SELECTION,
    payload: { id: tableId, selection: ids },
  };
}

/**
 * Toggle table rows
 */
function collapseRows({
  tableId,
  collapsedParentRows,
  collapsedRows,
  collapsedArrayMap,
}) {
  return {
    type: types.COLLAPSE_TABLE_ROWS,
    payload: {
      id: tableId,
      collapsedParentRows,
      collapsedRows,
      collapsedArrayMap,
    },
  };
}

// TODO: selections, other small updates

/**
 * @method createTableData
 * @summary Helper function to grab raw data and format/name it accordingly to
 * the values in the store.
 */
export function createTableData(rawData) {
  const dataObject = {
    windowType: rawData.windowType || rawData.windowId,
    viewId: rawData.viewId,
    docId: rawData.id,
    tabId: rawData.tabId,
    emptyText: rawData.emptyResultText,
    emptyHint: rawData.emptyResultHint,
    page: rawData.page,
    size: rawData.size,
    queryLimit: rawData.queryLimit,
    pageLength: rawData.pageLength,
    firstRow: rawData.firstRow,
    tabIndex: rawData.tabIndex,
    internalName: rawData.internalName,
    queryOnActivate: rawData.queryOnActivate,
    supportQuickInput: rawData.supportQuickInput,
    allowCreateNew: rawData.allowCreateNew,
    allowCreateNewReason: rawData.allowCreateNewReason,
    allowDelete: rawData.allowDelete,
    stale: rawData.stale,
    headerProperties: rawData.headerProperties
      ? rawData.headerProperties
      : undefined,
    headerElements: rawData.headerElements ? rawData.headerElements : undefined,
    orderBy: rawData.orderBy ? rawData.orderBy : undefined,

    // immer freezes objects to make them immutable, so we have to make a deep copy
    // of entries as otherwise we're just passing references to frozen objects
    columns: rawData.elements ? cloneDeep(rawData.elements) : undefined,
    rows: rawData.result ? cloneDeep(rawData.result) : undefined,
    defaultOrderBys: rawData.defaultOrderBys
      ? rawData.defaultOrderBys
      : undefined,
    expandedDepth: rawData.expandedDepth,
    keyProperty: rawData.keyProperty,

    // TODO: We have both `supportTree` and `collapsible` in the layout response.
    collapsible: rawData.collapsible,
    indentSupported: rawData.supportTree,
  };

  // we're removing any keys without a value ta make merging with the existing data
  // easier/faster
  return reduce(
    dataObject,
    (result, value, key) => {
      if (typeof value !== 'undefined') {
        result[key] = value;
      }
      return result;
    },
    {}
  );
}

// THUNK ACTION CREATORS

/*
 * Create a new table entry for grids using data from the window layout (so not populated with data yet)
 */
export function createGridTable(tableId, tableResponse) {
  return (dispatch, getState) => {
    const windowType = tableResponse.windowType || tableResponse.windowId;
    const tableLayout = getView(getState(), windowType).layout;
    const tableData = createTableData({
      ...tableResponse,
      ...tableLayout,
    });

    dispatch(createTable(tableId, tableData));

    return Promise.resolve(tableData);
  };
}

/*
 * Populate grid table with data and initial settings
 */
export function updateGridTable(tableId, tableResponse) {
  return (dispatch, getState) => {
    const state = getState();

    if (state.tables) {
      const tableExists = state.tables[tableId];

      if (tableExists) {
        const tableData = createTableData({
          ...tableResponse,
          headerElements: tableResponse.columnsByFieldName,
          keyProperty: 'id',
        });
        const { collapsible, expandedDepth } = tableExists;

        // Parse `rows` to add `indent` property
        if (tableData.rows.length) {
          tableData.rows = flattenRows(tableData.rows);
        }

        const { rows, keyProperty } = tableData;

        console.log('updateGridTable 1: ')//, tableData, tableResponse)

        dispatch(updateTable(tableId, tableData));
        dispatch(
          createCollapsedRows({
            tableId,
            rows,
            collapsible,
            expandedDepth,
            keyProperty,
          })
        );
      } else {
        const windowType = tableResponse.windowType || tableResponse.windowId;
        const tableLayout = getView(getState(), windowType).layout;
        const tableData = createTableData({
          ...tableResponse,
          ...tableLayout,
          headerElements: tableResponse.columnsByFieldName,
          keyProperty: 'id',
        });

        if (tableData.rows.length) {
          tableData.rows = flattenRows(tableData.rows);
        }

        console.log('updateGridTable 2: ')//, tableData, tableResponse)

        const { rows, collapsible, expandedDepth, keyProperty } = tableData;

        dispatch(createTable(tableId, tableData));
        dispatch(
          createCollapsedRows({
            tableId,
            rows,
            collapsible,
            expandedDepth,
            keyProperty,
          })
        );
      }

      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  };
}

/*
 * Create a new table entry for the details view when it's created, setting only the ids
 */
export function createTabTable(tableId, tableResponse) {
  return (dispatch) => {
    const tableData = createTableData({
      ...tableResponse,
    });

    dispatch(createTable(tableId, tableData));

    return Promise.resolve(tableData);
  };
}

/*
 * Update table entry for the details view with layout and data rows
 */
export function updateTabTable(tableId, tableResponse) {
  return (dispatch, getState) => {
    const state = getState();

    if (state.tables) {
      const tableExists = state.tables[tableId];
      const tableData = createTableData({
        ...tableResponse,
        keyProperty: 'rowId',
      });

      if (tableExists) {
        dispatch(updateTable(tableId, tableData));
      } else {
        dispatch(createTable(tableId, tableData));
      }

      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  };
}

function createCollapsedRows({
  tableId,
  rows,
  collapsible,
  expandedDepth,
  keyProperty,
}) {
  return (dispatch) => {
    let collapsedArrayMap = [];
    let collapsedParentRows = [];
    let collapsedRows = [];

    if (collapsible && rows.length) {
      // TODO: Remove
      try {
        rows.forEach((row) => {
          if (row.indent.length >= expandedDepth && row.includedDocuments) {
            collapsedArrayMap = collapsedArrayMap.concat(
              createCollapsedMap(row)
            );
            collapsedParentRows = collapsedParentRows.concat(row[keyProperty]);
          } else if (row.indent.length > expandedDepth) {
            collapsedRows = collapsedRows.concat(row[keyProperty]);
          }
        });
      } catch (e) {
        console.log('ERROR: ', e);
      }
    }

    if (collapsible) {
      dispatch(
        collapseRows({
          tableId,
          collapsedParentRows,
          collapsedRows,
          collapsedArrayMap,
        })
      );
    }
  };
}

/*
 * Create a new table entry for grids using data from the window layout (so not populated with data yet)
 */
export function collapseTableRow({ tableId, collapse, node }) {
  return (dispatch, getState) => {
    const table = getTable(getState(), tableId);
    let collapsedParentRows = cloneDeep(table.collapsedParentRows);
    let collapsedRows = cloneDeep(table.collapsedRows);
    let collapsedArrayMap = cloneDeep(table.collapsedArrayMap);
    const { keyProperty } = table;

    const inner = (parentNode) => {
      collapsedArrayMap = createCollapsedMap(
        parentNode,
        collapse,
        collapsedArrayMap
      );

      if (collapse) {
        collapsedParentRows.splice(
          collapsedParentRows.indexOf(parentNode[keyProperty]),
          1
        );
      } else {
        if (collapsedParentRows.indexOf(parentNode[keyProperty]) > -1) return;

        collapsedParentRows = collapsedParentRows.concat(
          parentNode[keyProperty]
        );
      }

      parentNode.includedDocuments &&
        parentNode.includedDocuments.map((childNode) => {
          if (collapse) {
            collapsedRows.splice(
              collapsedRows.indexOf(childNode[keyProperty]),
              1
            );
          } else {
            if (collapsedRows.indexOf(childNode[keyProperty]) > -1) return;

            collapsedRows = collapsedRows.concat(childNode[keyProperty]);
            childNode.includedDocuments && inner(childNode);
          }
        });
    };

    inner(node);

    const returnData = {
      tableId,
      collapsedRows,
      collapsedParentRows,
      collapsedArrayMap,
    };

    dispatch(collapseRows(returnData));

    return Promise.resolve(returnData);
  };
}
