import React from 'react';
import { Handle } from 'reactflow';
import { Box, Typography } from '@mui/material';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const TextBlock = ({ data, selected }) => {
  return (
    <Box
      sx={{
        padding: '16px 20px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // 半透明背景
        border: selected 
          ? `2px solid ${colors.primary.main}` 
          : '1px solid rgba(255, 255, 255, 0.2)', // 半透明边框
        borderRadius: '24px',
        minWidth: '100px',
        maxWidth: '300px',
        backdropFilter: 'blur(5px)',
        cursor: 'move',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          border: `1px solid rgba(255, 255, 255, 0.3)`,
        },
        transition: 'all 0.2s ease',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: colors.text.primary,
          fontSize: fonts.components.textBlock.fontSize,
          fontWeight: fonts.components.textBlock.fontWeight,
          lineHeight: fonts.components.textBlock.lineHeight,
          fontFamily: fonts.components.textBlock.fontFamily,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'text',
        }}
      >
        {data.label}
      </Typography>
      
      {/* 不显示任何连接点 */}
    </Box>
  );
};

export default TextBlock; 