import Link from 'next/link';

export default function Home() {
  return (
    // 统一暗黑背景与抗锯齿字体
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col antialiased selection:bg-blue-500/30">
      
      {/* 顶部导航栏 (与录音页统一风格) */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/40 backdrop-blur-md z-20 shadow-sm">
        <div className="flex items-center space-x-4">
          {/* Logo 区域 */}
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="text-blue-500 text-3xl">🎙️</span> Lecturely
          </h1>
          
          {/* Public Edition 专属高亮徽章 */}
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            Public Edition
          </span>
        </div>

        {/* 右侧占位或留作他用 */}
        <div className="text-sm text-gray-400 font-medium">
          v1.0.0
        </div>
      </header>

      {/* 页面主视觉区域 (Hero Section) */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* 背景炫光特效 (增加科技感) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6 z-10">
          全语境智能课堂助理
        </h2>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 z-10 leading-relaxed">
          实时双语转录、智能防空指针断句、毫秒级云端处理。为你打破语言壁垒，不错过课堂上的每一个重要细节。
        </p>

        {/* 核心入口按钮 (指向你的录音页) */}
        <Link
          href="/record" 
          className="z-10 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1"
        >
          🚀 启动转录引擎 (Launch App)
        </Link>
      </main>

      {/* 统一底部署名 (Footer) */}
      <footer className="w-full py-6 border-t border-gray-800/80 bg-gray-900/40 text-center z-20">
        <p className="text-sm text-gray-500 font-medium tracking-wide">
          Developed with ❤️ at Wenzhou-Kean University
        </p>
      </footer>
      
    </div>
  );
}
