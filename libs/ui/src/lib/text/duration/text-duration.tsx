import { useMemo } from 'react';

export interface TextDurationProps {
  begin: Date;
  end?: Date;
}

const plural = (word: string, value: number) => (value > 1 ? `${word}s` : word);

/**
 * Automatically handles formatting a duration between two dates. Always returns a duration of at least 1 second.
 */
export function TextDuration({ begin, end = new Date() }: TextDurationProps) {
  const duration = useMemo(() => {
    const diff = end.getTime() - begin.getTime();
    const diffInMinutes = diff / 1000 / 60;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = Math.floor(diffInMinutes % 60);
    const seconds = Math.max(Math.floor((diff / 1000) % 60), 0);

    if (hours > 0)
      return `${hours} ${plural('hour', hours)} ${minutes} ${plural(
        'minute',
        minutes,
      )}`;

    if (minutes > 0) return `${minutes} ${plural('minute', minutes)}`;

    return `${seconds || 1} ${plural('second', seconds)}`;
  }, [begin, end]);

  return <span>{duration}</span>;
}

export default TextDuration;
