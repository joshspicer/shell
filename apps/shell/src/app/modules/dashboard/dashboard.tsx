import { useCallback, useMemo } from 'react';
import { useDebounce } from '@cased/utilities';
import { TextTitle } from '@cased/ui';
import { useStoreActions, useStoreState } from '@cased/redux';
import FeaturedPrompt from './featured-prompt/featured-prompt';
import Prompt from './prompt-row/prompt';
import ReadyGuard from '../../guards/ready/ready-guard';
import { ConnectStatusBar } from '../prompt-connect/connect-status-bar/connect-status-bar';

const SEARCH_DELAY = 500;

export function Dashboard() {
  const debounce = useDebounce({ delay: SEARCH_DELAY });
  const search = useStoreState((state) => state.dashboard.search);

  const filteredPrompts = useStoreState(
    (state) => state.dashboard.filteredPrompts,
  );
  const allPrompts = useStoreState((state) => state.dashboard.prompts);

  const setSearch = useStoreActions((actions) => actions.dashboard.setSearch);
  const filterPrompts = useStoreActions(
    (actions) => actions.dashboard.filterPrompts,
  );
  const populate = useStoreActions((actions) => actions.dashboard.populate);

  const connectPrompt = useStoreActions((actions) => actions.dashboard.connect);

  const connect = useCallback(
    async (
      e: React.FormEvent,
      needsMoreInfo: boolean,
      slug: string,
      approvalRequired: boolean,
    ) => {
      e.preventDefault();
      connectPrompt({ approvalRequired, slug, needsMoreInfo });
    },
    [connectPrompt],
  );

  const onSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debounce?.run(() => {
        filterPrompts({ q: e.target.value });
      });
      setSearch({ search: e.target.value });
    },
    [debounce, filterPrompts, setSearch],
  );

  const featurePrompts = useMemo(
    () => allPrompts.filter((p) => p.featured),
    [allPrompts],
  );

  const printAllAvailablePrompts = useMemo(() => {
    if (filteredPrompts.length === 0) return <div />;

    return (
      <div className="rounded border border-zinc-300 bg-white">
        {filteredPrompts.map(
          ({
            name,
            description,
            slug,
            needsMoreInfo,
            ip,
            hostname,
            labels,
            certificateAuthentication,
            needAccess,
            needsAuthentication,
            authorizedForAuthenticatedPrincipals,
            authorizationExplanation,
            approvalRequired,
          }) => (
            <Prompt
              key={slug}
              name={name}
              description={description}
              slug={slug}
              needsMoreInfo={needsMoreInfo}
              ip={ip}
              hostname={hostname}
              labels={Object.entries(labels)}
              certificateAuthentication={certificateAuthentication}
              needAccess={needAccess}
              needsAuthentication={needsAuthentication}
              authorizedForAuthenticatedPrincipals={
                authorizedForAuthenticatedPrincipals
              }
              authorizationExplanation={authorizationExplanation}
              approvalRequired={approvalRequired}
              connect={connect}
            />
          ),
        )}
      </div>
    );
  }, [connect, filteredPrompts]);

  const printFeaturedPrompts = useMemo(
    () =>
      featurePrompts.map(
        ({
          name,
          description,
          slug,
          needsMoreInfo,
          needAccess,
          approvalRequired,
        }) => (
          <FeaturedPrompt
            key={slug}
            name={name}
            description={description}
            slug={slug}
            needsMoreInfo={needsMoreInfo}
            needAccess={needAccess}
            approvalRequired={approvalRequired}
            connect={connect}
          />
        ),
      ),
    [connect, featurePrompts],
  );

  return (
    <ReadyGuard waitFor={populate}>
      <ConnectStatusBar />
      <div className="space-y-12">
        {featurePrompts.length > 0 && (
          <div className="space-y-4">
            <TextTitle size="lg" className="mb-4">
              Quick Launch
            </TextTitle>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-8">
              {printFeaturedPrompts}
            </div>
          </div>
        )}
        {allPrompts.length > 0 && (
          <div className="space-y-4">
            <TextTitle size="lg" className="mb-4">
              All available prompts
            </TextTitle>
            <div className="w-full">
              <input
                className="block w-full rounded border border-zinc-400 p-2"
                name="q"
                placeholder="Filter prompts by string or label=value"
                value={search}
                autoComplete="off"
                onChange={onSearch}
                data-testid="dashboard__filter-prompt"
              />
            </div>
            <div className="w-gr">{printAllAvailablePrompts}</div>
          </div>
        )}
      </div>
      <span data-testid="dashboard__ready" />
    </ReadyGuard>
  );
}

export default Dashboard;
