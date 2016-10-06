import uuid from 'node-uuid';
import AJAX from 'utils/ajax';
import getInitialState from 'src/store/getInitialState';
import _ from 'lodash';
import * as api from '../../api/';

export function createPanel() {
  return {
    type: 'CREATE_PANEL',
    payload: {
      panelId: uuid.v4(), // for the default Panel
      queryId: uuid.v4(), // for the default Query
    },
  };
}

export function renamePanel(panelId, name) {
  return {
    type: 'RENAME_PANEL',
    payload: {
      panelId,
      name,
    },
  };
}

export function deletePanel(panelId) {
  return {
    type: 'DELETE_PANEL',
    payload: {
      panelId,
    },
  };
}

export function addQuery(panelId) {
  return {
    type: 'ADD_QUERY',
    payload: {
      panelId,
      queryId: uuid.v4(),
    },
  };
}

export function deleteQuery(panelId, queryId) {
  return {
    type: 'DELETE_QUERY',
    payload: {
      queryId,
      panelId,
    },
  };
}

export function toggleField(queryId, fieldFunc) {
  return {
    type: 'TOGGLE_FIELD',
    payload: {
      queryId,
      fieldFunc,
    },
  };
}

export function groupByTime(queryId, time) {
  return {
    type: 'GROUP_BY_TIME',
    payload: {
      queryId,
      time,
    },
  };
}

export function applyFuncsToField(queryId, fieldFunc) {
  return {
    type: 'APPLY_FUNCS_TO_FIELD',
    payload: {
      queryId,
      fieldFunc,
    },
  };
}

export function chooseTag(queryId, tag) {
  return {
    type: 'CHOOSE_TAG',
    payload: {
      queryId,
      tag,
    },
  };
}

export function chooseNamespace(queryId, {database, retentionPolicy}) {
  return {
    type: 'CHOOSE_NAMESPACE',
    payload: {
      queryId,
      database,
      retentionPolicy,
    },
  };
}

export function chooseMeasurement(queryId, measurement) {
  return {
    type: 'CHOOSE_MEASUREMENT',
    payload: {
      queryId,
      measurement,
    },
  };
}

export function setTimeRange(range) {
  window.localStorage.setItem('timeRange', JSON.stringify(range));

  return {
    type: 'SET_TIME_RANGE',
    payload: range,
  };
}

export function groupByTag(queryId, tagKey) {
  return {
    type: 'GROUP_BY_TAG',
    payload: {
      queryId,
      tagKey,
    },
  };
}

export function toggleTagAcceptance(queryId) {
  return {
    type: 'TOGGLE_TAG_ACCEPTANCE',
    payload: {
      queryId,
    },
  };
}

export function createExploration(source, push) {
  return (dispatch) => {
    const initialState = getInitialState();
    AJAX({
      url: `${source.links.self}/users/1/explorations`, // TODO: change this to use actual user link once users are introduced
      method: 'POST',
      data: JSON.stringify({
        data: JSON.stringify(initialState),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((resp) => {
      const explorer = parseRawExplorer(resp.data);
      dispatch(loadExploration(explorer));
      push(`/sources/${source.id}/chronograf/data_explorer/${btoa(explorer.link.href)}`); // Base64 encode explorer URI
    });
  };
}

export function deleteExplorer(clusterID, explorerID, push) {
  return (dispatch, getState) => {
    AJAX({
      url: `/api/int/v1/explorers/${explorerID}`,
      method: 'DELETE',
    }).then(() => {
      const state = getState();

      // If the currently active explorer is being deleted, load another session;
      if (state.activeExplorer.id === explorerID) {
        const explorer = state.explorers[0];

        // If we don't have an explorer to navigate to, it means we're deleting the last
        // explorer and should create a new one.
        if (explorer) {
          dispatch(loadExploration(explorer));
          push(`/chronograf/data_explorer/${explorer.id}`);
        } else {
          dispatch(createExploration(clusterID, push));
        }
      }

      dispatch({
        type: 'DELETE_EXPLORER',
        payload: {id: explorerID},
      });
    });
  };
}

export function editExplorer(clusterID, explorerID, params) {
  return (dispatch) => {
    AJAX({
      url: `/api/int/v1/explorers/${explorerID}`,
      method: 'PUT',
      data: JSON.stringify(params),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((resp) => {
      dispatch({
        type: 'EDIT_EXPLORER',
        payload: {
          explorer: resp.data,
        },
      });
    });
  };
}

function loadExplorers(explorers) {
  return {
    type: 'LOAD_EXPLORERS',
    payload: {explorers},
  };
}

function loadExploration(explorer) {
  return {
    type: 'LOAD_EXPLORER',
    payload: {explorer},
  };
}

export function fetchExplorers({source, userID, explorerURI, push}) {
  return (dispatch) => {
    dispatch({type: 'FETCH_EXPLORERS'});
    AJAX({
      url: `${source.links.self}/users/${userID}/explorations`,
    }).then(({data: {explorations}}) => {
      const explorers = explorations.map(parseRawExplorer);
      dispatch(loadExplorers(explorers));

      // Create a new explorer session for a user if they don't have any
      // saved (e.g. when they visit for the first time).
      if (!explorers.length) {
        dispatch(createExploration(source, push));
        return;
      }

      // If no explorerURI is provided, it means the user wasn't attempting to visit
      // a specific explorer (i.e. `/data_explorer/:id`).  In this case, pick the
      // most recently updated explorer and navigate to it.
      if (!explorerURI) {
        const explorer = _.maxBy(explorers, (ex) => ex.updated_at);
        dispatch(loadExploration(explorer));
        push(`/sources/${source.id}/chronograf/data_explorer/${btoa(explorer.link.href)}`);
        return;
      }

      // We have an explorerURI, meaning a specific explorer was requested.
      const explorer = explorers.find((ex) => ex.id === explorerURI);

      // Attempting to request a non-existent explorer
      if (!explorer) {
        return;
      }

      dispatch(loadExploration(explorer));
    });
  };
}

/**
 * Informs reducers when to clear out state in expectation of
 * a new data explorer being loaded, or showing a spinner, etc.
 */
function fetchExplorer() {
  return {
    type: 'FETCH_EXPLORER',
  };
}

function saveExplorer(error) {
  return {
    type: 'SAVE_EXPLORER',
    payload: error ? new Error(error) : null,
    error: true,
  };
}

export function chooseExploration(explorerURI, source, push) {
  return (dispatch, getState) => {
    // Save the previous session explicitly in case an auto-save was unable to complete.
    const {panels, queryConfigs, activeExplorer} = getState();
    api.saveExplorer({
      explorerID: activeExplorer.id,
      name: activeExplorer.name,
      panels,
      queryConfigs,
    }).then(() => {
      dispatch(saveExplorer());
    }).catch(({response}) => {
      const err = JSON.parse(response).error;
      dispatch(saveExplorer(err));
      console.error('Unable to save data explorer session: ', JSON.parse(response).error); // eslint-disable-line no-console
    });

    dispatch(fetchExplorer());
    AJAX({
      url: explorerURI,
    }).then((resp) => {
      const explorer = parseRawExplorer(resp.data);
      dispatch(loadExploration(explorer));
      push(`/sources/${source.id}/chronograf/data_explorer/${btoa(explorerURI)}`);
    });
  };
}

function parseRawExplorer(raw) {
  return Object.assign({}, raw, {
    data: JSON.parse(raw.data),
  });
}

export function updateRawQuery(queryID, text) {
  return {
    type: 'UPDATE_RAW_QUERY',
    payload: {
      queryID,
      text,
    },
  };
}
