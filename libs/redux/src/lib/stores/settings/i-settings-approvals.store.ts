import { Action, Thunk } from 'easy-peasy';
import { IApprovalBase, IApprovalAccess, IApprovalProgram } from '@cased/data';
import type { ILabel } from '@cased/data';
import type { IStoreInjections } from '../store';

export interface ISettingsApprovalsStore {
  programs: IApprovalBase[];
  access: IApprovalBase[];
  approvalUsersSearch: ILabel[];
  approvedUsers: ILabel[];

  setPrograms: Action<ISettingsApprovalsStore, { programs: IApprovalBase[] }>;
  setAccess: Action<ISettingsApprovalsStore, { access: IApprovalBase[] }>;
  setApprovalUsersSearch: Action<ISettingsApprovalsStore, { users: ILabel[] }>;
  setApprovedUsers: Action<ISettingsApprovalsStore, { users: ILabel[] }>;
  removeProgram: Action<ISettingsApprovalsStore, { id: string }>;
  clear: Action<ISettingsApprovalsStore>;

  populate: Thunk<ISettingsApprovalsStore, void, IStoreInjections>;

  createProgram: Thunk<
    ISettingsApprovalsStore,
    { slug: string; description?: string },
    IStoreInjections,
    ISettingsApprovalsStore,
    Promise<{ id?: string }>
  >;

  deleteProgram: Thunk<
    ISettingsApprovalsStore,
    { id: string },
    IStoreInjections
  >;

  retrieveApprovalProgram: Thunk<
    ISettingsApprovalsStore,
    { id: string },
    IStoreInjections,
    ISettingsApprovalsStore,
    Promise<IApprovalProgram | null>
  >;

  retrieveApprovalAccess: Thunk<
    ISettingsApprovalsStore,
    { id: string },
    IStoreInjections,
    ISettingsApprovalsStore,
    Promise<IApprovalAccess | null>
  >;

  submitApprovalProgram: Thunk<
    ISettingsApprovalsStore,
    { id: string; program: IApprovalProgram },
    IStoreInjections,
    ISettingsApprovalsStore,
    Promise<void>
  >;

  submitApprovalAccess: Thunk<
    ISettingsApprovalsStore,
    { id: string; access: IApprovalAccess },
    IStoreInjections,
    ISettingsApprovalsStore,
    Promise<void>
  >;

  autoUpdateApprovalProgram: Thunk<
    ISettingsApprovalsStore,
    { id: string; program: IApprovalProgram },
    IStoreInjections,
    ISettingsApprovalsStore,
    Promise<void>
  >;

  autoUpdateApprovalAccess: Thunk<
    ISettingsApprovalsStore,
    { id: string; access: IApprovalAccess },
    IStoreInjections,
    ISettingsApprovalsStore,
    Promise<void>
  >;

  populateApprovalUsersSearch: Thunk<
    ISettingsApprovalsStore,
    { query: string; id: string },
    IStoreInjections
  >;

  addAuthorizedUser: Thunk<
    ISettingsApprovalsStore,
    { id: string; user: ILabel },
    IStoreInjections,
    ISettingsApprovalsStore
  >;

  removeAuthorizedUser: Thunk<
    ISettingsApprovalsStore,
    { id: string; user: ILabel },
    IStoreInjections,
    ISettingsApprovalsStore
  >;
}
