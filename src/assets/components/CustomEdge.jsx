import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import { Box } from '@mui/material';
import { colors, shadows } from '../../theme/colors';

// 自定义边组件，支持序号显示
export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 根据选中状态调整样式
  const edgeStyle = {
    ...style,
    strokeWidth: selected ? 4 : (style.strokeWidth || 2), // 选中时变粗
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      <EdgeLabelRenderer>
        {/* 边序号标签 - 临时禁用 */}
        {/* {data?.edgeIndex !== undefined && (
          <Box
            sx={{
              position: 'absolute',
              left: labelX - 12,
              top: labelY - 12,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: colors.secondary.main,
              color: colors.secondary.contrastText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              zIndex: 10,
              boxShadow: shadows.small,
              border: `2px solid ${colors.background.default}`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          >
            {data.edgeIndex}
          </Box>
        )} */}
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge; 