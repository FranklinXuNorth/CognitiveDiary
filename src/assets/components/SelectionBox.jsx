import React from 'react';
import { Box } from '@mui/material';
import { colors } from '../../theme/colors';

const SelectionBox = ({ startPoint, endPoint, isVisible }) => {
  if (!isVisible || !startPoint || !endPoint) {
    return null;
  }

  // 计算框选区域，使用绝对值确保正确的矩形
  const left = Math.min(startPoint.x, endPoint.x);
  const top = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: `2px solid ${colors.primary.main}`,
        backgroundColor: `${colors.primary.main}20`, // 20% 透明度
        pointerEvents: 'none', // 防止干扰其他交互
        zIndex: 1000,
        borderRadius: '4px',
        boxShadow: `0 0 8px ${colors.primary.main}40`,
      }}
    />
  );
};

export default SelectionBox; 