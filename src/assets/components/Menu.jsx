import React from 'react';
import { Box, Paper, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Note as NoteIcon, Psychology as PsychologyIcon, TextFields as TextFieldsIcon } from '@mui/icons-material';
import { colors, shadows } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const Menu = ({ position, onAddNote, onAddThinkingNote, onAddAnnotation, onClose }) => {
  const handleItemClick = (action) => {
    action();
    onClose();
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        backgroundColor: colors.panel.background,
        border: `1px solid ${colors.panel.border}`,
        boxShadow: shadows.panel,
        borderRadius: 2,
        minWidth: 200,
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box sx={{ p: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: colors.text.secondary,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 1,
            px: 2,
            py: 1,
            display: 'block'
          }}
        >
          创建节点
        </Typography>
        
        <List sx={{ p: 0 }}>
          <ListItem
            button
            onClick={() => handleItemClick(onAddNote)}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&:hover': {
                backgroundColor: colors.primary.main + '20',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <NoteIcon sx={{ color: colors.primary.main, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="添加笔记"
              secondary="创建一个普通笔记节点"
              primaryTypographyProps={{
                sx: { 
                  color: colors.text.primary, 
                  fontSize: fonts.components.menu.primary.fontSize,
                  fontWeight: fonts.components.menu.primary.fontWeight,
                  fontFamily: fonts.components.menu.primary.fontFamily
                }
              }}
              secondaryTypographyProps={{
                sx: { 
                  color: colors.text.secondary, 
                  fontSize: fonts.components.menu.secondary.fontSize,
                  fontWeight: fonts.components.menu.secondary.fontWeight,
                  fontFamily: fonts.components.menu.secondary.fontFamily
                }
              }}
            />
          </ListItem>
          
          <ListItem
            button
            onClick={() => handleItemClick(onAddThinkingNote)}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&:hover': {
                backgroundColor: colors.secondary.main + '20',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <PsychologyIcon sx={{ color: colors.secondary.main, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="添加思考笔记"
              secondary="创建笔记并自动生成 LLM 回复"
              primaryTypographyProps={{
                sx: { 
                  color: colors.text.primary, 
                  fontSize: fonts.components.menu.primary.fontSize,
                  fontWeight: fonts.components.menu.primary.fontWeight,
                  fontFamily: fonts.components.menu.primary.fontFamily
                }
              }}
              secondaryTypographyProps={{
                sx: { 
                  color: colors.text.secondary, 
                  fontSize: fonts.components.menu.secondary.fontSize,
                  fontWeight: fonts.components.menu.secondary.fontWeight,
                  fontFamily: fonts.components.menu.secondary.fontFamily
                }
              }}
            />
          </ListItem>
          
          <ListItem
            button
            onClick={() => handleItemClick(onAddAnnotation)}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&:hover': {
                backgroundColor: colors.warning.main + '20',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <TextFieldsIcon sx={{ color: colors.warning.main, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="添加原始标注"
              secondary="创建无背景的纯文本标注"
              primaryTypographyProps={{
                sx: { 
                  color: colors.text.primary, 
                  fontSize: fonts.components.menu.primary.fontSize,
                  fontWeight: fonts.components.menu.primary.fontWeight,
                  fontFamily: fonts.components.menu.primary.fontFamily
                }
              }}
              secondaryTypographyProps={{
                sx: { 
                  color: colors.text.secondary, 
                  fontSize: fonts.components.menu.secondary.fontSize,
                  fontWeight: fonts.components.menu.secondary.fontWeight,
                  fontFamily: fonts.components.menu.secondary.fontFamily
                }
              }}
            />
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};

export default Menu; 