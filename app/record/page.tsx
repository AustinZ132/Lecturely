"use client";
import LecturelyIcon from "../components/icons/LecturelyIcon";
import App from "../components/App"; // 确保路径对应你实际的 App.tsx 路径

const Home = () => {
  return (
    <>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-gray-900">
        
        {/* --- 顶部：你的专属标题栏 --- */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-gray-800/50 border-b border-gray-700 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <LecturelyIcon className="w-8 h-8" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
              Lecturely
            </h1>
          </div>
          <div className="text-sm font-medium text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
            Public Edition
          </div>
        </header>

        {/* --- 中间：核心转录界面 --- */}
        <main className="flex-1 relative overflow-hidden">
          <App />
        </main>

        {/* --- 底部：你的署名与致敬 (极简不打扰) --- */}
        <footer className="h-8 shrink-0 bg-gray-900 border-t border-gray-800 flex items-center justify-center z-10">
          <p className="text-xs text-gray-500 font-mono">
            Designed & Built by Gemini & Austin · Powered by Deepgram & DeepSeek
          </p>
        </footer>

      </div>
    </>
  );
};

export default Home;