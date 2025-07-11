import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Menu,
  MenuItem,
  GlobalStyles
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon
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
    }}
  />
);

// 自定义节点组件 - 使用颜色主题
export const CustomNode = ({ data, selected, id }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // 检查节点是否被锁定或高亮
  const isLocked = data.isLocked || false;
  const isHighlighted = data.isHighlighted || false;
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
        elevation={selected ? 8 : 3}
        onContextMenu={handleContextMenu}
        className={(isLocked || isHighlighted) ? 'locked-node-pulse' : ''}
        sx={{
          padding: '14px 18px',
          minWidth: '50px',
          maxWidth: '400px', // 增加最大宽度限制
          width: 'auto', // 自动宽度
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
          backgroundColor: (isLocked || isHighlighted) ? colors.node.lockedBackground : colors.node.background,
          opacity: isThinking ? 0.8 : 1,
          transition: (isLocked || isHighlighted) ? 'none' : 'all 0.2s ease-in-out', // 锁定时禁用过渡，避免与动画冲突
          cursor: 'pointer !important',
          boxShadow: selected ? shadows.large : shadows.medium,
          '&:hover': {
            elevation: 6,
            transform: isLocked ? 'none' : 'scale(1.02)',
            boxShadow: shadows.large,
          }
        }}
      >
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
        <MarkdownRenderer 
          content={data.label}
          sx={{
            cursor: 'pointer',
            minHeight: '1.4em'
          }}
        />
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