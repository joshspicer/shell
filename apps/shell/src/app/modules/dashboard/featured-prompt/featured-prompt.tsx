import { Button } from '@cased/ui';
import { useMemo } from 'react';
import { IPromptProps } from '../prompt-row/prompt';

export function FeaturedPrompt({
  name,
  description,
  slug,
  needsMoreInfo,
  needAccess,
  approvalRequired,
  connect,
}: IPromptProps) {
  const launchButton = useMemo(() => {
    if (needAccess) {
      return (
        <button disabled className="btn">
          Launch (Access permission needed)
        </button>
      );
    }
    return (
      <Button type="submit" display="primary" size="small">
        Launch
      </Button>
    );
  }, [needAccess]);

  return (
    <form onSubmit={(e) => connect(e, needsMoreInfo, slug, approvalRequired)}>
      <div className="flex flex-col justify-between rounded border border-zinc-300 bg-white p-4">
        <div className="h-36">
          <h4 className="mb-2 text-base font-semibold">{name}</h4>
          <div>
            <p className="mb-4 truncate text-sm lg:overflow-visible lg:whitespace-normal">
              {description}
            </p>
          </div>
        </div>
        {launchButton}
      </div>
    </form>
  );
}

export default FeaturedPrompt;
