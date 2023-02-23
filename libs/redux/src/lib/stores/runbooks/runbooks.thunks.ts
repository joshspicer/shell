import { thunk } from 'easy-peasy';
import { Panel, RunbookMode } from '@cased/data';
import {
  dispatchAddError,
  dispatchSet404,
} from '../notifications/notifications.store';
import { dispatchSetLoading } from '../loading/loading.store';
import type { IRunbookStore } from './i-runbook-store';
import {
  createAllEdges,
  transformAllApiBlocksToNode,
  transformApiBlockToNode,
  transformNodeToApiBlock,
} from './runbooks-store-helpers';

export const runbooksThunks: Pick<
  IRunbookStore,
  | 'setRunbookMode'
  | 'updateNode'
  | 'deleteNode'
  | 'createNode'
  | 'populate'
  | 'closePanel'
  | 'markFormDirty'
  | 'selectNode'
> = {
  setRunbookMode: thunk(async (actions, _, { getStoreActions }) => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const { setPanel } = getStoreActions().runbooks;
    if (mode === 'view') {
      actions.setMode({ mode: RunbookMode.View });
      setPanel({ panel: Panel.Run });
      return;
    }

    if (!mode || mode === 'edit') {
      actions.setMode({ mode: RunbookMode.Edit });
    }
  }),

  updateNode: thunk(
    async (
      actions,
      { node, id: nodeId },
      { injections: { runbooksService }, getState, dispatch },
    ) => {
      const { id, nodes } = getState();
      // istanbul ignore next
      if (!id) throw new Error('Runbook id is not set');

      dispatchSetLoading(dispatch, true);
      let success = true;

      try {
        const apiBlock = transformNodeToApiBlock(id, node, nodeId);
        const index = nodes.findIndex((n) => n.id === nodeId);
        const { block } = await runbooksService.updateBlock(apiBlock);

        const updatedNode = transformApiBlockToNode(block, index, nodes.length);
        actions.setNodeById({ node: updatedNode });
        actions.setFormDirty({ dirty: false });
      } catch (e) /* istanbul ignore next */ {
        dispatchAddError(dispatch, 'Failed to update node, please try again');
        success = false;
      }

      dispatchSetLoading(dispatch, false);
      return success;
    },
  ),

  deleteNode: thunk(
    async (
      actions,
      { id: nodeId },
      { injections: { runbooksService }, dispatch },
    ) => {
      dispatchSetLoading(dispatch, true);
      let success = true;

      try {
        await runbooksService.deleteBlock(nodeId);
        actions.removeNodeById({ id: nodeId });
        actions.setFormDirty({ dirty: false });
      } catch (e) /* istanbul ignore next */ {
        dispatchAddError(dispatch, 'Failed to delete node, please try again');
        success = false;
      }

      dispatchSetLoading(dispatch, false);
      return success;
    },
  ),

  createNode: thunk(
    async (
      actions,
      { node },
      { injections: { runbooksService }, getState, dispatch },
    ) => {
      const { id } = getState();
      // istanbul ignore next
      if (!id) throw new Error('Failed to find runbook id in redux store');

      const block = transformNodeToApiBlock(id, node);
      dispatchSetLoading(dispatch, true);
      let success = true;

      try {
        const { block: data } = await runbooksService.createBlock(block);
        const updatedNode = transformApiBlockToNode(data);
        actions.setFormDirty({ dirty: false });

        actions.addNode({
          node: updatedNode.data,
          id: updatedNode.id,
        });
      } catch (error) /* istanbul ignore next */ {
        console.error('Runbook create failed', error);
        dispatchAddError(dispatch, 'Failed to create node. Please try again');
        success = false;
      }

      dispatchSetLoading(dispatch, false);
      return success;
    },
  ),

  populate: thunk(
    async (
      actions,
      { id },
      { injections: { runbooksService }, dispatch, getState },
    ) => {
      const activeId = getState().activeNodeId;
      dispatchSetLoading(dispatch, true);

      try {
        const { runbook, prompts, databases, apiProviders } =
          await runbooksService.get(id);
        const nodes = transformAllApiBlocksToNode(runbook.blocks);

        const activeNode = nodes.find(({ id: nodeId }) => nodeId === activeId);
        if (activeNode) activeNode.data.selected = true;

        const edges = createAllEdges(nodes);
        actions.set({
          id,
          name: runbook.name,
          nodes,
          edges,
          prompts,
          databases,
          apiProviders,
        });
      } catch (error) /* istanbul ignore next */ {
        console.error('Runbook page load failed', error);
        dispatchSet404(dispatch, true);
      }

      dispatchSetLoading(dispatch, false);
      actions.setIsPopulateCompleted({ complete: true });
    },
  ),

  closePanel: thunk(
    async (
      actions,
      { confirm },
      { injections: { routerService }, getState },
    ) => {
      const { isFormDirty, panel, mode } = getState();
      if (panel === Panel.None) return;
      if (panel === Panel.Run && mode === RunbookMode.View) return;

      if (
        confirm &&
        isFormDirty &&
        // eslint-disable-next-line no-alert
        !window.confirm('This will lose all unsaved changes. Are you sure?')
      ) {
        return;
      }

      actions.setPanel({ panel: Panel.None });
      actions.clearSelection();
      actions.setActiveNodeId({ id: undefined });
      actions.setFormDirty({ dirty: false });
      routerService.setSearchParams({});
    },
  ),

  markFormDirty: thunk(async (actions) => {
    actions.setFormDirty({ dirty: true });
  }),

  selectNode: thunk(
    async (actions, { id }, { injections: { routerService }, getState }) => {
      const { isFormDirty, mode } = getState();
      if (mode === RunbookMode.View) return;
      if (
        isFormDirty &&
        // eslint-disable-next-line no-alert
        !window.confirm('This will lose all unsaved changes. Are you sure?')
      ) {
        return;
      }

      actions.setFormDirty({ dirty: false });
      routerService.setSearchParams({ edit: id });
      actions.setPanel({ panel: Panel.Edit });
      actions.setActiveNodeId({ id });
    },
  ),
};
