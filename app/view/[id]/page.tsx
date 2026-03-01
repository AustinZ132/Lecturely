// 文件路径：app/view/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getRecords, TranscriptionRecord } from "../../../lib/storage"; // 注意这里的相对路径

export default function ViewRecord() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<TranscriptionRecord | null>(null);

  useEffect(() => {
    const records = getRecords();
    const found = records.find(r => r.id === id);
    if (found) setRecord(found);
  }, [id]);

  // 复用我们之前的导出功能
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
    return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">加载中或文件不存在...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      {/* 顶部工具栏 */}
      <div className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <Link href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 font-medium transition-colors">
            ⬅️ 返回主页
          </Link>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-100">{record.title}</h1>
            <span className="text-xs text-gray-500">归档于 {record.folder} · {record.date}</span>
          </div>
        </div>
        
        <button 
          onClick={exportToTXT}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md transition-all"
        >
          📥 导出文档 (TXT)
        </button>
      </div>

      {/* 沉浸式阅读区 (复用了你录音界面的样式) */}
      <div className="flex-1 overflow-y-auto px-8 pt-8 max-w-4xl mx-auto w-full space-y-4 pb-20">
        {record.content.map((item) => (
          <div key={item.id} className="p-4 rounded-xl bg-gray-800/60 border border-gray-700/50 shadow-sm text-[18px]">
            <div className="mb-2 text-gray-300">
              {item.original}
            </div>
            <div className="border-t border-gray-700/50 pt-2 font-medium text-green-400/90">
              {item.translation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}