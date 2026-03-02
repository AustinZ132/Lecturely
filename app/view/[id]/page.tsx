"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getRecords, TranscriptionRecord } from "../../../lib/storage"; 
// 🚀 注意这里的相对路径跳了两层 (../../) 去找 app 目录下的 components
import LecturelyIcon from "../../components/icons/LecturelyIcon";

export default function ViewRecord() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<TranscriptionRecord | null>(null);

  useEffect(() => {
    const records = getRecords();
    const found = records.find(r => r.id === id);
    if (found) setRecord(found);
  }, [id]);

  const exportToTXT = () => {
    if (!record || record.content.length === 0) return;
    const textContent = record.content.map(item => 
      `英文: ${item.original}\n中文: ${item.translation}\n------------------------\n`
    ).join("");

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.title}.txt`;
    link.click();
  };

  if (!record) {
    return (
      <div className="h-screen bg-gray-950 text-white flex flex-col justify-center items-center antialiased">
        <div className="animate-spin text-4xl mb-4">🎙️</div>
        <p className="text-gray-400 font-medium tracking-widest animate-pulse">正在读取记忆晶体...</p>
      </div>
    );
  }

  return (
    // 强制满屏高度，隐藏外部滚动条
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col antialiased selection:bg-blue-500/30 overflow-hidden">
      
      {/* --- 统一的极客风顶部导航栏 --- */}
      <header className="w-full shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/40 backdrop-blur-md z-20 shadow-sm">
        
        {/* 左侧：Logo + 标题区 */}
        <div className="flex items-center space-x-3 md:space-x-4 overflow-hidden">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 shrink-0">
            <LecturelyIcon className="w-6 h-6 md:w-8 md:h-8" />
            <span className="hidden md:inline">Lecturely</span>
          </h1>
          
          <span className="hidden lg:inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            Public Edition
          </span>

          <span className="text-gray-700 font-bold mx-1 hidden md:inline-block shrink-0">|</span>
          
          {/* 当前记录信息 */}
          <div className="flex flex-col border-l border-gray-700/50 pl-3 md:pl-4 min-w-0">
            <span className="text-sm md:text-base font-bold text-gray-100 truncate max-w-[150px] md:max-w-xs lg:max-w-md" title={record.title}>
              {record.title}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 truncate">
              📁 {record.folder} · {record.date}
            </span>
          </div>
        </div>

        {/* 右侧：操作区 */}
        <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
          <Link 
            href="/" 
            className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700 px-3 py-2 rounded-lg border border-gray-700"
            title="返回资源管理器"
          >
            <span>⬅️</span> <span className="hidden md:inline">返回大厅</span>
          </Link>
          
          <button 
            onClick={exportToTXT}
            className="px-3 py-2 md:px-5 md:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg md:rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
          >
            <span>📥</span> <span className="hidden md:inline">导出 TXT</span>
          </button>
        </div>
      </header>

      {/* --- 中间：沉浸式阅读区 --- */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-32 w-full max-w-4xl mx-auto space-y-5 scroll-smooth relative">
        {/* 背景隐约的炫光特效 */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
        
        {record.content.map((item, index) => (
          <div 
            key={item.id} 
            className="relative z-10 p-5 md:p-6 rounded-2xl bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/30 transition-colors shadow-sm text-base md:text-lg group"
          >
            {/* 段落序号指示器 */}
            <div className="absolute -left-2 -top-2 bg-gray-900 text-gray-500 text-[10px] font-mono px-2 py-0.5 rounded-md border border-gray-800 opacity-50 group-hover:opacity-100 transition-opacity">
              #{index + 1}
            </div>
            
            <div className="mb-3 text-gray-300 leading-relaxed font-medium">
              {item.original}
            </div>
            <div className="border-t border-gray-700/50 pt-3 font-medium text-emerald-400/90 leading-relaxed">
              {item.translation}
            </div>
          </div>
        ))}
      </main>

      {/* --- 底部：专属署名 --- */}
      <footer className="w-full shrink-0 py-4 border-t border-gray-800/80 bg-gray-900/40 text-center z-20">
        <p className="text-[8px] md:text-sm text-gray-500 font-medium tracking-wide">
          Designed & Built by Gemini & Austin @ WKU · Powered by Deepgram & DeepSeek
        </p>
      </footer>
      
    </div>
  );
}

