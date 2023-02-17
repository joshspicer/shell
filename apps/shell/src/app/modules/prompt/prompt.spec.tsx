import { promptService as PromptType, PromptAccessError } from '@cased/remotes';
import { render, waitFor } from '@testing-library/react';
import { StoreProvider } from 'easy-peasy';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  WebSocketStatus,
  getMockStore,
  factory,
  PromptWebSocket,
} from '@cased/redux';
import { Terminal } from 'xterm';
import { AxiosError } from 'axios';
import Prompt from './prompt';

const fakeToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

interface IOptions {
  mockWebSocketError?: boolean;
  injections?: Record<string, unknown>;
}

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {});

const setup = (options: IOptions = {}) => {
  const { injections = {}, mockWebSocketError = false } = options;
  const messageSubscriptions: ((_: unknown) => void)[] = [];

  const authenticate = mockWebSocketError
    ? jest.fn().mockRejectedValue(new Error())
    : // @NOTE Suite crashes when this is converted to a proper promise, that's weird...
      jest.fn();

  const mockWebSocket: Partial<PromptWebSocket> = {
    send: jest.fn(),
    sendResize: jest.fn(),
    close: jest.fn(),
    authenticate,
    onMessage: jest
      .fn()
      .mockImplementation((callback) => messageSubscriptions.push(callback)),
    onClose: jest.fn(),
  };

  const mockTerminal: Partial<Terminal> = {
    open: jest.fn(),
    write: jest.fn(),
    dispose: jest.fn(),
    onData: jest.fn(),
    loadAddon: jest.fn(),
    onResize: jest.fn(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(factory, 'createWebSocket').mockReturnValue(mockWebSocket as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(factory, 'createTerminal').mockReturnValue(mockTerminal as any);

  const mockStore = getMockStore({
    promptService: {
      get: jest
        .fn()
        .mockImplementation((slug) => Promise.resolve({ name: slug })),
      getWebSocketUrl: async () => ({
        url: 'ws://localhost:1234',
        promptSessionId: '1234',
      }),
    },
    ...injections,
  });

  mockStore.getActions().auth.setAccessToken({ token: fakeToken });

  window.history.pushState({}, '', '/prompts/my-prompt');

  const sendMessageFromServer = (message: string) => {
    messageSubscriptions.forEach((callback) => callback(message));
  };

  const expectTerminalOutput = (expected: string) =>
    waitFor(() =>
      expect(mockTerminal.write).toHaveBeenCalledWith(
        expect.stringContaining(expected),
      ),
    );

  const expectWebSocketStatus = async (status: WebSocketStatus) =>
    waitFor(() => expect(mockStore.getState().prompt.status).toBe(status));

  const result = render(
    <StoreProvider store={mockStore}>
      <Routes>
        <Route path="/prompts/:slug" element={<Prompt slug="my-prompt" />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </StoreProvider>,
    { wrapper: BrowserRouter },
  );

  return {
    mockStore,
    mockWebSocket,
    expectWebSocketStatus,
    expectTerminalOutput,
    sendMessageFromServer,
    result,
  };
};

describe('Prompt', () => {
  it('renders a terminal', async () => {
    const {
      sendMessageFromServer,
      mockWebSocket,
      expectWebSocketStatus,
      expectTerminalOutput,
    } = setup();

    await waitFor(() =>
      expect(mockWebSocket.authenticate).toHaveBeenCalledWith(fakeToken),
    );

    sendMessageFromServer('$A_PROMPT>');
    await expectTerminalOutput('$A_PROMPT>');
    await expectWebSocketStatus(WebSocketStatus.Connected);
  });

  it('displays error when authentication fails', async () => {
    const { mockWebSocket, expectWebSocketStatus, mockStore } = setup({
      mockWebSocketError: true,
    });

    await expectWebSocketStatus(WebSocketStatus.Disconnected);
    await waitFor(() =>
      expect(mockWebSocket.authenticate).toHaveBeenCalledWith(fakeToken),
    );
    expect(mockStore.getState().notifications.messages[0].message).toBe(
      'Failed to authenticate web socket',
    );
  });

  it(`Fails to run if the user doesn't have access`, async () => {
    const { mockStore, expectWebSocketStatus } = setup({
      injections: {
        promptService: {
          get: async (slug: string) =>
            ({ name: slug } as Partial<typeof PromptType>),
          getWebSocketUrl: (slug: string) => {
            throw new PromptAccessError(slug);
          },
        },
      },
    });

    await expectWebSocketStatus(WebSocketStatus.Disconnected);
    expect(mockStore.getState().notifications.messages[0].message).toBe(
      'No access',
    );
  });

  it('Fails to run two connections at once', async () => {
    const { mockStore, mockWebSocket } = setup();

    await waitFor(() =>
      expect(mockWebSocket.authenticate).toHaveBeenCalledWith(fakeToken),
    );

    render(
      <StoreProvider store={mockStore}>
        <Routes>
          <Route path="/prompts/:slug" element={<Prompt slug="my-prompt" />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </StoreProvider>,
      { wrapper: BrowserRouter },
    );

    expect(mockConsoleError).toBeCalledWith('Connection already in progress');
    mockConsoleError.mockReset();
  });

  it('Fails to run if the url lookup fails', async () => {
    const { expectWebSocketStatus, mockStore } = setup({
      injections: {
        promptService: {
          get: async (slug: string) =>
            ({ name: slug } as Partial<typeof PromptType>),
          getWebSocketUrl: () => {
            throw new AxiosError("Can't find prompt");
          },
        },
      },
    });

    await expectWebSocketStatus(WebSocketStatus.Disconnected);
    expect(mockStore.getState().notifications.messages[0].message).toBe(
      'Failed to connect',
    );
  });
});
