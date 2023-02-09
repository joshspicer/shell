import { cloneElement, ReactElement, ReactNode, useMemo } from 'react';
import clsx from 'clsx';
import './button.scss';

export interface ButtonPrimaryProps {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  display?: 'default' | 'primary' | 'link' | 'danger';
  outline?: boolean;
  size?: 'small' | 'default' | 'large';
  disabled?: boolean;
  className?: string;

  /**
   * Optional as this may be used in a form
   */
  onClick?: () => void;

  /**
   * Replace the `<button>` element with a custom element. Renders `onClick` logic useless
   */
  as?: ReactElement;
}

export function Button({
  children,
  onClick,
  type = 'button',
  display = 'default',
  size = 'default',
  outline = false,
  disabled = false,
  className,
  as,
}: ButtonPrimaryProps) {
  const classNames = useMemo(
    () =>
      clsx(`font-medium inline-block text-center`, className, {
        // Standard buttons
        'bg-zinc-100 border border-zinc-400 hover:bg-zinc-50 active:bg-zinc-200':
          display === 'default' && outline === false,
        'bg-primary hover:bg-primary-hover active:bg-primary text-white border border-blue-900':
          display === 'primary' && outline === false,
        'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border border-red-700':
          display === 'danger' && outline === false,

        // Outline buttons
        'bg-transparent border border-primary text-primary':
          outline === true && display === 'primary',
        'bg-transparent border border-zinc-400 text-fg-default':
          outline === true && display === 'default',
        'bg-transparent border border-red-600 text-red-600':
          outline === true && display === 'danger',

        // Size
        'px-3 py-2 rounded': size === 'default',
        'px-2.5 py-1.5 text-sm rounded': size === 'small',
      }),
    [display, size, outline, className],
  );

  const printButton = useMemo(() => {
    if (as) {
      return cloneElement(as, {
        className: classNames,
        children,
      });
    }

    return (
      <button
        onClick={onClick}
        type={type}
        className={classNames}
        disabled={disabled}
      >
        {children}
      </button>
    );
  }, [as, onClick, type, classNames, disabled, children]);

  return printButton;
}

export default Button;
