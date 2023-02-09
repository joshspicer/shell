import {
  CardBlock,
  CardTitle,
  FormInputCheckbox,
  FormLabels,
  FormRadio,
  IRadioOption,
} from '@cased/ui';
import { ILabel, ApprovalType } from '@cased/data';
import { useCallback } from 'react';
import { useStoreState, useStoreActions } from '@cased/redux';

const APPROVAL_REQUIREMENTS: IRadioOption[] = [
  {
    label: 'Anyone can respond to approval requests',
    description:
      "Peer approval ensures review but doesn't enforce who can review requests",
    value: ApprovalType.anyone,
  },
  {
    label: 'Restrict who can respond to approval requests',
    description: 'Specify groups and people who can review requests',
    value: ApprovalType.restrict,
  },
];

export interface FormPartialApprovalPrivilegeProps {
  id: string;
  approvalRequired: boolean;
  approvalType: ApprovalType;
  allowSelfApproval: boolean;
  onUpdateForm: (key: string, value: unknown) => void;
}

export function FormPartialApprovalPrivilege({
  id,
  approvalRequired,
  approvalType,
  allowSelfApproval,
  onUpdateForm,
}: FormPartialApprovalPrivilegeProps) {
  const userSearchResults = useStoreState(
    (store) => store.settingsApprovals.approvalUsersSearch,
  );

  const approvedUsers = useStoreState(
    (store) => store.settingsApprovals.approvedUsers,
  );

  const userSearch = useStoreActions(
    (actions) => actions.settingsApprovals.populateApprovalUsersSearch,
  );

  const addAuthorizedUser = useStoreActions(
    (actions) => actions.settingsApprovals.addAuthorizedUser,
  );

  const removeAuthorizedUser = useStoreActions(
    (actions) => actions.settingsApprovals.removeAuthorizedUser,
  );

  const onSearchUsers = useCallback(
    (_: unknown, query: string) => {
      userSearch({ query, id });
    },
    [userSearch, id],
  );

  const onAddAuthorizedUser = useCallback(
    async (name: string, user: ILabel) => {
      addAuthorizedUser({
        id,
        user,
      });
    },
    [id, addAuthorizedUser],
  );

  const onRemoveAuthorizedUser = useCallback(
    async (name: string, user: ILabel) => {
      removeAuthorizedUser({
        id,
        user,
      });
    },
    [id, removeAuthorizedUser],
  );

  return (
    <CardBlock className="flex flex-col space-y-4">
      <CardTitle>Approval privileges</CardTitle>

      <FormInputCheckbox
        label="Approval required"
        description="Enable approval requirement"
        value={approvalRequired}
        onChange={onUpdateForm}
        name="approvalRequired"
      />

      {approvalRequired && (
        <FormRadio
          name="approvalType"
          label="Approal Requirement"
          hideLabel
          options={APPROVAL_REQUIREMENTS}
          onChange={onUpdateForm}
          value={approvalType}
        />
      )}

      {approvalRequired && approvalType === ApprovalType.restrict && (
        <FormLabels
          label="Approved Users"
          name="restrictedUsers"
          suggestions={userSearchResults}
          selections={approvedUsers}
          onSearch={onSearchUsers}
          onAdd={onAddAuthorizedUser}
          onRemove={onRemoveAuthorizedUser}
        />
      )}

      {approvalRequired && (
        <FormInputCheckbox
          label="Allow self approval"
          description="A user can approve their own session request"
          value={allowSelfApproval}
          onChange={onUpdateForm}
          name="allowSelfApproval"
        />
      )}
    </CardBlock>
  );
}

export default FormPartialApprovalPrivilege;
