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
  InputAdornment,
  Menu,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Info as InfoIcon, 
  KeyboardReturn as EnterIcon,
  Psychology as PsychologyIcon,
  Close as CloseIcon
} from '@mui/icons-material';

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
const CustomNode = ({ data, selected, id }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // 检查节点是否被锁定
  const isLocked = data.isLocked || false;
  const isThinking = data.label === "🤔 Thinking...";

  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAskLLM = () => {
    // 触发询问LLM的事件
    console.log('CustomNode - 准备调用LLM, 节点ID:', id, '节点内容:', data.label);
    console.log('CustomNode - 回调函数存在:', !!data.onAskLLM);
    if (data.onAskLLM) {
      data.onAskLLM(id, data.label);
    } else {
      console.error('CustomNode - 回调函数不存在!');
    }
    handleClose();
  };

  return (
    <>
      <Paper
        elevation={selected ? 8 : 3}
        onContextMenu={handleContextMenu}
        sx={{
          padding: '14px 18px',
          minWidth: '120px',
          maxWidth: '300px', // 设置最大宽度
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRadius: '12px',
          border: selected ? '2px solid #1976d2' : 
                 isLocked ? '2px solid #ff9800' : 
                 '2px solid transparent',
          backgroundColor: isLocked ? '#fff3e0' : 'white', // 锁定时淡橙色背景
          opacity: isThinking ? 0.8 : 1, // thinking状态半透明
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer !important',
          '&:hover': {
            elevation: 6,
            transform: isLocked ? 'none' : 'scale(1.02)', // 锁定时不缩放
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
            lineHeight: 1.4, // 增加行高
            cursor: 'pointer',
            wordBreak: 'break-word', // 允许单词内断行
            whiteSpace: 'pre-wrap', // 保留换行符和空格
            overflow: 'hidden', // 隐藏溢出
            display: '-webkit-box',
            WebkitLineClamp: 8, // 最多显示8行
            WebkitBoxOrient: 'vertical',
            minHeight: '1.4em', // 最小高度为一行
            textAlign: 'center', // 居中对齐
            margin: 0,
            padding: 0
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
      
      {/* 右键菜单 */}
      {!isThinking && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e0e0e0'
            }
          }}
        >
          <MenuItem 
            onClick={handleAskLLM} 
            disabled={isLocked}
            sx={{ 
              minWidth: '150px',
              '&:hover': {
                backgroundColor: isLocked ? 'transparent' : '#f5f5f5'
              },
              opacity: isLocked ? 0.5 : 1
            }}
          >
            <PsychologyIcon sx={{ mr: 1, color: isLocked ? '#ccc' : '#1976d2' }} />
            Ask LLM
          </MenuItem>
        </Menu>
      )}
    </>
  );
};

// 节点类型定义 - 移到组件外部
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(4);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [inputPosition, setInputPosition] = useState({ x: 0, y: 0 });
  const [inputValue, setInputValue] = useState('');
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const { screenToFlowPosition } = useReactFlow();
  const inputRef = useRef(null);
  
  // 用户名和数据同步相关状态
  const [username, setUsername] = useState('default_user');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitializedRef = useRef(false);
  
  // 节点锁定状态管理
  const [lockedNodes, setLockedNodes] = useState(new Set());
  
  // 自定义双击检测
  const clickTimeoutRef = useRef(null);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  
  // handleAskLLM函数引用，避免循环依赖
  const handleAskLLMRef = useRef(null);
  
  // nodeId的引用，避免闭包问题
  const nodeIdRef = useRef(nodeId);
  
  // 同步nodeId和nodeIdRef
  useEffect(() => {
    nodeIdRef.current = nodeId;
  }, [nodeId]);
  


  // LLM API调用函数（带超时处理）
  const callLLM = useCallback(async (message) => {
    console.log('🔄 开始LLM API调用，消息:', message);
    
    try {
      // 添加30秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      console.log('📡 发送请求到后端...');
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          temperature: 0.7,
          max_tokens: 1000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📡 收到响应，状态:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ LLM API调用成功，响应长度:', data.response?.length);
      return data.response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ LLM API调用超时 (30秒)');
        throw new Error('API调用超时，请重试');
      }
      console.error('❌ LLM API调用失败:', error);
      throw error;
    }
  }, []); // 无依赖项

  // 数据保存函数
  const saveData = useCallback(async (showNotification = true) => {
    // 使用函数式更新来避免闭包问题
    setIsSaving(prev => {
      if (prev) return prev; // 如果已经在保存中，则不执行
      
      // 异步执行保存逻辑
      (async () => {
        try {
          const response = await fetch('http://localhost:8000/save-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username,
              nodes: nodes,
              edges: edges
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setLastSaved(new Date());
          
          if (showNotification) {
            setSnackbarMessage('数据保存成功！');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          }
          
          console.log('数据保存成功:', data);
          
        } catch (error) {
          console.error('数据保存失败:', error);
          if (showNotification) {
            setSnackbarMessage('数据保存失败: ' + error.message);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        } finally {
          setIsSaving(false);
        }
      })();
      
      return true; // 设置为保存中状态
    });
  }, [username, nodes, edges]); // 移除状态更新函数依赖

  // 更新节点内容
  const updateNode = useCallback((nodeId, newData) => {
    setNodes((nds) => 
      nds.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, []);

  // 锁定/解锁节点
  const setNodeLocked = useCallback((nodeId, locked) => {
    updateNode(nodeId, { isLocked: locked });
  }, [updateNode]);

  // 创建新节点（重构为通用函数）
  const createNode = useCallback((content = null, position = null, extraData = {}) => {
    // 使用传入的内容或输入框内容
    const nodeContent = content || inputValue.trim();
    if (!nodeContent) return null;
    
    // 使用传入的位置或输入框位置
    let nodePosition;
    if (position) {
      nodePosition = position;
    } else {
      // 将屏幕坐标转换为流坐标
      const flowPosition = screenToFlowPosition({ x: inputPosition.x, y: inputPosition.y });
      nodePosition = {
        x: flowPosition.x - 60, // 居中
        y: flowPosition.y - 30   // 居中
      };
    }
    
    const newNodeId = nodeId.toString();
    const newNode = {
      id: newNodeId,
      type: 'custom',
      position: nodePosition,
      data: { 
        label: nodeContent,
        // 在这里我们不直接引用handleAskLLM，而是在后面通过updateNode设置
        ...extraData // 支持额外数据（如锁定状态）
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNodeId(prev => prev + 1);
    console.log('创建节点:', newNode); // 调试日志
    
    // 只有手动创建时才隐藏输入框
    if (!content) {
      setIsInputVisible(false);
      setInputValue('');
    }
    
    return newNodeId; // 返回新节点ID
  }, [inputValue, inputPosition, nodeId, screenToFlowPosition]); // 移除handleAskLLM依赖

    // 处理Ask LLM请求 - 简化版本
  const handleAskLLM = useCallback(async (sourceNodeId, nodeContent) => {
    console.log('🚀 开始LLM请求，源节点ID:', sourceNodeId, '内容:', nodeContent);
    
    // 1. 立即锁定被提问的节点
    setNodeLocked(sourceNodeId, true);
    
    // 2. 获取当前节点ID并生成thinking节点ID
    const thinkingNodeId = nodeIdRef.current.toString();
    console.log('🆔 生成thinking节点ID:', thinkingNodeId);
    
    // 3. 找到源节点并计算thinking节点位置
    let sourceNode = null;
    setNodes(currentNodes => {
      console.log('📋 当前节点列表:', currentNodes.map(n => ({id: n.id, label: n.data.label})));
      
      sourceNode = currentNodes.find(node => node.id === sourceNodeId);
      if (!sourceNode) {
        console.error('❌ 找不到源节点:', sourceNodeId);
        return currentNodes;
      }
      
      // 计算thinking节点位置
      const thinkingPosition = {
        x: sourceNode.position.x + 150 + 50,
        y: sourceNode.position.y
      };
      
      console.log('📍 计算thinking节点位置:', thinkingPosition);
      
      // 创建thinking节点
      const thinkingNode = {
        id: thinkingNodeId,
        type: 'custom',
        position: thinkingPosition,
        data: { 
          label: "🤔 Thinking...",
          isLocked: true,
          onAskLLM: (...args) => handleAskLLMRef.current?.(...args)
        }
      };
      
      console.log('✨ 创建thinking节点:', thinkingNode);
      
      return [...currentNodes, thinkingNode];
    });
    
    // 4. 更新nodeId
    setNodeId(prev => prev + 1);
    
    // 5. 创建连接
    const newEdge = {
      id: `e${sourceNodeId}-${thinkingNodeId}`,
      source: sourceNodeId,
      target: thinkingNodeId,
      type: 'smoothstep',
      markerEnd: { type: 'arrowclosed', color: '#1976d2' },
      style: { stroke: '#1976d2', strokeWidth: 2 }
    };
    
    setEdges(eds => [...eds, newEdge]);
    console.log('🔗 创建连接:', newEdge);
    
    // 6. 立即开始异步LLM调用
    console.log('📞 开始LLM API调用...');
    
    try {
      const llmResponse = await callLLM(nodeContent);
      console.log('🎉 LLM API调用成功，响应长度:', llmResponse?.length);
      
      const finalContent = llmResponse.length > 200 ? 
        llmResponse.substring(0, 200) + '...' : 
        llmResponse;
        
      console.log('🔄 更新thinking节点内容...');
      updateNode(thinkingNodeId, {
        label: finalContent,
        isLocked: false
      });
      
      console.log('🔓 解锁源节点:', sourceNodeId);
      setNodeLocked(sourceNodeId, false);
      
      setSnackbarMessage('LLM分析完成！');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      console.log('✅ LLM流程完成');
      
      // 自动保存
      setTimeout(() => saveData(false), 200);
      
    } catch (error) {
      console.error('❌ LLM调用失败:', error);
      
      updateNode(thinkingNodeId, {
        label: `❌ Error: ${error.message}`,
        isLocked: false
      });
      
      setNodeLocked(sourceNodeId, false);
      
      setSnackbarMessage('LLM调用失败: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    
    // 创建后立即自动保存
    setTimeout(() => saveData(false), 100);
    
  }, [setNodeLocked, updateNode, saveData]); // 使用nodeIdRef，移除nodeId依赖

  // 设置handleAskLLM引用
  handleAskLLMRef.current = handleAskLLM;

  // 数据加载函数
  const loadData = useCallback(async () => {
    if (isLoading) return; // 防止重复加载
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:8000/load-data/${username}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.nodes && data.nodes.length > 0) {
        // 为加载的节点添加回调函数
        const nodesWithCallbacks = data.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onAskLLM: (...args) => handleAskLLMRef.current?.(...args)
          }
        }));
        
        setNodes(nodesWithCallbacks);
        setEdges(data.edges || []);
        setLastSaved(new Date(data.last_updated));
        
        setSnackbarMessage(`数据加载成功！用户: ${username}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // 如果没有数据，保持初始状态
        setSnackbarMessage(`欢迎新用户: ${username}`);
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
      }
      
      console.log('数据加载成功:', data);
      
    } catch (error) {
      console.error('数据加载失败:', error);
      setSnackbarMessage('数据加载失败: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [username, isLoading]); // 移除状态更新函数依赖

  // 初始化节点数据（仅在没有加载数据时使用）
  useEffect(() => {
    const initializeNodes = () => {
      const nodesWithCallbacks = initialNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onAskLLM: (...args) => handleAskLLMRef.current?.(...args)
        }
      }));
      setNodes(nodesWithCallbacks);
    };
    
    // 仅在没有从数据库加载数据且没有现有节点时初始化
    if (nodes.length === 0 && !isLoading && !lastSaved) {
      initializeNodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, isLoading, lastSaved]); // 简化依赖项

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
      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
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
  }, [screenToFlowPosition, isInputVisible]);

  // 处理节点选择变化
  const handleSelectionChange = useCallback((params) => {
    console.log('选择变化:', params); // 调试日志
    setSelectedNodes(params.nodes);
  }, []);

  // 取消创建
  const cancelCreate = useCallback(() => {
    setIsInputVisible(false);
    setInputValue('');
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const nodeId = createNode();
      if (nodeId) {
        // 为手动创建的节点设置回调函数
        updateNode(nodeId, { onAskLLM: (...args) => handleAskLLMRef.current?.(...args) });
        
        // 手动创建节点后自动保存
        setTimeout(() => {
          saveData(false); // 静默保存
        }, 100);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelCreate();
    }
  }, [createNode, cancelCreate, updateNode, saveData]);

  // 删除选中的节点
  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length > 0) {
      // 检查是否有锁定的节点
      const lockedNodeIds = selectedNodes
        .filter(node => node.data.isLocked)
        .map(node => node.id);
      
      if (lockedNodeIds.length > 0) {
        setSnackbarMessage(`无法删除锁定的节点: ${lockedNodeIds.join(', ')}`);
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      
      const selectedNodeIds = selectedNodes.map(node => node.id);
      
      // 删除选中的节点
      setNodes((nds) => nds.filter((node) => !selectedNodeIds.includes(node.id)));
      
      // 删除与选中节点相关的边
      setEdges((eds) => eds.filter((edge) => 
        !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      ));
      
      setSelectedNodes([]);
      console.log('删除节点:', selectedNodeIds); // 调试日志
      
      // 删除节点后自动保存
      setTimeout(() => {
        saveData(false); // 静默保存
      }, 100);
    }
  }, [selectedNodes, saveData]); // 重新添加saveData依赖

  // 键盘事件监听器
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedNodes();
      }
      
      // Ctrl+S 保存快捷键
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // 阻止默认的保存网页行为
        saveData();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [deleteSelectedNodes, saveData]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // 初始化数据加载
  useEffect(() => {
    hasInitializedRef.current = false; // 重置初始化状态
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]); // 只依赖username，避免循环

  // 注意：自动保存功能已重新添加，在创建/删除节点和LLM完成时自动保存

  // 处理Snackbar关闭
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

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
                    onClick={() => createNode()}
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
            • 右键点击节点询问LLM，立即生成"Thinking"节点
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • 拖拽节点右侧圆点连接到其他节点
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • 左键拖拽移动节点，右键拖拽平移画布
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • 选中节点后按Delete键删除（锁定节点不可删除）
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5, color: 'primary.main' }}>
            • Ctrl+S 手动保存数据
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5, color: 'success.main' }}>
            • 创建/删除节点时自动保存
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5, color: 'warning.main' }}>
            • 橙色边框表示节点已锁定，正在处理中
          </Typography>
        </Box>
      </Paper>

      {/* 用户状态面板 */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          minWidth: 200,
          p: 2,
          borderRadius: '12px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PsychologyIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            用户状态
          </Typography>
        </Box>
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            用户: {username}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            节点数: {nodes.length}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            连接数: {edges.length}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {isSaving ? '正在保存...' : 
             isLoading ? '正在加载...' : 
             lastSaved ? `上次保存: ${lastSaved.toLocaleTimeString()}` : '未保存'}
          </Typography>
        </Box>
      </Paper>

      {/* 通知组件 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
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
