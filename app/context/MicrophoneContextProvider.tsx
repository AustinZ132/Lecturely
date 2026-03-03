"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,      // 🚀 新增引入
  useEffect,   // 🚀 新增引入
  ReactNode,
} from "react";

interface MicrophoneContextType {
  microphone: MediaRecorder | null;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  setupMicrophone: () => void;
  microphoneState: MicrophoneState | null;
}

export enum MicrophoneEvents {
  DataAvailable = "dataavailable",
  Error = "error",
  Pause = "pause",
  Resume = "resume",
  Start = "start",
  Stop = "stop",
}

export enum MicrophoneState {
  NotSetup = -1,
  SettingUp = 0,
  Ready = 1,
  Opening = 2,
  Open = 3,
  Error = 4,
  Pausing = 5,
  Paused = 6,
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(
  undefined
);

interface MicrophoneContextProviderProps {
  children: ReactNode;
}

const MicrophoneContextProvider: React.FC<MicrophoneContextProviderProps> = ({
  children,
}) => {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(
    MicrophoneState.NotSetup
  );
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null);

  // 🐶 核心修复 3：静默看门狗的状态记录器
  const lastDataTimeRef = useRef<number>(Date.now());
  const watchdogIntervalRef = useRef<any>(null);

  // 组件卸载时清理看门狗
  useEffect(() => {
    return () => {
      if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
    };
  }, []);

  const setupMicrophone = async () => {
    setMicrophoneState(MicrophoneState.SettingUp);

    try {
      let mediaStream;
      const audioSource = localStorage.getItem("LecSync_AudioSource") || 'mic';

      if (audioSource === 'system') {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        const audioTrack = displayStream.getAudioTracks()[0];
        if (!audioTrack) {
          alert("🚨 抓取失败！请务必在弹窗中勾选【分享标签页中的音频】！");
          displayStream.getTracks().forEach(track => track.stop());
          setMicrophoneState(MicrophoneState.Error);
          return;
        }

        mediaStream = new MediaStream([audioTrack]);
        displayStream.getVideoTracks().forEach(track => track.stop());

      } else {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
          },
        });
      }

      const recorder = new MediaRecorder(mediaStream);
      
      // 🐶 看门狗嗅探器：每次麦克风吐出有效数据，刷新最后存活时间
      recorder.addEventListener("dataavailable", (e) => {
        if (e.data.size > 0) {
          lastDataTimeRef.current = Date.now();
        }
      });

      setMicrophone(recorder);
      setMicrophoneState(MicrophoneState.Ready);
    } catch (err: any) {
      console.error("麦克风初始化失败:", err);
      setMicrophoneState(MicrophoneState.Error);
    }
  };

  const stopMicrophone = useCallback(() => {
    if (!microphone) return;
    setMicrophoneState(MicrophoneState.Pausing);

    // 🛑 停止看门狗
    if (watchdogIntervalRef.current) {
      clearInterval(watchdogIntervalRef.current);
      watchdogIntervalRef.current = null;
    }

    if (microphone.state === "recording") {
      microphone.pause();
      setMicrophoneState(MicrophoneState.Paused);
    }
  }, [microphone]);

  const startMicrophone = useCallback(() => {
    if (!microphone) return;

    try {
      // 🚀 终极防御：如果已经在录音了，直接无视并退出，彻底消灭报错！
      if (microphone.state === "recording") {
        setMicrophoneState(MicrophoneState.Open);
        return;
      }

      setMicrophoneState(MicrophoneState.Opening);

      if (microphone.state === "paused") {
        microphone.resume();
      } else if (microphone.state === "inactive") {
        microphone.start(250);
      }

      setMicrophoneState(MicrophoneState.Open);

      // 🐶 启动看门狗：防止浏览器因“环境过静”而掐断底层音频流
      lastDataTimeRef.current = Date.now();
      if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
      
      watchdogIntervalRef.current = setInterval(() => {
        if (microphone.state === "recording") {
          // 如果超过 2.5 秒连最基本的环境底噪数据都没收到，说明浏览器休眠了音频管道
          if (Date.now() - lastDataTimeRef.current > 2500) {
            console.warn("⚠️ 麦克风底层音频流疑似卡死，正在后台静默唤醒...");
            try {
              // 自动模拟你的手动操作：静默暂停再瞬间恢复，一脚踢醒麦克风引擎
              microphone.pause();
              setTimeout(() => {
                if (microphone.state === "paused") {
                  microphone.resume();
                  lastDataTimeRef.current = Date.now(); // 重置时间，防止死循环
                }
              }, 50);
            } catch (e) {
              console.error("静默唤醒失败:", e);
            }
          }
        }
      }, 1000); // 每秒巡逻一次

    } catch (error) {
      console.warn("已安全拦截重复启动麦克风的指令:", error);
    }
  }, [microphone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        stopMicrophone,
        setupMicrophone,
        microphoneState,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone(): MicrophoneContextType {
  const context = useContext(MicrophoneContext);

  if (context === undefined) {
    throw new Error(
      "useMicrophone must be used within a MicrophoneContextProvider"
    );
  }

  return context;
}

export { MicrophoneContextProvider, useMicrophone };
