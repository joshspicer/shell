import clsx from 'clsx';
import { ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';

import './text-link.scss';

export interface TextLinkProps {
  children: ReactNode;
  targetBlank?: boolean;
  href?: string;
  to?: string;
  onClick?: () => void;
  display?: 'default' | 'danger';
  className?: string;
}

export function TextLink({
  href,
  to,
  children,
  targetBlank,
  display = 'default',
  className: classNameProp,
  onClick,
}: TextLinkProps) {
  const link = useMemo(() => {
    const target = targetBlank ? '_blank' : undefined;
    const className = clsx('text-blue-600', classNameProp, {
      'text-blue-600': display === 'default',
      'text-red-500': display === 'danger',
    });

    if (href) {
      return (
        <a target={target} className={className} href={href}>
          {children}
        </a>
      );
    }

    if (to) {
      return (
        <Link target={target} className={className} to={to}>
          {children}
        </Link>
      );
    }

    if (onClick) {
      return (
        <button className={className} onClick={onClick}>
          {children}
        </button>
      );
    }

    return children;
  }, [href, to, children, targetBlank, display, onClick, classNameProp]);

  return <span>{link}</span>;
}

export default TextLink;
