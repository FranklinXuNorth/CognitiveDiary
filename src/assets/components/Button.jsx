import React from 'react';
import { IconButton as MuiIconButton, Button as MuiButton } from '@mui/material';
import { colors, shadows } from '../../theme/colors';

// 主要按钮组件
export const PrimaryButton = ({ children, onClick, disabled = false, size = 'medium', sx = {}, ...props }) => {
  return (
    <MuiButton
      variant="contained"
      onClick={onClick}
      disabled={disabled}
      size={size}
      sx={{
        backgroundColor: colors.primary.main,
        color: colors.primary.contrastText,
        borderRadius: '8px',
        boxShadow: shadows.small,
        textTransform: 'none',
        fontWeight: 500,
        '&:hover': {
          backgroundColor: colors.primary.dark,
          boxShadow: shadows.medium,
        },
        '&:disabled': {
          backgroundColor: colors.text.disabled,
          color: colors.text.hint,
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

// 次要按钮组件
export const SecondaryButton = ({ children, onClick, disabled = false, size = 'medium', sx = {}, ...props }) => {
  return (
    <MuiButton
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      size={size}
      sx={{
        borderColor: colors.primary.main,
        color: colors.primary.main,
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 500,
        '&:hover': {
          borderColor: colors.primary.dark,
          backgroundColor: colors.primary.main + '08', // 8% opacity
        },
        '&:disabled': {
          borderColor: colors.text.disabled,
          color: colors.text.disabled,
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

// 圆形图标按钮组件
export const RoundIconButton = ({ children, onClick, disabled = false, size = 'small', color = 'primary', sx = {}, ...props }) => {
  const getColors = () => {
    switch (color) {
      case 'success':
        return {
          bg: colors.success.main,
          hover: colors.success.dark,
          text: colors.success.contrastText
        };
      case 'warning':
        return {
          bg: colors.warning.main,
          hover: colors.warning.dark,
          text: colors.warning.contrastText
        };
      case 'error':
        return {
          bg: colors.error.main,
          hover: colors.error.dark,
          text: colors.error.contrastText
        };
      default:
        return {
          bg: colors.primary.main,
          hover: colors.primary.dark,
          text: colors.primary.contrastText
        };
    }
  };

  const buttonColors = getColors();

  return (
    <MuiIconButton
      onClick={onClick}
      disabled={disabled}
      size={size}
      sx={{
        backgroundColor: buttonColors.bg,
        color: buttonColors.text,
        borderRadius: '4px',
        margin: '4px',
        padding: '6px',
        boxShadow: shadows.small,
        '&:hover': {
          backgroundColor: buttonColors.hover,
          boxShadow: shadows.medium,
        },
        '&:disabled': {
          backgroundColor: colors.text.disabled,
          color: colors.text.hint,
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </MuiIconButton>
  );
};

// 文本按钮组件
export const TextButton = ({ children, onClick, disabled = false, size = 'medium', color = 'primary', sx = {}, ...props }) => {
  const textColor = color === 'primary' ? colors.primary.main : colors[color]?.main || color;
  
  return (
    <MuiButton
      variant="text"
      onClick={onClick}
      disabled={disabled}
      size={size}
      sx={{
        color: textColor,
        textTransform: 'none',
        fontWeight: 500,
        borderRadius: '6px',
        '&:hover': {
          backgroundColor: textColor + '08', // 8% opacity
        },
        '&:disabled': {
          color: colors.text.disabled,
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

// 危险操作按钮组件
export const DangerButton = ({ children, onClick, disabled = false, size = 'medium', sx = {}, ...props }) => {
  return (
    <MuiButton
      variant="contained"
      onClick={onClick}
      disabled={disabled}
      size={size}
      sx={{
        backgroundColor: colors.error.main,
        color: colors.error.contrastText,
        borderRadius: '8px',
        boxShadow: shadows.small,
        textTransform: 'none',
        fontWeight: 500,
        '&:hover': {
          backgroundColor: colors.error.dark,
          boxShadow: shadows.medium,
        },
        '&:disabled': {
          backgroundColor: colors.text.disabled,
          color: colors.text.hint,
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

// 成功按钮组件
export const SuccessButton = ({ children, onClick, disabled = false, size = 'medium', sx = {}, ...props }) => {
  return (
    <MuiButton
      variant="contained"
      onClick={onClick}
      disabled={disabled}
      size={size}
      sx={{
        backgroundColor: colors.success.main,
        color: colors.success.contrastText,
        borderRadius: '8px',
        boxShadow: shadows.small,
        textTransform: 'none',
        fontWeight: 500,
        '&:hover': {
          backgroundColor: colors.success.dark,
          boxShadow: shadows.medium,
        },
        '&:disabled': {
          backgroundColor: colors.text.disabled,
          color: colors.text.hint,
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default {
  PrimaryButton,
  SecondaryButton,
  RoundIconButton,
  TextButton,
  DangerButton,
  SuccessButton
}; 