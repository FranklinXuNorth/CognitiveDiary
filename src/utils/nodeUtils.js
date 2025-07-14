// 节点链追踪实用函数
export const traceNodeChain = (targetNodeId, nodes, edges) => {
  console.log('🔍 开始追踪节点链，目标节点ID:', targetNodeId);
  
  // 如果目标节点不存在，返回空结果
  const targetNode = nodes.find(node => node.id === targetNodeId);
  if (!targetNode) {
    console.error('❌ 目标节点不存在:', targetNodeId);
    return { chainNodes: [], chainEdges: [] };
  }
  
  const chainNodes = new Set();
  const chainEdges = new Set();
  const visited = new Set(); // 防止无限循环
  
  // 递归函数：追踪到达当前节点的所有路径
  const traceBackwards = (nodeId) => {
    if (visited.has(nodeId)) {
      return; // 已经访问过，避免循环
    }
    
    visited.add(nodeId);
    chainNodes.add(nodeId);
    
    // 查找所有指向当前节点的边
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    
    for (const edge of incomingEdges) {
      chainEdges.add(edge.id);
      // 递归追踪源节点
      traceBackwards(edge.source);
    }
  };
  
  // 从目标节点开始追踪
  traceBackwards(targetNodeId);
  
  // 转换为数组并获取完整的节点和边对象
  const chainNodesArray = Array.from(chainNodes).map(nodeId => 
    nodes.find(node => node.id === nodeId)
  ).filter(Boolean);
  
  const chainEdgesArray = Array.from(chainEdges).map(edgeId => 
    edges.find(edge => edge.id === edgeId)
  ).filter(Boolean);
  
  console.log('✅ 节点链追踪完成:', {
    chainNodes: chainNodesArray.map(n => ({ id: n.id, label: n.data.label })),
    chainEdges: chainEdgesArray.map(e => ({ id: e.id, source: e.source, target: e.target }))
  });
  
  return {
    chainNodes: chainNodesArray,
    chainEdges: chainEdgesArray
  };
};

// 高亮节点和边的样式应用函数
export const applyChainHighlight = (nodes, edges, chainNodes, chainEdges, colors) => {
  console.log('🎨 应用链式高亮，节点数:', chainNodes.length, '边数:', chainEdges.length);
  
  const chainNodeIds = new Set(chainNodes.map(node => node.id));
  const chainEdgeIds = new Set(chainEdges.map(edge => edge.id));
  
  // 高亮节点 - 只设置isHighlighted标志，样式由CustomNode组件处理
  const highlightedNodes = nodes.map(node => {
    if (chainNodeIds.has(node.id)) {
      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted: true
        }
        // 不再需要直接操作style
      };
    }
    return node;
  });
  
  // 高亮边
  const highlightedEdges = edges.map(edge => {
    if (chainEdgeIds.has(edge.id)) {
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: colors.highlight.chain,
          strokeWidth: 4,
          filter: `drop-shadow(0 0 5px ${colors.highlight.chain}90)`,
          strokeDasharray: '5,5',
          animation: 'chainEdgeFlow 1s linear infinite'
        },
        markerEnd: {
          ...edge.markerEnd,
          color: colors.highlight.chain
        },
        className: 'chain-edge-animated'
      };
    }
    return edge;
  });
  
  return {
    nodes: highlightedNodes,
    edges: highlightedEdges
  };
};

// 清除高亮的函数
export const clearChainHighlight = (nodes, edges, colors) => {
  console.log('🧹 清除链式高亮');
  
  // 清除节点高亮 - 只移除isHighlighted标志
  const unhighlightedNodes = nodes.map(node => {
    if (node.data.isHighlighted) {
      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted: false
        }
        // 不再需要直接操作style
      };
    }
    return node;
  });
  
  // 清除边高亮
  const unhighlightedEdges = edges.map(edge => {
    // 基于stroke颜色来判断是否高亮，更可靠
    if (edge.style?.stroke === colors.highlight.chain) {
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
  
  return {
    nodes: unhighlightedNodes,
    edges: unhighlightedEdges
  };
};

export default { traceNodeChain, applyChainHighlight, clearChainHighlight }; 