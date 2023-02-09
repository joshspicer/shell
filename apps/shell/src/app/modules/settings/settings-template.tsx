import { TextLink } from '@cased/ui';
import clsx from 'clsx';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStoreState } from '@cased/redux';
import { ReactComponent as BlockedIcon } from './icon-blocked.svg';

export enum TabId {
  General,
  Ssh,
  Users,
  Approvals,
  Runbooks,
  UserProfile,
  AddUser,
}

const tabs = [
  {
    id: TabId.General,
    to: '/settings',
    title: 'General',
  },
  {
    id: TabId.Ssh,
    to: '/settings/ssh',
    title: 'SSH',
  },
  {
    id: TabId.Users,
    to: '/settings/users',
    title: 'Users and Groups',
  },
  {
    id: TabId.AddUser,
    to: '/settings/add-user',
    title: 'Add User',
  },
  {
    id: TabId.Approvals,
    to: '/settings/approvals',
    title: 'Approvals',
  },
  {
    id: TabId.Runbooks,
    to: '/settings/runbooks',
    title: 'Runbooks',
  },
  {
    id: TabId.UserProfile,
    to: '/settings/user-profile',
    title: 'User Profile',
  },
];

interface SettingsTemplateProps {
  children: React.ReactNode;
  activeTab: TabId;
  returnButton?: { link: string; title: string };
  testId?: string;
}

export function SettingsTemplate({
  children,
  activeTab,
  returnButton,
  testId,
}: SettingsTemplateProps) {
  const user = useStoreState((state) => state.auth.user);

  const printTabs = useMemo(
    () =>
      tabs.map(({ to, title, id }) => (
        <li key={id}>
          <Link
            to={to}
            className={clsx('tab tab-bordered', {
              'font-bold': id === activeTab,
              'border-gray-300 text-gray-500': id !== activeTab,
            })}
          >
            {title}
          </Link>
        </li>
      )),
    [activeTab],
  );

  const printBackButton = useMemo(() => {
    if (!returnButton) return null;

    const { link, title } = returnButton;

    return (
      <p>
        <TextLink className="ml-0 pl-0" to={link}>
          {title}
        </TextLink>
      </p>
    );
  }, [returnButton]);

  const printContent = useMemo(() => {
    if (user?.role !== 'admin')
      return (
        <p className="text-center text-gray-600">
          <BlockedIcon className="inline w-5" /> Only administrators have access
          to this page
        </p>
      );

    return (
      <>
        <ul className="tabs mb-4">{printTabs}</ul>

        <div className="flex flex-col space-y-4">
          {printBackButton}
          {children}
        </div>

        <span data-testid={testId} />
      </>
    );
  }, [user, printTabs, printBackButton, children, testId]);

  return printContent;
}

export default SettingsTemplate;
