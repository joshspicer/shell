import { ApprovalStatus } from '@cased/data';
import clsx from 'clsx';
import ApprovalStatusIcon from '../approval-status-icon/approval-status-icon';
import TextDuration from '../text/duration/text-duration';

import TextLink from '../text/text-link/text-link';

type ApprovalProps = {
  id: string;
  avatarUrl: string;
  requestorEmail: string;
  responderEmail?: string;
  prompt?: string;
  command?: string;
  status: ApprovalStatus;
  hideActions?: boolean;
  border?: boolean;
  createdAt: Date;
};

export function Approval({
  id,
  prompt,
  command,
  avatarUrl,
  requestorEmail,
  responderEmail,
  status,
  hideActions,
  border,
  createdAt,
}: ApprovalProps) {
  return (
    <div
      className={clsx('flex items-center justify-between gap-2', {
        'border-2 p-2': border,
      })}
    >
      <div className="inline-block w-20 rounded border border-emerald-600 bg-emerald-50 px-2 py-1 text-center text-xs uppercase text-emerald-800">
        {prompt ? 'Prompt' : 'Command'}
      </div>
      <div className="avatar">
        <div className="w-6 rounded-full">
          <img alt="avatar" src={avatarUrl} />
        </div>
      </div>
      <div className="grow">
        <span className="font-medium text-zinc-900">{requestorEmail}</span>
        <span> is requesting access to </span>
        <span className="font-medium text-zinc-900">{prompt || command}</span>
        <span>
          {' '}
          <small>
            <TextDuration begin={createdAt} /> ago
          </small>
        </span>
      </div>
      <ApprovalStatusIcon
        status={status}
        selfApproved={requestorEmail === responderEmail}
      />
      {!hideActions && <TextLink to={`/approvals/${id}`}>Details</TextLink>}
    </div>
  );
}

export default Approval;
