import { Terminal } from 'xterm';
import { SearchAddon } from 'xterm-addon-search';
import { PromptWebSocket } from '../stores/prompt/prompt.web-socket';

export const factory = {
  createWebSocket: (url: string) => new PromptWebSocket(url),
  createTerminal: () => new Terminal(),
  createSearchAddon: () => new SearchAddon(),
};
