import { useMemo } from 'react';
import { useStoreState, useStoreActions, NotificationType } from '@cased/redux';
import './notification-list.scss';
import clsx from 'clsx';

export function NotificationList() {
  const notifications = useStoreState((state) => state.notifications.messages);

  const removeItem = useStoreActions((actions) => actions.notifications.remove);

  const printErrors = useMemo(
    () =>
      notifications.map(({ type, message, id }) => {
        const className = clsx(
          'alert d-block mb-1 border bg-red-600 p-2 text-sm text-white shadow-lg',
          {
            'bg-red-600': type === NotificationType.Error,
            'bg-green-600': type === NotificationType.Success,
          },
        );

        return (
          <button
            key={id}
            onClick={() => removeItem({ id })}
            className={className}
          >
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 flex-shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{message}</span>
            </div>
          </button>
        );
      }),
    [notifications, removeItem],
  );

  return <div className="notification-list">{printErrors}</div>;
}

export default NotificationList;
