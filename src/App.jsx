import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';

const nodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: '你好 React Flow' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: '连接我' } }
];

const edges = [
  { id: 'e1-2', source: '1', target: '2' }
];

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges} />
    </div>
  );
}

export default App;
