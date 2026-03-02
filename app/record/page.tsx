"use client";
import LecturelyIcon from "../components/icons/LecturelyIcon";
import App from "../components/App"; 

const Home = () => {
  return (
    // 强制满屏高度 (h-screen) 并隐藏外部滚动条，确保只有 App 内部滚动
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col antialiased selection:bg-blue-500/30 overflow-hidden">
      
      {/* --- 统一的极客风顶部导航栏 --- */}
      <header className="w-full shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/40 backdrop-blur-md z-20 shadow-sm">
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Logo 区域 (保留了你自定义的 LecturelyIcon) */}
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <LecturelyIcon className="w-6 h-6 md:w-8 md:h-8" />
            Lecturely
          </h1>
          
          {/* Public Edition 专属高亮徽章 */}
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            Public Edition
          </span>
        </div>

        {/* 右侧：新增返回主页的快捷入口 */}
        <a 
          href="/" 
          className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700"
        >
          <span>🏠</span> <span className="hidden md:inline">返回大厅</span>
        </a>
      </header>

      {/* --- 中间：核心转录界面 --- */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <App />
      </main>

      {/* --- 底部：你的专属署名与致敬 --- */}
     <footer className="w-full py-6 border-t border-gray-800/80 bg-gray-900/40 text-center z-20 mt-auto">
        <p className="text-[10px] text-gray-500 font-medium tracking-wide">
          Designed & Built by Gemini & Austin @ WKU · Powered by Deepgram & DeepSeek
        </p>
      </footer>
      
    </div>
  );
};

export default Home;
