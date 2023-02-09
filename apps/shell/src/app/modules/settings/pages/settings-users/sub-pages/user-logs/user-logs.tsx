import { TextTitle } from '@cased/ui';
import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useStoreState, useStoreActions } from '@cased/redux';
import ReadyGuard from '../../../../../../guards/ready/ready-guard';
import SettingsTemplate, { TabId } from '../../../../settings-template';
import LogCard from '../../log-card/log-card';

export function UserLogs() {
  const params = useParams<{ id: string }>();
  const logs = useStoreState((state) => state.settings.userLogs);
  const user = useStoreState((state) => state.settings.userLogsAuthor);
  const populate = useStoreActions(
    (actions) => actions.settings.populateUserLogs,
  );

  const handlePopulation = useCallback(() => {
    const { id } = params;
    if (!id) throw new Error('No ID provided');
    return populate({ id });
  }, [populate, params]);

  const printLogs = useMemo(
    () =>
      logs.map(
        ({ email, runbook, session, location, host, ip, id, approval }) => (
          <LogCard
            key={id}
            email={email}
            location={location}
            host={host}
            ip={ip}
            runbook={runbook}
            session={session}
            approval={approval}
          />
        ),
      ),
    [logs],
  );

  return (
    <ReadyGuard waitFor={handlePopulation}>
      <SettingsTemplate
        returnButton={{
          link: '/settings/users',
          title: `Back to all users`,
        }}
        activeTab={TabId.Users}
      >
        <TextTitle size="lg">
          Session logs for{' '}
          <strong data-testid="user-logs__name">{user.name}</strong>{' '}
          <span data-testid="user-logs__email">({user.email})</span>
        </TextTitle>

        {printLogs}

        <span data-testid="user-logs" />
      </SettingsTemplate>
    </ReadyGuard>
  );
}

export default UserLogs;
