import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Typography, Box } from '@mui/material';
import { colors } from '../../theme/colors';

// 自定义 markdown 组件映射
const components = {
  // 段落
  p: ({ node, ...props }) => (
    <Typography 
      variant="body2" 
      component="p" 
      sx={{ 
        margin: '0.5em 0',
        lineHeight: 1.4,
        color: colors.text.secondary,
        fontSize: '14px',
        '&:first-of-type': { marginTop: 0 },
        '&:last-of-type': { marginBottom: 0 }
      }}
      {...props}
    />
  ),
  
  // 标题
  h1: ({ node, ...props }) => (
    <Typography 
      variant="h6" 
      component="h1" 
      sx={{ 
        margin: '0.8em 0 0.4em 0',
        fontWeight: 600,
        color: colors.primary.main,
        fontSize: '18px',
        lineHeight: 1.3,
        '&:first-of-type': { marginTop: 0 }
      }}
      {...props}
    />
  ),
  
  h2: ({ node, ...props }) => (
    <Typography 
      variant="h6" 
      component="h2" 
      sx={{ 
        margin: '0.7em 0 0.3em 0',
        fontWeight: 600,
        color: colors.primary.main,
        fontSize: '16px',
        lineHeight: 1.3,
        '&:first-of-type': { marginTop: 0 }
      }}
      {...props}
    />
  ),
  
  h3: ({ node, ...props }) => (
    <Typography 
      variant="subtitle1" 
      component="h3" 
      sx={{ 
        margin: '0.6em 0 0.3em 0',
        fontWeight: 600,
        color: colors.primary.main,
        fontSize: '15px',
        lineHeight: 1.3,
        '&:first-of-type': { marginTop: 0 }
      }}
      {...props}
    />
  ),
  
  // 强调
  strong: ({ node, ...props }) => (
    <Typography 
      component="strong" 
      sx={{ 
        fontWeight: 600,
        color: colors.text.primary,
        fontSize: 'inherit'
      }}
      {...props}
    />
  ),
  
  em: ({ node, ...props }) => (
    <Typography 
      component="em" 
      sx={{ 
        fontStyle: 'italic',
        color: colors.text.secondary,
        fontSize: 'inherit'
      }}
      {...props}
    />
  ),
  
  // 代码
  code: ({ node, inline, ...props }) => {
    if (inline) {
      return (
        <Typography 
          component="code" 
          sx={{ 
            backgroundColor: colors.background.paper,
            padding: '2px 4px',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: '"Fira Code", "Consolas", monospace',
            color: colors.secondary.main,
            border: `1px solid ${colors.panel.border}`
          }}
          {...props}
        />
      );
    }
    
    return (
      <Box
        component="pre"
        sx={{
          backgroundColor: colors.background.paper,
          padding: '8px 12px',
          borderRadius: '6px',
          margin: '0.5em 0',
          overflow: 'auto',
          fontSize: '13px',
          fontFamily: '"Fira Code", "Consolas", monospace',
          color: colors.text.secondary,
          border: `1px solid ${colors.panel.border}`,
          '&:first-of-type': { marginTop: 0 },
          '&:last-of-type': { marginBottom: 0 }
        }}
      >
        <Typography
          component="code"
          sx={{
            fontSize: 'inherit',
            fontFamily: 'inherit',
            color: 'inherit'
          }}
          {...props}
        />
      </Box>
    );
  },
  
  // 列表
  ul: ({ node, ...props }) => (
    <Box
      component="ul"
      sx={{
        margin: '0.5em 0',
        paddingLeft: '1.5em',
        '&:first-of-type': { marginTop: 0 },
        '&:last-of-type': { marginBottom: 0 }
      }}
      {...props}
    />
  ),
  
  ol: ({ node, ...props }) => (
    <Box
      component="ol"
      sx={{
        margin: '0.5em 0',
        paddingLeft: '1.5em',
        '&:first-of-type': { marginTop: 0 },
        '&:last-of-type': { marginBottom: 0 }
      }}
      {...props}
    />
  ),
  
  li: ({ node, ...props }) => (
    <Typography 
      component="li" 
      sx={{ 
        margin: '0.2em 0',
        color: colors.text.secondary,
        fontSize: '14px',
        lineHeight: 1.4
      }}
      {...props}
    />
  ),
  
  // 引用
  blockquote: ({ node, ...props }) => (
    <Box
      component="blockquote"
      sx={{
        margin: '0.8em 0',
        paddingLeft: '1em',
        borderLeft: `4px solid ${colors.primary.main}`,
        backgroundColor: colors.background.paper,
        padding: '0.5em 1em',
        borderRadius: '0 4px 4px 0',
        fontStyle: 'italic',
        color: colors.text.secondary,
        '&:first-of-type': { marginTop: 0 },
        '&:last-of-type': { marginBottom: 0 }
      }}
      {...props}
    />
  ),
  
  // 链接
  a: ({ node, ...props }) => (
    <Typography 
      component="a" 
      sx={{ 
        color: colors.primary.main,
        textDecoration: 'underline',
        fontSize: 'inherit',
        '&:hover': {
          color: colors.primary.dark
        }
      }}
      {...props}
    />
  ),
  
  // 分割线
  hr: ({ node, ...props }) => (
    <Box
      component="hr"
      sx={{
        margin: '1em 0',
        border: 'none',
        borderTop: `2px solid ${colors.primary.dark}`,
        '&:first-of-type': { marginTop: 0 },
        '&:last-of-type': { marginBottom: 0 }
      }}
      {...props}
    />
  )
};

// Markdown 渲染器组件
export const MarkdownRenderer = ({ content, sx = {} }) => {
  return (
    <Box 
      sx={{
        width: '100%',
        wordBreak: 'break-word',
        ...sx
      }}
    >
      <ReactMarkdown 
        components={components}
        skipHtml={true} // 跳过 HTML 标签，只渲染 markdown
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer; 