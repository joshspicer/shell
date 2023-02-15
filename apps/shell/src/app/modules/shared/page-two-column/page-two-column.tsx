import { useMemo } from 'react';
import { TemplateTwoColumn } from '@cased/ui';
import { useLocation } from 'react-router-dom';
import { useStoreState } from '@cased/redux';
import { navigation } from './navigation';
import { userNavigation } from './user-navigation';

export interface PageTwoColumnProps {
  children: React.ReactNode;
  testId?: string;
}

export function PageTwoColumn({ children, testId }: PageTwoColumnProps) {
  const location = useLocation();
  const userName = useStoreState((state) => state.auth.user?.email || '');

  const activeLinkId = useMemo(
    () =>
      [...navigation]
        // Flip the navigation to avoid accidentally choosing home first since it's at the root
        .reverse()
        .find(({ path }) => location.pathname.includes(path))?.id,
    [location.pathname],
  );

  return (
    <TemplateTwoColumn
      userName={userName}
      userLinks={userNavigation}
      navLinks={navigation}
      activeLinkId={activeLinkId}
      testId={testId}
    >
      {children}
    </TemplateTwoColumn>
  );
}

export default PageTwoColumn;
