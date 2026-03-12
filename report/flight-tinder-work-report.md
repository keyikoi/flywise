# Flight Tinder 项目工作报告

**项目日期**: 2026-03-11
**项目类型**: MVP 原型开发
**技术栈**: React + Vite + Tailwind CSS v4 + Framer Motion

---

## 项目概述

开发一个 Tinder 风格的航班/目的地探索应用，用户通过左右滑动卡片的方式浏览和收藏航班推荐。

---

## 完整对话记录

### 1. 项目启动与需求讨论

**用户提示词**:
> 我希望和你一起 vibe coding。我是一个 UXUI 设计师，代码不会，对视觉审美要求高

**工作内容**:
- 确认合作模式：用户负责视觉设计决策，我负责代码实现
- 了解用户背景：UX/UI 设计师，高视觉审美要求

---

**用户提示词**:
> 我们来头脑风暴一下，我有一个 vibe coding 的想法，核心是以 tinder 那种滑动的卡片交互，卡片的内容是航班卡片，卡片上面会有起降时间 机票价格，图形化的。更进一步 maybe 就是做个 tinder 版的选航班，比如你输入自己的偏好，从目的地和航班的各种纬度都给你匹配。你从专业角度帮我想想，最开始的 mvp 版本可以实现核心功能

**工作内容**:
- 分析产品概念：Tinder for Flights
- 确定 MVP 功能优先级：
  - **Must Have**: 航班卡片展示、滑动交互、已保存列表
  - **Should Have**: 简单筛选、卡片细节展开
  - **Could Have**: 智能匹配算法、多维度偏好设置
- 推荐技术栈：React + Tailwind + Framer Motion

---

### 2. 视觉风格与技术确认

**用户提示词**:
> 首先我想在手机上看，技术实现你建议哪个就哪个，希望效果好，然后方案上目的地是不确定的，目的地也是选航班的一个纬度。卡片上我希望有跟目的地相关的插图。目前想的是 airbnb 风格插画，把当地有特色的场景/名胜做成偏向 3d 风格的视觉。另外我也可以给你一些视觉输入，那我要怎么给你发图片呢？

**工作内容**:
- 确认移动端优先策略
- 确定目的地插图方案：MVP 使用 emoji + 渐变背景占位
- 告知用户可以直接发送图片（拖拽/粘贴/上传）

---

### 3. 视觉参考与完整流程设计

**用户提示词**:
> 视觉风格参考 hinge 和 bumble，然后在开始推荐航班之前也像 dating app 一样引导用户输入一些偏好，但是是旅行偏好，比如目的，比如对目的地的喜好，比如对人数或者家庭出行之类的限制性要求，我希望这样的页面在 demo 里面可以有 2-3 个，结束之后开始出目的地航班卡片推荐，卡片里除了 airbnb 风格的插图，下面的航班信息需要包括日期、OD、起降时间、价格（最好有一点对于当前价格的描述，是高是低之类的），还有什么你可以想想，就是让用户对航班和目的地都能够有个种草的原因。然后最开始需要引导用户左滑是下一个，右滑是收藏该航班，交互跟我发你的有一张图类似。右滑的话希望有个爱心的动效或者加入购物车的动效。

**工作内容**:
- 分析 Hinge/Bumble 设计语言：大标题、圆角按钮、进度指示器、温暖配色
- 设计完整用户流程（3 页 Onboarding + 滑动主界面）
- 设计航班卡片信息结构
- 初始化项目并启动开发服务器

**核心代码改动**:
```jsx
// 创建项目
npm create vite@latest flight-tinder -- --template react
npm install framer-motion lucide-react clsx tailwind-merge
npm install -D @tailwindcss/vite tailwindcss postcss autoprefixer
```

---

### 4. 样式问题修复

**用户提示词**:
> 现在所有样式都没有生效，打开来只看到文字和符号

**工作内容**:
- 诊断问题：Tailwind v4 需要 `@tailwindcss/vite` 插件
- 修复 `vite.config.js` 配置

**核心代码改动**:
```javascript
// vite.config.js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

---

### 5. 滚动问题修复（第 2 页）

**用户提示词**:
> 现在样式生效了，但是当我滑到第二个页面，整个页面的向下滑动有问题，'预算范围？'以下的内容展示不出来，请修复滑动 bar

**工作内容**:
- 修复 `OnboardingPage2` 布局：添加可滚动容器
- 使用 `flex-1 overflow-y-auto` 和 `flex-shrink-0` 分离固定区域和滚动区域

**核心代码改动**:
```jsx
// OnboardingPage2 结构
<div className="flex flex-col h-full">
  <div className="flex-shrink-0">进度条 + 标题</div>
  <div className="flex-1 overflow-y-auto scrollbar-hide">
    {/* 可滚动内容 */}
  </div>
  <div className="flex-shrink-0">底部按钮</div>
</div>
```

---

### 6. 滚动问题修复（第 3 页）

**用户提示词**:
> 第三页的滑动仍然是错误的，请检查所有页面的滑动 bar

**工作内容**:
- 修复 `OnboardingPage3` 布局：同样的滚动容器结构
- 统一三页 Onboarding 的布局模式

---

### 7. 滑动页面问题反馈

**用户提示词**:
> 现在我进入了划屏配对机票的界面，有几个问题：
> 1. 没有滑动条，当整个页面的高度不够时，下面的两个按钮展示不全
> 2. 要实现划屏的功能，目前机票卡片不能左右滑动也没有动效，我要的是像 tinder 一样，右滑喜欢，左滑 pass
> 3. 右上角的喜欢按钮不能点击，不知道你有没有真的做收藏列表的页面

**工作内容**:
- 制定修复计划（3 个问题）
- 添加 `useMotionValue`, `useTransform`, `animate` 导入

---

### 8. 拖动功能初步实现

**用户提示词**:
> 现在不仅按钮没了，左右划动也没反应。请把按钮加回来，然后联网搜索类似 tinder 卡片左右滑动的样式代码，修复你的代码

**工作内容**:
- 搜索 Framer Motion Tinder 卡片实现参考
- 修复 `dragConstraints` 配置问题
- 添加拖动指示器（收藏/跳过标签）
- 实现底部操作按钮

**核心代码改动**:
```jsx
// DraggableCard 拖动逻辑
const x = useMotionValue(0)
const rotate = useTransform(x, [-200, 200], [-25, 25])
const likeOpacity = useTransform(x, [0, 150], [0, 1])
const nopeOpacity = useTransform(x, [0, -150], [0, 1])

const handleDragEnd = (_, info) => {
  const threshold = 100
  if (info.offset.x > threshold) {
    animate(x, 500, {
      type: 'spring',
      stiffness: 500,
      damping: 30,
      onComplete: () => onSwipe('right')
    })
  } else if (info.offset.x < -threshold) {
    animate(x, -500, { ... })
  } else {
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
  }
}
```

---

### 9. 滑动消失逻辑修复

**用户提示词**:
> 现在能滑动了，但还是有问题，最上层卡片被拖拽后没有消失，即使拖拽到屏幕最左边也没有消失，请实现松手后卡片消失并判定为喜欢或跳过的逻辑。松手后它应该立即消失，下层取消灰色

**工作内容**:
- 第一次尝试：修改 `handleDragEnd` 的 `onComplete` 回调
- 问题：卡片飞出后没有正确移除

---

**用户提示词**:
> 还是有问题：首先，下层卡片应该一开始设置 opacity:0.5，当上层卡片被彻底移出后再移除灰色效果；2、目前还是移动不出去，在 onComplete 回调触发 onSwipe 时，最上层卡片依然存在。请检查你的指针操作，是不是在滑动时先把指针指向了第二张卡片，目前的状况是第一张卡片滑动后没有被消失，反而是第二张卡片消失了

**工作内容**:
- 根本问题诊断：更新 `currentIndex` 导致 React 重新渲染，而不是让滑动的卡片完成动画后移除
- 解决方案：使用 `cardId` 追踪卡片，配合 `AnimatePresence` 管理卡片生命周期

**核心代码改动**:
```jsx
// SwipePage - 使用 cardId 追踪
const handleSwipe = (cardId, direction) => {
  if (direction === 'right') {
    const flight = flights.find(f => f.id === cardId)
    setSaved(prev => [...prev, flight])
  }
  setSwipedCards(prev => new Set(prev).add(cardId))
  setTimeout(() => setCurrentIndex(prev => prev + 1), 300)
}

// 获取可见卡片
const visibleCards = []
for (let i = 0; i < 2 && currentIndex + i < flights.length; i++) {
  visibleCards.push({ flight, destination, isTop: i === 0 })
}

// AnimatePresence 管理卡片
<AnimatePresence>
  {visibleCards.map(({ flight, destination, isTop }) => (
    <DraggableCard
      key={flight.id}
      flight={flight}
      destination={destination}
      onSwipe={handleSwipe}
      isTopCard={isTop}
      cardId={flight.id}
    />
  ))}
</AnimatePresence>
```

---

### 10. 图层顺序修复

**用户提示词**:
> 很好，现在滑动已经生效了，但是图层关系有问题，顶层卡片应该在第二张卡片的上方。现在虽然第二张卡片有 50 的透明度，但是它处于顶层卡片的上方，导致还没有滑动的时候就能看到下层卡片。请修复

**工作内容**:
- 添加 `zIndex` 区分图层
- 调整渲染顺序：先渲染下层卡片，再渲染顶层卡片

**核心代码改动**:
```jsx
// DraggableCard - 添加 zIndex
<motion.div
  style={{
    x,
    rotate,
    zIndex: isTopCard ? 10 : 1
  }}
  animate={isTopCard ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0.5 }}
>

// SwipePage - 调整渲染顺序
{/* 先渲染下层卡片（在底层） */}
{visibleCards.filter(c => !c.isTop).map(...)}
{/* 再渲染顶层卡片（在上层） */}
{visibleCards.filter(c => c.isTop).map(...)}
```

---

## 功能清单

### ✅ 已完成功能

| 模块 | 功能 | 状态 |
|------|------|------|
| Onboarding | 兴趣选择页（选 5 个标签） | ✅ |
| Onboarding | 出行设置页（同行人数 + 预算） | ✅ |
| Onboarding | 出发地设置页（城市 + 日期偏好） | ✅ |
| 主界面 | 可拖拽航班卡片 | ✅ |
| 主界面 | 左滑跳过/右滑收藏 | ✅ |
| 主界面 | 拖动指示器（收藏/跳过标签） | ✅ |
| 主界面 | 底部操作按钮 | ✅ |
| 主界面 | 卡片飞出动画 | ✅ |
| 主界面 | 下层卡片预览（半透明） | ✅ |
| 收藏列表 | 查看已收藏航班 | ✅ |
| 收藏列表 | 从主界面入口进入 | ✅ |
| 视觉 | Hinge/Bumble 风格 | ✅ |
| 视觉 | 响应式移动端布局 | ✅ |

---

## 项目文件结构

```
flight-tinder/
├── src/
│   ├── App.jsx          # 主应用（所有组件）
│   ├── index.css        # Tailwind + 自定义样式
│   └── main.jsx         # 入口文件
├── vite.config.js       # Vite 配置（含 Tailwind 插件）
├── package.json
└── index.html
```

---

## 下一步建议

### 短期优化
1. **真实航班数据**: 接入 AviationStack 或 Skyscanner API
2. **目的地插图**: 替换 emoji 为 Airbnb 风格 3D 插画
3. **收藏管理**: 添加删除、排序功能
4. **动效增强**: 爱心粒子爆炸效果

### 长期功能
1. **智能推荐算法**: 基于用户偏好匹配目的地
2. **多维度筛选**: 价格范围、飞行时长、转机次数
3. **价格追踪**: 历史价格曲线、降价提醒
4. **分享功能**: 分享收藏的航班给朋友

---

## 技术要点总结

### Framer Motion 核心 API
- `useMotionValue`: 创建可动画的运动值
- `useTransform`: 将一个运动值映射到另一个
- `animate`: 命令式动画控制
- `AnimatePresence`: 处理组件进入/退出动画
- `drag`: 拖动手势支持

### Tailwind CSS v4 新特性
- 使用 `@import "tailwindcss"` 替代传统指令
- 需要 `@tailwindcss/vite` 插件
- 默认使用 OKLCH 色域

### 移动端优化
- `-webkit-tap-highlight-color: transparent` 移除点击高亮
- `touchAction: 'none'` 优化触摸响应
- `safe-area-inset-bottom` 适配 iPhone 刘海

---

**报告生成时间**: 2026-03-11
**项目状态**: MVP 原型完成，可正常运行
