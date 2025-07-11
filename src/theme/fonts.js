// 字体设置配置文件
export const fonts = {
  // 基础字体大小
  sizes: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '32px',
    '5xl': '48px',
  },
  
  // 字体权重
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // 行高
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.4,
    relaxed: 1.625,
    loose: 2,
  },
  
  // 字体族
  families: {
    sans: '"Roboto", "Helvetica", "Arial", sans-serif',
    serif: '"Georgia", "Times New Roman", serif',
    mono: '"Courier New", "Monaco", monospace',
  },
  
  // 组件特定字体设置
  components: {
    // 普通节点
    node: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.4,
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    
    // 文本块/注释节点 - 字体大小加倍
    textBlock: {
      fontSize: '28px', // 14px * 2
      fontWeight: 400,
      lineHeight: 1.4,
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    
    // 输入框
    input: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.4,
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    
    // 菜单
    menu: {
      primary: {
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: 1.4,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      secondary: {
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: 1.4,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
    },
    
    // 面板
    panel: {
      title: {
        fontSize: '16px',
        fontWeight: 700,
        lineHeight: 1.4,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      content: {
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.4,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
    },
  },
};

export default fonts; 