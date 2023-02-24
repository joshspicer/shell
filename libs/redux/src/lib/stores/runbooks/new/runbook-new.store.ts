import { action, thunk } from 'easy-peasy';
import { errorToAxiosError } from '@cased/utilities';
import { dispatchAddError } from '../../notifications/notifications.store';
import { dispatchSetLoading } from '../../loading/loading.store';
import { IRunbookNewStore } from './i-runbook-new.store';

export const newRunbookStore: IRunbookNewStore = {
  newRunbookId: '',
  name: '',
  description: '',
  isCreated: false,

  setIsCreated: action((state, { created }) => {
    state.isCreated = created;
  }),

  add: action((state, runbook) => {
    state.newRunbookId = runbook.id.toString();
    state.name = runbook.name;
    state.description = runbook.description;
  }),

  create: thunk(
    async (
      actions,
      { runbook: { name, description } },
      { injections: { runbooksService }, dispatch },
    ) => {
      dispatchSetLoading(dispatch, true);

      try {
        const { runbook } = await runbooksService.create(name, description);
        actions.add(runbook);
        actions.setIsCreated({ created: true });
      } catch (error) {
        const { response } = errorToAxiosError(error);
        console.error('Runbook create failed', error);

        // istanbul ignore next
        dispatchAddError(
          dispatch,
          response?.data.reason || 'Failed to create runbook. Please try again',
        );
      }

      dispatchSetLoading(dispatch, false);
    },
  ),
};
