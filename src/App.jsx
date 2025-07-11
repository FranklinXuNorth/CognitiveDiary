import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  NodeGlobalStyles 
} from './assets/components/CustomNode';
import Menu from './assets/components/Menu';
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
  const { screenToFlowPosition } = useReactFlow();
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
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  
  // 节点锁定状态管理
  const [lockedNodes, setLockedNodes] = useState(new Set());
  
  // 链式查询状态管理
  const [isChainHighlighted, setIsChainHighlighted] = useState(false);
  const [currentChainData, setCurrentChainData] = useState(null);
  
  // 自定义双击检测
  const clickTimeoutRef = useRef(null);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  
  // handleAskLLM函数引用，避免循环依赖
  const handleAskLLMRef = useRef(null);
  
  // handleChainedQuery函数引用，避免循环依赖
  const handleChainedQueryRef = useRef(null);
  
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
    
    const nodesToSave = nodesToSaveParam || nodesRef.current;
    const edgesToSave = edgesToSaveParam || edgesRef.current;


    console.log('📤 开始保存数据:', { 
      username, 
      nodesCount: nodesToSave.length, 
      edgesCount: edgesToSave.length,
      showNotification
    });
    
    try {
      const requestData = {
        username: username,
        nodes: nodesToSave,
        edges: edgesToSave
      };
      
      console.log('📡 发送保存请求到后端...', requestData);
      
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
  }, [username, isSaving]);

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
        isLocked: true,
        onAskLLM: (...args) => handleAskLLMRef.current?.(...args)
      }
    };
    
    const newEdge = {
      id: `llm-${sourceNodeId}-${thinkingNodeId}`,
      source: sourceNodeId,
      target: thinkingNodeId,
      type: 'smoothstep',
      markerEnd: { 
        type: 'arrowclosed', 
        color: colors.edge.default 
      },
      style: { 
        stroke: colors.edge.default, 
        strokeWidth: 2 
      }
    };
    
    // 3. 在本地状态中添加 thinking 节点和边（不保存）
    setNodes(currentNodes => [...currentNodes, thinkingNode]);
    setEdges(currentEdges => {
      const edgeExists = currentEdges.some(edge => edge.id === newEdge.id);
      if (edgeExists) {
        return currentEdges;
      }
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

      // 6. 使用最新状态更新UI
      setNodes(finalNodes);

      setSnackbarMessage('LLM分析完成！');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // 7. 此时执行唯一的一次保存，并传入最新的节点状态
      try {
        console.log('📤 LLM成功后，执行最终保存');
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
    
    // 锁定源节点
    setNodeLocked(sourceNodeId, true);
    
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
        onAskLLM: (...args) => handleAskLLMRef.current?.(...args),
        onChainedQuery: (...args) => handleChainedQueryRef.current?.(...args),
        isLocked: true
      }
    };
    
    // 创建连接边
    const newEdge = {
      id: `chain-${sourceNodeId}-${thinkingNodeId}`,
      source: sourceNodeId,
      target: thinkingNodeId,
      type: 'smoothstep',
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
    
    // 更新边列表 - 添加重复检查
    setEdges(currentEdges => {
      // 检查边缘是否已经存在
      const edgeExists = currentEdges.some(edge => edge.id === newEdge.id);
      if (edgeExists) {
        console.log('⚠️ 链式查询 - 边缘已存在，跳过添加:', newEdge.id);
        return currentEdges; // 返回原数组，不添加重复边缘
      }
      
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
        if (node.id === sourceNodeId) {
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
      
      // 解锁源节点
      setNodeLocked(sourceNodeId, false);
      
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
      onAskLLM: (...args) => handleAskLLMRef.current?.(...args), // 直接设置回调
      onChainedQuery: (...args) => handleChainedQueryRef.current?.(...args), // 添加链式查询回调
      ...extraData // 支持额外数据（如锁定状态）
    };
    
    if (isAnnotationMode) {
      nodeType = 'textBlock';
      nodeData = { 
        label: nodeContent,
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
    console.log('✨ 创建节点:', newNode);
    
    // 只有手动创建时才隐藏输入框和重置状态
    if (!content) {
      setIsInputVisible(false);
      setInputValue('');
      
      // 如果是思考模式，创建节点后自动调用LLM
      if (isThinkingMode) {
        console.log('🤔 思考模式：创建节点后自动调用LLM');
        // 不再使用setTimeout，直接调用
        handleAskLLM(newNodeId, nodeContent);
        setIsThinkingMode(false); // 重置思考模式
      }
      
      // 重置标注模式
      if (isAnnotationMode) {
        setIsAnnotationMode(false);
      }
    }
    
    // 根据autoSave参数决定是否自动保存
    if (autoSave && !isThinkingMode) { // 思考模式在handleAskLLM中保存
      try {
        console.log('📤 创建节点后自动保存');
        await saveData({ showNotification: false });
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
  }, [inputValue, inputPosition, getNextNodeId, screenToFlowPosition, saveData, isThinkingMode, isAnnotationMode, handleAskLLM]);

  // 设置回调函数引用
  handleAskLLMRef.current = handleAskLLM;
  handleChainedQueryRef.current = handleChainedQuery;

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
        // 为加载的节点添加回调函数
        const nodesWithCallbacks = data.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onAskLLM: (...args) => handleAskLLMRef.current?.(...args),
            onChainedQuery: (...args) => handleChainedQueryRef.current?.(...args)
          }
        }));
        
        // 为加载的边添加默认样式（如果缺失）
        const edgesWithStyles = (data.edges || []).map(edge => ({
          ...edge,
          type: edge.type || 'smoothstep',
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
          onChainedQuery: (...args) => handleChainedQueryRef.current?.(...args)
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
      type: 'smoothstep',
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
    
    // 如果菜单当前可见，单击空白区域应该关闭菜单
    if (isMenuVisible) {
      console.log('菜单可见，点击空白区域关闭菜单');
      setIsMenuVisible(false);
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
      
      // 显示菜单而不是直接显示输入框
      console.log('双击位置:', { x: event.clientX, y: event.clientY }); // 调试日志
      
      // 设置菜单位置为鼠标点击位置
      setMenuPosition({ x: event.clientX, y: event.clientY });
      setIsMenuVisible(true);
      
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
  }, [screenToFlowPosition, isInputVisible, isMenuVisible]);

  // 处理选择变化（节点和边）
  const handleSelectionChange = useCallback((params) => {
    console.log('选择变化:', params); // 调试日志
    setSelectedNodes(params.nodes);
    setSelectedEdges(params.edges);
  }, []);

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
      
      const selectedNodeIds = selectedNodes.map(node => node.id);
      console.log('🗑️ 准备删除节点:', selectedNodeIds);
      
      // 预先计算删除后的数据
      const currentNodes = nodes;
      const currentEdges = edges;
      
      const filteredNodes = currentNodes.filter((node) => !selectedNodeIds.includes(node.id));
      const filteredEdges = currentEdges.filter((edge) => 
        !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      );
      
      console.log('🗑️ 删除后预计剩余节点数:', filteredNodes.length);
      console.log('🗑️ 删除后预计剩余边数:', filteredEdges.length);
      
      // 更新状态
      setNodes(filteredNodes);
      setEdges(filteredEdges);
      setSelectedNodes([]);
      
      console.log('✅ 节点删除完成，准备保存');
      
      // 保存更新后的数据
      const saveDeletedData = async () => {
        try {
          console.log('📡 准备保存删除后的数据:', {
            username: username,
            nodesCount: filteredNodes.length,
            edgesCount: filteredEdges.length
          });
          
          const response = await fetch(`${API_BASE_URL}/save-data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username,
              nodes: filteredNodes,
              edges: filteredEdges
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          const data = await response.json();
          setLastSaved(new Date());
          console.log('✅ 删除节点后保存成功:', data);
          
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
      setTimeout(saveDeletedData, 100);
      
    } else {
      console.log('🗑️ 没有选中的节点，跳过删除');
    }
  }, [selectedNodes, username, nodes, edges]);

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
        setSnackbarMessage('连线已删除，但保存失败: ' + error.message);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
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
  }, [deleteSelectedNodes, deleteSelectedEdges, saveData, isChainHighlighted, colors]);

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
        <Background color={canvasColors.background} gap={canvasColors.grid} />
        <Controls />
      </ReactFlow>

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
          "• 双击空白区域弹出创建菜单",
          "• 选择'添加笔记'创建普通节点",
          "• 选择'添加思考笔记'创建节点并自动生成LLM分析",
          "• 选择'添加原始标注'创建半透明文本块（无连接点）",
          "• 输入内容后按Ctrl+Enter或点击按钮创建节点",
          "• 单独按Enter键可换行，按Esc键或点击空白区域取消输入",
          "• 右键点击节点询问LLM，立即生成'Thinking'节点",
          "• 右键点击节点选择'链式查询'，追踪整个思维链路",
          "• 按Esc键清除链式高亮",
          "• 拖拽节点右侧圆点连接到其他节点",
          "• 左键拖拽移动节点，右键拖拽平移画布",
          "• 选中节点后按Delete键删除（锁定节点不可删除）",
          "• 点击连线按Delete键删除连线",
          { text: "• Ctrl+S 手动保存数据", color: colors.primary.main },
          { text: "• 创建/删除节点时自动保存", color: colors.success.main },
          { text: "• 橙色边框表示节点已锁定，正在处理中", color: colors.warning.main }
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
