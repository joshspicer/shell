import { ILink } from '@cased/data';
import Header from '../header/header';
import Sidebar, { INavLink } from '../sidebar/sidebar';
import './template-two-column.scss';

export interface TemplateTwoColumnProps {
  userName: string;
  userLinks: ILink[];
  navLinks: INavLink[];
  activeLinkId?: string;
  children: React.ReactNode;
  testId?: string;
}

export function TemplateTwoColumn({
  userName,
  userLinks,
  navLinks,
  activeLinkId,
  children,
  testId,
}: TemplateTwoColumnProps) {
  return (
    <div data-testid={testId} className="template-two-column min-h-full">
      <Header
        className="sticky z-10"
        userName={userName}
        userLinks={userLinks}
      />

      <Sidebar
        className="fixed w-64"
        links={navLinks}
        activeId={activeLinkId}
      />

      <div className="template-two-column__content">
        <div className="mx-4 min-h-full max-w-7xl p-4">{children}</div>
      </div>
    </div>
  );
}

export default TemplateTwoColumn;
