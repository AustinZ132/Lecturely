"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,      
  useEffect,   
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

  // 🐶 静默看门狗的状态记录器
  const lastDataTimeRef = useRef<number>(Date.now());
  const watchdogIntervalRef = useRef<any>(null);

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
            // 🚀 核心抗干扰升级 1：关闭浏览器的粗暴降噪，保留带有口音的人声辅音细节！把降噪工作交给更聪明的 Deepgram。
            noiseSuppression: false, 
            echoCancellation: true,
            // 🚀 核心抗干扰升级 2：开启 AGC (自动增益控制)！教授走远声音变小时，麦克风会自动把音量拉满！
            autoGainControl: true,   
          },
        });
      }

      const recorder = new MediaRecorder(mediaStream);
      
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

      lastDataTimeRef.current = Date.now();
      if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
      
      watchdogIntervalRef.current = setInterval(() => {
        if (microphone.state === "recording") {
          if (Date.now() - lastDataTimeRef.current > 2500) {
            console.warn("⚠️ 麦克风底层音频流疑似卡死，正在后台静默唤醒...");
            try {
              microphone.pause();
              setTimeout(() => {
                if (microphone.state === "paused") {
                  microphone.resume();
                  lastDataTimeRef.current = Date.now(); 
                }
              }, 50);
            } catch (e) {
              console.error("静默唤醒失败:", e);
            }
          }
        }
      }, 1000); 

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
