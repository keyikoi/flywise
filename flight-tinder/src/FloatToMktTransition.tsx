import React, { CSSProperties } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
  AbsoluteFill,
} from "remotion";

// ============ 设计令牌（来自 Figma）============
const colors = {
  white: "#ffffff",
  darkGray: "#0f131a",
  midGray: "#5c5f66",
  brandYellow: "#ffe033",
  brandGreen: "#149aa8",
};

// Float 条初始位置
const floatBar = {
  top: 110,
  width: 714,
  height: 130,
  borderRadius: 24,
};

// Mkt 条目标位置
const mktBar = {
  top: 632,
  left: 18,
  width: 714,
  height: 72,
  borderRadius: 12,
};

// ============ 红包图标组件 ============
const RedPacketIcon: React.FC<{ size: number; opacity: number }> = ({
  size,
  opacity,
}) => (
  <div
    style={{
      width: size,
      height: size,
      position: "relative",
      opacity,
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)`,
        borderRadius: size * 0.15,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: size * 0.1,
          left: "50%",
          transform: "translateX(-50%)",
          width: size * 0.4,
          height: size * 0.4,
          background: "radial-gradient(circle, #ffd700 0%, #ffb700 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: size * 0.15,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: size * 0.25,
          color: "#ffd700",
          fontWeight: "bold",
        }}
      >
        福
      </div>
    </div>
  </div>
);

// ============ 小图标组件 ============
const SmallIcon: React.FC<{ size: number; opacity: number }> = ({
  size,
  opacity,
}) => (
  <div
    style={{
      width: size,
      height: size,
      position: "relative",
      opacity,
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)`,
        borderRadius: size * 0.2,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
      }}
    >
      💰
    </div>
  </div>
);

// ============ 箭头图标组件 ============
const ArrowIcon: React.FC<{ opacity: number }> = ({ opacity }) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    style={{ opacity }}
  >
    <path
      d="M9 18l6-6-6-6"
      stroke={colors.darkGray}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============ 关闭按钮组件 ============
const CloseButton: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      width: 48,
      height: 48,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity,
    }}
  >
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke={colors.midGray}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

// ============ 主过渡组件 ============
export const FloatToMktTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 动画时间点定义
  const HOLD_DURATION = 3; // 保持 3 秒
  const TRANSITION_DURATION = 0.8; // 过渡 0.8 秒

  const holdFrames = HOLD_DURATION * fps;
  const transitionStartFrame = holdFrames;
  const transitionEndFrame = holdFrames + TRANSITION_DURATION * fps;

  // 过渡进度（0-1），使用 cubic-bezier 实现丝滑效果
  const progress = interpolate(
    frame,
    [transitionStartFrame, transitionEndFrame],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  // ============ 位置插值 ============
  // 垂直移动：从 110px 到 632px
  const currentTop = interpolate(progress, [0, 1], [floatBar.top, mktBar.top]);

  // 水平移动：从居中到 left: 18px
  // 初始居中位置：(1920 - 714) / 2 = 603px
  const initialLeft = (1920 - floatBar.width) / 2;
  const currentLeft = interpolate(progress, [0, 1], [initialLeft, mktBar.left]);

  // ============ 尺寸插值 ============
  const currentHeight = interpolate(
    progress,
    [0, 1],
    [floatBar.height, mktBar.height]
  );

  const currentBorderRadius = interpolate(
    progress,
    [0, 1],
    [floatBar.borderRadius, mktBar.borderRadius]
  );

  // ============ 图标大小插值 ============
  const iconSize = interpolate(progress, [0, 1], [82, 40]);

  // ============ 文字透明度插值（交叉淡入淡出）============
  // Float 条内容淡出
  const floatContentOpacity = interpolate(
    frame,
    [transitionStartFrame, transitionStartFrame + 0.4 * fps],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Mkt 条内容淡入
  const mktContentOpacity = interpolate(
    frame,
    [transitionStartFrame + 0.2 * fps, transitionStartFrame + 0.6 * fps],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // ============ 按钮/箭头插值 ============
  // 黄色按钮淡出
  const buttonOpacity = interpolate(
    frame,
    [transitionStartFrame, transitionStartFrame + 0.3 * fps],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // 关闭按钮淡出
  const closeBtnOpacity = interpolate(
    frame,
    [transitionStartFrame, transitionStartFrame + 0.3 * fps],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // 箭头图标淡入
  const arrowOpacity = interpolate(
    frame,
    [transitionEndFrame - 0.3 * fps, transitionEndFrame],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // 容器样式
  const containerStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f0f4f8 0%, #d9e4f0 100%)",
  };

  // 动态条样式
  const barStyle: CSSProperties = {
    position: "absolute",
    top: currentTop,
    left: currentLeft,
    width: floatBar.width,
    height: currentHeight,
    backgroundColor: colors.white,
    borderRadius: currentBorderRadius,
    boxShadow: "0px 12px 40px rgba(0, 0, 0, 0.16)",
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    gap: "18px",
    overflow: "hidden",
    transition: "none", // 由 Remotion 控制动画
  };

  return (
    <AbsoluteFill style={containerStyle}>
      {/* 背景航班信息页模拟 */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%)",
        }}
      >
        {/* 模拟航班列表内容 */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 168,
            right: 168,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 120,
                background: "white",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      {/* 浮动的条 */}
      <div style={barStyle}>
        {/* 左侧图标区域 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: iconSize,
            height: iconSize,
            flexShrink: 0,
          }}
        >
          {/* 红包图标（float 状态） */}
          <div style={{ position: "absolute", opacity: floatContentOpacity }}>
            <RedPacketIcon size={iconSize} opacity={1} />
          </div>
          {/* 小图标（mkt 状态） */}
          <div style={{ position: "absolute", opacity: mktContentOpacity }}>
            <SmallIcon size={iconSize} opacity={1} />
          </div>
        </div>

        {/* 中间文字区域 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            overflow: "hidden",
          }}
        >
          {/* Float 条文字 */}
          <div
            style={{
              opacity: floatContentOpacity,
              transition: "opacity 0.3s",
            }}
          >
            <div
              style={{
                fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                fontSize: 32,
                fontWeight: 500,
                color: colors.darkGray,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
              }}
            >
              航班历史低价
            </div>
            <div
              style={{
                fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                fontSize: 24,
                fontWeight: 400,
                color: colors.midGray,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
              }}
            >
              当前为价格低点 建议尽快预订
            </div>
          </div>

          {/* Mkt 条文字 */}
          <div
            style={{
              position: "absolute",
              opacity: mktContentOpacity,
              transition: "opacity 0.3s",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                fontSize: 28,
                fontWeight: 500,
                color: colors.brandGreen,
                whiteSpace: "nowrap",
              }}
            >
              历史低价
            </div>
            <div
              style={{
                fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                fontSize: 24,
                fontWeight: 400,
                color: colors.darkGray,
                whiteSpace: "nowrap",
              }}
            >
              当前价格是该航班近期低价，建议尽快预订
            </div>
          </div>
        </div>

        {/* 右侧黄色按钮（float 状态） */}
        <div
          style={{
            opacity: buttonOpacity,
            transition: "opacity 0.3s",
          }}
        >
          <div
            style={{
              height: 60,
              padding: "0 24px",
              backgroundColor: colors.brandYellow,
              borderRadius: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                fontSize: 28,
                fontWeight: 500,
                color: colors.darkGray,
                whiteSpace: "nowrap",
              }}
            >
              看趋势
            </span>
          </div>
        </div>

        {/* 右侧箭头图标（mkt 状态） */}
        <div style={{ opacity: arrowOpacity, transition: "opacity 0.3s" }}>
          <ArrowIcon opacity={1} />
        </div>

        {/* 关闭按钮（float 状态） */}
        <div
          style={{
            opacity: closeBtnOpacity,
            transition: "opacity 0.3s",
          }}
        >
          <CloseButton opacity={1} />
        </div>
      </div>

      {/* 调试信息 */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          fontFamily: "monospace",
          fontSize: 12,
          color: "#666",
          background: "rgba(255,255,255,0.8)",
          padding: "8px 12px",
          borderRadius: 8,
        }}
      >
        Frame: {frame} | Progress: {progress.toFixed(2)} | Top:{" "}
        {currentTop.toFixed(0)}px | Height: {currentHeight.toFixed(0)}px
      </div>
    </AbsoluteFill>
  );
};

export default FloatToMktTransition;
