import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  ThemeProvider, 
  createTheme,
  CssBaseline,
  Box,
  GlobalStyles,
  TextField,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Info as InfoIcon, 
  KeyboardReturn as EnterIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

// 导入主题和组件
import { colors, shadows, canvasColors } from './theme/colors';
import { fonts } from './theme/fonts';
import { RoundIconButton } from './assets/components/Button';
import { InfoPanel, StatusPanel, FloatingPanel } from './assets/components/Panel';
import { 
  nodeTypes, 
  initialNodes, 
  initialEdges, 
  NodeGlobalStyles,
  NodeFeature,
  NodeType
} from './assets/components/CustomNode';
import { CustomEdge } from './assets/components/CustomEdge';
import Menu from './assets/components/Menu';
import SelectionBox from './assets/components/SelectionBox';
import { traceNodeChain, applyChainHighlight, clearChainHighlight } from './utils/nodeUtils';

// http://localhost:8000/chat
// https://cognitivediarybackend.fly.dev
// 全局配置 - 后端API基础URL
const API_BASE_URL = 'http://localhost:8000';

// 创建MUI主题 - 使用颜色主题
const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrastText,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.secondary.contrastText,
    },
    success: {
      main: colors.success.main,
      light: colors.success.light,
      dark: colors.success.dark,
      contrastText: colors.success.contrastText,
    },
    warning: {
      main: colors.warning.main,
      light: colors.warning.light,
      dark: colors.warning.dark,
      contrastText: colors.warning.contrastText,
    },
    error: {
      main: colors.error.main,
      light: colors.error.light,
      dark: colors.error.dark,
      contrastText: colors.error.contrastText,
    },
    info: {
      main: colors.info.main,
      light: colors.info.light,
      dark: colors.info.dark,
      contrastText: colors.info.contrastText,
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
  },
  typography: {
    fontFamily: fonts.families.sans,
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
        boxShadow: 'none !important',
      },
      '.react-flow__node.dragging': {
        cursor: 'grabbing !important',
        boxShadow: 'none !important',
      },
      '.react-flow__handle': {
        cursor: 'crosshair !important',
        boxShadow: 'none !important',
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

// 交互模式枚举
const InteractionMode = {
  NORMAL: 'normal',           // 正常状态
  SELECTING: 'selecting',     // 选中节点状态
  BOX_SELECTING: 'boxSelecting', // 框选状态
  DRAGGING: 'dragging'        // 拖拽状态
};

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [inputPosition, setInputPosition] = useState({ x: 0, y: 0 });
  const [inputValue, setInputValue] = useState('');
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // 菜单相关状态
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isThinkingMode, setIsThinkingMode] = useState(false); // 标记是否为思考模式
  const [isAnnotationMode, setIsAnnotationMode] = useState(false); // 标记是否为标注模式
  const { screenToFlowPosition, getViewport } = useReactFlow();
  const inputRef = useRef(null);
  
  // 用户名和数据同步相关状态
  const [username, setUsername] = useState('default_user');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // 添加数据加载状态标记
  const [hasLoadedUserData, setHasLoadedUserData] = useState(false); // 标记是否已加载用户数据
  const hasInitializedRef = useRef(false);

  // 使用useRef来持有最新的节点和边状态，避免在回调中出现闭包问题
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  
  // 使用 useEffect 确保 nodesRef 和 edgesRef 始终是最新的
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  
  // 节点锁定状态管理
  const [lockedNodes, setLockedNodes] = useState(new Set());
  
  // 链式查询状态管理
  const [isChainHighlighted, setIsChainHighlighted] = useState(false);
  const [currentChainData, setCurrentChainData] = useState(null);
  
  // 序号管理
  const [nextNodeIndex, setNextNodeIndex] = useState(1);
  const [nextEdgeIndex, setNextEdgeIndex] = useState(1);
  
  // 自定义双击检测
  const clickTimeoutRef = useRef(null);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  
  // 新的交互状态管理
  const [interactionMode, setInteractionMode] = useState(InteractionMode.NORMAL);
  const [boxSelectedNodes, setBoxSelectedNodes] = useState(new Set()); // 框选中的节点
  const [selectionGroupIds, setSelectionGroupIds] = useState(new Set()); // 当前组选中的节点
  
  // 全局编辑状态管理
  const [isAnyNodeEditing, setIsAnyNodeEditing] = useState(false);
  
  // 框选相关状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  
  // 拖拽相关状态
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [dragStartNodes, setDragStartNodes] = useState([]);
  
  // 边类型定义 - 使用useMemo避免重新创建
  const edgeTypes = useMemo(() => ({
    custom: CustomEdge
  }), []);
  
  // 节点类型定义 - 使用useMemo避免重新创建
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  
  // handleAskLLM函数引用，避免循环依赖
  const handleAskLLMRef = useRef(null);
  
  // handleChainedQuery函数引用，避免循环依赖
  const handleChainedQueryRef = useRef(null);
  
  // handleNodeEdit函数引用，避免循环依赖
  const handleNodeEditRef = useRef(null);
  
  // 生成唯一节点ID的函数
  const generateUniqueNodeId = useCallback((currentNodes = []) => {
    // 获取当前所有节点的数字ID
    const existingIds = currentNodes
      .map(node => parseInt(node.id))
      .filter(id => !isNaN(id));
    
    // 如果没有现有ID，从1开始
    if (existingIds.length === 0) {
      return '1';
    }
    
    // 找到最大ID并加1
    const maxId = Math.max(...existingIds);
    return (maxId + 1).toString();
  }, []);
  
  // 当前最大节点ID的引用，避免闭包问题
  const getNextNodeId = useCallback(() => {
    return generateUniqueNodeId(nodes);
  }, [nodes, generateUniqueNodeId]);
  


  // LLM API调用函数（带超时处理）
  const callLLM = useCallback(async (message) => {
    console.log('🔄 开始LLM API调用，消息:', message);
    
    try {
      // 添加30秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      console.log('📡 发送请求到后端...');
      // 使用正确的chat端点
      const response = await fetch(`${API_BASE_URL}/chat`, {
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
  const saveData = useCallback(async (options = {}) => {
    // 防止重复保存
    if (isSaving) {
      console.log('⏳ 正在保存中，跳过重复保存');
      return;
    }
    
    // 额外的防重复机制 - 如果上次保存距离现在不到1秒，则跳过
    const now = Date.now();
    const lastSaveTime = saveData.lastSaveTime || 0;
    if (now - lastSaveTime < 50) {
      console.log('⏭️ 距离上次保存不到1秒，跳过重复保存');
      return;
    }
    saveData.lastSaveTime = now;
    
    setIsSaving(true);

    const { 
      nodes: nodesToSaveParam, 
      edges: edgesToSaveParam, 
      showNotification = true 
    } = options;
    
    // 优先用参数，否则用最新 ref
    const nodesToSave = nodesToSaveParam || nodesRef.current;
    const edgesToSave = edgesToSaveParam || edgesRef.current;

    console.log('�� 开始保存数据:', { 
      username, 
      nodesCount: nodesToSave.length, 
      edgesCount: edgesToSave.length,
      showNotification,
      nodesToSaveSource: nodesToSaveParam ? 'explicit' : 'ref',
      edgesToSaveSource: edgesToSaveParam ? 'explicit' : 'ref'
    });
    
    try {
      const requestData = {
        username: username,
        nodes: nodesToSave,
        edges: edgesToSave
      };
      
      console.log('📡 发送保存请求到后端...', {
        username: requestData.username,
        nodesCount: requestData.nodes.length,
        edgesCount: requestData.edges.length,
        nodeIds: requestData.nodes.map(n => n.id)
      });
      
      const response = await fetch(`${API_BASE_URL}/save-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('📡 收到后端响应，状态码:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      setLastSaved(new Date());
      
      if (showNotification) {
        setSnackbarMessage('数据保存成功！');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
      
      console.log('✅ 数据保存成功:', data);
      
    } catch (error) {
      console.error('❌ 数据保存失败:', error);
      console.error('❌ 错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (showNotification) {
        setSnackbarMessage('数据保存失败: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      
      // 重新抛出错误，让调用者能够捕获
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [username, isSaving, nodes, edges]);

  // 更新节点内容
  const updateNode = useCallback((nodeId, newData) => {
    setNodes((nds) => 
      nds.map(node => 
        node.id === nodeId 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                ...newData,
                // 确保回调函数不被覆盖
                onAskLLM: node.data.onAskLLM,
                onChainedQuery: node.data.onChainedQuery,
                onEdit: node.data.onEdit,
                onEditingStateChange: node.data.onEditingStateChange,
                onCollapseChange: node.data.onCollapseChange
              } 
            }
          : node
      )
    );
  }, []);

  // 锁定/解锁节点
  const setNodeLocked = useCallback((nodeId, locked) => {
    updateNode(nodeId, { isLocked: locked });
  }, [updateNode]);

  // 处理节点编辑
  const handleNodeEdit = useCallback(async (nodeId, newContent) => {
    console.log('✏️ 开始编辑节点:', nodeId, '新内容:', newContent);
    
    // 使用 setNodes 的 callback 方式，确保保存时使用最新的节点数据
    setNodes(nds => {
      const updated = nds.map(node =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label: newContent,
                // 确保回调函数不被覆盖
                onAskLLM: node.data.onAskLLM,
                onChainedQuery: node.data.onChainedQuery,
                onEdit: node.data.onEdit,
                onEditingStateChange: node.data.onEditingStateChange
              }
            }
          : node
      );
      
      // 在 setNodes 的 callback 中直接保存，确保使用最新的节点数据
      console.log('📤 编辑后立即保存最新数据');
      saveData({ nodes: updated, showNotification: false }).then(() => {
        console.log('✅ 编辑后保存成功');
        setSnackbarMessage('节点编辑成功！');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }).catch((error) => {
        console.error('❌ 编辑后保存失败:', error);
        setSnackbarMessage('编辑成功但保存失败: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
      
      return updated;
    });
  }, [saveData, setSnackbarMessage, setSnackbarSeverity, setSnackbarOpen]);

  // 处理编辑状态变化
  const handleEditingStateChange = useCallback((isEditing) => {
    setIsAnyNodeEditing(isEditing);
    console.log('📝 编辑状态变化:', isEditing);
  }, []);

  // 处理折叠状态变化
  const handleCollapseChange = useCallback((nodeId, isCollapsed) => {
    updateNode(nodeId, { isCollapsed });
  }, [updateNode]);

  // ==================================================================
  // LLM 和链式查询相关函数
  // ==================================================================

  // 处理Ask LLM请求 - 简化版本
  const handleAskLLM = useCallback(async (sourceNodeId, nodeContent) => {
    console.log('🚀 开始LLM请求，源节点ID:', sourceNodeId, '内容:', nodeContent);
    
    // 1. 立即锁定被提问的节点
    setNodeLocked(sourceNodeId, true);
    
    // 2. 生成thinking节点ID和位置
    let thinkingNodeId = null;
    
    const sourceNode = nodesRef.current.find(node => node.id === sourceNodeId);
    if (!sourceNode) {
      console.error('❌ 找不到源节点:', sourceNodeId);
      setNodeLocked(sourceNodeId, false);
      return;
    }
    
    thinkingNodeId = generateUniqueNodeId(nodesRef.current);
    
    const thinkingPosition = {
      x: sourceNode.position.x + (sourceNode.width || 300) + 50,
      y: sourceNode.position.y
    };
    
    const thinkingNode = {
      id: thinkingNodeId,
      type: 'custom',
      position: thinkingPosition,
      data: { 
        label: "🤔 Thinking...",
        nodeIndex: nextNodeIndex, // 添加节点序号
        isLocked: true,
        isCollapsed: false, // 默认不折叠
        onAskLLM: (...args) => handleAskLLMRef.current?.(...args),
        onChainedQuery: (...args) => handleChainedQueryRef.current?.(...args),
        onEdit: (...args) => handleNodeEditRef.current?.(...args),
        onEditingStateChange: handleEditingStateChange, // 添加编辑状态变化回调
        onCollapseChange: handleCollapseChange // 添加折叠状态变化回调
      }
    };
    
    const newEdge = {
      id: `llm-${sourceNodeId}-${thinkingNodeId}`,
      source: sourceNodeId,
      target: thinkingNodeId,
      type: 'custom', // 使用自定义边类型
      data: {
        edgeIndex: nextEdgeIndex // 添加边序号
      },
      markerEnd: { 
        type: 'arrowclosed', 
        color: colors.highlight.chain 
      },
      style: { 
        stroke: colors.highlight.chain, 
        strokeWidth: 4,
        filter: `drop-shadow(0 0 5px ${colors.highlight.chain}90)`,
        strokeDasharray: '5,5',
        animation: 'chainEdgeFlow 1s linear infinite'
      },
      className: 'chain-edge-animated'
    };
    
    // 3. 在本地状态中添加 thinking 节点和边（不保存）
    setNodes(currentNodes => [...currentNodes, thinkingNode]);
    setNextNodeIndex(prev => prev + 1); // 增加节点序号
    setEdges(currentEdges => {
      const edgeExists = currentEdges.some(edge => edge.id === newEdge.id);
      if (edgeExists) {
        return currentEdges;
      }
      setNextEdgeIndex(prev => prev + 1); // 增加边序号
      return [...currentEdges, newEdge];
    });
    
    // 4. 开始异步LLM调用
    try {
      const llmResponse = await callLLM(nodeContent);
      
      // 5. LLM成功，手动计算最终状态
      const finalNodes = nodesRef.current.map(node => {
        if (node.id === thinkingNodeId) {
          return { ...node, data: { ...node.data, label: llmResponse, isLocked: false } };
        }
        if (node.id === sourceNodeId) {
          return { ...node, data: { ...node.data, isLocked: false } };
        }
        return node;
      });

      // 6. 清除LLM查询边的动画效果
      const finalEdges = edgesRef.current.map(edge => {
        if (edge.id === `llm-${sourceNodeId}-${thinkingNodeId}`) {
          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: colors.edge.default,
              strokeWidth: 2,
              filter: undefined,
              strokeDasharray: undefined,
              animation: undefined
            },
            markerEnd: {
              ...edge.markerEnd,
              color: colors.edge.default
            },
            className: undefined
          };
        }
        return edge;
      });

      // 7. 使用最新状态更新UI
      setNodes(finalNodes);
      setEdges(finalEdges);

      setSnackbarMessage('LLM分析完成！');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // 7. 此时执行唯一的一次保存，并传入最新的节点状态
      try {
        console.log('📤 LLM成功后，执行最终保存（包含thinking节点）');
        // 直接传递最新的nodes状态，edges状态没有变化，使用ref里的即可
        await saveData({ nodes: finalNodes, showNotification: false });
        console.log('✅ LLM成功后保存成功');
      } catch (error) {
        console.error('❌ LLM成功后保存失败:', error);
        setSnackbarMessage('LLM分析完成但保存失败: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      
    } catch (error) {
      console.error('❌ LLM调用失败:', error);

      // 8. LLM失败，从UI上直接移除临时的thinking节点和边
      setNodes(nds => nds.filter(n => n.id !== thinkingNodeId));
      setEdges(eds => eds.filter(e => e.id !== newEdge.id));

      // 解锁源节点
      setNodeLocked(sourceNodeId, false);
      
      setSnackbarMessage('LLM调用失败: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [setNodeLocked, updateNode, generateUniqueNodeId, callLLM, saveData]);
  
  // 处理链式查询请求
  const handleChainedQuery = useCallback(async (sourceNodeId, nodeContent) => {
    console.log('🔗 开始链式查询，源节点ID:', sourceNodeId, '内容:', nodeContent);
    
    // 清除之前的高亮
    if (isChainHighlighted) {
      console.log('🧹 清除之前的链式高亮');
      const { nodes: clearedNodes, edges: clearedEdges } = clearChainHighlight(nodesRef.current, edgesRef.current, colors);
      setNodes(clearedNodes);
      setEdges(clearedEdges);
      setIsChainHighlighted(false);
      setCurrentChainData(null);
    }
    
    // 追踪节点链
    const { chainNodes, chainEdges } = traceNodeChain(sourceNodeId, nodesRef.current, edgesRef.current);
    
    if (chainNodes.length === 0) {
      console.log('⚠️ 没有找到节点链');
      setSnackbarMessage('没有找到连接到此节点的链路');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    
    // 应用高亮
    console.log('🔍 高亮前 - 节点数:', nodesRef.current.length, '边数:', edgesRef.current.length);
    console.log('🔍 链式追踪结果 - 链节点数:', chainNodes.length, '链边数:', chainEdges.length);
    const { nodes: highlightedNodes, edges: highlightedEdges } = applyChainHighlight(
      nodesRef.current, 
      edgesRef.current, 
      chainNodes, 
      chainEdges, 
      colors
    );
    console.log('🔍 高亮后 - 节点数:', highlightedNodes.length, '边数:', highlightedEdges.length);
    
    setNodes(highlightedNodes);
    setEdges(highlightedEdges);
    setIsChainHighlighted(true);
    setCurrentChainData({ chainNodes, chainEdges });
    
    // 收集链中所有节点的内容
    const chainContent = chainNodes.reverse().map(node => node.data.label).join(' -> ');
    console.log('🔗 链式内容:', chainContent);
    
    // 构造链式查询的请求数据
    const chainQueryData = {
      chain_nodes: chainNodes.map(node => ({
        id: node.id,
        label: node.data.label
      })),
      target_node_content: nodeContent,
      temperature: 0.7
    };
    
    // 🔒 锁定所有链式节点
    console.log('🔒 锁定所有链式节点:', chainNodes.map(node => node.id));
    chainNodes.forEach(node => {
      setNodeLocked(node.id, true);
    });
    
    // 生成thinking节点ID和位置
    let thinkingNodeId = null;
    
    // 先找到源节点并计算thinking节点参数
    const sourceNode = nodesRef.current.find(node => node.id === sourceNodeId);
    if (!sourceNode) {
      console.error('❌ 找不到源节点:', sourceNodeId);
      return;
    }
    
    thinkingNodeId = generateUniqueNodeId(nodesRef.current);
    
    // 计算thinking节点位置
    const thinkingPosition = {
      x: sourceNode.position.x + (sourceNode.width || 300) + 50,
      y: sourceNode.position.y
    };
    
    // 创建thinking节点
    const thinkingNode = {
      id: thinkingNodeId,
      type: 'custom',
      position: thinkingPosition,
      data: {
        label: '🔗 Chained Thinking...',
        nodeIndex: nextNodeIndex, // 添加节点序号
        isLocked: true,
        isCollapsed: false, // 默认不折叠
        onAskLLM: (...args) => handleAskLLMRef.current?.(...args),
        onChainedQuery: (...args) => handleChainedQueryRef.current?.(...args),
        onEdit: (...args) => handleNodeEditRef.current?.(...args),
        onEditingStateChange: handleEditingStateChange, // 添加编辑状态变化回调
        onCollapseChange: handleCollapseChange // 添加折叠状态变化回调
      }
    };
    
    // 创建连接边
    const newEdge = {
      id: `chain-${sourceNodeId}-${thinkingNodeId}`,
      source: sourceNodeId,
      target: thinkingNodeId,
      type: 'custom', // 使用自定义边类型
      data: {
        edgeIndex: nextEdgeIndex // 添加边序号
      },
      markerEnd: {
        type: 'arrowclosed',
        color: colors.edge.default
      },
      style: {
        stroke: colors.edge.default,
        strokeWidth: 2
      }
    };
    
    // 分别更新节点和边缘，避免嵌套调用
    setNodes(currentNodes => [...currentNodes, thinkingNode]);
    setNextNodeIndex(prev => prev + 1); // 增加节点序号
    
    // 更新边列表 - 添加重复检查
    setEdges(currentEdges => {
      // 检查边缘是否已经存在
      const edgeExists = currentEdges.some(edge => edge.id === newEdge.id);
      if (edgeExists) {
        console.log('⚠️ 链式查询 - 边缘已存在，跳过添加:', newEdge.id);
        return currentEdges; // 返回原数组，不添加重复边缘
      }
      
      setNextEdgeIndex(prev => prev + 1); // 增加边序号
      console.log('✅ 链式查询 - 添加新边缘:', { id: newEdge.id, source: newEdge.source, target: newEdge.target });
      console.log('🔍 链式查询 - 添加前边数:', currentEdges.length, '添加后边数:', currentEdges.length + 1);
      return [...currentEdges, newEdge];
    });
    
    // 调用链式查询API
    try {
      console.log('📡 发送链式查询请求到后端...');
      const response = await fetch(`${API_BASE_URL}/chain_chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chainQueryData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const llmResponse = data.response;
      
      // 1. 在内存中创建包含LLM响应的节点列表（此时仍有高亮）
      const nodesWithLlmResponse = nodesRef.current.map(node => {
        if (node.id === thinkingNodeId) {
          return { ...node, data: { ...node.data, label: llmResponse, isLocked: false } };
        }
        // 🔓 解锁所有链式节点
        if (chainNodes.some(chainNode => chainNode.id === node.id)) {
          return { ...node, data: { ...node.data, isLocked: false } };
        }
        return node;
      });
      
      // 2. 基于上一步的结果，清除所有高亮，生成最终的干净状态
      console.log('🧹 清除链式高亮并准备最终状态');
      const { nodes: finalNodes, edges: finalEdges } = clearChainHighlight(
        nodesWithLlmResponse,
        edgesRef.current,
        colors
      );

      // 3. 一次性更新UI状态
      setNodes(finalNodes);
      setEdges(finalEdges);
      setIsChainHighlighted(false);
      setCurrentChainData(null);
      
      console.log('✅ 链式查询完成，高亮已清除');
      setSnackbarMessage('链式查询完成！');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // 4. 使用最终的、干净的状态进行自动保存
      try {
        console.log('📤 链式查询完成后自动保存（已清除高亮）');
        await saveData({ nodes: finalNodes, edges: finalEdges, showNotification: false });
        console.log('✅ 链式查询后保存成功');
      } catch (error) {
        console.error('❌ 链式查询后保存失败:', error);
        setSnackbarMessage('链式查询完成但保存失败: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      
    } catch (error) {
      console.error('❌ 链式查询失败:', error);
      
      // 删除thinking节点
      setNodes(currentNodes => currentNodes.filter(node => node.id !== thinkingNodeId));
      setEdges(currentEdges => currentEdges.filter(edge => edge.target !== thinkingNodeId));
      
      // 🔓 解锁所有链式节点
      console.log('🔓 链式查询失败，解锁所有链式节点:', chainNodes.map(node => node.id));
      chainNodes.forEach(node => {
        setNodeLocked(node.id, false);
      });
      
      setSnackbarMessage('链式查询失败: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);

      // 链式查询失败时，也直接移除临时节点
      setNodes(currentNodes => currentNodes.filter(node => node.id !== thinkingNodeId));
      setEdges(currentEdges => currentEdges.filter(edge => edge.target !== thinkingNodeId));
    }
  }, [isChainHighlighted, setNodeLocked, generateUniqueNodeId, callLLM, saveData, colors]);

  // ==================================================================
  // 节点创建和管理
  // ==================================================================

  // 创建新节点（重构为通用函数）
  const createNode = useCallback(async (content = null, position = null, extraData = {}, autoSave = true) => {
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
    
    const newNodeId = getNextNodeId();
    
    // 根据模式决定节点类型和数据
    let nodeType = 'custom';
    let nodeData = { 
      label: nodeContent,
      nodeIndex: nextNodeIndex, // 添加节点序号
      isCollapsed: false, // 默认不折叠
      onAskLLM: (...args) => handleAskLLMRef.current?.(...args), // 直接设置回调
      onChainedQuery: (...args) => handleChainedQueryRef.current?.(...args), // 添加链式查询回调
      onEdit: (...args) => handleNodeEditRef.current?.(...args), // 添加编辑回调
      onEditingStateChange: handleEditingStateChange, // 添加编辑状态变化回调
      onCollapseChange: handleCollapseChange, // 添加折叠状态变化回调
      ...extraData // 支持额外数据（如锁定状态）
    };
    
    if (isAnnotationMode) {
      nodeType = 'custom';
      nodeData = { 
        label: nodeContent,
        nodeType: 'annotation', // 设置为原始标注类型
        features: ['edit'], // 只包含编辑功能
        onEdit: (...args) => handleNodeEditRef.current?.(...args), // 添加编辑回调
        onEditingStateChange: handleEditingStateChange, // 添加编辑状态变化回调
        ...extraData 
      };
    }

    const newNode = {
      id: newNodeId,
      type: nodeType,
      position: nodePosition,
      data: nodeData
    };

    setNodes((nds) => [...nds, newNode]);
    setNextNodeIndex(prev => prev + 1); // 增加节点序号
    console.log('✨ 创建节点:', newNode);
    
    // 只有手动创建时才隐藏输入框和重置状态
    if (!content) {
      setIsInputVisible(false);
      setInputValue('');
      
      // 如果是思考模式，创建节点后自动调用LLM
      if (isThinkingMode) {
        console.log('🤔 思考模式：创建节点后自动调用LLM');
        console.log('🤔 节点ID:', newNodeId, '节点内容:', nodeContent);
        console.log('🤔 handleAskLLMRef.current 存在:', !!handleAskLLMRef.current);
        
        // 使用setTimeout确保节点状态更新完成后再调用LLM
        setTimeout(() => {
          console.log('🤔 延迟调用LLM，确保节点已创建');
          console.log('🤔 当前节点列表:', nodesRef.current.map(n => ({ id: n.id, label: n.data.label })));
          
          // 使用ref调用，避免循环依赖
          if (handleAskLLMRef.current) {
            console.log('🤔 开始调用handleAskLLM...');
            handleAskLLMRef.current(newNodeId, nodeContent);
            console.log('🤔 handleAskLLM调用完成');
          } else {
            console.error('❌ handleAskLLMRef.current 不存在！');
          }
        }, 100); // 100ms延迟确保状态更新
        
        setIsThinkingMode(false); // 重置思考模式
      }
      
      // 重置标注模式
      if (isAnnotationMode) {
        setIsAnnotationMode(false);
      }
    }
    
    // 根据autoSave参数决定是否自动保存
    if (autoSave) { // 移除!isThinkingMode条件，所有模式都保存
      try {
        console.log('📤 创建节点后自动保存');
        // 确保使用最新的节点状态进行保存
        const currentNodes = [...nodes, newNode];
        await saveData({ nodes: currentNodes, showNotification: false });
        console.log('✅ 节点创建后保存成功');
      } catch (error) {
        console.error('❌ 节点创建后保存失败:', error);
        setSnackbarMessage('节点已创建，但保存失败: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } else {
      console.log('⏭️ 跳过节点创建后的自动保存');
    }
    
    return newNodeId; // 返回新节点ID
  }, [inputValue, inputPosition, getNextNodeId, screenToFlowPosition, saveData, isThinkingMode, isAnnotationMode, nodes]);

  // 设置回调函数引用
  handleAskLLMRef.current = handleAskLLM;
  handleChainedQueryRef.current = handleChainedQuery;
  handleNodeEditRef.current = handleNodeEdit;

  // 使用useEffect确保ref在正确的时机被设置
  useEffect(() => {
    handleAskLLMRef.current = handleAskLLM;
    console.log('✅ handleAskLLMRef 已设置');
  }, [handleAskLLM]);

  useEffect(() => {
    handleChainedQueryRef.current = handleChainedQuery;
    console.log('✅ handleChainedQueryRef 已设置');
  }, [handleChainedQuery]);

  useEffect(() => {
    handleNodeEditRef.current = handleNodeEdit;
    console.log('✅ handleNodeEditRef 已设置');
  }, [handleNodeEdit]);

  // 数据加载函数
  const loadData = useCallback(async () => {
    if (isLoading) {
      console.log('正在加载中，跳过重复加载');
      return;
    }
    
    setIsLoading(true);
    console.log('📥 开始加载数据，用户:', username);
    
    try {
      const response = await fetch(`${API_BASE_URL}/load-data/${username}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 收到数据:', { 
        nodesCount: data.nodes?.length || 0, 
        edgesCount: data.edges?.length || 0 
      });
      
      if (data.nodes && data.nodes.length > 0) {
        // 为加载的节点添加回调函数和序号
        const nodesWithCallbacks = data.nodes.map((node, index) => {
          // 检查是否为原始标注节点（textBlock类型或包含annotation标识）
          const isAnnotation = node.type === 'textBlock' || node.data.nodeType === 'annotation';
          
          return {
          ...node,
            type: isAnnotation ? 'custom' : node.type, // 将textBlock转换为custom
          data: {
            ...node.data,
            nodeIndex: node.data.nodeIndex || (index + 1), // 保持原有序号或使用索引+1
              nodeType: isAnnotation ? 'annotation' : (node.data.nodeType || 'normal'), // 设置节点类型
              features: isAnnotation ? ['edit'] : (node.data.features || ['edit', 'ask_llm', 'chained_query']), // 设置功能
              isCollapsed: node.data.isCollapsed || false, // 保持折叠状态
              onAskLLM: isAnnotation ? undefined : ((...args) => handleAskLLMRef.current?.(...args)),
              onChainedQuery: isAnnotation ? undefined : ((...args) => handleChainedQueryRef.current?.(...args)),
                          onEdit: (...args) => handleNodeEditRef.current?.(...args),
            onEditingStateChange: handleEditingStateChange, // 添加编辑状态变化回调
            onCollapseChange: handleCollapseChange // 添加折叠状态变化回调
          }
        };
        });
        
        // 为加载的边添加默认样式和序号（如果缺失）
        const edgesWithStyles = (data.edges || []).map((edge, index) => ({
          ...edge,
          type: edge.type || 'custom', // 默认使用自定义边类型
          data: {
            ...edge.data,
            edgeIndex: edge.data?.edgeIndex || (index + 1) // 保持原有序号或使用索引+1
          },
          markerEnd: edge.markerEnd || {
            type: 'arrowclosed',
            color: colors.edge.default
          },
          style: edge.style || {
            stroke: colors.edge.default,
            strokeWidth: 2
          }
        }));
        
        setNodes(nodesWithCallbacks);
        setEdges(edgesWithStyles);
        setLastSaved(new Date(data.last_updated));
        setDataLoaded(true); // 标记数据已加载
        setHasLoadedUserData(true); // 标记已加载用户数据
        
        // 更新序号计数器
        const maxNodeIndex = Math.max(...nodesWithCallbacks.map(n => n.data.nodeIndex || 0), 0);
        const maxEdgeIndex = Math.max(...edgesWithStyles.map(e => e.data?.edgeIndex || 0), 0);
        setNextNodeIndex(maxNodeIndex + 1);
        setNextEdgeIndex(maxEdgeIndex + 1);
        
        setSnackbarMessage(`数据加载成功！用户: ${username}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        console.log('✅ 数据加载成功，节点数:', nodesWithCallbacks.length, '边数:', edgesWithStyles.length);
      } else {
        // 如果没有数据，标记为已加载但初始化为空
        setNodes([]);
        setEdges([]);
        setDataLoaded(true); // 标记数据已加载（即使是空数据）
        setHasLoadedUserData(false); // 没有加载到用户数据
        setSnackbarMessage(`欢迎新用户: ${username}`);
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        console.log('📝 新用户，初始化为空数据');
      }
      
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
      setSnackbarMessage('数据加载失败: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setDataLoaded(true); // 即使失败也标记为已尝试加载
      setHasLoadedUserData(false); // 标记没有加载到用户数据
    } finally {
      setIsLoading(false);
    }
  }, [username, isLoading]);

  // 初始化节点和边数据（仅在没有加载用户数据时使用）
  useEffect(() => {
    const initializeData = () => {
              const nodesWithCallbacks = initialNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onAskLLM: (...args) => handleAskLLMRef.current?.(...args),
            onChainedQuery: (...args) => handleChainedQueryRef.current?.(...args),
            onEdit: (...args) => handleNodeEditRef.current?.(...args)
          }
        }));
      setNodes(nodesWithCallbacks);
      setEdges(initialEdges); // 同时初始化边
      console.log('🎯 初始化默认数据:', { nodes: nodesWithCallbacks, edges: initialEdges });
    };
    
    // 只有在数据加载完成且没有加载到用户数据时才初始化默认数据
    console.log('🔍 初始化检查:', { dataLoaded, hasLoadedUserData, nodesLength: nodes.length, edgesLength: edges.length, isLoading });
    if (dataLoaded && !hasLoadedUserData && nodes.length === 0 && edges.length === 0 && !isLoading) {
      console.log('🚀 初始化默认数据（新用户）');
      initializeData();
    } else if (dataLoaded && hasLoadedUserData) {
      console.log('✅ 跳过初始化 - 已加载用户数据');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, hasLoadedUserData, nodes.length, edges.length, isLoading]);

  // 处理连接
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      type: 'custom', // 使用自定义边类型
      data: {
        edgeIndex: nextEdgeIndex // 添加边序号
      },
      markerEnd: {
        type: 'arrowclosed',
        color: colors.edge.default
      },
      style: {
        stroke: colors.edge.default,
        strokeWidth: 2
      }
    };
    setEdges((eds) => addEdge(newEdge, eds));
    setNextEdgeIndex(prev => prev + 1); // 增加边序号
  }, [setEdges, nextEdgeIndex]);

  // 处理右键点击空白区域显示菜单
  const handlePaneContextMenu = useCallback((event) => {
    console.log('右键点击事件触发', event.target.className); // 调试日志
    
    // 检查是否点击的是空白区域（pane）
    if (!event.target.classList.contains('react-flow__pane')) {
      console.log('不是空白区域，忽略');
      return;
    }
    
    // 阻止默认的右键菜单
    event.preventDefault();
    
    // 如果输入框当前可见，右键点击空白区域应该关闭输入框
    if (isInputVisible) {
      console.log('输入框可见，右键点击空白区域关闭输入框');
      setIsInputVisible(false);
      setInputValue('');
      return;
    }
    
    // 如果菜单当前可见，右键点击空白区域应该关闭菜单
    if (isMenuVisible) {
      console.log('菜单可见，右键点击空白区域关闭菜单');
      setIsMenuVisible(false);
      return;
    }
    
    // 显示菜单
    console.log('右键点击位置:', { x: event.clientX, y: event.clientY }); // 调试日志
    
    // 设置菜单位置为鼠标点击位置
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setIsMenuVisible(true);
  }, [isInputVisible, isMenuVisible]);

  // 处理左键点击空白区域
  const handlePaneClick = useCallback((event) => {
    console.log('左键点击事件触发', event.target.className); // 调试日志
    
    // 检查是否点击的是空白区域（pane）
    if (!event.target.classList.contains('react-flow__pane')) {
      console.log('不是空白区域，忽略');
      return;
    }
    
    // 如果输入框当前可见，左键点击空白区域应该关闭输入框
    if (isInputVisible) {
      console.log('输入框可见，左键点击空白区域关闭输入框');
      setIsInputVisible(false);
      setInputValue('');
      return;
    }
    
    // 如果菜单当前可见，左键点击空白区域应该关闭菜单
    if (isMenuVisible) {
      console.log('菜单可见，左键点击空白区域关闭菜单');
      setIsMenuVisible(false);
      return;
    }
    
    // 左键点击空白处的处理逻辑
    if (interactionMode === InteractionMode.BOX_SELECTING) {
      // 框选模式：退出框选，可无缝进入新框选
      console.log('🚪 框选模式下左键点击空白，退出框选模式');
      exitSelectionMode();
    } else if (interactionMode === InteractionMode.SELECTING) {
      // 选择模式：取消选择，可无缝进入框选
      console.log('🚪 选择模式下左键点击空白，取消选择');
      // 只清除选中状态，不重新设置整个 nodes 数组
      setSelectedNodes([]);
      setInteractionMode(InteractionMode.NORMAL);
    }
  }, [isInputVisible, isMenuVisible, interactionMode]);



  // 处理节点拖拽开始
  const handleNodeDragStart = useCallback((event, node) => {
    // 如果正在编辑，阻止拖拽
    if (isAnyNodeEditing) {
      console.log('🚫 编辑中，阻止节点拖拽');
      event.preventDefault();
      return;
    }
    
    console.log('🚀 节点拖拽开始:', node.id);
    setIsDraggingNode(true);
    setInteractionMode(InteractionMode.DRAGGING);
    
    // 检查当前是否在框选模式中
    const currentSelectionGroupIds = selectionGroupIds;
    const isInBoxSelectingMode = currentSelectionGroupIds.size > 0;
    
    console.log('🔍 拖拽开始检查:', {
      nodeId: node.id,
      isInBoxSelectingMode,
      selectionGroupIds: Array.from(currentSelectionGroupIds),
      isInGroup: currentSelectionGroupIds.has(node.id)
    });
    
    // 如果在框选模式中，确保拖拽的节点在选中组中
    if (isInBoxSelectingMode && !currentSelectionGroupIds.has(node.id)) {
      console.log('❌ 拖拽的节点不在选中组中');
      return;
    }
    
    // 如果不在框选模式中，且拖拽的节点不在选中组中，清除其他选择
    if (!isInBoxSelectingMode && !selectedNodes.some(selectedNode => selectedNode.id === node.id)) {
      // 只更新选中状态，不重新设置整个 nodes 数组
      setSelectedNodes([node]);
    }
  }, [selectedNodes, nodes, selectionGroupIds, isAnyNodeEditing]);

  // 处理节点拖拽
  const handleNodeDrag = useCallback((event, node, nodes) => {
    // 如果正在编辑，阻止拖拽
    if (isAnyNodeEditing) {
      console.log('🚫 编辑中，阻止节点拖拽');
      event.preventDefault();
      return;
    }
    
    // 检查当前是否在框选模式中
    const currentSelectionGroupIds = selectionGroupIds;
    const isInBoxSelectingMode = currentSelectionGroupIds.size > 0;
    
    console.log('🔍 拖拽中检查:', {
      nodeId: node.id,
      isInBoxSelectingMode,
      selectionGroupIds: Array.from(currentSelectionGroupIds),
      isInGroup: currentSelectionGroupIds.has(node.id)
    });
    
    // 如果在框选模式中，进行组拖拽
    if (isInBoxSelectingMode && currentSelectionGroupIds.has(node.id)) {
      console.log('🔄 组拖拽中，移动所有选中节点');
      
      // 获取拖拽前的节点位置（从ref中获取）
      const previousNodes = nodesRef.current;
      const previousNode = previousNodes.find(n => n.id === node.id);
      
      if (!previousNode) {
        console.log('❌ 找不到拖拽前的节点位置');
        return;
      }
      
      // 计算拖拽的偏移量（当前拖拽位置 - 拖拽前位置）
      const deltaX = node.position.x - previousNode.position.x;
      const deltaY = node.position.y - previousNode.position.y;
      
      console.log('🔄 拖拽偏移量:', { deltaX, deltaY });
      console.log('🔄 拖拽前位置:', previousNode.position);
      console.log('🔄 拖拽后位置:', node.position);
      
      // 如果偏移量太小，忽略
      if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
        return;
      }
      
      // 移动所有选中的节点
      const updatedNodes = previousNodes.map(n => {
        if (currentSelectionGroupIds.has(n.id)) {
          const newPosition = {
            x: n.position.x + deltaX,
            y: n.position.y + deltaY
          };
          console.log(`🔄 移动节点 ${n.id}:`, { from: n.position, to: newPosition });
          return {
            ...n,
            position: newPosition
          };
        }
        return n;
      });
      
      console.log('🔄 更新后节点数:', updatedNodes.length);
      
      // 更新节点状态
      setNodes(updatedNodes);
      
      return;
    }
    
    // 如果不在框选模式中，且只有一个节点被选中，使用ReactFlow的默认拖拽
    if (!isInBoxSelectingMode && selectedNodes.length <= 1) {
      return;
    }
    
    // 普通的多选拖拽：移动所有选中的节点
    const previousNodes = nodesRef.current;
    const previousNode = previousNodes.find(n => n.id === node.id);
    
    if (!previousNode) return;
    
    // 计算拖拽的偏移量
    const deltaX = node.position.x - previousNode.position.x;
    const deltaY = node.position.y - previousNode.position.y;
    
    // 移动所有选中的节点
    const updatedNodes = previousNodes.map(n => {
      if (selectedNodes.some(selectedNode => selectedNode.id === n.id)) {
        return {
          ...n,
          position: {
            x: n.position.x + deltaX,
            y: n.position.y + deltaY
          }
        };
      }
      return n;
    });
    
    setNodes(updatedNodes);
  }, [selectedNodes, selectionGroupIds, isAnyNodeEditing]);

  // 处理节点拖拽结束
  const handleNodeDragStop = useCallback(async (event, node) => {
    // 如果正在编辑，阻止拖拽
    if (isAnyNodeEditing) {
      console.log('🚫 编辑中，阻止节点拖拽结束');
      event.preventDefault();
      return;
    }
    
    console.log('🛑 节点拖拽结束:', node.id);
    setIsDraggingNode(false);
    
    // 检查当前是否在框选模式中
    const currentSelectionGroupIds = selectionGroupIds;
    const isInBoxSelectingMode = currentSelectionGroupIds.size > 0;
    
    console.log('🔍 拖拽结束检查:', {
      nodeId: node.id,
      isInBoxSelectingMode,
      selectionGroupIds: Array.from(currentSelectionGroupIds),
      isInGroup: currentSelectionGroupIds.has(node.id)
    });
    
    // 如果是从框选模式拖拽，保持框选模式，不保存
    if (isInBoxSelectingMode && currentSelectionGroupIds.has(node.id)) {
      setInteractionMode(InteractionMode.BOX_SELECTING);
      console.log('🔄 保持框选模式，不保存');
      return;
    }
    
    // 只有在非框选模式下才保存
    if (!isInBoxSelectingMode) {
      // 自动保存拖拽后的布局
      try {
        console.log('💾 保存单独节点拖拽后的布局数据');
        await saveData({ showNotification: false });
        console.log('✅ 单独节点拖拽后布局保存成功');
        
        setSnackbarMessage('节点位置已保存！');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
      } catch (error) {
        console.error('❌ 单独节点拖拽后布局保存失败:', error);
        setSnackbarMessage('位置保存失败: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
    
    // 不改变交互模式，保持当前状态
    console.log('✅ 单独节点拖拽完成，保持当前交互模式');
  }, [selectionGroupIds, username, saveData, isAnyNodeEditing]);

  // 批量移动选中的节点
  const moveSelectedNodes = useCallback((deltaX, deltaY) => {
    if (selectedNodes.length === 0) return;
    
    setNodes(nds => nds.map(node => {
      if (selectedNodes.some(selectedNode => selectedNode.id === node.id)) {
        return {
          ...node,
          position: {
            x: node.position.x + deltaX,
            y: node.position.y + deltaY
          }
        };
      }
      return node;
    }));
  }, [selectedNodes]);

  // 批量询问LLM回调（预留）
  const handleBatchAskLLM = useCallback((nodeIds) => {
    console.log('批量询问LLM:', nodeIds);
    // TODO: 实现批量询问LLM的逻辑
  }, []);

  // 批量编组回调（预留）
  const handleBatchGroup = useCallback((nodeIds) => {
    console.log('批量编组:', nodeIds);
    // TODO: 实现批量编组的逻辑
  }, []);

  // 退出框选模式
  const exitSelectionMode = useCallback(async () => {
    console.log('🚪 退出框选模式');
    
    // 获取最新的节点状态（从ref中获取）
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    
    // 清除所有节点的选中状态后再保存
    const nodesToSave = currentNodes.map(node => ({
      ...node,
      selected: false
    }));
    
    console.log('💾 准备保存的节点数据（已清除选中状态）:', nodesToSave.map(n => ({ id: n.id, position: n.position })));
    
    // 保存当前布局到后端
    try {
      console.log('💾 保存框选后的布局数据');
      await saveData({ showNotification: false });
      console.log('✅ 框选后布局保存成功');
      
      setSnackbarMessage('布局已保存！');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
    } catch (error) {
      console.error('❌ 框选后布局保存失败:', error);
      setSnackbarMessage('布局保存失败: ' + error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    
    // 更新状态
    setInteractionMode(InteractionMode.NORMAL);
    setSelectionGroupIds(new Set());
    setBoxSelectedNodes(new Set());
    
    // 清除所有节点的选中状态
    setNodes(nds => nds.map(node => ({
      ...node,
      selected: false
    })));
    setSelectedNodes([]);
  }, [username, saveData]);

  // 处理选择变化（节点和边）
  const handleSelectionChange = useCallback((params) => {
    console.log('选择变化:', params); // 调试日志
    
    // 只有在真正的框选模式中才阻止选择变化
    if (interactionMode === InteractionMode.BOX_SELECTING && selectionGroupIds.size > 0) {
      console.log('🔒 框选模式中，保持当前选中状态');
      return;
    }
    
    setSelectedNodes(params.nodes);
    setSelectedEdges(params.edges);
  }, [interactionMode, selectionGroupIds]);

  // 调试函数：检查节点选中状态
  const debugNodeSelection = useCallback(() => {
    console.log('🔍 调试节点选中状态:');
    console.log('📦 当前节点数组:', nodes.map(n => ({ id: n.id, selected: n.selected })));
    console.log('📦 选中节点数组:', selectedNodes.map(n => n.id));
    console.log('📦 框选组:', Array.from(selectionGroupIds));
    console.log('📦 交互模式:', interactionMode);
    
    // 检查React Flow是否正确渲染选中状态
    const selectedNodesInDOM = document.querySelectorAll('.react-flow__node.selected');
    console.log('🔍 DOM中选中的节点:', Array.from(selectedNodesInDOM).map(el => el.getAttribute('data-id')));
  }, [nodes, selectedNodes, selectionGroupIds, interactionMode]);

  // 取消创建
  const cancelCreate = useCallback(() => {
    setIsInputVisible(false);
    setInputValue('');
    setIsThinkingMode(false); // 重置思考模式
    setIsAnnotationMode(false); // 重置标注模式
  }, []);

  // 菜单处理函数
  const handleAddNote = useCallback(() => {
    console.log('📝 选择添加普通笔记');
    setIsThinkingMode(false);
    setInputPosition({ x: menuPosition.x, y: menuPosition.y });
    setIsInputVisible(true);
    setInputValue('');
  }, [menuPosition]);

  const handleAddThinkingNote = useCallback(() => {
    console.log('🤔 选择添加思考笔记');
    console.log('🤔 当前handleAskLLMRef状态:', !!handleAskLLMRef.current);
    setIsThinkingMode(true);
    setInputPosition({ x: menuPosition.x, y: menuPosition.y });
    setIsInputVisible(true);
    setInputValue('');
  }, [menuPosition]);

  const handleAddAnnotation = useCallback(() => {
    console.log('📝 选择添加原始标注');
    setIsThinkingMode(false);
    setIsAnnotationMode(true);
    setInputPosition({ x: menuPosition.x, y: menuPosition.y });
    setIsInputVisible(true);
    setInputValue('');
  }, [menuPosition]);

  const handleCloseMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback(async (event) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      // Ctrl+Enter 创建节点
      event.preventDefault();
      await createNode();
      // console.log('🎯 手动创建节点完成:', nodeId);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelCreate();
    }
    // 单独的 Enter 键允许换行（不阻止默认行为）
  }, [createNode, cancelCreate]);

  // 删除选中的节点
  const deleteSelectedNodes = useCallback(async () => {
    if (selectedNodes.length > 0) {
      console.log('🗑️ 开始删除节点流程，选中节点数:', selectedNodes.length);
      
      // 检查是否有锁定的节点
      const lockedNodeIds = selectedNodes
        .filter(node => node.data.isLocked)
        .map(node => node.id);
      
      if (lockedNodeIds.length > 0) {
        console.log('❌ 有锁定的节点，无法删除:', lockedNodeIds);
        setSnackbarMessage(`无法删除锁定的节点: ${lockedNodeIds.join(', ')}`);
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      
      // 预先计算删除后的数据
      const selectedNodeIds = selectedNodes.map(node => node.id);
      console.log('🗑️ 准备删除节点:', selectedNodeIds);
      
      // 使用 setNodes 的 callback 方式确保数据一致性
      setNodes(nds => {
        const filteredNodes = nds.filter((node) => !selectedNodeIds.includes(node.id));
        console.log('🗑️ 删除后预计剩余节点数:', filteredNodes.length);
        return filteredNodes;
      });
      
      setEdges(eds => {
        const filteredEdges = eds.filter((edge) => 
          !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
        );
        console.log('🗑️ 删除后预计剩余边数:', filteredEdges.length);
        return filteredEdges;
      });
      
      setSelectedNodes([]);
      
      console.log('✅ 节点删除完成，准备保存');
      
      // 保存更新后的数据
      const saveDeletedData = async () => {
        try {
          console.log('📤 删除节点后自动保存');
          await saveData({ showNotification: false });
          console.log('✅ 删除节点后保存成功');
          
          setSnackbarMessage('节点删除并保存成功！');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          
        } catch (error) {
          console.error('❌ 删除节点后保存失败:', error);
          setSnackbarMessage('删除成功但保存失败: ' + error.message);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      };
      
      // 延迟保存确保状态更新完成
      await saveDeletedData();
      
    } else {
      console.log('🗑️ 没有选中的节点，跳过删除');
    }
  }, [selectedNodes, username, nodes, edges, saveData]);

  // 删除选中的边
  const deleteSelectedEdges = useCallback(async () => {
    if (selectedEdges.length > 0) {
      const selectedEdgeIds = selectedEdges.map(edge => edge.id);
      
      // 删除选中的边
      setEdges((eds) => eds.filter((edge) => !selectedEdgeIds.includes(edge.id)));
      
      setSelectedEdges([]);
      console.log('删除边:', selectedEdgeIds); // 调试日志
      
      setSnackbarMessage(`已删除 ${selectedEdgeIds.length} 条连线`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // 删除边后立即保存
      try {
        console.log('📤 删除边后自动保存');
        await saveData({ showNotification: false });
        console.log('✅ 删除边后保存成功');
      } catch (error) {
        console.error('❌ 删除边后保存失败:', error);
        setSnackbarMessage('删除成功但保存失败: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } else {
      console.log('🗑️ 没有选中的边，跳过删除');
    }
  }, [selectedEdges, saveData]);

  // 键盘事件监听器
  useEffect(() => {
    const handleGlobalKeyDown = async (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // 优先删除选中的节点，如果没有选中节点则删除选中的边
        if (nodesRef.current.some(n => n.selected)) {
          await deleteSelectedNodes();
        } else if (edgesRef.current.some(e => e.selected)) {
          await deleteSelectedEdges();
        }
      }
      
      // Ctrl+S 保存快捷键
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // 阻止默认的保存网页行为
        await saveData();
      }
      
      // 箭头键移动选中的节点
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) && selectedNodes.length > 0 && !isAnyNodeEditing) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1; // Shift+箭头键移动10像素，普通箭头键移动1像素
        
        let deltaX = 0;
        let deltaY = 0;
        
        switch (event.key) {
          case 'ArrowUp':
            deltaY = -step;
            break;
          case 'ArrowDown':
            deltaY = step;
            break;
          case 'ArrowLeft':
            deltaX = -step;
            break;
          case 'ArrowRight':
            deltaX = step;
            break;
        }
        
        moveSelectedNodes(deltaX, deltaY);
      }
      
      // Esc键清除链式高亮
      if (event.key === 'Escape' && isChainHighlighted) {
        console.log('🧹 按Esc键清除链式高亮');
        const { nodes: clearedNodes, edges: clearedEdges } = clearChainHighlight(nodesRef.current, edgesRef.current, colors);
        setNodes(clearedNodes);
        setEdges(clearedEdges);
        setIsChainHighlighted(false);
        setCurrentChainData(null);
        setSnackbarMessage('已清除链式高亮');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [deleteSelectedNodes, deleteSelectedEdges, saveData, isChainHighlighted, colors, isAnyNodeEditing]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // 全局鼠标事件监听器，用于框选
  useEffect(() => {
    const handleGlobalMouseDown = (event) => {
      // 检查是否点击的是ReactFlow的pane
      const reactFlowPane = event.target.closest('.react-flow__pane');
      if (!reactFlowPane) {
        return;
      }
      
      // 如果输入框或菜单可见，不处理鼠标事件
      if (isInputVisible || isMenuVisible) {
        return;
      }
      
      // 如果点击的是节点
      const clickedNode = event.target.closest('.react-flow__node');
      if (clickedNode) {
        const nodeId = clickedNode.getAttribute('data-id');
        
        // 根据当前交互模式处理节点点击
        if (interactionMode === InteractionMode.BOX_SELECTING) {
          // 框选模式：点击组外节点退出框选并选中该节点
          if (!selectionGroupIds.has(nodeId)) {
            console.log('🚪 点击组外节点，退出框选模式并选中该节点');
            exitSelectionMode();
            // 选中点击的节点
            setNodes(nds => nds.map(node => ({
              ...node,
              selected: node.id === nodeId
            })));
            setSelectedNodes(nodes.filter(node => node.id === nodeId));
            setInteractionMode(InteractionMode.SELECTING);
          }
        } else if (interactionMode === InteractionMode.SELECTING) {
          // 选择模式：点击其他节点切换选择
          setNodes(nds => nds.map(node => ({
            ...node,
            selected: node.id === nodeId
          })));
          setSelectedNodes(nodes.filter(node => node.id === nodeId));
        } else {
          // 正常模式：选中节点
          setNodes(nds => nds.map(node => ({
            ...node,
            selected: node.id === nodeId
          })));
          setSelectedNodes(nodes.filter(node => node.id === nodeId));
          setInteractionMode(InteractionMode.SELECTING);
        }
        return;
      }
      
      // 点击空白处
      if (interactionMode === InteractionMode.BOX_SELECTING) {
        // 框选模式：退出框选，可无缝进入新框选
        console.log('🚪 框选模式下点击空白，退出框选模式');
        exitSelectionMode();
      } else if (interactionMode === InteractionMode.SELECTING) {
        // 选择模式：取消选择，可无缝进入框选
        console.log('🚪 选择模式下点击空白，取消选择');
        setNodes(nds => nds.map(node => ({
          ...node,
          selected: false
        })));
        setSelectedNodes([]);
        setInteractionMode(InteractionMode.NORMAL);
      }
      
      // 开始框选（无论之前是什么状态）
      console.log('✅ 开始框选');
      setIsSelecting(true);
      setSelectionStart({ x: event.clientX, y: event.clientY });
      setSelectionEnd({ x: event.clientX, y: event.clientY });
    };

    const handleGlobalMouseMove = (event) => {
      if (!isSelecting) {
        return;
      }
      
      console.log('🖱️ 全局鼠标移动，更新框选');
      setSelectionEnd({ x: event.clientX, y: event.clientY });
    };

    const handleGlobalMouseUp = (event) => {
      if (!isSelecting) {
        return;
      }
      
      console.log('🛑 全局鼠标释放，结束框选');
      setIsSelecting(false);
      
      // 计算框选区域
      const startX = Math.min(selectionStart.x, selectionEnd.x);
      const endX = Math.max(selectionStart.x, selectionEnd.x);
      const startY = Math.min(selectionStart.y, selectionEnd.y);
      const endY = Math.max(selectionStart.y, selectionEnd.y);
      
      // 如果框选区域太小，认为是点击而不是框选
      if (Math.abs(endX - startX) < 5 && Math.abs(endY - startY) < 5) {
        setSelectionStart(null);
        setSelectionEnd(null);
        return;
      }
      
      // 获取ReactFlow容器
      const reactFlowContainer = document.querySelector('.react-flow');
      if (!reactFlowContainer) {
        setSelectionStart(null);
        setSelectionEnd(null);
        return;
      }
      
      // 使用ReactFlow的API获取viewport信息
      const viewport = getViewport();
      console.log('🔍 ReactFlow Viewport:', viewport);
      
      // 使用ReactFlow的API转换坐标
      const flowStart = screenToFlowPosition({ x: startX, y: startY });
      const flowEnd = screenToFlowPosition({ x: endX, y: endY });
      
      const flowStartX = flowStart.x;
      const flowStartY = flowStart.y;
      const flowEndX = flowEnd.x;
      const flowEndY = flowEnd.y;
      
      console.log('🔍 坐标转换结果:', {
        screenStart: { x: startX, y: startY },
        screenEnd: { x: endX, y: endY },
        flowStart: { x: flowStartX, y: flowStartY },
        flowEnd: { x: flowEndX, y: flowEndY }
      });
      
      // 确保框选区域是有效的
      const flowWidth = Math.abs(flowEndX - flowStartX);
      const flowHeight = Math.abs(flowEndY - flowStartY);
      
      console.log('🔍 框选区域尺寸:', { flowWidth, flowHeight });
      
      console.log('🔍 框选区域:', {
        screen: { startX, endX, startY, endY },
        flow: { flowStartX, flowEndX, flowStartY, flowEndY }
      });
      
      // 添加更详细的调试信息
      console.log('🔍 框选区域详情:', {
        screenStart: { x: startX, y: startY },
        screenEnd: { x: endX, y: endY },
        flowStart: { x: flowStartX, y: flowStartY },
        flowEnd: { x: flowEndX, y: flowEndY },
        screenWidth: endX - startX,
        screenHeight: endY - startY,
        flowWidth: flowEndX - flowStartX,
        flowHeight: flowEndY - flowStartY
      });
      
      // 选择框选区域内的节点
      const currentNodes = nodesRef.current;
      console.log('🔍 当前所有节点:', currentNodes.map(n => ({ id: n.id, position: n.position })));
      
      const selectedNodeIds = currentNodes.filter(node => {
        const nodeX = node.position.x;
        const nodeY = node.position.y;
        const nodeWidth = 120; // 假设节点宽度
        const nodeHeight = 60; // 假设节点高度
        
        const isInSelection = (
          nodeX + nodeWidth >= flowStartX &&
          nodeX <= flowEndX &&
          nodeY + nodeHeight >= flowStartY &&
          nodeY <= flowEndY
        );
        
        console.log(`🔍 节点 ${node.id}:`, {
          position: { x: nodeX, y: nodeY },
          size: { width: nodeWidth, height: nodeHeight },
          bounds: {
            left: nodeX,
            right: nodeX + nodeWidth,
            top: nodeY,
            bottom: nodeY + nodeHeight
          },
          selection: { flowStartX, flowEndX, flowStartY, flowEndY },
          isInSelection,
          // 添加详细的碰撞检测信息
          collision: {
            horizontal: nodeX + nodeWidth >= flowStartX && nodeX <= flowEndX,
            vertical: nodeY + nodeHeight >= flowStartY && nodeY <= flowEndY,
            leftCheck: nodeX + nodeWidth >= flowStartX,
            rightCheck: nodeX <= flowEndX,
            topCheck: nodeY + nodeHeight >= flowStartY,
            bottomCheck: nodeY <= flowEndY
          }
        });
        
        return isInSelection;
      }).map(node => node.id);
      
      console.log('📦 框选结果:', selectedNodeIds);
      console.log('📦 节点总数:', nodes.length);
      
      // 更新选中状态
      const updatedNodes = currentNodes.map(node => ({
        ...node,
        selected: selectedNodeIds.includes(node.id)
      }));
      
      console.log('📦 更新节点状态:', updatedNodes.map(n => ({ id: n.id, selected: n.selected })));
      
      // 强制更新节点状态
      setNodes(nds => nds.map(node => ({
        ...node,
        selected: selectedNodeIds.includes(node.id)
      })));
      const selectedNodesArray = currentNodes.filter(node => selectedNodeIds.includes(node.id));
      setSelectedNodes(selectedNodesArray);
      
      console.log('📦 设置选中节点:', selectedNodesArray.map(n => n.id));
      
      // 确保React Flow能正确渲染选中状态
      setTimeout(() => {
        console.log('🔍 延迟检查节点状态:', updatedNodes.map(n => ({ id: n.id, selected: n.selected })));
        
        // 强制重新渲染选中状态
        setNodes(nds => nds.map(node => ({
          ...node,
          selected: selectedNodeIds.includes(node.id)
        })));
      }, 100);
      
      // 如果框选到了节点，进入框选模式
      if (selectedNodeIds.length > 0) {
        setInteractionMode(InteractionMode.BOX_SELECTING);
        setSelectionGroupIds(new Set(selectedNodeIds));
        setBoxSelectedNodes(new Set(selectedNodeIds));
        setSnackbarMessage(`框选成功！选中了 ${selectedNodeIds.length} 个节点，进入组移动模式`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // 调试：检查节点状态
        setTimeout(() => {
          debugNodeSelection();
        }, 100);
      }
      
      // 清除框选状态
      setSelectionStart(null);
      setSelectionEnd(null);
    };

    document.addEventListener('mousedown', handleGlobalMouseDown);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleGlobalMouseDown);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isSelecting, selectionStart, selectionEnd, isInputVisible, isMenuVisible]);

  // 初始化数据加载
  useEffect(() => {
    console.log('🔄 初始化数据加载效果触发，用户:', username, '已初始化:', hasInitializedRef.current);
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      console.log('🚀 开始初始化数据加载');
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
      {NodeGlobalStyles}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}

        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onSelectionChange={handleSelectionChange}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        panOnDrag={[2]} // 只有右键（按钮2）可以平移
        panOnScroll={false}
        zoomOnDoubleClick={false}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        selectNodesOnDrag={false} // 拖拽时不选中节点
        elementsSelectable={true} // 启用元素选择，允许选中连线
        nodesConnectable={true}
        nodesDraggable={!isAnyNodeEditing} // 编辑时禁用节点拖拽
        multiSelectionKeyCode={null} // 禁用多选快捷键
        deleteKeyCode={null} // 禁用删除快捷键，我们自定义处理
        preventScrolling={!isAnyNodeEditing} // 编辑时允许滚动
        style={{ 
          cursor: 'default',
          width: '100%',
          height: '100%'
        }}
      >
        <Background color={canvasColors.background} gap={canvasColors.grid} />
        <Controls />
      </ReactFlow>

      {/* 框选组件 */}
      <SelectionBox
        startPoint={selectionStart}
        endPoint={selectionEnd}
        isVisible={isSelecting}
      />

      {/* 双击菜单 */}
      {isMenuVisible && (
        <Menu
          position={menuPosition}
          onAddNote={handleAddNote}
          onAddThinkingNote={handleAddThinkingNote}
          onAddAnnotation={handleAddAnnotation}
          onClose={handleCloseMenu}
        />
      )}

      {/* 浮动输入框 */}
      {isInputVisible && (
        <FloatingPanel position={inputPosition}>
          <TextField
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isThinkingMode ? "输入思考内容（将自动生成LLM分析）..." : 
              isAnnotationMode ? "输入原始标注内容..." : 
              "输入节点内容..."
            }
            variant="outlined"
            size="small"
            autoComplete="off"
            autoFocus={true}
            multiline
            maxRows={8}
            sx={{
              minWidth: '250px',
              maxWidth: '400px',
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
                fontSize: fonts.components.input.fontSize,
                fontWeight: fonts.components.input.fontWeight,
                lineHeight: fonts.components.input.lineHeight,
                fontFamily: fonts.components.input.fontFamily,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <RoundIconButton
                    onClick={async () => {
                      // 确保createNode是异步的
                      await createNode();
                    }}
                    size="small"
                    color={
                      isThinkingMode ? "secondary" : 
                      isAnnotationMode ? "warning" : 
                      "primary"
                    }
                  >
                    <EnterIcon fontSize="small" />
                  </RoundIconButton>
                </InputAdornment>
              ),
            }}
          />
        </FloatingPanel>
      )}

      {/* 信息面板 */}
      <InfoPanel
        title="操作说明"
        icon={<InfoIcon />}
        items={[
          "• 右键点击空白区域弹出创建菜单",
          "• 选择'添加笔记'创建普通节点",
          "• 选择'添加思考笔记'创建节点并自动生成LLM分析",
          "• 选择'添加原始标注'创建半透明节点（仅支持编辑功能）",
          "• 输入内容后按Ctrl+Enter或点击按钮创建节点",
          "• 单独按Enter键可换行，按Esc键或点击空白区域取消输入",
          "• 右键点击节点选择'编辑'修改节点内容",
          "• 编辑时按Ctrl+Enter确认，按Esc或点击空白处取消",
          "• 右键点击节点询问LLM，立即生成'Thinking'节点",
          "• 右键点击节点选择'链式查询'，追踪整个思维链路",
          "• 按Esc键清除链式高亮",
          "• 拖拽节点右侧圆点连接到其他节点",
          "• 左键拖拽移动节点，右键拖拽平移画布",
          "• 点击空白处拖拽进行框选，点击节点拖拽移动节点",
          "• 框选后进入组移动模式，拖拽组内任意节点移动整个组",
          "• 组移动模式下点击空白处或非组节点退出模式",
          "• 选中节点后可用箭头键移动，Shift+箭头键快速移动",
          "• 选中节点后按Delete键删除（锁定节点不可删除）",
          "• 点击连线按Delete键删除连线",
          { text: "• Ctrl+S 手动保存数据", color: colors.primary.main },
          { text: "• 创建/删除/编辑节点时自动保存", color: colors.success.main },
          { text: "• 橙色边框表示节点已锁定，正在处理中", color: colors.warning.main },
          { text: "• 玫红色背景表示节点正在编辑中", color: colors.node.editing }
        ]}
      />

      {/* 用户状态面板 */}
      <StatusPanel
        title="用户状态"
        icon={<PsychologyIcon />}
        status={{
          "用户": username,
          "节点数": nodes.length,
          "连接数": edges.length,
          "选中节点": selectedNodes.length,
          "选中连线": selectedEdges.length,
          "状态": isSaving ? '正在保存...' : 
                   isLoading ? '正在加载...' : 
                   lastSaved ? `上次保存: ${lastSaved.toLocaleTimeString()}` : '未保存'
        }}
      />

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
