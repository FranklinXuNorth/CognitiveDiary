import React, { useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: '你好 React Flow' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: '连接我' } },
  { id: '3', position: { x: 500, y: 300 }, data: { label: 'End'} }
];

const initialEdges = [
  { id: '1-2', source: '1', target: '2' },
  { id: '2-3', source: '2', target: '3' },
];

function Flow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [count, setCount] = useState(initialNodes.length + 1);
  const { project, setNodes: updateNodes } = useReactFlow();

  const handleDoubleClick = (event) => {
    const clientPosition = { x: event.clientX, y: event.clientY };
    const flowPosition = project(clientPosition);
    const newId = `${count}`;

    // 初始粗略居中（等下会精修）
    const roughPosition = {
      x: flowPosition.x - 75,
      y: flowPosition.y - 25,
    };

    const newNode = {
      id: newId,
      position: roughPosition,
      data: { label: `新节点 ${newId}` },
    };

    setNodes((nds) => [...nds, newNode]);

    const newEdge = {
      id: `e${count - 1}-${count}`,
      source: `${count - 1}`,
      target: `${count}`,
    };
    setEdges((eds) => [...eds, newEdge]);
    setCount(count + 1);

    // 延迟测量真实尺寸再重新设置位置
    setTimeout(() => {
      const el = document.querySelector(`[data-id="${newId}"]`);
      if (!el) return;

      const { offsetWidth, offsetHeight } = el;
      const adjustedPos = {
        x: flowPosition.x - offsetWidth / 2,
        y: flowPosition.y - offsetHeight / 2,
      };

      updateNodes((nds) =>
        nds.map((node) =>
          node.id === newId
            ? { ...node, position: adjustedPos }
            : node
        )
      );
    }, 0); // next tick
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onDoubleClick={handleDoubleClick}
        panOnDrag={false}
        zoomOnDoubleClick={false}
        fitView
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
