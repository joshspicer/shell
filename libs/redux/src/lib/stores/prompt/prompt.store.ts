import { ApprovalStatus } from '@cased/data';
import { PromptAccessError, routerService } from '@cased/remotes';
import { Debounce, errorToAxiosError } from '@cased/utilities';
import { AxiosError } from 'axios';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { Terminal } from 'xterm';
import { factory } from '../../utils/factory';
import {
  dispatchNotification,
  NotificationType,
} from '../notifications/notifications.store';
import type { IStoreInjections, IStore } from '../store';
import { PromptWebSocket } from './prompt.web-socket';

const debounce = new Debounce(5000);

export enum WebSocketStatus {
  Initial = 'Initial',
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
}

type IPromptStore = {
  webSocket?: PromptWebSocket;
  webSocketId: number;
  status: WebSocketStatus;
  promptSessionId?: string;
  showApproval: boolean;
  approvalId: string;
  message: string;

  setWebSocket: Action<IPromptStore, IPromptStore['webSocket']>;
  setStatus: Action<IPromptStore, IPromptStore['status']>;
  setPromptSessionId: Action<IPromptStore, IPromptStore['promptSessionId']>;
  incrementWebSocketId: Action<IPromptStore>;
  setShowApproval: Action<IPromptStore, IPromptStore['showApproval']>;
  setApprovalId: Action<IPromptStore, IPromptStore['approvalId']>;
  setMessage: Action<IPromptStore, IPromptStore['message']>;

  clearStatusBar: Thunk<IPromptStore, never, IStoreInjections>;
  connect: Thunk<
    IPromptStore,
    { slug: string; token: string; term: Terminal; approvalStatus: string },
    IStoreInjections
  >;
  dispose: Thunk<IPromptStore, CloseEvent | undefined, IStoreInjections>;
  waitForApproval: Thunk<
    IPromptStore,
    { approvalId: string },
    IStoreInjections,
    IStore
  >;
  requestApproval: Thunk<
    IPromptStore,
    { slug: string },
    IStoreInjections,
    IStore
  >;
  uploadFile: Thunk<
    IPromptStore,
    { slug: string; file: File },
    IStoreInjections
  >;
};

export const promptStore: IPromptStore = {
  webSocket: undefined,
  webSocketId: 0,
  promptSessionId: undefined,
  status: WebSocketStatus.Initial,
  showApproval: false,
  approvalId: '',
  message: '',

  setStatus: action((state, socketState) => {
    state.status = socketState;
  }),

  setWebSocket: action((state, webSocket) => {
    state.webSocket = webSocket;
  }),

  setPromptSessionId: action((state, promptSessionId) => {
    state.promptSessionId = promptSessionId;
  }),

  incrementWebSocketId: action((state) => {
    state.webSocketId += 1;
  }),

  setShowApproval: action((state, showApproval) => {
    state.showApproval = showApproval;
  }),

  setApprovalId: action((state, approvalId) => {
    state.approvalId = approvalId;
  }),

  setMessage: action((state, message) => {
    state.message = message;
  }),

  clearStatusBar: thunk((actions) => {
    actions.setShowApproval(false);
    actions.setApprovalId('');
    actions.setMessage('');
  }),

  connect: thunk(
    async (
      actions,
      { slug, token, term, approvalStatus, ...rest },
      { injections: { promptService }, getState, dispatch },
    ) => {
      const isReadyToConnect = [
        WebSocketStatus.Disconnected,
        WebSocketStatus.Initial,
      ].includes(getState().status);

      if (!isReadyToConnect) {
        console.error('Connection already in progress');
        return;
      }

      const originalId = getState().webSocketId;
      const isCanceled = () => getState().webSocketId !== originalId;

      // Get the web socket url
      let url;
      let promptSessionId;
      try {
        actions.setStatus(WebSocketStatus.Connecting);

        ({ url, promptSessionId } = await promptService.getWebSocketUrl(
          slug,
          approvalStatus,
          {
            ...rest,
          },
        ));

        actions.setPromptSessionId(promptSessionId);
      } catch (error) {
        console.error('getWebSocketUrl error', error);

        // istanbul ignore next
        if (isCanceled()) return;

        actions.dispose();
        if (error instanceof PromptAccessError) {
          dispatchNotification(dispatch, 'No access', NotificationType.Error);
        } else if (error instanceof AxiosError) {
          const { response } = errorToAxiosError(error);
          // istanbul ignore next
          dispatchNotification(
            dispatch,
            response?.data.status || 'Failed to connect',
            NotificationType.Error,
          );
        } else if (error instanceof Error) {
          dispatchNotification(dispatch, error.message, NotificationType.Error);
        }

        return;
      }

      // Connect and authenticate the web socket
      let ws: PromptWebSocket;
      try {
        // istanbul ignore next
        if (isCanceled()) return;

        ws = factory.createWebSocket(url);
        ws.onClose(actions.dispose);
        actions.setWebSocket(ws);

        ws.onMessage((data) => {
          // istanbul ignore next
          if (isCanceled()) return;
          term.write(data);
        });

        // istanbul ignore next
        if (isCanceled()) return;
        await ws.authenticate(token);
      } catch (error) {
        // istanbul ignore next
        if (isCanceled()) return;
        actions.dispose();
        dispatchNotification(
          dispatch,
          'Failed to authenticate web socket',
          NotificationType.Error,
        );
        return;
      }

      // Terminal connected!
      // istanbul ignore next
      if (isCanceled()) return;
      actions.setStatus(WebSocketStatus.Connected);
      term.onResize(({ cols, rows }) => ws.sendResize(cols, rows));
      const disposable = term.onData((input) => ws.send(input));
      ws.onClose(() => disposable.dispose());
    },
  ),

  dispose: thunk(async (actions, evt, { getState, dispatch }) => {
    routerService.navigate('/dashboard');
    actions.incrementWebSocketId();
    actions.setStatus(WebSocketStatus.Disconnected);
    actions.setPromptSessionId(undefined);

    const { webSocket } = getState();
    if (webSocket) {
      webSocket.close();
      actions.setWebSocket(undefined);
      if (evt?.reason) {
        dispatchNotification(dispatch, evt.reason, NotificationType.Success);
      }
    }
  }),

  waitForApproval: thunk(
    async (
      actions,
      { approvalId },
      { injections: { approvalsService }, getStoreActions },
    ) => {
      const approval = await approvalsService.get(approvalId);

      // istanbul ignore next
      return new Promise<boolean>((resolve) => {
        if (approval.status === ApprovalStatus.Open) {
          debounce.run(async () => {
            const { waitForApproval } = getStoreActions().prompt;
            const nestedResult = await waitForApproval({ approvalId });
            resolve(nestedResult);
          });
        } else if (
          approval.status === ApprovalStatus.Denied ||
          approval.status === ApprovalStatus.Cancelled ||
          approval.status === ApprovalStatus.TimedOut
        ) {
          // istanbul ignore next
          actions.setMessage(approval.status);
          resolve(false);
        } else if (approval.status === ApprovalStatus.Approved) {
          // istanbul ignore next
          resolve(true);
        } else {
          // istanbul ignore next
          actions.setMessage('Unknown approval status');
          resolve(false);
        }
      });
    },
  ),

  requestApproval: thunk(
    async (
      actions,
      { slug },
      { injections: { approvalsService }, dispatch, getStoreActions },
    ) => {
      actions.setShowApproval(true);
      const { waitForApproval } = getStoreActions().prompt;
      try {
        const approvalId = await approvalsService.post(slug);
        actions.setApprovalId(approvalId);
        const success = await waitForApproval({ approvalId });

        if (success) {
          actions.setShowApproval(false);
        }

        return success;
      } catch (error) {
        dispatchNotification(
          dispatch,
          'Failed to request approval',
          NotificationType.Error,
        );
        return false;
      }
    },
  ),

  uploadFile: thunk(
    async (
      _actions,
      { slug, file },
      { injections: { promptService }, dispatch },
    ) => {
      try {
        await promptService.upload(file, slug);
      } catch (error) {
        // istanbul ignore next
        console.error('Failed to upload file', error);
        dispatchNotification(
          dispatch,
          'Failed to upload file',
          NotificationType.Error,
        );
        return;
      }
      dispatchNotification(dispatch, 'File uploaded', NotificationType.Success);
    },
  ),
};
