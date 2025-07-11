import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { colors, shadows } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

// 基础面板组件
export const BasePanel = ({ 
  children, 
  position = 'absolute',
  top = 16, 
  right = 16, 
  left, 
  bottom,
  width,
  maxWidth = 300,
  sx = {},
  ...props 
}) => {
  const positionStyles = {
    position,
    ...(top !== undefined && { top }),
    ...(right !== undefined && { right }),
    ...(left !== undefined && { left }),
    ...(bottom !== undefined && { bottom }),
    ...(width !== undefined && { width }),
    maxWidth,
    padding: 2,
    borderRadius: '12px',
    backgroundColor: colors.panel.background,
    backdropFilter: 'blur(10px)',
    boxShadow: shadows.panel,
    border: `1px solid ${colors.panel.border}`,
    ...sx
  };

  return (
    <Paper elevation={3} sx={positionStyles} {...props}>
      {children}
    </Paper>
  );
};

// 信息面板组件
export const InfoPanel = ({ 
  title, 
  icon, 
  items = [], 
  position = 'absolute',
  top = 16, 
  right = 16,
  sx = {},
  ...props 
}) => {
  return (
    <BasePanel 
      position={position}
      top={top} 
      right={right} 
      sx={sx}
      {...props}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon && React.cloneElement(icon, { 
          sx: { 
            mr: 1, 
            fontSize: '1.2rem',
            color: colors.primary.main,
            ...icon.props.sx 
          }
        })}
        <Typography variant="h6" sx={{ 
          fontSize: fonts.components.panel.title.fontSize, 
          fontWeight: fonts.components.panel.title.fontWeight,
          fontFamily: fonts.components.panel.title.fontFamily,
          color: colors.text.primary
        }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ fontSize: fonts.components.panel.content.fontSize, color: colors.text.secondary }}>
        {items.map((item, index) => (
          <Typography 
            key={index} 
            variant="body2" 
            sx={{ 
              mb: 0.5,
              color: item.color || colors.text.secondary,
              fontWeight: item.bold ? 600 : 400,
              fontSize: fonts.components.panel.content.fontSize,
              fontFamily: fonts.components.panel.content.fontFamily,
            }}
          >
            {item.prefix && <span style={{ marginRight: '4px' }}>{item.prefix}</span>}
            {item.text || item}
          </Typography>
        ))}
      </Box>
    </BasePanel>
  );
};

// 状态面板组件
export const StatusPanel = ({ 
  title, 
  icon,
  status = {}, 
  position = 'absolute',
  top = 16, 
  left = 16,
  sx = {},
  ...props 
}) => {
  return (
    <BasePanel 
      position={position}
      top={top} 
      left={left} 
      sx={{
        minWidth: 200,
        ...sx
      }}
      {...props}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon && React.cloneElement(icon, { 
          sx: { 
            mr: 1, 
            fontSize: '1.2rem',
            color: colors.primary.main,
            ...icon.props.sx 
          }
        })}
        <Typography variant="h6" sx={{ 
          fontSize: fonts.components.panel.title.fontSize, 
          fontWeight: fonts.components.panel.title.fontWeight,
          fontFamily: fonts.components.panel.title.fontFamily,
          color: colors.text.primary
        }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ fontSize: fonts.components.panel.content.fontSize, color: colors.text.secondary }}>
        {Object.entries(status).map(([key, value], index) => (
          <Typography 
            key={index} 
            variant="body2" 
            sx={{ 
              mb: 0.5,
              color: value?.color || colors.text.secondary,
              fontWeight: value?.bold ? 600 : 400,
              fontSize: fonts.components.panel.content.fontSize,
              fontFamily: fonts.components.panel.content.fontFamily,
            }}
          >
            <span style={{ fontWeight: 500 }}>{key}:</span> {value?.text || value}
          </Typography>
        ))}
      </Box>
    </BasePanel>
  );
};

// 浮动面板组件
export const FloatingPanel = ({ 
  children, 
  position = { x: 0, y: 0 },
  transform = 'translate(-50%, -50%)',
  zIndex = 1000,
  sx = {},
  ...props 
}) => {
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform,
        zIndex,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: shadows.floating,
        border: `1px solid ${colors.panel.border}`,
        backgroundColor: colors.panel.background,
        ...sx
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};

export default {
  BasePanel,
  InfoPanel,
  StatusPanel,
  FloatingPanel
}; 