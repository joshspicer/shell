import { factory } from '@cased/redux';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid';
import clsx from 'clsx';
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Terminal } from 'xterm';
import { SearchAddon } from 'xterm-addon-search';

type Props = {
  terminal: Terminal;
};

const SEARCH_OPTIONS = { incremental: false };

export default function PromptSearch({ terminal }: Props) {
  const searchAddon = useRef<SearchAddon>();
  const [matchFailed, setMatchFailed] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState(false);

  const dropdownClassName = useMemo(
    () =>
      clsx('dropdown-content mt-2 flex w-80 rounded-md bg-white p-3', {
        hidden: !show,
      }),
    [show],
  );

  useEffect(() => {
    // istanbul ignore next
    if (!terminal) return undefined;

    // @TODO It would be easier to initialize the search addon from a custom hook. Would do away with a lot of these branch edge cases
    // Falls under separation of concnerns
    searchAddon.current = factory.createSearchAddon();
    terminal.loadAddon(searchAddon.current);

    return () => {
      // istanbul ignore next
      if (!searchAddon.current) return;
      searchAddon.current.dispose();
    };
  }, [terminal]);

  const queryChanged = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    // istanbul ignore next
    if (!searchAddon.current) return;

    const { value } = event.target;
    setQuery(value);

    const success = searchAddon.current.findNext(value, {
      ...SEARCH_OPTIONS,
      incremental: true,
    });

    // @TODO This should be properly tested as this is a pertty important edge case to handle
    // istanbul ignore next
    if (value.trim() === '') {
      setMatchFailed(false);
    } else {
      setMatchFailed(!success);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    if (searchAddon) searchAddon.current?.findNext('');
    setMatchFailed(false);
    inputRef.current?.focus();
    setShow(false);
  }, []);

  const toggleDropdown = useCallback(
    (showDropdown: boolean) => {
      if (showDropdown) {
        setShow(showDropdown);

        window.setTimeout(() => {
          // istanbul ignore next
          if (!inputRef.current) return;
          // Forcibly skip a frame to ensure the dropdown is rendered before focusing
          inputRef.current.focus();
        }, 1);
        return;
      }

      clearSearch();
    },
    [inputRef, clearSearch],
  );

  const findNext = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      // istanbul ignore next
      if (!searchAddon.current) return;
      e.preventDefault();
      searchAddon.current.findNext(query, SEARCH_OPTIONS);
    },
    [query],
  );

  const closeOverlayClassName = useMemo(
    () => clsx('fixed top-0 left-0 h-full w-full', { hidden: !show }),
    [show],
  );

  return (
    <form
      className="dropdown dropdown-bottom dropdown-end dropdown-open"
      onSubmit={findNext}
    >
      <button
        data-testid="prompt-search__show"
        type="button"
        className="flex cursor-pointer items-center gap-1 text-white"
        onClick={() => toggleDropdown(!show)}
      >
        <MagnifyingGlassIcon className="h-4" />
        Search
      </button>

      <div
        aria-hidden
        className={closeOverlayClassName}
        onClick={() => toggleDropdown(false)}
      />

      <div className={dropdownClassName} data-testid="prompt-search__content">
        <label>
          <span className="sr-only">Search Text</span>

          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            className={clsx(
              'w-full grow rounded-md border-[1px] px-2 py-1',
              matchFailed
                ? 'border-red-300 outline-red-500'
                : 'border-gray-300',
            )}
            onChange={queryChanged}
            value={query}
          />
        </label>

        <button
          type="button"
          disabled={matchFailed}
          className="cursor-pointer pl-2 disabled:text-gray-400"
          data-testid="prompt-search__previous"
          onClick={() => {
            searchAddon.current?.findPrevious(query, SEARCH_OPTIONS);
          }}
        >
          <ChevronUpIcon className="h-4" />
        </button>

        <button
          type="submit"
          disabled={matchFailed}
          className="cursor-pointer pl-2 disabled:text-gray-400"
          data-testid="prompt-search__next"
        >
          <ChevronDownIcon className="h-4" />
        </button>

        <button
          type="button"
          className="pl-2"
          onClick={clearSearch}
          data-testid="prompt-search__close"
        >
          <XCircleIcon className="h-4" />
        </button>
      </div>
    </form>
  );
}
