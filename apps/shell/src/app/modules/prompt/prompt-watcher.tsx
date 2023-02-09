import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Debounce } from '@cased/utilities';
import './xterm.scss';
import { promptService } from '@cased/remotes';
import { factory } from '@cased/redux';
import PromptSearch from './search/prompt-search';
import { ansi } from './prompt.ansi';
import { startLoadingMessage } from './prompt.loader';

export default function PromptWatcher() {
  const { promptSessionId } = useParams();
  const termEl = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal>();
  const webSocketRef = useRef<WebSocket>();
  const terminalFitAddonRef = useRef<FitAddon>();

  const webSocketUrl = useMemo(() => {
    if (!promptSessionId) return undefined;
    return promptService.getWebSocketShareUrl(promptSessionId);
  }, [promptSessionId]);

  // This effect is responsible for initializing the terminal and connecting to the web socket
  useEffect(() => {
    if (!termEl.current) throw new Error('Terminal element not initialized');
    if (!webSocketUrl) throw new Error('WebSocket URL not initialized');

    terminalFitAddonRef.current = new FitAddon();
    const term = factory.createTerminal();
    setTerminal(term);
    term.loadAddon(terminalFitAddonRef.current);
    term.open(termEl.current);
    terminalFitAddonRef.current.fit();

    const disposeLoader = startLoadingMessage(term, `Connecting to prompt`);
    let canceled = false;
    webSocketRef.current = new WebSocket(webSocketUrl);
    webSocketRef.current.addEventListener('open', () => {
      // istanbul ignore next
      if (canceled) return;
      disposeLoader();
      term.writeln(ansi('Connected to server...', 'green'));
    });

    webSocketRef.current.addEventListener('close', () => {
      // istanbul ignore next
      if (canceled) return;
      disposeLoader();
      term.writeln(ansi('Disconnected from server', 'red'));
    });

    webSocketRef.current.addEventListener('error', () => {
      // istanbul ignore next
      if (canceled) return;
      disposeLoader();
      term.writeln(ansi('Error connecting to server', 'red'));
    });

    webSocketRef.current.addEventListener('message', (event) => {
      // istanbul ignore next
      if (canceled) return;
      term.write(event.data);
    });

    return () => {
      canceled = true;
      disposeLoader();
      term.dispose();
      setTerminal(undefined);
      webSocketRef.current?.close();
      webSocketRef.current = undefined;
    };
  }, [webSocketUrl]);

  // This effect is responsible for resizing the terminal when the window is resized
  useEffect(() => {
    if (!terminalFitAddonRef.current) return undefined;

    const debouncer = new Debounce(100);
    const handleResize = () => {
      // istanbul ignore next
      debouncer.run(() => terminalFitAddonRef.current?.fit());
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative h-full">
      <div className="absolute right-8 top-2 z-10 flex gap-6 bg-[rgba(0,0,0,0.5)]">
        {terminal ? <PromptSearch terminal={terminal} /> : null}
      </div>
      <div className="xterm h-full bg-black p-1" ref={termEl} />
    </div>
  );
}
