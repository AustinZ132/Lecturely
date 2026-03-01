// components/icons/LecturelyIcon.tsx
import React from 'react';

const LecturelyIcon = ({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      {...props} 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 纯黑色背景块，确保在任何背景下都能呈现您要求的黑色背景 */}
      <rect width="100" height="100" fill="#000000" />
      
      {/* 几何加粗直角 L 主体，垂直笔触顶部体现麦克风元素 */}
      {/* 字体为白色 (#FFFFFF)，带来经典的科幻质感 */}
      <path 
        d="M 30 10 Q 30 5 35 5 H 45 Q 50 5 50 10 V 65 H 75 V 85 H 30 Z" 
        fill="#FFFFFF" 
      />
      
      {/* 麦克风网格和机身纹理 details, 提升科幻和具体感 */}
      <path 
        d="M 35 15 H 45 M 35 23 H 45 M 35 31 H 45 V 43 H 35 V 31" 
        stroke="#000000" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <circle cx="40" cy="15" r="3" fill="#000000" />
      
      {/* 模拟激光切割的转角细节 (镂空效果)，提升科幻感 */}
      <path 
        d="M 45 65 L 45 70 L 50 70 Z" 
        fill="#000000" 
      />
    </svg>
  );
};

export default LecturelyIcon;