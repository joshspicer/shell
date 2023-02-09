import { TextTitle } from '@cased/ui';
import { useCallback, useMemo, useState } from 'react';
import { IUser } from '@cased/data';
import { useStoreActions } from '@cased/redux';
import SettingsTemplate, { TabId } from '../../settings-template';
import ReadyGuard from '../../../../guards/ready/ready-guard';

export function SettingsUserProfile() {
  const [user, setUser] = useState<IUser>({
    name: '',
    email: '',
    groups: [],
  });

  const get = useStoreActions((actions) => actions.auth.retrieveCurrentUser);

  const populate = useCallback(async () => {
    const data = await get();
    setUser(data);
  }, [get]);

  const printGroups = useMemo(
    () => user?.groups?.map((x) => <li key={x}>{x}</li>),
    [user],
  );

  return (
    <ReadyGuard waitFor={populate}>
      <SettingsTemplate activeTab={TabId.UserProfile}>
        <div>
          <TextTitle>My profile</TextTitle>

          <ul className="list-inside list-disc">
            <li>Name: {user.name}</li>
            <li>Email: {user.email}</li>
          </ul>
        </div>

        <div>
          <TextTitle>My Groups</TextTitle>

          <ul className="list-inside list-disc">{printGroups}</ul>
        </div>

        <span data-testid="settings-user-profile" />
      </SettingsTemplate>
    </ReadyGuard>
  );
}

export default SettingsUserProfile;
