"use client";

import {
  createClient,
  LiveClient,
  LiveConnectionState,
  LiveTranscriptionEvents,
  type LiveSchema,
  type LiveTranscriptionEvent,
} from "@deepgram/sdk";

import {
  createContext,
  useContext,
  useState,
  useRef, // 🚀 引入 useRef
  ReactNode,
  FunctionComponent,
} from "react";

interface DeepgramContextType {
  connection: LiveClient | null;
  connectToDeepgram: (options: LiveSchema, endpoint?: string) => Promise<void>;
  disconnectFromDeepgram: () => void;
  connectionState: LiveConnectionState;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(
  undefined
);

interface DeepgramContextProviderProps {
  children: ReactNode;
}

// 这是你服务器生成兜底临时 Token 的接口
const getToken = async (): Promise<string> => {
  const response = await fetch("/api/authenticate", { cache: "no-store" });
  const result = await response.json();
  return result.access_token;
};

const DeepgramContextProvider: FunctionComponent<
  DeepgramContextProviderProps
> = ({ children }) => {
  const [connection, setConnection] = useState<LiveClient | null>(null);
  const [connectionState, setConnectionState] = useState<LiveConnectionState>(
    LiveConnectionState.CLOSED
  );

  // 🚀 核心修复 2：断网/休眠自动重连的状态记录器
  const lastOptionsRef = useRef<{ options: LiveSchema; endpoint?: string } | null>(null);
  const isIntentionalCloseRef = useRef<boolean>(false);

  /**
   * Connects to the Deepgram speech recognition service and sets up a live transcription session.
   */
  const connectToDeepgram = async (options: LiveSchema, endpoint?: string) => {
    // 每次连接时，记录最新的配置参数，并将“主动断开”标志重置
    lastOptionsRef.current = { options, endpoint };
    isIntentionalCloseRef.current = false;

    const customKey = typeof window !== "undefined" ? localStorage.getItem("LecSync_DG_Key") : null;
    let deepgram;

    if (customKey && customKey.trim() !== "") {
      const apiKey = customKey.trim();
      console.log("🟢 [Public Edition] 正在使用用户自定义的 Deepgram Key");
      deepgram = createClient(apiKey); 
    } else {
      const tempToken = await getToken();
      console.log("🟡 [Default] 正在使用服务器兜底的 Deepgram Token");
      deepgram = createClient({ accessToken: tempToken });
    }

    const conn = deepgram.listen.live(options, endpoint);

    conn.addListener(LiveTranscriptionEvents.Open, () => {
      setConnectionState(LiveConnectionState.OPEN);
      console.log("🚀 Deepgram 连接已建立！");
    });

    conn.addListener(LiveTranscriptionEvents.Close, () => {
      setConnectionState(LiveConnectionState.CLOSED);
      console.log("🛑 Deepgram 连接已关闭。");

      // 🚀 核心修复 2：休眠或断网导致被动掉线时，触发自动重连机制
      if (!isIntentionalCloseRef.current) {
        console.warn("⚠️ 监测到非预期的连接断开 (可能是断网或设备休眠)，3秒后尝试自动重连...");
        setTimeout(() => {
          // 确保在等待期间用户没有手动点击结束，再执行重连
          if (lastOptionsRef.current && !isIntentionalCloseRef.current) {
            console.log("🔄 正在执行断线重连...");
            connectToDeepgram(lastOptionsRef.current.options, lastOptionsRef.current.endpoint);
          }
        }, 3000);
      }
    });

    conn.addListener(LiveTranscriptionEvents.Error, (err) => {
      console.error("❌ Deepgram WebSocket 错误拦截:", err);
      // 注意：这里的错误最终也会导致触发 Close 事件，所以重连逻辑交给 Close 事件统一处理即可
    });

    setConnection(conn);
  };

  const disconnectFromDeepgram = async () => {
    // 明确标记：这是用户点击按钮主动触发的断开（比如结束转录或更改设置），不需要自动重连！
    isIntentionalCloseRef.current = true;
    if (connection) {
      connection.finish();
      setConnection(null);
    }
  };

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram(): DeepgramContextType {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error(
      "useDeepgram must be used within a DeepgramContextProvider"
    );
  }
  return context;
}

export {
  DeepgramContextProvider,
  useDeepgram,
  LiveConnectionState,
  LiveTranscriptionEvents,
  type LiveTranscriptionEvent,
};
