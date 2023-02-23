import { Edge } from 'react-flow-renderer';
import { Action, Computed, Thunk } from 'easy-peasy';
import { INodeAction, INodeActionData, Panel, RunbookMode } from '@cased/data';
import type { IStore, IStoreInjections } from '../store';

export interface IRunbookStore {
  mode: RunbookMode;
  id?: string;
  name?: string;
  activeNodeId?: string;
  nodes: INodeAction[];
  edges: Edge<unknown>[];
  isPopulateCompleted: boolean;
  panel: Panel;
  isFormDirty: boolean;
  focusNodeId?: string;

  prompts: {
    slug: string;
  }[];

  databases: {
    id: string;
    label: string;
  }[];

  apiProviders: {
    id: string;
    api_name: string;
  }[];

  activeNode: Computed<IRunbookStore, INodeAction | undefined>;
  focusNode: Computed<IRunbookStore, INodeAction | undefined>;

  setMode: Action<IRunbookStore, { mode: RunbookMode }>;
  addNode: Action<
    IRunbookStore,
    { id: string; node: INodeActionData; nodeParentId?: string }
  >;
  removeNodeById: Action<IRunbookStore, { id: string }>;
  setNodeById: Action<IRunbookStore, { node: INodeAction }>;
  setActiveNodeId: Action<IRunbookStore, { id: string | undefined }>;
  clearSelection: Action<IRunbookStore>;
  set: Action<
    IRunbookStore,
    {
      id: string;
      name: string;
      nodes: INodeAction[];
      edges: Edge<unknown>[];
      prompts: { slug: string }[];
      databases: { id: string; label: string }[];
      apiProviders: { id: string; api_name: string }[];
    }
  >;
  setIsPopulateCompleted: Action<IRunbookStore, { complete: boolean }>;
  clearAll: Action<IRunbookStore>;
  setPanel: Action<IRunbookStore, { panel: Panel }>;
  setFormDirty: Action<IRunbookStore, { dirty: boolean }>;
  setFocusId: Action<IRunbookStore, { id?: string }>;

  setRunbookMode: Thunk<IRunbookStore, void, IStoreInjections, IStore>;
  populate: Thunk<IRunbookStore, { id: string }, IStoreInjections>;
  closePanel: Thunk<IRunbookStore, { confirm?: boolean }, IStoreInjections>;
  markFormDirty: Thunk<IRunbookStore, undefined>;

  createNode: Thunk<
    IRunbookStore,
    { node: INodeActionData },
    IStoreInjections,
    Record<string, never>,
    Promise<boolean>
  >;

  updateNode: Thunk<
    IRunbookStore,
    { node: INodeActionData; id: string },
    IStoreInjections,
    Record<string, never>,
    Promise<boolean>
  >;

  deleteNode: Thunk<
    IRunbookStore,
    { id: string },
    IStoreInjections,
    Record<string, never>,
    Promise<boolean>
  >;

  selectNode: Thunk<IRunbookStore, { id: string }, IStoreInjections>;
}
