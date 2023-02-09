import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBlock,
  CardTitle,
  Ide,
  TextBlock,
  TextLink,
  TextTitle,
} from '@cased/ui';
import { useSearchParams } from 'react-router-dom';
import { ISettingsUser } from '@cased/data';
import { useStoreActions, useStoreState } from '@cased/redux';
import ReadyGuard from '../../../../guards/ready/ready-guard';
import SettingsTemplate, { TabId } from '../../settings-template';
import TableUsersAndRoles from './tables/table-users-and-roles/table-users-and-roles';
import TableGroups from './tables/table-groups/table-groups';
import ModalPermissions from './modal-permissions/modal-permissions';

const IDE_SAVE_DELAY = 1500;

export function SettingsUsers() {
  const [permissionModalTarget, setPermissionModalModalTarget] =
    useState<ISettingsUser | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const users = useStoreState((state) => state.settings.users);
  const userAccess = useStoreState((state) => state.settings.userAccess);
  const updateUserAccess = useStoreActions(
    (state) => state.settings.updateUserAccess,
  );

  const groups = useStoreState((state) => state.settings.groups);
  const groupAccess = useStoreState((state) => state.settings.groupAccess);
  const updateGroupAccess = useStoreActions(
    (state) => state.settings.updateGroupAccess,
  );

  const populate = useStoreActions(
    (actions) => actions.settings.populateGroupsAndUsers,
  );
  const updateUserRole = useStoreActions(
    (actions) => actions.settings.updateUserRole,
  );

  const clearPermissions = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const updateUser = useCallback(
    (role: string) => {
      const id = permissionModalTarget?.id;
      if (!id) return;
      updateUserRole({ id, role }).then(clearPermissions);
    },
    [permissionModalTarget, updateUserRole, clearPermissions],
  );

  useEffect(() => {
    const id = searchParams.get('permissions');
    setPermissionModalModalTarget(users.find((user) => user.id === id) || null);
  }, [searchParams, users]);

  return (
    <ReadyGuard waitFor={populate}>
      <div data-testid="settings-users">
        <SettingsTemplate activeTab={TabId.Users}>
          <Card>
            <CardBlock>
              <CardTitle>Users and roles</CardTitle>
            </CardBlock>

            <CardBlock>
              <TableUsersAndRoles list={users} />
            </CardBlock>
          </Card>

          <Card>
            <CardBlock>
              <CardTitle>Groups</CardTitle>
            </CardBlock>

            <CardBlock>
              <TableGroups list={groups} />
            </CardBlock>
          </Card>

          <div data-testid="settings-users__user-access">
            <TextTitle size="lg">Manage user access to prompts</TextTitle>
            <TextBlock>
              <TextLink
                targetBlank
                href="https://docs.cased.com/cased-documentation/web-shell/groups-and-permissions"
              >
                Read the groups and permissions documentation
              </TextLink>{' '}
              for details on controlling user access to prompts
            </TextBlock>

            <Ide
              code={userAccess}
              mode="json"
              onChange={(value) => updateUserAccess({ value })}
              delay={IDE_SAVE_DELAY}
            />
          </div>

          <div data-testid="settings-users__group-access">
            <TextTitle size="lg">Manage group access to prompts</TextTitle>
            <TextBlock>
              <TextLink
                targetBlank
                href="https://docs.cased.com/cased-documentation/web-shell/groups-and-permissions"
              >
                Read the groups and permissions documentation
              </TextLink>{' '}
              for details on controlling group access to prompts
            </TextBlock>

            <Ide
              code={groupAccess}
              mode="json"
              onChange={(value) => updateGroupAccess({ value })}
              delay={IDE_SAVE_DELAY}
            />
          </div>
        </SettingsTemplate>

        {/* @TODO This is an anti-pattern. Never call a modal directly in a module. Use redux instead to trigger a global event */}
        {permissionModalTarget ? (
          <ModalPermissions
            onSubmit={updateUser}
            onClose={clearPermissions}
            name={permissionModalTarget.name}
            role={permissionModalTarget.role}
          />
        ) : null}
      </div>
    </ReadyGuard>
  );
}

export default SettingsUsers;
