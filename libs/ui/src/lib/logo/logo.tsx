import { Link } from 'react-router-dom';
import logo from './shell-logo.svg';

interface ILogoProps {
  withText?: boolean;
}

export function Logo({ withText = true }: ILogoProps) {
  return (
    <Link
      to="/"
      className="relative -left-1.5 inline-block rounded p-1.5 ring-slate-300 hover:bg-slate-200 focus:bg-slate-100 focus:ring-2 active:bg-slate-100 active:ring-2"
    >
      <h3 className="sr-only">Cased, Inc.</h3>

      <div className="flex items-center space-x-2">
        <img alt="Cased, Inc." src={logo} width="24" />

        {withText ? (
          <div className="font-medium text-gray-900">Cased, Inc.</div>
        ) : null}
      </div>
    </Link>
  );
}

export default Logo;
