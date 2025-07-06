import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  ThemeProvider, 
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Paper,
  GlobalStyles,
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Info as InfoIcon, KeyboardReturn as EnterIcon } from '@mui/icons-material';

// 创建MUI主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// 全局样式覆盖ReactFlow的默认样式
const globalStyles = (
  <GlobalStyles
    styles={{
      '.react-flow__pane': {
        cursor: 'default !important',
      },
      '.react-flow__pane.dragging': {
        cursor: 'grabbing !important',
      },
      '.react-flow__node': {
        cursor: 'pointer !important',
      },
      '.react-flow__node.dragging': {
        cursor: 'grabbing !important',
      },
      '.react-flow__handle': {
        cursor: 'crosshair !important',
      },
      '.react-flow__controls': {
        cursor: 'default !important',
      },
      '.react-flow__controls button': {
        cursor: 'pointer !important',
      },
    }}
  />
);

// 自定义节点组件 - 使用MUI样式
const CustomNode = ({ data, selected }) => {
  return (
    <Paper
      elevation={selected ? 8 : 3}
      sx={{
        padding: '12px 20px',
        minWidth: '120px',
        textAlign: 'center',
        position: 'relative',
        borderRadius: '12px',
        border: selected ? '2px solid #1976d2' : '2px solid transparent',
        backgroundColor: 'white',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer !important',
        '&:hover': {
          elevation: 6,
          transform: 'scale(1.02)',
        }
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#1976d2',
          border: '3px solid #ffffff',
          width: '14px',
          height: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          cursor: 'crosshair'
        }}
      />
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 500,
          color: '#333',
          fontSize: '14px',
          lineHeight: 1.2,
          cursor: 'pointer'
        }}
      >
        {data.label}
      </Typography>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#1976d2',
          border: '3px solid #ffffff',
          width: '14px',
          height: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          cursor: 'crosshair'
        }}
      />
    </Paper>
  );
};

// 节点类型定义
const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  { 
    id: '1', 
    type: 'custom',
    position: { x: 100, y: 100 }, 
    data: { label: '开始节点' } 
  },
  { 
    id: '2', 
    type: 'custom',
    position: { x: 350, y: 100 }, 
    data: { label: '中间节点' } 
  },
  { 
    id: '3', 
    type: 'custom',
    position: { x: 600, y: 100 }, 
    data: { label: '结束节点' } 
  }
];

const initialEdges = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2',
    type: 'smoothstep',
    markerEnd: {
      type: 'arrowclosed',
      color: '#1976d2'
    },
    style: {
      stroke: '#1976d2',
      strokeWidth: 2
    }
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3',
    type: 'smoothstep',
    markerEnd: {
      type: 'arrowclosed',
      color: '#1976d2'
    },
    style: {
      stroke: '#1976d2',
      strokeWidth: 2
    }
  }
];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(4);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [inputPosition, setInputPosition] = useState({ x: 0, y: 0 });
  const [inputValue, setInputValue] = useState('');
  const [selectedNodes, setSelectedNodes] = useState([]);
  const { project } = useReactFlow();
  const inputRef = useRef(null);
  
  // 自定义双击检测
  const clickTimeoutRef = useRef(null);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  // 处理连接
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      type: 'smoothstep',
      markerEnd: {
        type: 'arrowclosed',
        color: '#1976d2'
      },
      style: {
        stroke: '#1976d2',
        strokeWidth: 2
      }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  // 自定义双击检测逻辑
  const handlePaneClick = useCallback((event) => {
    console.log('点击事件触发', event.target.className); // 调试日志
    
    // 检查是否点击的是空白区域（pane）
    if (!event.target.classList.contains('react-flow__pane')) {
      console.log('不是空白区域，忽略');
      return;
    }
    
    // 如果输入框当前可见，单击空白区域应该关闭输入框
    if (isInputVisible) {
      console.log('输入框可见，点击空白区域关闭输入框');
      setIsInputVisible(false);
      setInputValue('');
      return;
    }
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTimeRef.current;
    
    console.log('点击时间差:', timeDiff); // 调试日志
    
    if (timeDiff < 300) { // 300ms内的连续点击认为是双击
      // 双击事件
      console.log('检测到双击!');
      
      // 清除之前的定时器
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      
      // 显示浮动输入框
      const flowPosition = project({ x: event.clientX, y: event.clientY });
      console.log('双击位置:', flowPosition); // 调试日志
      
      // 设置输入框位置为鼠标点击位置
      setInputPosition({ x: event.clientX, y: event.clientY });
      setIsInputVisible(true);
      setInputValue('');
      
      // 延迟聚焦，确保输入框已经渲染
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
      
      // 重置计数
      clickCountRef.current = 0;
    } else {
      // 单击事件
      console.log('单击事件');
      clickCountRef.current = 1;
      
      // 清除之前的定时器
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      // 设置定时器，如果300ms内没有第二次点击，则认为是单击
      clickTimeoutRef.current = setTimeout(() => {
        console.log('确认单击');
        clickCountRef.current = 0;
        clickTimeoutRef.current = null;
      }, 300);
    }
    
    lastClickTimeRef.current = currentTime;
  }, [project, isInputVisible]);

  // 处理节点选择变化
  const handleSelectionChange = useCallback((params) => {
    console.log('选择变化:', params); // 调试日志
    setSelectedNodes(params.nodes);
  }, []);

  // 创建新节点
  const createNode = useCallback(() => {
    if (inputValue.trim()) {
      // 将屏幕坐标转换为流坐标
      const flowPosition = project({ x: inputPosition.x, y: inputPosition.y });
      
      const newNode = {
        id: nodeId.toString(),
        type: 'custom',
        position: {
          x: flowPosition.x - 60, // 居中
          y: flowPosition.y - 30   // 居中
        },
        data: { label: inputValue.trim() }
      };
      
      setNodes((nds) => [...nds, newNode]);
      setNodeId(nodeId + 1);
      console.log('创建节点:', newNode); // 调试日志
    }
    // 隐藏输入框
    setIsInputVisible(false);
    setInputValue('');
  }, [inputValue, inputPosition, nodeId, setNodes, project]);

  // 取消创建
  const cancelCreate = useCallback(() => {
    setIsInputVisible(false);
    setInputValue('');
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      createNode();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelCreate();
    }
  }, [createNode, cancelCreate]);

  // 删除选中的节点
  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length > 0) {
      const selectedNodeIds = selectedNodes.map(node => node.id);
      
      // 删除选中的节点
      setNodes((nds) => nds.filter((node) => !selectedNodeIds.includes(node.id)));
      
      // 删除与选中节点相关的边
      setEdges((eds) => eds.filter((edge) => 
        !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      ));
      
      setSelectedNodes([]);
      console.log('删除节点:', selectedNodeIds); // 调试日志
    }
  }, [selectedNodes, setNodes, setEdges]);

  // 键盘事件监听器
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedNodes();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [deleteSelectedNodes]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative',
      '& .react-flow__pane': {
        cursor: 'default !important',
      }
    }}>
      {globalStyles}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        onSelectionChange={handleSelectionChange}
        panOnDrag={[2]} // 只有右键（按钮2）可以平移
        panOnScroll={false}
        zoomOnDoubleClick={false}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.5}
        maxZoom={2}
        selectNodesOnDrag={false} // 拖拽时不选中节点
        elementsSelectable={true}
        nodesConnectable={true}
        nodesDraggable={true}
        style={{ 
          cursor: 'default',
          width: '100%',
          height: '100%'
        }}
      >
        <Background color="#e0e0e0" gap={20} />
        <Controls />
      </ReactFlow>

      {/* 浮动输入框 */}
      {isInputVisible && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            left: inputPosition.x,
            top: inputPosition.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            border: '1px solid #e0e0e0'
          }}
        >
          <TextField
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入节点内容..."
            variant="outlined"
            size="small"
            autoComplete="off"
            sx={{
              minWidth: '250px',
              '& .MuiOutlinedInput-root': {
                paddingRight: 0,
                '& fieldset': {
                  border: 'none',
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  border: 'none',
                },
              },
              '& .MuiInputBase-input': {
                padding: '12px 16px',
                fontSize: '14px',
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={createNode}
                    edge="end"
                    size="small"
                    sx={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      borderRadius: '4px',
                      margin: '4px',
                      padding: '6px',
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      },
                    }}
                  >
                    <EnterIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Paper>
      )}

      {/* 信息面板 */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          maxWidth: 300,
          p: 2,
          borderRadius: '12px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <InfoIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            操作说明
          </Typography>
        </Box>
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • 双击空白区域弹出输入框
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • 输入内容后按Enter键或点击蓝色按钮创建节点
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • 按Esc键或点击空白区域取消输入
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • 拖拽节点右侧圆点连接到其他节点
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • 左键拖拽移动节点，右键拖拽平移画布
          </Typography>
          <Typography variant="body2">
            • 选中节点后按Delete键删除
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </ThemeProvider>
  );
}
