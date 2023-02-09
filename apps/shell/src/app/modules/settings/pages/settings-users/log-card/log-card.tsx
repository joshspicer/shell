import {
  Card,
  CardBlock,
  TextBlock,
  TextDate,
  TextLink,
  TextDuration,
} from '@cased/ui';
import { useMemo } from 'react';
import { ReactComponent as ShareIcon } from './share.svg';

interface ILogCardProps {
  email: string;
  location: string;
  host: string;
  ip: string;

  runbook?: {
    id: string;
    name: string;
    date: Date;
  };

  session?: {
    id: string;
    startTime: Date;
    endTime?: Date;
  };

  approval?: {
    id: string;
    reason: string;
  };
}

export function LogCard({
  email,
  location,
  host,
  ip,
  runbook,
  session,
  approval,
}: ILogCardProps) {
  const printBody = useMemo(() => {
    if (runbook) {
      const { id, name, date } = runbook;
      return (
        <TextBlock>
          <strong className="font-medium text-gray-900">{email}</strong>{' '}
          executed a{' '}
          <TextLink to={`/runbooks/${id}`}>runbook ({name})</TextLink> at{' '}
          <TextDate display="dateTime" date={date} />
        </TextBlock>
      );
    }

    if (session) {
      const { id, startTime, endTime } = session;

      return (
        <div className="flex flex-row justify-between space-x-4">
          <TextBlock>
            <>
              {endTime ? (
                <small className="inline-block w-20 rounded bg-gray-700 px-2 py-1 text-center text-xs uppercase text-white">
                  {endTime ? 'Inactive' : 'Active'}
                </small>
              ) : (
                <small className="inline-block w-20 rounded bg-emerald-700 px-2 py-1 text-center text-xs uppercase text-emerald-50">
                  {endTime ? 'Inactive' : 'Active'}
                </small>
              )}{' '}
              <strong className="font-medium text-gray-900">{email}</strong>{' '}
              started a{' '}
              {!endTime ? (
                <TextLink href={`/prompts/share/${id}`} targetBlank>
                  session
                </TextLink>
              ) : (
                'session'
              )}{' '}
              at <TextDate display="dateTime" date={startTime} />{' '}
              {endTime ? (
                <>
                  for <TextDuration begin={startTime} end={endTime} />
                </>
              ) : null}
            </>
          </TextBlock>

          {!endTime ? (
            <p className="shrink">
              <TextLink href={`/prompts/share/${id}`}>
                <strong>
                  Share URL <ShareIcon className="inline w-4" />
                </strong>
              </TextLink>
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <p>Session log type does not exist. Please verify log data integrity.</p>
    );
  }, [email, runbook, session]);

  const printMeta = useMemo(
    () => (
      <ul className="flex flex-col space-y-1 text-sm text-gray-600">
        <li>
          <strong>Location</strong>: {location || 'Unknown'}
        </li>
        <li>
          <strong>Host/prompt</strong>: {host || 'Unknown'}
        </li>
        <li>
          <strong>User&apos;s IP</strong>: {ip || 'Unknown'}
        </li>

        {approval ? (
          <>
            <li>
              <strong>Reason</strong>:{' '}
              <span data-testid="log-card__reason">{approval.reason}</span>
            </li>
            <li>
              <strong>Approval</strong>: `${approval.id}
            </li>
          </>
        ) : null}
      </ul>
    ),
    [location, host, ip, approval],
  );

  return (
    <Card>
      <CardBlock>
        <div className="mb-3">{printBody}</div>

        {printMeta}
      </CardBlock>
    </Card>
  );
}

export default LogCard;
