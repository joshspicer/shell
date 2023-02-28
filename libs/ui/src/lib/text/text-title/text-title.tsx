import clsx from 'clsx';
import { useMemo } from 'react';
import './text-title.scss';

export interface TextTitleProps {
  children: React.ReactNode;
  size?: 'default' | 'lg' | '6xl';
  className?: string;
}

export function TextTitle({
  className: initClassName = '',
  children,
  size = 'default',
}: TextTitleProps) {
  const className = useMemo(
    () =>
      clsx(`${initClassName} font-semibold`, {
        'text-base': size === 'default',
        'text-lg': size === 'lg',
        'text-6xl': size === '6xl',
      }),
    [size, initClassName],
  );

  return <h2 className={className}>{children}</h2>;
}

export default TextTitle;
