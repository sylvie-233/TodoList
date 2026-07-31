/**
 * 前端表单校验规则集（配合 Vant Form 组件使用）
 */

export const rules = {
  required: (label = '此项') => ({
    required: true,
    message: `请输入${label}`,
  }),

  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '请输入有效的邮箱地址',
  },

  minLength: (min: number) => ({
    validator: (val: string) => val.length >= min,
    message: `至少输入 ${min} 个字符`,
  }),

  maxLength: (max: number) => ({
    validator: (val: string) => val.length <= max,
    message: `最多输入 ${max} 个字符`,
  }),

  passwordMatch: (password: string) => ({
    validator: (val: string) => val === password,
    message: '两次输入的密码不一致',
  }),
};
