// 文件路径：app/page.tsx
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
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <header className="flex items-center justify-between mb-8 max-w-5xl mx-auto border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400 tracking-tight">
            Lecturely 资源管理器
          </h1>
        </div>
        <Link href="/record" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all">
          <span>🎙️</span> 开始新转录
        </Link>
      </header>

      <main className="max-w-5xl mx-auto">
        {/* 路径导航面包屑 */}
        <div className="flex items-center space-x-2 mb-8 text-lg font-medium">
          <button 
            onClick={() => setCurrentFolder(null)} 
            className={`transition-colors ${currentFolder === null ? "text-gray-100" : "text-gray-500 hover:text-blue-400"}`}
          >
            🏠 我的转录
          </button>
          {currentFolder && (
            <>
              <span className="text-gray-600">/</span>
              <span className="text-blue-400">📁 {currentFolder}</span>
            </>
          )}
        </div>

        {/* 视图一：根目录 (显示文件夹) */}
        {currentFolder === null && (
          folders.length === 0 ? (
            <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed">
              <p className="text-gray-500 mb-4 text-lg">暂无文件夹</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {folders.map((folder) => (
                <div 
                  key={folder} 
                  onClick={() => setCurrentFolder(folder)}
                  className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-750 transition-all shadow-sm cursor-pointer group flex flex-col items-center relative"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📁</div>
                  <h3 className="text-lg font-bold text-gray-100 truncate w-full text-center">{folder}</h3>
                  <p className="text-sm text-gray-500 mt-1">{folderStats[folder]} 个文件</p>
                  
                  {/* 悬浮操作栏 */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                    <button onClick={(e) => handleRenameFolder(e, folder)} className="bg-gray-900/80 p-1.5 rounded-md hover:text-blue-400" title="重命名">✏️</button>
                    <button onClick={(e) => handleDeleteFolder(e, folder)} className="bg-gray-900/80 p-1.5 rounded-md hover:text-red-400" title="删除">🗑️</button>
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
              <div key={record.id} className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-green-500/50 transition-colors shadow-sm relative group">
                <h3 className="text-lg font-bold text-gray-100 mb-2 truncate pr-8" title={record.title}>
                  📄 {record.title}
                </h3>
                <p className="text-sm text-gray-500 mb-6">{record.date}</p>
                
                <div className="flex items-center justify-between border-t border-gray-700/50 pt-4">
                  <span className="text-xs text-gray-400">共 {record.content.length} 条对话</span>
                  <div className="flex space-x-4">
                    {/*  核心：点击查看详情 */}
                    <Link href={`/view/${record.id}`} className="text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors">
                      查看内容
                    </Link>
                    <button 
                      onClick={() => handleDeleteRecord(record.id)}
                      className="text-red-500/70 hover:text-red-500 text-sm font-medium transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}