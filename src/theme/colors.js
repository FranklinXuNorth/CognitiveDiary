// 暗蓝色主题颜色定义 - 使用RGB格式
export const colors = {
  // 主色调 - 蓝色系
  primary: {
    main: 'rgb(52, 144, 220)',      // 主蓝色
    light: 'rgb(102, 178, 255)',    // 亮蓝色
    dark: 'rgb(25, 118, 210)',      // 深蓝色
    contrastText: 'rgb(240, 248, 255)' // 浅蓝白色
  },
  
  // 次要色调 - 青色系
  secondary: {
    main: 'rgb(38, 166, 154)',      // 青绿色
    light: 'rgb(77, 208, 225)',     // 亮青色
    dark: 'rgb(0, 121, 107)',       // 深青色
    contrastText: 'rgb(240, 248, 255)' // 浅蓝白色
  },
  
  // 功能色调
  success: {
    main: 'rgb(76, 175, 80)',       // 绿色
    light: 'rgb(129, 199, 132)',    // 亮绿色
    dark: 'rgb(56, 142, 60)',       // 深绿色
    contrastText: 'rgb(240, 248, 255)' // 浅蓝白色
  },
  
  warning: {
    main: 'rgb(255, 193, 7)',       // 黄色
    light: 'rgb(255, 213, 79)',     // 亮黄色
    dark: 'rgb(255, 143, 0)',       // 深黄色
    contrastText: 'rgb(33, 47, 61)' // 深色文字
  },
  
  error: {
    main: 'rgb(244, 67, 54)',       // 红色
    light: 'rgb(239, 83, 80)',      // 亮红色
    dark: 'rgb(211, 47, 47)',       // 深红色
    contrastText: 'rgb(240, 248, 255)' // 浅蓝白色
  },
  
  info: {
    main: 'rgb(33, 150, 243)',      // 信息蓝
    light: 'rgb(100, 181, 246)',    // 亮信息蓝
    dark: 'rgb(25, 118, 210)',      // 深信息蓝
    contrastText: 'rgb(240, 248, 255)' // 浅蓝白色
  },
  
  // 背景色 - 暗蓝色主题
  background: {
    default: 'rgb(25, 35, 47)',     // 深蓝灰色背景
    paper: 'rgb(33, 47, 61)',       // 稍亮的蓝灰色
    contrast: 'rgb(220, 230, 240)'  // 对比色文字
  },
  
  // 文本色 - 亮灰色系
  text: {
    primary: 'rgb(220, 230, 240)',   // 亮灰色主要文字
    secondary: 'rgb(176, 190, 204)', // 次要文字
    disabled: 'rgb(120, 134, 148)',  // 禁用文字
    hint: 'rgb(148, 162, 176)'       // 提示文字
  },
  
  // 节点相关颜色 - 蓝灰色系
  node: {
    background: 'rgb(55, 71, 87)',       // 蓝灰色节点背景
    border: 'rgb(76, 97, 118)',          // 蓝灰色边框
    selected: 'rgb(52, 144, 220)',       // 选中蓝色
    locked: 'rgb(200, 210, 220)',        // 锁定灰白色边框
    lockedBackground: 'rgb(14, 27, 40)', // 锁定背景
    thinking: 'rgb(198, 115, 126)',      // 思考节点背景
    editing: 'rgb(50, 109, 183)',        // 编辑状态玫红色
    annotationBackground: 'rgb(255, 244, 138)', // 便签黄
    annotationText: 'rgb(0, 0, 0)' // 便签黑字
  },
  
  // 连接线颜色 - 浅蓝色系
  edge: {
    default: 'rgb(102, 178, 255)',   // 浅蓝色连线
    selected: 'rgb(255, 193, 7)',    // 选中黄色
    hover: 'rgb(144, 202, 249)'      // 悬停浅蓝色
  },
  
  // Handle颜色 - 蓝色系
  handle: {
    background: 'rgb(52, 144, 220)',     // 蓝色背景
    border: 'rgb(240, 248, 255)',        // 白色边框
    shadow: 'rgba(0, 0, 0, 0.4)'         // 阴影
  },
  
  // 输入框颜色 - 深蓝色系
  input: {
    background: 'rgb(44, 62, 80)',       // 深蓝色背景
    border: 'rgb(76, 97, 118)',          // 蓝灰色边框
    focus: 'rgb(52, 144, 220)',          // 聚焦蓝色
    shadow: 'rgba(0, 0, 0, 0.3)'         // 阴影
  },
  
  // 面板颜色 - 半透明深蓝
  panel: {
    background: 'rgba(33, 47, 61, 0.95)', // 半透明深蓝背景
    shadow: 'rgba(0, 0, 0, 0.4)',         // 深色阴影
    border: 'rgb(76, 97, 118)'            // 蓝灰色边框
  },
  
  // 高亮颜色
  highlight: {
    chain: 'rgb(255, 255, 255)' // 淡金色，用于链式查询高亮
  }
};

// ReactFlow画布背景色 - 暗蓝色
export const canvasColors = {
  background: 'rgb(44, 62, 80)',     // 深蓝灰色背景
  grid: 20
};

// 渐变色定义 - 暗蓝色主题
export const gradients = {
  primary: 'linear-gradient(135deg, rgb(52, 144, 220) 0%, rgb(102, 178, 255) 100%)',
  success: 'linear-gradient(135deg, rgb(76, 175, 80) 0%, rgb(129, 199, 132) 100%)',
  warning: 'linear-gradient(135deg, rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)',
  error: 'linear-gradient(135deg, rgb(244, 67, 54) 0%, rgb(239, 83, 80) 100%)'
};

// 阴影定义 - 加深阴影适应暗色主题
export const shadows = {
  small: '0 2px 4px rgba(0, 0, 0, 0.3)',
  medium: '0 4px 8px rgba(0, 0, 0, 0.4)',
  large: '0 8px 16px rgba(0, 0, 0, 0.5)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.6)',
  handle: '0 2px 4px rgba(0, 0, 0, 0.4)',
  panel: '0 8px 32px rgba(0, 0, 0, 0.6)',
  floating: '0 4px 20px rgba(0, 0, 0, 0.4)'
};

export default colors; 