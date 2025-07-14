import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  Menu,
  MenuItem,
  GlobalStyles,
  TextField,
  Box,
  IconButton
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  Handle,
  Position
} from 'reactflow';

// 导入颜色和阴影
import { colors, shadows } from '../../theme/colors';
// 导入字体设置
import { fonts } from '../../theme/fonts';
// 导入 Markdown 渲染器
import { MarkdownRenderer } from './MarkdownRenderer';
// 导入文本块组件
import TextBlock from './TextBlock';

// 节点功能枚举
export const NodeFeature = {
  EDIT: 'edit',
  ASK_LLM: 'ask_llm',
  CHAINED_QUERY: 'chained_query'
};

// 节点类型枚举
export const NodeType = {
  NORMAL: 'normal',      // 普通节点：包含所有功能
  ANNOTATION: 'annotation' // 原始标注：只包含编辑功能
};

// 节点闪烁动画的全局样式
export const NodeGlobalStyles = (
  <GlobalStyles
    styles={{
      // 闪烁动画定义
      '@keyframes lockBorderPulse': {
        '0%': {
          borderColor: 'rgb(200, 210, 220)',
          boxShadow: '0 0 0 0 rgba(200, 210, 220, 0.7)',
        },
        '50%': {
          borderColor: 'rgb(240, 248, 255)',
          boxShadow: '0 0 0 4px rgba(200, 210, 220, 0.3)',
        },
        '100%': {
          borderColor: 'rgb(200, 210, 220)',
          boxShadow: '0 0 0 0 rgba(200, 210, 220, 0.7)',
        },
      },
      '.locked-node-pulse': {
        animation: 'lockBorderPulse 1.5s ease-in-out infinite',
      },
      
      // 链式查询边动画定义
      '@keyframes chainEdgeFlow': {
        '0%': {
          strokeDashoffset: '0',
        },
        '100%': {
          strokeDashoffset: '-20',
        },
      },
      '.chain-edge-animated': {
        strokeDasharray: '5,5',
        animation: 'chainEdgeFlow 1s linear infinite',
      },
    }}
  />
);

// 自定义节点组件 - 使用颜色主题
export const CustomNode = ({ data, selected, id }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [nodeWidth, setNodeWidth] = useState(null);
  const editInputRef = useRef(null);
  const nodeRef = useRef(null);
  const open = Boolean(anchorEl);
  
  // 检查节点是否被锁定或高亮
  const isLocked = data.isLocked || false;
  const isHighlighted = data.isHighlighted || false;
  const isThinking = data.label === "🤔 Thinking..." || data.label === "🔗 Chained Thinking...";
  
  // 获取节点类型和功能
  const nodeType = data.nodeType || NodeType.NORMAL;
  const features = data.features || getDefaultFeatures(nodeType);
  
  // 检查各功能是否可用
  const canEdit = !isLocked && !isThinking && features.includes(NodeFeature.EDIT);
  const canAskLLM = !isLocked && features.includes(NodeFeature.ASK_LLM);
  const canChainedQuery = !isLocked && features.includes(NodeFeature.CHAINED_QUERY);

  // 获取默认功能列表
  function getDefaultFeatures(type) {
    switch (type) {
      case NodeType.ANNOTATION:
        return [NodeFeature.EDIT];
      case NodeType.NORMAL:
      default:
        return [NodeFeature.EDIT, NodeFeature.ASK_LLM, NodeFeature.CHAINED_QUERY];
    }
  }

  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // 开始编辑
  const handleStartEdit = () => {
    // 记录当前节点宽度
    if (nodeRef.current) {
      const width = nodeRef.current.offsetWidth;
      setNodeWidth(width);
      console.log('📏 记录节点宽度:', width);
    }
    setEditValue(data.label);
    setIsEditing(true);
    // 通知父组件编辑状态变化
    if (data.onEditingStateChange) {
      data.onEditingStateChange(true);
    }
    handleClose();
  };

  // 确认编辑
  const handleConfirmEdit = () => {
    console.log('✅ 确认编辑 - 节点ID:', id);
    console.log('✅ 编辑内容:', editValue);
    console.log('✅ 编辑内容trim后:', editValue.trim());
    console.log('✅ onEdit回调存在:', !!data.onEdit);
    
    if (editValue.trim() && data.onEdit) {
      console.log('✅ 调用onEdit回调');
      data.onEdit(id, editValue.trim());
    } else {
      console.error('❌ 编辑失败 - 内容为空或回调不存在');
      console.error('❌ editValue.trim():', editValue.trim());
      console.error('❌ data.onEdit:', data.onEdit);
    }
    setIsEditing(false);
    setNodeWidth(null);
    // 通知父组件编辑状态变化
    if (data.onEditingStateChange) {
      data.onEditingStateChange(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
    setNodeWidth(null);
    // 通知父组件编辑状态变化
    if (data.onEditingStateChange) {
      data.onEditingStateChange(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (event) => {
    // 在编辑模式下阻止删除键的默认行为，防止删除节点
    if (event.key === 'Delete' || event.key === 'Backspace' || (event.ctrlKey && event.key === 'Backspace')) {
      event.stopPropagation();
      return;
    }
    
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      handleConfirmEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelEdit();
    }
  };

  // 处理点击空白处取消编辑
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && !event.target.closest('.node-edit-container')) {
        // 通知父组件编辑状态变化
        if (data.onEditingStateChange) {
          data.onEditingStateChange(false);
        }
        handleCancelEdit();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, data.onEditingStateChange]);

  // 自动聚焦到输入框
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

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

  const handleChainedQuery = () => {
    // 触发链式查询的事件
    console.log('CustomNode - 准备调用链式查询, 节点ID:', id, '节点内容:', data.label);
    console.log('CustomNode - 链式查询回调函数存在:', !!data.onChainedQuery);
    if (data.onChainedQuery) {
      data.onChainedQuery(id, data.label);
    } else {
      console.error('CustomNode - 链式查询回调函数不存在!');
    }
    handleClose();
  };

  return (
    <>
      <Paper
        ref={nodeRef}
        elevation={selected ? 8 : 3}
        onContextMenu={handleContextMenu}
        className={`node-edit-container ${(isLocked || isHighlighted) ? 'locked-node-pulse' : ''}`}
        sx={{
          padding: '14px 18px',
          minWidth: '50px',
          maxWidth: '400px', // 增加最大宽度限制
          width: isEditing && nodeWidth ? `${nodeWidth}px` : 'auto', // 编辑时使用记录的宽度
          textAlign: 'left', // 改为左对齐，更适合长文本
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start', // 改为左对齐
          justifyContent: 'flex-start', // 改为顶部对齐
          position: 'relative',
          borderRadius: '12px',
          border: selected ? `2px solid ${colors.node.selected}` : 
                 (isLocked || isHighlighted) ? `2px solid ${colors.node.locked}` : 
                 `2px solid transparent`,
          backgroundColor: isEditing ? colors.node.editing :
                         (isLocked || isHighlighted) ? colors.node.lockedBackground : 
                         (nodeType === NodeType.ANNOTATION ? colors.node.annotationBackground || 'rgba(255, 255, 255, 0.7)' : colors.node.background),
          opacity: isThinking ? 0.8 : (nodeType === NodeType.ANNOTATION ? 0.8 : 1),
          transition: (isLocked || isHighlighted) ? 'none' : 'all 0.2s ease-in-out', // 锁定时禁用过渡，避免与动画冲突
          cursor: 'pointer !important', // 强制所有节点为pointer
          boxShadow: selected ? shadows.large : shadows.medium,
          '&:hover': {
            elevation: 6,
            transform: isLocked ? 'none' : 'scale(1.02)',
            boxShadow: shadows.large,
          }
        }}
      >
        {/* 节点序号标签 - 临时禁用 */}
        {/* {data.nodeIndex !== undefined && (
          <Box
            sx={{
              position: 'absolute',
              top: '-8px',
              left: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: colors.primary.main,
              color: colors.primary.contrastText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              zIndex: 10,
              boxShadow: shadows.small,
              border: `2px solid ${colors.background.default}`
            }}
          >
            {data.nodeIndex}
          </Box>
        )} */}
        
        {/* 原始标注节点不显示连接点 */}
        {nodeType !== NodeType.ANNOTATION && (
          <Handle
            type="target"
            position={Position.Left}
            style={{
              background: colors.handle.background,
              border: `3px solid ${colors.handle.border}`,
              width: '14px',
              height: '14px',
              boxShadow: shadows.handle,
              cursor: 'crosshair'
            }}
          />
        )}
        
        {isEditing ? (
          <Box sx={{ 
            width: '100%', 
            position: 'relative',
            minWidth: '100%',
            maxWidth: '100%'
          }}>
            <TextField
              ref={editInputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              multiline
              maxRows={8}
              variant="outlined"
              size="small"
              autoComplete="off"
              sx={{
                width: '100%',
                minWidth: '100%',
                maxWidth: '100%',
                '& .MuiOutlinedInput-root': {
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontFamily: fonts.components.node.fontFamily,
                  lineHeight: 1.4,
                  color: (nodeType === NodeType.ANNOTATION ? colors.node.annotationText : colors.text.primary),
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  width: '100%',
                  minWidth: '100%',
                  maxWidth: '100%',
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
                  padding: 0,
                  width: '100%',
                },
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mt: 1, 
              justifyContent: 'flex-end' 
            }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmEdit();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                sx={{
                  backgroundColor: colors.success.main,
                  color: colors.success.contrastText,
                  '&:hover': {
                    backgroundColor: colors.success.dark,
                  },
                  width: 24,
                  height: 24,
                }}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                sx={{
                  backgroundColor: colors.error.main,
                  color: colors.error.contrastText,
                  '&:hover': {
                    backgroundColor: colors.error.dark,
                  },
                  width: 24,
                  height: 24,
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <MarkdownRenderer 
            content={data.label}
            color={nodeType === NodeType.ANNOTATION ? colors.node.annotationText : colors.text.primary}
            sx={{
              cursor: 'pointer',
              minHeight: '1.4em'
            }}
          />
        )}
        
        {/* 原始标注节点不显示连接点 */}
        {nodeType !== NodeType.ANNOTATION && (
          <Handle
            type="source"
            position={Position.Right}
            style={{
              background: colors.handle.background,
              border: `3px solid ${colors.handle.border}`,
              width: '14px',
              height: '14px',
              boxShadow: shadows.handle,
              cursor: 'crosshair'
            }}
          />
        )}
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
              boxShadow: shadows.floating,
              border: `1px solid ${colors.panel.border}`
            }
          }}
        >
          {/* 编辑功能 */}
          {features.includes(NodeFeature.EDIT) && (
            <MenuItem 
              onClick={handleStartEdit} 
              disabled={!canEdit}
              sx={{ 
                minWidth: '150px',
                '&:hover': {
                  backgroundColor: !canEdit ? 'transparent' : colors.info.main + '08'
                },
                opacity: !canEdit ? 0.5 : 1
              }}
            >
              <EditIcon sx={{ 
                mr: 1, 
                color: !canEdit ? colors.text.disabled : colors.info.main 
              }} />
              编辑
            </MenuItem>
          )}
          
          {/* Ask LLM功能 */}
          {features.includes(NodeFeature.ASK_LLM) && (
            <MenuItem 
              onClick={handleAskLLM} 
              disabled={isLocked}
              sx={{ 
                minWidth: '150px',
                '&:hover': {
                  backgroundColor: isLocked ? 'transparent' : colors.primary.main + '08'
                },
                opacity: isLocked ? 0.5 : 1
              }}
            >
              <PsychologyIcon sx={{ 
                mr: 1, 
                color: isLocked ? colors.text.disabled : colors.primary.main 
              }} />
              Ask LLM
            </MenuItem>
          )}
          
          {/* 链式查询功能 */}
          {features.includes(NodeFeature.CHAINED_QUERY) && (
            <MenuItem 
              onClick={handleChainedQuery} 
              disabled={isLocked}
              sx={{ 
                minWidth: '150px',
                '&:hover': {
                  backgroundColor: isLocked ? 'transparent' : colors.secondary.main + '08'
                },
                opacity: isLocked ? 0.5 : 1
              }}
            >
              <TimelineIcon sx={{ 
                mr: 1, 
                color: isLocked ? colors.text.disabled : colors.secondary.main 
              }} />
              链式查询
            </MenuItem>
          )}
        </Menu>
      )}
    </>
  );
};

// 节点类型定义 - 移到组件外部，避免每次渲染都创建新对象
export const nodeTypes = {
  custom: CustomNode,
  textBlock: TextBlock,
};

// 初始节点数据
export const initialNodes = [
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

// 初始边数据
export const initialEdges = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2',
    type: 'smoothstep',
    markerEnd: {
      type: 'arrowclosed',
      color: colors.edge.default
    },
    style: {
      stroke: colors.edge.default,
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
      color: colors.edge.default
    },
    style: {
      stroke: colors.edge.default,
      strokeWidth: 2
    }
  }
];

export default CustomNode; 