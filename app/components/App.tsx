"use client";
import { saveRecord, getRecords } from '../../lib/storage';
import { useEffect, useRef, useState } from "react";
import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "../context/DeepgramContextProvider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "../context/MicrophoneContextProvider";

interface HistoryItem {
  id: string;
  original: string;
  translation: string;
}

const App: () => JSX.Element = () => {
  // Basic state management
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentText, setCurrentText] = useState<string>(""); 
  const [interimText, setInterimText] = useState<string>(""); 
  const currentTextRef = useRef<string>(""); 
  
  const [liveTranslation, setLiveTranslation] = useState<string>("");
  
  // Translation fragments buffer to prevent UI flickering
  const liveChunksRef = useRef<string[]>([]);
  
  // Abort controller to cancel outdated translation streams when a new paragraph starts
  const paragraphAbortControllerRef = useRef<AbortController | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // --- 智能滚动相关状态与引用 ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true); // 控制是否跟随最新进度滚动
  
  const [fontSize, setFontSize] = useState<number>(18);

  // Control panel state
  const [isPaused, setIsPaused] = useState(false);

  // Toggle pause/resume recording
  const togglePause = () => {
    if (isPaused) {
      microphone?.resume();
      setIsPaused(false);
    } else {
      microphone?.pause();
      setIsPaused(true);
    }
  };
 
  // Audio source selection (hydration safe)
  const [isMounted, setIsMounted] = useState(false);
  const [audioSource, setAudioSource] = useState<'mic' | 'system'>('mic');

  // Custom API keys (BYOK)
  const [deepseekKey, setDeepseekKey] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("LecSync_DS_Key") || "";
    return "";
  });
  const [deepgramKey, setDeepgramKey] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("LecSync_DG_Key") || "";
    return "";
  });

  useEffect(() => {
    setIsMounted(true);
    const savedSource = localStorage.getItem("LecSync_AudioSource") as 'mic' | 'system';
    if (savedSource) {
      setAudioSource(savedSource);
    }
  }, []);

  // Export transcription history to TXT
  const exportToTXT = () => {
    if (history.length === 0) {
      alert("目前还没有转录内容哦！");
      return;
    }
    
    const textContent = history.map(item => 
      `英文: ${item.original}\n中文: ${item.translation}\n------------------------\n`
    ).join("");

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/[\/:]/g, '-');
    link.download = `课堂转录_${dateStr}.txt`;
    link.click();
  };

  // Save modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveFolder, setSaveFolder] = useState("");
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);

  // Prepare saving process and open modal
  const handleEndRecordingClick = () => {
    const pendingText = (currentTextRef.current + " " + interimText).trim();

    if (history.length === 0 && !pendingText) {
      alert("当前没有录制到任何内容！");
      window.location.href = '/';
      return;
    }

    if (pendingText) {
      const uniqueId = Date.now().toString() + Math.random().toString().slice(2, 6);
      
      setHistory((prev) => [...prev, { 
        id: uniqueId, 
        original: pendingText, 
        translation: liveTranslation || "已归档" 
      }]);
      
      if (!liveTranslation) {
        handleTranslate(pendingText, uniqueId);
      }
      
      currentTextRef.current = "";
      setCurrentText("");
      setInterimText("");
      setLiveTranslation("");
    }

    const records = getRecords();
    const folders = Array.from(new Set(records.map(r => r.folder)));
    setAvailableFolders(folders.length > 0 ? folders : ["默认分类", "专业课", "英语"]);

    const defaultDate = new Date().toLocaleString('zh-CN', { hour12: false });
    setSaveTitle(`课堂笔记_${defaultDate}`);
    setSaveFolder(folders.length > 0 ? folders[0] : "默认分类");

    if (!isPaused) togglePause();
    
    setIsSaveModalOpen(true);
  };

  const confirmSave = () => {
    microphone?.stop();
    disconnectFromDeepgram();

    const finalTitle = saveTitle.trim() || `课堂笔记_${new Date().toLocaleString('zh-CN', { hour12: false })}`;
    const finalFolder = saveFolder.trim() || "默认分类";

    saveRecord({
      id: Date.now().toString(),
      title: finalTitle,
      folder: finalFolder,
      date: new Date().toLocaleString('zh-CN', { hour12: false }),
      content: history,
    });

    exportToTXT();
    setIsSaveModalOpen(false);
    window.location.href = '/'; 
  };

  // Deepgram configurations (cached in local storage)
  const [dgConfig, setDgConfig] = useState(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("LecSync_Config");
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    }
    return {
      model: "nova-3",
      interim_results: true,
      smart_format: true,
      endpointing: 700,  // 默认中间值 700
      utterance_end_ms: 2000, // 默认中间值 2000
      diarize: false, 
      punctuate: true,
      profanity_filter: false,
      dictation: false,
      numerals: true,
    };
  });

  const { connection, connectToDeepgram, disconnectFromDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, microphoneState } = useMicrophone();
  const keepAliveInterval = useRef<any>();

  useEffect(() => {
    setupMicrophone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram(dgConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState]);

  const applyNewConfig = () => {
    localStorage.setItem("LecSync_Config", JSON.stringify(dgConfig));
    localStorage.setItem("LecSync_DS_Key", deepseekKey.trim());
    localStorage.setItem("LecSync_DG_Key", deepgramKey.trim());
    
    window.location.reload(); 
  };

  // Translate finalized sentences
  const handleTranslate = async (textToTranslate: string, targetId: string) => {
    if (!textToTranslate.trim()) return;
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey.trim()}`
        },
        body: JSON.stringify({ text: textToTranslate })
      });
   
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
    
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read() || {};
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.trim() === "" || line.startsWith('data: [DONE]')) continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              accumulated += data.choices[0]?.delta?.content || "";
              setHistory(prev => prev.map(item => 
                item.id === targetId ? { ...item, translation: accumulated } : item
              ));
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      setHistory(prev => prev.map(item => item.id === targetId ? { ...item, translation: "[翻译失败]" } : item));
    }
  };

  // Translate real-time fragments (interim results)
  const handleChunkTranslate = async (chunkText: string, chunkIndex: number) => {
    if (!chunkText.trim()) return;
    
    if (!paragraphAbortControllerRef.current) {
      paragraphAbortControllerRef.current = new AbortController();
    }
    const signal = paragraphAbortControllerRef.current.signal;

    try {
      // 通过控制请求头部和保活机制，榨干浏览器的并发潜力
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey.trim()}`,
          'Connection': 'keep-alive'
        },
        body: JSON.stringify({ text: chunkText }),
        signal: signal
      });

    if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
   
      let currentChunkText = "";
      let buffer = "";

      while (true) {
        if (signal.aborted) break;

        const { done, value } = await reader.read() || {};
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "" || line.startsWith('data: [DONE]')) continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              currentChunkText += data.choices[0]?.delta?.content || "";
              
              if (!signal.aborted) {
                liveChunksRef.current[chunkIndex] = currentChunkText;
                setLiveTranslation(liveChunksRef.current.join("")); 
              }
            } catch (e) {}
          }
        }
      }
    } catch (error: any) {
      // Ignore abort errors implicitly
    }
  };

  useEffect(() => {
    if (!microphone) return;
    if (!connection) return;

    const onData = (e: BlobEvent) => {
      if (e.data.size > 0) connection?.send(e.data);
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let transcript = data.channel.alternatives[0].transcript;

      if (transcript !== "") {
        if (speechFinal) {
          const finalStr = (currentTextRef.current + " " + transcript).trim();
          const uniqueId = Date.now().toString() + Math.random().toString().slice(2, 6);
          
          setHistory((prev) => [...prev, { id: uniqueId, original: finalStr, translation: "..." }]);
          handleTranslate(finalStr, uniqueId); 

          currentTextRef.current = "";
          setCurrentText("");
          setInterimText("");
          setLiveTranslation("");
          liveChunksRef.current = []; 
          
          if (paragraphAbortControllerRef.current) {
            paragraphAbortControllerRef.current.abort(); 
          }
          paragraphAbortControllerRef.current = new AbortController(); 

        } else if (isFinal) {
          currentTextRef.current = (currentTextRef.current + " " + transcript).trim();
          setCurrentText(currentTextRef.current);
          setInterimText(""); 
          
          const chunkIndex = liveChunksRef.current.length;
          liveChunksRef.current.push(""); 
          handleChunkTranslate(transcript, chunkIndex);
        } else {
          setInterimText(transcript);
        }
      }
    };

    const onError = (err: any) => {
      console.warn("Deepgram background error (ignored):", err);
    };

    if (connectionState === LiveConnectionState.OPEN) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      connection.addListener(LiveTranscriptionEvents.Error, onError); 
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);
      startMicrophone();
    }

    return () => {
      // prettier-ignore
      connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      connection.removeListener(LiveTranscriptionEvents.Error, onError); 
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  useEffect(() => {
    if (!connection) return;
    if (microphoneState !== MicrophoneState.Open && connectionState === LiveConnectionState.OPEN) {
      connection.keepAlive();
      keepAliveInterval.current = setInterval(() => { connection.keepAlive(); }, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }
    return () => clearInterval(keepAliveInterval.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState, connectionState]);

  // --- 滚动事件监听：判断用户是否往回滑了 ---
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // 如果距离底部超过 150px，说明用户在往回看，关闭自动滚动
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setIsAutoScroll(isAtBottom);
  };

  // --- 自动滚动逻辑：只有在 isAutoScroll 为 true 时才滚动到底部 ---
  useEffect(() => {
    if (isAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, currentText, interimText, liveTranslation, isAutoScroll]); 

  return (
    <div className="flex flex-col h-full w-full antialiased bg-transparent relative overflow-hidden">
      
      {/* Toolbar */}
      <div className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/40 z-20 shadow-sm shrink-0">
        
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            ⚙️ 参数设置
          </button>

          <button 
            onClick={() => {
              const newSource = audioSource === 'mic' ? 'system' : 'mic';
              localStorage.setItem("LecSync_AudioSource", newSource);
              window.location.reload(); 
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm border border-gray-600 ${
              audioSource === 'system' 
                ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
           {!isMounted ? '...' : (audioSource === 'mic' ? '🎙️ 麦克风' : '💻 系统内录')}
          </button>
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={togglePause}
            className={`px-6 py-2 rounded-xl font-bold transition-all shadow-md ${
              isPaused 
                ? "bg-green-500 hover:bg-green-400 text-white animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
                : "bg-yellow-600 hover:bg-yellow-500 text-white"
            }`}
          >
            {isPaused ? "▶ 继续转录" : "⏸ 暂停转录"}
          </button>

          <button 
            onClick={exportToTXT}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md"
          >
            📥 导出 TXT
          </button>

          <button 
            onClick={handleEndRecordingClick}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-md"
          >
            ⏹ 结束转录
          </button>
        </div>
        <div className="w-[120px]"></div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-20 left-6 z-40 bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 w-80 max-h-[80vh] overflow-y-auto flex flex-col space-y-4">
          <h3 className="text-white font-bold text-lg border-b border-gray-700 pb-2">设置</h3>

          <div className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
            <h4 className="text-sm font-bold text-blue-400 mb-2">🔑 Public Edition (自带秘钥)</h4>
            <div className="flex flex-col">
              <label className="text-gray-400 text-xs mb-1">Deepgram API Key (语音识别)</label>
              <input 
                type="password" 
                value={deepgramKey} 
                onChange={(e) => setDeepgramKey(e.target.value)} 
                className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:border-blue-500 outline-none" 
                placeholder="在此输入您的 Deepgram Key..."
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-400 text-xs mb-1">DeepSeek API Key (AI 翻译)</label>
              <input 
                type="password" 
                value={deepseekKey} 
                onChange={(e) => setDeepseekKey(e.target.value)} 
                className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded text-sm focus:border-blue-500 outline-none" 
                placeholder="在此输入您的 DeepSeek Key..."
              />
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">秘钥仅安全地存储在您本机的浏览器缓存中，不会上传至任何第三方服务器。</p>
          </div>
          
          <div className="border-t border-gray-700 my-2"></div>
          
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-gray-300 text-sm mb-1 flex items-center">
                全局字号大小: {fontSize}px
              </label>
              <input type="range" min="14" max="36" step="1" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="accent-blue-500" />
            </div>

            <div className="flex flex-col">
              <label className="text-gray-300 text-sm mb-1 flex items-center">
                Endpointing (停顿断句): {dgConfig.endpointing}ms
                <span className="cursor-help text-gray-400 hover:text-white transition-colors text-xs ml-2 bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center" title="检测到多长时间的语音停顿后进行一次短句切分。调小此数值（如700ms）能极大地加快字幕翻译响应速度。">❓</span>
              </label>
              <input type="range" min="100" max="1500" step="50" value={dgConfig.endpointing} onChange={(e) => setDgConfig({...dgConfig, endpointing: Number(e.target.value)})} className="accent-blue-500" />
            </div>
            
            <div className="flex flex-col">
              <label className="text-gray-300 text-sm mb-1 flex items-center">
                Utterance End (静音断句): {dgConfig.utterance_end_ms}ms
                <span className="cursor-help text-gray-400 hover:text-white transition-colors text-xs ml-2 bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center" title="检测到长时间静音后，强制结束并归档当前一整段话。">❓</span>
              </label>
              <input type="range" min="1000" max="3000" step="100" value={dgConfig.utterance_end_ms} onChange={(e) => setDgConfig({...dgConfig, utterance_end_ms: Number(e.target.value)})} className="accent-blue-500" />
            </div>
          </div>

          <div className="border-t border-gray-700 my-2"></div>

          <div className="space-y-3">
            {[
              { key: 'smart_format', label: '智能格式化', tip: '自动将日期、时间、标点等格式化为易读排版' },
              { key: 'punctuate', label: '自动标点', tip: '根据语调自动推断并添加逗号、句号和问号' },
              { key: 'numerals', label: '数字格式化', tip: '将发音的英文数字(two)自动转为阿拉伯数字(2)' },
            ].map((item) => (
              <label key={item.key} className="flex items-center cursor-pointer group">
                <input type="checkbox" checked={dgConfig[item.key as keyof typeof dgConfig] as boolean} onChange={(e) => setDgConfig({...dgConfig, [item.key]: e.target.checked})} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                <span className="text-gray-300 text-sm ml-3">{item.label}</span>
                <span className="cursor-help text-gray-500 group-hover:text-gray-300 transition-colors text-[10px] ml-2" title={item.tip}>❓</span>
              </label>
            ))}
          </div>

          <button onClick={applyNewConfig} className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold transition-colors shadow-lg">
            保存并重新连接
          </button>
        </div>
      )}

      {/* Main Transcription Display with Scroll Listener */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-col flex-auto overflow-y-auto px-8 pt-8 max-w-4xl mx-auto w-full space-y-4 pb-32 scroll-smooth relative"
      >
        {history.map((item, index) => {
          const isLatest = index === history.length - 1;
          return (
            <div 
              key={item.id} 
              style={{ fontSize: `${fontSize}px` }}
              className={`p-4 rounded-xl shadow-md transition-all duration-500 ${
                isLatest ? 'bg-gray-800 border-l-4 border-blue-500' : 'bg-gray-800/60'
              }`}
            >
              <div className="mb-2 text-gray-400 leading-relaxed font-medium">
                {item.original}
              </div>

              <div className={`border-t border-gray-700/50 pt-2 font-medium leading-relaxed ${isLatest ? 'text-gray-100' : 'text-gray-400'}`}>
                {item.translation === "..." ? (
                  <span className="animate-pulse text-gray-500">正在精校翻译...</span>
                ) : (
                  item.translation
                )}
              </div>
            </div>
          );
        })}

        {(currentText || interimText) && (
          <div 
            style={{ fontSize: `${fontSize}px` }}
            className="bg-gray-800 border-l-4 border-blue-400 p-5 rounded-xl shadow-lg mt-2 relative overflow-hidden"
          >
            <div className="mb-3 text-[0.9em] text-gray-400 leading-relaxed font-medium">
              <span>{currentText} </span>
              <span className="text-gray-300 font-semibold">{interimText}</span>
            </div>
            
            {(liveTranslation || currentText) && (
              <div className="border-t border-gray-600/50 pt-3 text-[1.25em] font-black text-white tracking-wide drop-shadow-md">
                {liveTranslation ? liveTranslation : <span className="animate-pulse text-gray-500 tracking-widest text-[0.8em]">同步翻译中...</span>}
              </div>
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-1 w-full" />
      </div>

      {/* 悬浮的“回到最新”按钮 */}
      {!isAutoScroll && (
        <button
          onClick={() => {
            setIsAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-600/90 hover:bg-blue-500 text-white px-6 py-3 rounded-full shadow-[0_4px_20px_rgba(37,99,235,0.4)] backdrop-blur z-30 flex items-center gap-2 transition-all font-bold text-sm"
        >
          👇 回到实时位置
        </button>
      )}

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <h2 className="text-2xl font-bold text-white mb-6">💾 保存课堂档案</h2>

            <div className="mb-5">
              <label className="block text-gray-400 text-sm font-medium mb-2">档案名称</label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="请输入课程或讲座名称..."
              />
            </div>

            <div className="mb-8">
              <label className="block text-gray-400 text-sm font-medium mb-2">📁 归档位置</label>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={saveFolder}
                  onChange={(e) => setSaveFolder(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="在此输入新文件夹名..."
                />
                <button
                  onClick={() => setSaveFolder("")}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors border border-gray-600 shadow-sm whitespace-nowrap"
                  title="清空并准备输入新文件夹名"
                >
                  ➕ 新建
                </button>
              </div>
              
              {availableFolders.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">或快速选择已有分类：</div>
                  <div className="flex flex-wrap gap-2">
                    {availableFolders.map(folder => (
                      <button
                        key={folder}
                        onClick={() => setSaveFolder(folder)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          saveFolder === folder
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                            : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white'
                        }`}
                      >
                        📁 {folder}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setIsSaveModalOpen(false);
                  if (isPaused) togglePause(); 
                }}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmSave}
                className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all"
              >
                💾 确认归档
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default App;
