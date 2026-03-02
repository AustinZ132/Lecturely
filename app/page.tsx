"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecords, deleteRecord, deleteFolder, renameFolder, TranscriptionRecord } from "../lib/storage";

export default function Dashboard() {
  const [records, setRecords] = useState<TranscriptionRecord[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null); // null 表示在根目录

  useEffect(() => {
    setRecords(getRecords());
  }, []);

  // 计算当前拥有的所有文件夹及其包含的文件数
  const folderStats = records.reduce((acc, record) => {
    acc[record.folder] = (acc[record.folder] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const folders = Object.keys(folderStats);

  // 文件夹操作
  const handleRenameFolder = (e: React.MouseEvent, oldName: string) => {
    e.stopPropagation(); // 阻止点击事件穿透到进入文件夹
    const newName = window.prompt(`重命名文件夹 "${oldName}" 为：`, oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
      renameFolder(oldName, newName.trim());
      setRecords(getRecords()); // 刷新
    }
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderName: string) => {
    e.stopPropagation();
    if (window.confirm(`⚠️ 危险操作：确定要删除文件夹 "${folderName}" 及其内部的 ${folderStats[folderName]} 条记录吗？此操作不可恢复！`)) {
      deleteFolder(folderName);
      setRecords(getRecords()); // 刷新
    }
  };

  // 文件操作
  const handleDeleteRecord = (id: string) => {
    if (window.confirm("确定要永久删除这条记录吗？")) {
      deleteRecord(id);
      setRecords(getRecords());
    }
  };

  return (
    // 统一暗黑背景与抗锯齿字体
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col antialiased selection:bg-blue-500/30">
      
      {/* 统一的极客风顶部导航栏 */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/40 backdrop-blur-md z-20 shadow-sm">
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Logo 区域 */}
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="text-blue-500 text-2xl md:text-3xl">🎙️</span> Lecturely
          </h1>
          
          {/* Public Edition 专属高亮徽章 */}
          <span className="hidden md:inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            Public Edition
          </span>

          <span className="text-gray-700 font-bold mx-1 hidden md:inline-block">|</span>
          
          <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
            资源管理器
          </span>
        </div>

        {/* 右侧核心按钮 */}
        <Link 
          href="/record" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 md:px-6 md:py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <span>🚀</span> <span className="hidden md:inline">启动转录引擎</span><span className="md:hidden">新建</span>
        </Link>
      </header>

      {/* 页面核心主功能区 */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-8 relative">
        {/* 背景隐约的炫光特效 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />

        <div className="relative z-10">
          {/* 路径导航面包屑 */}
          <div className="flex items-center space-x-2 mb-8 text-lg font-medium">
            <button 
              onClick={() => setCurrentFolder(null)} 
              className={`transition-colors flex items-center gap-2 ${currentFolder === null ? "text-gray-100" : "text-gray-500 hover:text-blue-400"}`}
            >
              <span>🏠</span> 我的转录
            </button>
            {currentFolder && (
              <>
                <span className="text-gray-600">/</span>
                <span className="text-blue-400 flex items-center gap-2"><span>📁</span> {currentFolder}</span>
              </>
            )}
          </div>

          {/* 视图一：根目录 (显示文件夹) */}
          {currentFolder === null && (
            folders.length === 0 ? (
              <div className="text-center py-24 bg-gray-900/40 rounded-3xl border border-gray-800/80 border-dashed backdrop-blur-sm">
                <div className="text-6xl mb-4 opacity-50">📂</div>
                <p className="text-gray-400 mb-2 text-lg">这里空空如也</p>
                <p className="text-gray-500 text-sm">点击右上角启动引擎，开始你的第一节课！</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {folders.map((folder) => (
                  <div 
                    key={folder} 
                    onClick={() => setCurrentFolder(folder)}
                    className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all shadow-sm cursor-pointer group flex flex-col items-center relative"
                  >
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform drop-shadow-lg">📁</div>
                    <h3 className="text-lg font-bold text-gray-100 truncate w-full text-center">{folder}</h3>
                    <p className="text-sm text-gray-500 mt-1 bg-gray-900/50 px-3 py-1 rounded-full">{folderStats[folder]} 个文件</p>
                    
                    {/* 悬浮操作栏 */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <button onClick={(e) => handleRenameFolder(e, folder)} className="bg-gray-900/80 p-2 rounded-lg hover:text-blue-400 transition-colors" title="重命名">✏️</button>
                      <button onClick={(e) => handleDeleteFolder(e, folder)} className="bg-gray-900/80 p-2 rounded-lg hover:text-red-400 transition-colors" title="删除">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* 视图二：文件夹内部 (显示文件卡片) */}
          {currentFolder !== null && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {records.filter(r => r.folder === currentFolder).map((record) => (
                <div key={record.id} className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-emerald-500/40 hover:bg-gray-800/80 transition-all shadow-sm relative group">
                  <h3 className="text-lg font-bold text-gray-100 mb-2 truncate pr-8" title={record.title}>
                    📄 {record.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6 font-mono">{record.date}</p>
                  
                  <div className="flex items-center justify-between border-t border-gray-700/50 pt-4 mt-auto">
                    <span className="text-xs font-medium text-gray-500 bg-gray-900/60 px-2 py-1 rounded-md">
                      共 {record.content.length} 段对话
                    </span>
                    <div className="flex space-x-3 items-center">
                      <Link href={`/view/${record.id}`} className="text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors">
                        查看详情 →
                      </Link>
                      <button 
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-500/50 hover:text-red-400 text-sm font-bold transition-colors p-1"
                        title="删除记录"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 统一底部署名 (Footer) */}
      <footer className="w-full py-6 border-t border-gray-800/80 bg-gray-900/40 text-center z-20 mt-auto">
        <p className="text-sm text-gray-500 font-medium tracking-wide">
          Developed with ❤️ at Wenzhou-Kean University
        </p>
      </footer>
      
    </div>
  );
}
