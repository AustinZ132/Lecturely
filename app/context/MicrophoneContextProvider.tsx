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
      let finalStream; // 最终要录制的流
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

        finalStream = new MediaStream([audioTrack]);
        displayStream.getVideoTracks().forEach(track => track.stop());

      } else {
        // 1. 先获取原始麦克风流（保留基础的系统增益）
        const rawStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: false, 
            echoCancellation: false,
            autoGainControl: false,  
          },
        });

        // 🚀 终极杀手锏：引入 Web Audio API 强行物理放大音量
        // 兼容 Safari 的 webkitAudioContext
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(rawStream);
        const gainNode = audioContext.createGain();
        
        // 🔥 核心增益倍数：2.5 代表把输入的声音波形强行放大 2.5 倍！
        // 如果教授声音实在太小，你可以把这里的 2.5 改成 3.0 甚至 4.0！
        // 注意：倍数越大，环境里的空调声等底噪也会跟着变大。2.5 是一个非常强力且均衡的值。
        gainNode.gain.value = 4.0; 
        
        const destination = audioContext.createMediaStreamDestination();
        
        // 串联起来：原始声音 -> 放大器 -> 最终输出流
        source.connect(gainNode);
        gainNode.connect(destination);

        finalStream = destination.stream;
      }

      // 将经过“物理放大”处理后的最终流交给录音器
      const recorder = new MediaRecorder(finalStream);
      
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
