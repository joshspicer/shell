import { action, thunk } from 'easy-peasy';
import { errorToAxiosError } from '@cased/utilities';
import { dispatchSetLoading } from '../../loading/loading.store';
import { transformRunResultData } from '../runbooks-store-helpers';
import { dispatchAddError } from '../../notifications/notifications.store';

import { IRunbookRunStore } from './i-runbook-run.store';

export const runbookRunStore: IRunbookRunStore = {
  formFields: [],
  runData: {},
  runResult: [],

  setRunFormFields: action((state, { fields }) => {
    state.formFields = fields;
  }),

  setRunData: action((state, { runData }) => {
    state.runData = runData;
  }),

  setRunResult: action((state, { runResult }) => {
    state.runResult = runResult;
  }),

  clearAll: action((state) => {
    state.formFields = [];
    state.runData = {};
    state.runResult = [];
  }),

  setRunbookRunFormFields: thunk(async (actions, _, { getStoreState }) => {
    const { id, nodes } = getStoreState().runbooks;
    if (!id) throw new Error('Failed to find runbook id in redux store');

    const formNode = nodes.find((n) => n.data.form);
    if (!formNode || !formNode.data.form) return null;

    const initialFormValues: {
      [key: string]: string;
    } = {};
    const formFields = formNode.data.form;
    for (let i = 0; i < formFields.length; i += 1) {
      const { name } = formFields[i];
      initialFormValues[name] = '';
    }

    actions.setRunbookRunData({
      runData: { [formNode.id]: initialFormValues },
    });
    actions.setRunFormFields({ fields: formFields });
    return true;
  }),

  setRunbookRunData: thunk(async (actions, { runData }) => {
    actions.setRunData({ runData });
  }),

  setRunbookRunResult: thunk(async (actions, { runResult }) => {
    actions.setRunResult({ runResult });
  }),

  run: thunk(
    async (
      actions,
      _,
      { injections: { runbooksService }, dispatch, getState, getStoreState },
    ) => {
      const { id, nodes } = getStoreState().runbooks;
      const { runData } = getState();
      if (!id) throw new Error('Failed to find runbook id in redux store');

      dispatchSetLoading(dispatch, true);
      let success = true;
      try {
        const { result } = await runbooksService.run(id, { runData });
        const formatedResult = transformRunResultData(result, nodes);
        actions.setRunbookRunResult({ runResult: formatedResult });
      } catch (error) {
        const { response } = errorToAxiosError(error);
        console.error('Runbook run failed', error);
        success = false;
        // istanbul ignore next
        dispatchAddError(
          dispatch,
          response?.data?.reason || 'Failed to run runbook. Please try again',
        );
      }
      dispatchSetLoading(dispatch, false);
      return success;
    },
  ),
};
