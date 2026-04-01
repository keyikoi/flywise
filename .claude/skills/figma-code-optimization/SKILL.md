---
name: figma-code-optimization
description: 通过 Figma 设计稿链接快速获取高质量的前端代码，并将其高质量地集成到本项目中
version: 1.1.0
---

# Figma Code Optimization

## 概述

此技能旨在帮助开发者通过 Figma 设计稿链接快速获取高质量的前端代码，并将其高质量地集成到本项目中。确保生成的代码能跑通，而且符合项目的规范标准。

## 核心流程 (Workflow)

核心流程分为以下5个步骤。详细指南参考 [references/BEST_PRACTICES.md](references/BEST_PRACTICES.md)

### 1. Figma 代码获取 (Figma Code Retrieval)

- **入参准备与调用**：获取 Figma URL（可为单个或多个）。若用户传入多个设计稿链接，表示这几个设计稿为相似模块，需按多链接流程处理。确定主题名称（可选，默认 `theme = null`，由用户指定）。
- **获取代码**：
  - **单链接**：调用 MCP 工具 `get_codes_by_figma_url` 一次，传入正确的 `figma_url`；若 `theme` 有值则传递 `theme`，否则不传递。等待工具返回代码后进入后续流程。
  - **多链接（相似模块）**：对每一个设计稿链接逐个调用 `get_codes_by_figma_url`，为每个链接生成对应代码；`theme` 规则同上。等待所有调用完成并收到全部代码结果。
- **多链接智能合并**：仅当存在多个链接时执行。本地 agent 在收到所有链接的代码之后，执行智能合并逻辑：对比多份代码的差异（如状态、分支、样式变体等），生成**一份**统一代码，用条件、配置或 props 等方式覆盖多种情况/变体，避免重复文件。合并完成后再进入步骤 2（标签转换）及后续流程。合并时的角色、约束、工作流与输出规范见 [references/MULTI_LINK_MERGE.md](references/MULTI_LINK_MERGE.md)。

### 2. 代码标签转换 (Tag Conversion) [可选]


- **项目类型识别**：首先检查当前项目是否为 Rax 项目。通过读取项目根目录下的 `package.json` 文件，检查 `dependencies` 或 `devDependencies` 中是否包含 `rax` 相关依赖。
- **标签转换**：如果确认为 Rax 项目，则需要将生成的 React 标准标签转换为 Rax 标签。

### 3. Token 替换检查 (Token Replacement Check) [可选]

- **执行条件**：此步骤为可选步骤，仅当用户使用了主题配置（theme 参数）时执行；当 `theme` 为 `null` 或未传入时，视为未使用主题，可跳过此步骤。
- **替换处理**：检查生成的样式文件中的硬编码值，查找主题配置中是否有对应的 token。

### 4. 代码风格优化 (Code Style Optimization)

- **风格适配**：仅修改代码风格以匹配项目规范。包括但不限于：类型定义，命名规范，样式处理
- **内容保持**：**严禁修改代码的有效功能内容**。确保转换后的逻辑与原始生成代码完全一致。

### 5. 智能项目集成 (Smart Project Integration)

- **位置识别**：根据代码功能（页面或组件）智能确定在项目中的存放位置（如 `src/pages/` 或 `src/components/`）。
- **文件注入**：自动创建必要的目录 and 文件，并将优化后的代码插入。
- **引用处理**：自动修正文件间的 import 路径，确保新插入的代码能无缝运行。
- **最终验证**：确保插入后的页面或组件在开发环境下能顺利编译并运行，无控制台报错。
