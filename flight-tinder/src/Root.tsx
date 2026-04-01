import React from "react";
import { Composition } from "remotion";
import { FloatToMktTransition } from "./FloatToMktTransition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/*
        Float to Mkt Transition 动画
        - 分辨率：1920x1080
        - 帧率：30fps
        - 总时长：约 5 秒（3 秒保持 + 0.8 秒过渡 + 余量）
      */}
      <Composition
        id="FloatToMktTransition"
        component={FloatToMktTransition}
        durationInFrames={150} // 5 秒 @ 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};

export default RemotionRoot;
