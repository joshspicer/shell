import { ILog } from '@cased/data';
import { Action, action, Thunk, thunk } from 'easy-peasy';

import { dispatchSetLoading } from '../loading/loading.store';
import type { IStoreInjections } from '../store';

export interface IActivitiesStore {
  allActivities: ILog[];
  populateAll: Thunk<IActivitiesStore, undefined, IStoreInjections>;
  setAllActivities: Action<IActivitiesStore, ILog[]>;
  exportLogs: Thunk<IActivitiesStore, undefined, IStoreInjections>;
}

export const activitiesStore: IActivitiesStore = {
  allActivities: [],

  setAllActivities: action((state, activities) => {
    state.allActivities = [...activities];
  }),

  populateAll: thunk(async (actions, _, { injections, dispatch }) => {
    dispatchSetLoading(dispatch, true);

    try {
      const activities = await injections.activitiesService.getAll();
      actions.setAllActivities(activities);
    } catch (error) {
      console.error('Failed to fetch activities', error);
    }

    dispatchSetLoading(dispatch, false);
  }),

  exportLogs: thunk(async (actions, _, { injections, dispatch }) => {
    dispatchSetLoading(dispatch, true);

    try {
      await injections.activitiesService.export();
    } catch (error) {
      console.error('Failed to fetch activities', error);
    }

    dispatchSetLoading(dispatch, false);
  }),
};
