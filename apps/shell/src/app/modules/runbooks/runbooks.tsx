import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Node,
  ReactFlowInstance,
} from 'react-flow-renderer';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { INodeActionData, RunbookMode, Panel } from '@cased/data';
import { Button, Logo } from '@cased/ui';
import { useStoreState, useStoreActions } from '@cased/redux';
import ActionNode from './action-node/action-node';
import EdgeAdd from './edge-add/edge-add';
import NodePanel from './node-inspector-panel/node-inspector-panel';
import NodeCreationPanel from './node-creation-panel/node-creation-panel';
import { createNodesConfig } from './node-creation-panel/create-nodes-config';
import { stringToNodeType } from './node-type';
import RunbooksRunPanel from './runbooks-run-panel/runbooks-run-panel';

export function Runbooks() {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [reactFlowInstance, setReactFlowInstance] = useState<
    ReactFlowInstance | undefined
  >();

  const state = useStoreState((store) => store.runbooks);
  const focus = useStoreState((store) => store.runbooks.focusNode);
  const nodes = useStoreState((store) => store.runbooks.nodes);
  const panel = useStoreState((store) => store.runbooks.panel);
  const activeNode = useStoreState((store) => store.runbooks.activeNode);
  const isPopulateCompleted = useStoreState(
    (store) => store.runbooks.isPopulateCompleted,
  );
  const mode = useStoreState((store) => store.runbooks.mode);

  const deleteNode = useStoreActions((store) => store.runbooks.deleteNode);
  const selectNode = useStoreActions((store) => store.runbooks.selectNode);
  const updateNode = useStoreActions((store) => store.runbooks.updateNode);
  const populate = useStoreActions((store) => store.runbooks.populate);
  const closePanel = useStoreActions((store) => store.runbooks.closePanel);
  const setPanel = useStoreActions((store) => store.runbooks.setPanel);
  const setFocusId = useStoreActions((store) => store.runbooks.setFocusId);
  const setActiveNodeId = useStoreActions(
    (store) => store.runbooks.setActiveNodeId,
  );
  const setRunbookMode = useStoreActions(
    (store) => store.runbooks.setRunbookMode,
  );

  const edgeTypes = useMemo(() => ({ edgeAdd: EdgeAdd }), []);
  const nodeTypes = useMemo(() => ({ action: ActionNode }), []);

  const clickNode = useCallback(
    (_: unknown, { id }: Node) => {
      selectNode({ id });
    },
    [selectNode],
  );

  const saveActiveNodeChanges = useCallback(
    (data: INodeActionData) => {
      if (!activeNode) return;

      const node = { ...activeNode };
      node.data = { ...activeNode.data, ...data };

      updateNode({ node: node.data, id: activeNode.id }).then((success) => {
        if (!success) return;
        closePanel({});
      });
    },
    [activeNode, updateNode, closePanel],
  );

  const clickNodeDelete = useCallback(
    (id: string) => {
      deleteNode({ id }).then((success) => {
        if (!success) return;
        closePanel({});
      });
    },
    [deleteNode, closePanel],
  );

  const clickClosePanel = useCallback(() => {
    closePanel({ confirm: true });
  }, [closePanel]);

  const printPanel = useMemo(() => {
    if (panel === Panel.Create || nodes.length === 0) {
      const nodeType = searchParams.get('create');

      return (
        <NodeCreationPanel
          creatableNodes={createNodesConfig}
          pageId={params.id}
          nodeType={stringToNodeType(nodeType)}
          onCancel={clickClosePanel}
        />
      );
    }

    if (panel === Panel.Edit && activeNode) {
      return (
        <NodePanel
          onCancel={clickClosePanel}
          onSave={saveActiveNodeChanges}
          onDelete={clickNodeDelete}
          id={activeNode.id}
          node={activeNode.data}
        />
      );
    }

    if (panel === Panel.Run) {
      return <RunbooksRunPanel />;
    }

    return null;
  }, [
    clickClosePanel,
    searchParams,
    panel,
    params,
    activeNode,
    saveActiveNodeChanges,
    clickNodeDelete,
    nodes,
  ]);

  useEffect(() => {
    setRunbookMode();
  }, [searchParams, setRunbookMode]);

  // Update displayed panel
  useEffect(() => {
    if (mode === RunbookMode.View) return;
    if (searchParams.get('create')) {
      // @TODO Move to redux
      setActiveNodeId({ id: undefined });
      setPanel({ panel: Panel.Create });
      return;
    }

    const id = searchParams.get('edit');
    if (id) {
      selectNode({ id });
      return;
    }

    closePanel({});
  }, [
    searchParams,
    selectNode,
    closePanel,
    setPanel,
    setActiveNodeId,
    setRunbookMode,
    mode,
  ]);

  // Initial population
  useEffect(() => {
    if (isPopulateCompleted || !params.id) return;
    populate({ id: params.id }).then(() => {
      const id = searchParams.get('edit');
      if (id) setFocusId({ id });
    });
  }, [params, populate, isPopulateCompleted, searchParams, setFocusId]);

  // Confirm before closing the page if runbooks store has a dirty form
  useEffect(() => {
    const confirm = (e: BeforeUnloadEvent) => {
      if (state.isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', confirm);
    return () => window.removeEventListener('beforeunload', confirm);
  }, [state]);

  // Auto focus on a node
  useEffect(() => {
    if (!focus) return;

    // @TODO Remove as soon as React Flow fixes this issue
    // The viewport is reporting that it has 0 width and height. This is a workaround to inject the correct focus values.
    // Please don't ask why dividing by 5 and 8 works. I don't know. But the value almost always perfectly centers the view ¯\_(ツ)_/¯
    const offset = { x: window.innerWidth / 5, y: window.innerHeight / 8 };

    const { x, y } = focus.position;
    reactFlowInstance?.setCenter(x - offset.x, y - offset.y);
    setFocusId({});
  }, [setFocusId, reactFlowInstance, focus]);

  if (!state.isPopulateCompleted) {
    return null;
  }

  return (
    <div data-testid="runbooks" className="app-runbooks fixed h-full w-full">
      <div className="border-fg-muted flex h-14 items-center justify-between border-b bg-white px-6">
        <Logo withText={false} />
        <h1 className="self-centered font-semibold">{state.name}</h1>
        {mode === RunbookMode.View ? (
          <Link to={`/runbooks/${params.id}`} className="text-blue-500">
            Edit
          </Link>
        ) : (
          <Link
            to={`/runbooks/${params.id}?mode=view`}
            className="text-blue-500"
          >
            Run
          </Link>
        )}
      </div>

      <div className="absolute p-6">
        <Button
          className="border-fg-muted rounded border bg-white"
          as={<Link to={`/runbooks/${params.id}?create=show`} />}
        >
          Add Node
        </Button>
      </div>

      {printPanel}

      <ReactFlow
        edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={state.edges}
        onNodeClick={clickNode}
        onInit={(instance) => setReactFlowInstance(instance)}
        style={{ display: 'relative', zIndex: '-1' }}
      >
        <Background gap={5} style={{ opacity: '0.3' }} />
      </ReactFlow>
    </div>
  );
}

export default Runbooks;
