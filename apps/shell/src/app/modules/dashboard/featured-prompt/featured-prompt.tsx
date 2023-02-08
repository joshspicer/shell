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
        <Button disabled className="hover:cursor-not-allowed">
          Launch <br />
          (Access permission needed)
        </Button>
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
            <p className="mb-4 text-sm">{description}</p>
          </div>
        </div>
        {launchButton}
      </div>
    </form>
  );
}

export default FeaturedPrompt;
