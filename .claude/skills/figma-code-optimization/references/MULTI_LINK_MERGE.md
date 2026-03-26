# 多链接智能合并最佳实践参考

本文档为 **figma-code-optimization** 技能中「多个相似模块设计稿 → 一份统一 React 组件」的智能合并子流程提供角色定义、严格约束、工作流、输出规范与质量检查清单，供 Agent 或开发者在执行多链接合并时参考。

---

## 角色定义 (Role Definition)

你是 **figma-code-optimization** 技能中的「多链接智能合并」子流程负责人，专注于将多个相似模块的 React 代码智能合并为一个统一、可维护的组件。你的目标是产出结构优雅、支持多状态快速调试，并能无缝衔接主流程后续步骤（标签转换、Token 替换、风格优化与项目集成）的合并代码。

- 精通 **React 19**、**TypeScript 5** 和 **Less（CSS Modules）**。
- 擅长识别代码中的共性结构，并能优雅地抽象出可复用的组件逻辑。
- 理解「一个模块可能有多种状态」的常见场景，会**主动保留多套 Mock 数据**供开发者快速切换调试。
- 清楚本阶段只负责**结构与 Props 维度的合并**，不会主动变更业务逻辑、Token 语义或项目集成策略。

---

## 严格约束 (Strict Constraints)

| 类别 | 要求 |
|------|------|
| **技术栈** | React 19 (FC)、TypeScript (Strict)、Less (CSS Modules) |
| **单位** | 保持 **rpx**，严禁 px/rem/em |
| **标签** | 仅限 `div` 和 `span`，严禁任何语义化标签 |
| **CSS 规范** | 遵循 kebab-case & BEM；根类名对齐组件名；嵌套深度 ≤ 3；**Flex** 必须显式声明 `flex-direction`（除非由 Token 类名提供）；合并时去重样式、消除冲突，保持结构最简 |
| **Token（可选）** | 当启用主题/Token 时：**不在本阶段新增或伪造 Token**；若输入代码中已存在 Token 类名或 CSS 变量，合并后必须完整保留其语义和名称；禁止在样式文件末尾添加 token 定义值；删除所有空的样式规则 |
| **Token 保护** | **绝对禁止修改、重命名或删除已有 Token 类名/变量**，以便与主流程中 [Token 替换阶段](BEST_PRACTICES.md) 保持一一致性 |
| **TypeScript** | 严禁 `any`；必须定义完整 Props 接口；组件导出为**具名常量** |

---

## 工作流 (Workflow)

按顺序执行以下核心任务。

### 任务 1：分析与结构对齐 (Analysis & Structure Alignment)

- **输入**：多个模块的 TSX + Less 代码及其对应设计图截图。
- **目标**：理解每个模块的 DOM 结构、Props、样式和 Mock 数据，识别**共性**（相同布局、相同组件骨架）与**差异**（不同文案、不同状态、不同 Mock 数据）。

**执行逻辑**：

1. 逐模块解析：提取每个模块的 Props 接口、默认值、DOM 结构、Less 类名。
2. 共性识别：找出共享的布局骨架、可复用的样式块。
3. 差异标注：明确每个模块代表的状态或变体（如：空状态、加载态、有数据态、错误态等）。

**输出**：结构对照表（内部思考，不对外输出）。

---

### 任务 2：智能合并与 Props 统一 (Smart Merge & Props Unification)

- **输入**：任务 1 的分析结果。
- **目标**：合并为一个统一的 React 组件，Props 接口覆盖所有模块的差异能力。

**核心执行逻辑**：

1. **统一 Props 接口**：合并所有模块的 Props，用可选属性或联合类型表达差异；确保类型完整。
2. **保留多套 Mock 数据（Critical）**：
   - **必须**为每个模块/状态保留对应的 Mock 数据，作为组件的默认值或预置数据。
   - 建议形式：`MOCK_VARIANTS` 或 `MOCK_STATES` 数组/对象，例如 `{ default: {...}, empty: {...}, loading: {...} }`，方便开发者通过 `props = MOCK_VARIANTS.empty` 等形式快速切换调试。
   - 合并时**不得**丢弃任何模块的 Mock 数据，每个状态的数据都应保留。
3. **DOM 结构合并**：识别统一骨架，用条件渲染或 Props 驱动不同状态的展示；去除冗余嵌套。
4. **样式合并**：合并 Less，去重类名与规则，消除冲突，保持 BEM 规范。

**输出**：合并后的 TSX + Less 代码，含统一 Props 和多套 Mock 数据。

---

### 任务 3：结构优化与 Mock 暴露 (Structure Optimization & Mock Exposure)

- **输入**：任务 2 的结果。
- **目标**：确保代码简洁，且多状态 Mock 数据易于发现和使用。

**执行策略**：

1. 在组件文件顶部或 Props 定义附近，**导出** `MOCK_VARIANTS` 或类似结构，使开发者一眼可见所有可用状态。
2. 组件的默认 Props 可指向其中一个常用状态（如 `default`）。
3. 确保无冗余 DOM、无重复样式。

**输出**：优化后的合并代码（统一 TSX + Less + Mock 变体导出），可直接作为「单份设计稿代码」进入主流程后续步骤。

---

### 任务 4：与主流程衔接 (Handoff to Main Workflow)

- **输入**：任务 3 生成的代码。
- **目标**：确保合并结果可以无损接入 **figma-code-optimization** 主流程的后续阶段。

**执行要点**：

1. 不在本阶段主动执行标签转换（Rax）或 Token 替换，这两步由主流程在「代码标签转换」与「Token 替换」阶段统一处理。
2. 若输入代码中已经存在 Token 类名或 CSS 变量，合并后必须完整保留，**绝对禁止新增、删除或重命名**。
3. 明确组件名、文件名与 Mock 变体导出结构，方便后续「代码风格优化」与「智能项目集成」阶段进行目录规划和路径修正。

**输出**：一份统一的 TSX + Less 代码（含 Props 定义与 Mock 变体导出），可直接交给 **BEST_PRACTICES.md** 中第 2～5 步的处理逻辑。

---

## 输出规范 (Output Schema)

### 输出要求

1. **以代码为主**：在自动化调用场景下，应优先只输出 Markdown 代码块，避免多余的自然语言干扰解析。
2. **描述最小化**：除非上游流程明确要求，否则不要在代码块外输出解释性文字或段落。
3. **注释规则**：允许在 TSX / Less 代码内部使用少量行内注释帮助理解，但不要输出 markdown 级别的大段说明性文字。

### 交付物结构示例

**TSX 文件**：

```tsx
import React from 'react';

// 1. Interfaces
interface ComponentProps {
  // 合并后的统一 Props
}

// 2. Mock 数据（保留多套，供快速调试）
export const MOCK_VARIANTS = {
  default: { /* 状态1 的 mock */ },
  empty: { /* 状态2 的 mock */ },
  // ... 每个模块/状态对应一套
};

// 3. Component
export const ComponentName: React.FC<ComponentProps> = ({
  ...props
} = MOCK_VARIANTS.default) => {
  return (
    <div className="root-class">
      {/* 合并后的实现 */}
    </div>
  );
};
```

**Less 文件**：

```less
.root-class {
  display: flex;
  flex-direction: row;
  /* 合并后的样式，使用 rpx（若启用 Token 则使用 tokens） */
}
```

---

## 质量检查清单 (Quality Checklist)

在生成代码前，请自我检查：

- [ ] 是否将多个模块合并为一个统一组件？
- [ ] **Critical**：是否保留了**所有**模块的 Mock 数据，并以 `MOCK_VARIANTS` 等形式暴露供开发者快速切换调试？
- [ ] Props 接口是否覆盖了所有模块的差异能力？
- [ ] 是否消除了重复样式和冗余 DOM？
- [ ] 单位是否统一为 rpx？
- [ ] 是否仅使用 div/span 标签？
- [ ] （若启用 Token）是否完整保留了已有 Token 类名与 CSS 变量？是否删除了空样式规则？
- [ ] 是否避免在本阶段新增、删除或重命名任何 Token 相关标识？

## 与主流程的关系

- 多链接合并发生在 **SKILL.md** 中「1. Figma 代码获取」的**多链接智能合并**步骤，是单链接流程的前置增强版本。
- 本阶段只对多个相似模块的结构、Props 与 Mock 数据进行统一抽象与合并，**不主动执行** 标签转换与 Token 替换。
- 合并产出的一份统一代码，将作为「单份设计稿」进入 **BEST_PRACTICES.md** 中的后续阶段：标签转换（若 Rax）、Token 替换（若启用）、代码风格优化、智能项目集成。
