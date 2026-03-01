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

  /**
   * Connects to the Deepgram speech recognition service and sets up a live transcription session.
   */
  const connectToDeepgram = async (options: LiveSchema, endpoint?: string) => {
    // 🚀 BYOK 核心拦截逻辑：优先读取用户在设置面板填写的独立 Key
    let token = "";
    const customKey = typeof window !== "undefined" ? localStorage.getItem("LecSync_DG_Key") : null;

    if (customKey && customKey.trim() !== "") {
      // 如果有自定义 Key，直接使用（不花你的钱）
      token = customKey.trim();
      console.log("🟢 [Public Edition] 正在使用用户自定义的 Deepgram Key");
    } else {
      // 如果没填，则向服务器请求兜底 Token（花你的钱，或者你可以把兜底逻辑拆掉）
      token = await getToken();
      console.log("🟡 [Default] 正在使用服务器兜底的 Deepgram Token");
    }

    const deepgram = createClient({ accessToken: token });
    const conn = deepgram.listen.live(options, endpoint);

    conn.addListener(LiveTranscriptionEvents.Open, () => {
      setConnectionState(LiveConnectionState.OPEN);
    });

    conn.addListener(LiveTranscriptionEvents.Close, () => {
      setConnectionState(LiveConnectionState.CLOSED);
    });

    setConnection(conn);
  };

  const disconnectFromDeepgram = async () => {
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