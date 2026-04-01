# Figma 转代码全流程最佳实践指南

本指南整合了从 Figma 代码获取到项目集成的五个核心阶段，详细介绍了每个环节的执行标准、代码示例及核心原则，旨在帮助开发者高效、规范地完成视觉稿还原。

---

## 1. Figma 代码获取 (Code Retrieval)

调用 MCP `get_codes_by_figma_url` 工具，传递正确的 Figma 设计稿链接和主题名称，是获取高质量前端代码的第一步。

### 📋 步骤概述

开发者需要根据项目需求选择合适的主题名称，直接传递给 MCP 工具。目前可选的主题包括：`'fliggy'`, `'ae'`, `'lazada'`, `'gcash'`, `'aplus'`。

### ✅ 正确示例
```javascript
// 1. 调用 MCP 工具获取代码
const result = await get_codes_by_figma_url({
  figma_url: 'https://www.figma.com/file/abc123...',
  ...(theme ? { theme } : {}) // ✅ 仅在 theme 有值时传递参数
});
```

### 💡 关键要点
- **theme 参数格式**：直接传入主题名称字符串（如 `'ae'`, `'lazada'`, `'gcash'`, `'aplus'`, `'fliggy'`）。
- **空值处理**：如果 `theme` 为空字符串、`null` 或 `undefined`，**不应传递** `theme` 参数。

### 🔍 检查清单
- [ ] 是否已正确传入主题名称字符串？
- [ ] 若 `theme` 为空，是否已确保未传递该参数？

### 📎 多设计稿链接（相似模块）

当用户传入**多个** Figma 设计稿链接时，表示这些设计稿属于相似模块（如同一组件的不同状态、不同主题或不同分支）。流程如下：

1. **逐个获取代码**：对每个链接分别调用 `get_codes_by_figma_url`，为每个设计稿生成对应代码；`theme` 的传递规则与单链接一致。
2. **等待全部返回**：本地 agent 需收到所有链接的代码结果后，再执行下一步。
3. **智能合并**：对多份代码执行智能合并逻辑：
   - 对比多份代码的差异（如状态、分支、样式变体、文案等）。
   - 生成**一份**统一代码，通过条件渲染、props、配置或枚举等方式覆盖多种情况，避免产出多份重复文件。
   - 合并后的代码作为「一份设计稿」进入后续流程（标签转换、Token 替换、风格优化、项目集成）。
   - 合并的详细角色、约束、四步工作流、输出规范与质量检查清单见 [references/MULTI_LINK_MERGE.md](MULTI_LINK_MERGE.md)。

### 🔍 多链接检查清单
- [ ] 是否已对每个 figma_url 分别调用了 `get_codes_by_figma_url`？
- [ ] 是否在收到全部代码后才执行合并？
- [ ] 合并后的代码是否用一份文件/组件覆盖了多种变体？

---

## 2. 代码标签转换 (Tag Conversion)[可选]

在获取原始 React 代码后，针对特定框架（如 Rax）需要进行结构化的标签转换。

### ⚠️ 重要提示
**此步骤为可选步骤**，仅在项目类型为 Rax 时执行。

### ✅ 转换示例（React → Rax）

#### 转换前（React 标准代码）
```tsx
import React from 'react';
import './index.css';

interface Props {
  title: string;
  count: number;
}

const MyComponent: React.FC<Props> = ({ title, count }) => {
  return (
    <div className="container">
      <div className="header">
        <img src="logo.png" alt="Logo" className="logo" />
        <span className="title">{title}</span>
      </div>
      <div className="content">
        <span className="count">{count}</span>
      </div>
    </div>
  );
};

export default MyComponent;
```

#### 转换后（Rax 组件代码）
```tsx
import { createElement } from 'rax';
import View from 'rax-view';
import Text from 'rax-text';
import Image from 'rax-image';
import './index.css';

interface Props {
  title: string;
  count: number;
}

const MyComponent = ({ title, count }: Props) => {
  return (
    <View className="container">
      <View className="header">
        <Image source={{ uri: 'logo.png' }} className="logo" />
        <Text className="title">{title}</Text>
      </View>
      <View className="content">
        <Text className="count">{count}</Text>
      </View>
    </View>
  );
};

export default MyComponent;
```

### 🔍 检查清单
- [ ] (Rax 项目) 标签是否已完整转换为 Rax 组件（View, Text, Image 等）？

---

## 3. Token 替换 (Token Replacement)[可选]

将样式中的硬编码值（Hard-coded values）替换为主题配置中的 Token（根据 theme 参数匹配 `assets/` 文件夹下的 JSON 文件，例如 `fliggy` 匹配 `fliggy.json`），是确保 UI 一致性和可维护性的关键步骤。
fliggy
### 📋 核心原则
1. **类名优先原则**：若 Token 提供了 `className`，**必须**直接作用于 TSX/JSX 的类名属性上，CSS 中对应的硬编码属性应直接删除，不再使用 CSS 变量。
2. **按需替换**：若主题配置中无对应值且无对应类名，必须保留原始硬编码值，严禁伪造变量。
3. **精确匹配**：只有完全相等的值才进行替换。

### 🛠 替换规则与优先级
| 优先级 | Token 类型 | 主题配置示例 | 处理方式 |
| :--- | :--- | :--- | :--- |
| **1 (最高)** | **类名 Token** | `{ "typography": { "h1": { "className": "u-h1" } } }` | **TSX/JSX:** 添加 `class="u-h1"`<br>**CSS:** 删除对应硬编码属性 |
| **2** | **变量 Token** | `{ "colors": { "primary": "#F60" } }` | **CSS:** 使用 `var(--color-primary)` |

### ✅ 正确示例
**主题配置：**
```json
{
  "typography": { "title": { "className": "u-title", "value": "20px" } },
  "colors": { "brand": "#0F0F7F" }
}
```

**优化前：**
```jsx
// Index.jsx: <div className="text">标题</div>
// Index.less: .text { font-size: 20px; color: #0F0F7F; }
```

**优化后：**
```jsx
// Index.jsx: 类名 Token 优先添加
// <div className="text u-title">标题</div>

// Index.less: 变量替换，冗余属性删除
// .text { color: var(--color-brand); } // font-size 已被 u-title 覆盖，故删除
```

### ⚠️ 常见错误
- **重复定义**：在 TSX/JSX 应用了类名 Token 后，仍在 CSS 中保留对应的变量定义（如 `font-size: var(--font-title)`）。
- **忽略一致性**：如 `padding: 16px 20px;` 中仅部分值有 Token，建议整体保持硬编码以维持视觉比例。

### 🔍 检查清单
- [ ] **Token 优先**：带有 `className` 的 Token 是否已直接添加到组件标签上？
- [ ] **CSS 清理**：被类名 Token 覆盖的冗余 CSS 属性是否已删除？

---

## 4. 代码风格优化 (Style Optimization)

在保持功能和 Token 逻辑不变的前提下，调整代码风格以匹配项目的开发规范。

### ⚠️ 核心原则
- **逻辑锁定**：严禁修改任何业务逻辑、事件处理 or 有效功能内容。
- **Token 保护**：**绝对禁止修改 Token 类名**。Token 名称（如 `color-xxx`）在风格优化阶段必须保持原样，不得进行 kebab-case 或 BEM 转换。

### ✅ 优化示例

#### 示例 1: TypeScript 风格统一
```tsx
// 优化前 - 使用 type
type Props = { userName: string; userAge: number; };

// 优化后 - 统一使用 interface
interface Props {
  userName: string;
  userAge: number;
}
```

#### 示例 2: className 命名转换
```tsx
// 优化前 (小驼峰)
<div className="userCard">
  <span className="userName">{name}</span>
  {/* Token 类名保持不变 */}
  <div className="token-color-primary">内容</div>
</div>

// 优化后 (kebab-case / BEM)
<div className="user-card">
  <span className="user-card__name">{name}</span>
  {/* Token 类名严禁修改 */}
  <div className="token-color-primary">内容</div>
</div>
```

#### 示例 3: CSS Modules 转换
```tsx
// 优化前
import './index.css';
<div className="container"><span className="title">Hello</span></div>

// 优化后
import styles from './index.module.less';
<div className={styles.container}><span className={styles.title}>Hello</span></div>
```

### 💡 风格优化要点
1. **命名规范**：普通类名遵循项目约定（camelCase/kebab-case/BEM），Token 类名必须豁免。
2. **样式处理**：根据项目需求转换普通 CSS 为 CSS Modules。
3. **路径别名**：将相对路径转换为项目定义的别名（如 `../../components` → `@/components`）。

### 🔍 检查清单
- [ ] **Token 保护**：**所有的 Token 类名是否保持原始形态未被修改？**
- [ ] **风格统一**：类型定义 (Interface)、命名规范及路径别名是否符合项目要求？

---

## 5. 智能项目集成 (Project Integration)

根据代码功能智能确定存放位置，自动创建目录，并修正引用路径。

### 📋 核心流程
遵循项目既有约定，通常分为页面级和组件级。

### ✅ 目录结构规范
```text
src/
├── pages/ (或 views/)         ← 页面组件 (含路由、复杂布局、数据获取)
│   └── ProductDetail/
│       ├── index.tsx
│       ├── index.module.less
│       └── components/        ← 页面私有组件
├── components/                ← 公用组件 (高复用、功能单一)
│   └── Rating/
│       ├── index.tsx
│       └── index.module.less
└── utils/                     ← 工具函数
```

### 🛠 路径修正与冲突处理
- **导入路径修正**：自动将生成代码中的相对路径转换为别名路径。
- **样式引入**：确保组件与样式文件同级，统一使用 `./index.module.less` 形式引入。
- **冲突策略**：检测同名冲突，避免静默覆盖现有代码，必要时进行重命名（如 `ButtonV2`）。

### ❌ 避坑指南
1. **位置错放**：将独立页面错放在 `components/` 目录下。
2. **命名断裂**：未根据项目规范修正目录命名风格，导致一致性破坏。
3. **路径失效**：集成后未修正 `import` 导致编译失败。

### 🔍 检查清单
- [ ] **位置准确**：页面入 `pages/`，通用组件入 `components/`。
- [ ] **引用正确**：所有 `import` 路径（含别名）已修正，样式引用无误。
- [ ] **冲突处理**：是否已检测并妥善处理同名文件冲突？
- [ ] **功能验证**：视觉效果是否与原稿一致？渲染结果与逻辑是否完全符合预期？
