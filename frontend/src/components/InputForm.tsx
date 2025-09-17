import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Mic, Image as ImageIcon, X, Check, Play, Pause, Square, Info } from "lucide-react";

interface InputFormProps {
  onSubmit: (query: string, imageFile: File | null, audioFile: File | null) => void;
  isLoading: boolean;
  context?: 'homepage' | 'chat';
}

export function InputForm({ onSubmit, isLoading, context = 'homepage' }: InputFormProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(32).fill(0));
  const [showRecordingHelp, setShowRecordingHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const waveformBufferRef = useRef<number[]>([]);
  const maxRecordingTime = 131; // 131 seconds limit

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space bar to toggle recording (only when not focused on textarea)
      if (e.code === 'Space' && e.target !== textareaRef.current && !e.repeat) {
        e.preventDefault();
        toggleVoiceRecording();
      }
      
      // Escape to cancel recording
      if (e.key === 'Escape' && isRecording) {
        e.preventDefault();
        cancelRecording();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]);

  // Clean up media stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Waveform visualization
  const updateWaveform = () => {
    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Get frequency data for better visualization
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume from frequency data
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const averageVolume = sum / bufferLength;
      
      // Convert to percentage and amplify for better visibility
      const volumePercent = Math.min(100, (averageVolume / 255) * 300);
      
      // Create scrolling waveform effect
      const barCount = window.innerWidth < 640 ? 32 : 24;
      
      if (waveformBufferRef.current.length === 0) {
        waveformBufferRef.current = new Array(barCount).fill(0);
      }
      
      // Scroll from right to left: remove first element, add new at end
      waveformBufferRef.current.shift();
      waveformBufferRef.current.push(volumePercent);
      
      // Update display
      setWaveformData([...waveformBufferRef.current]);
    }
    // Schedule next frame if analyser still exists
    if (analyserRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }
  };

  // Audio context setup
  const setupAudioContext = async (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Configure analyser for better frequency detection
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      // Connect stream to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Initialize waveform buffer
      const barCount = window.innerWidth < 640 ? 32 : 24;
      waveformBufferRef.current = new Array(barCount).fill(0);
      
    } catch (error) {
      console.error('Audio context setup error:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Reset state
      setRecordedAudio(null);
      setRecordingTime(0);
      const barCount = window.innerWidth < 640 ? 32 : 24;
      setWaveformData(new Array(barCount).fill(0));
      waveformBufferRef.current = new Array(barCount).fill(0);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Setup audio visualization
      await setupAudioContext(stream);

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, { type: mimeType });
        
        setRecordedAudio(audioFile);
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 100, 50]);
        }
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        // Reset waveform
        const barCount = window.innerWidth < 640 ? 32 : 24;
        setWaveformData(new Array(barCount).fill(0));
        waveformBufferRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start waveform animation
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            stopRecording();
            return maxRecordingTime;
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Recording error:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          alert('Không được phép truy cập microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.');
        } else if (error.name === 'NotFoundError') {
          alert('Không tìm thấy microphone. Vui lòng kiểm tra thiết bị âm thanh.');
        } else {
          alert('Lỗi truy cập microphone. Vui lòng thử lại.');
        }
      } else {
        alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setRecordedAudio(null);
      const barCount = window.innerWidth < 640 ? 32 : 24;
      setWaveformData(new Array(barCount).fill(0));
      waveformBufferRef.current = [];
      
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playRecordedAudio = async () => {
    if (!recordedAudio) return;
    
    if (isPlaying) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    try {
      const audioUrl = URL.createObjectURL(recordedAudio);
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onpause = () => {
        setIsPlaying(false);
      };
      
      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (!inputValue.trim() && !selectedImage && !recordedAudio) return;
    
    onSubmit(inputValue.trim(), selectedImage, recordedAudio);
    setInputValue("");
    setSelectedImage(null);
    setRecordedAudio(null);
    setRecordingTime(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedImage(file);
  };

  const clearRecordedAudio = () => {
    setRecordedAudio(null);
    setRecordingTime(0);
  };

  // Get voice button variant based on state
  const getVoiceButtonVariant = () => {
    if (isRecording) return "destructive";
    if (recordedAudio) return "default";
    return "ghost";
  };

  // Get voice button classes for enhanced visual states
  const getVoiceButtonClasses = () => {
    if (isRecording) return "animate-pulse bg-red-500 hover:bg-red-600 text-white";
    if (recordedAudio) return "bg-green-500 hover:bg-green-600 text-white";
    return "text-muted-foreground hover:text-foreground";
  };

  const placeholderText =
    context === 'chat'
      ? "Trả lời hoặc hỏi thêm..."
      : "Hỏi về sản phẩm, đặt hàng hoặc hỗ trợ...";

  return (
    <div className="w-full">
      <Card className="border border-border bg-card">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main input area */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                rows={3}
                className="resize-none pr-16 min-h-[80px]"
                disabled={isRecording}
              />
              
              {/* Input controls positioned at bottom right */}
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                {/* Recording Help Button */}
                {!isRecording && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowRecordingHelp(!showRecordingHelp)}
                    title="Hướng dẫn ghi âm"
                    className="h-8 w-8"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                )}

                {/* Image Button */}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleImageClick}
                  title="Tải ảnh"
                  className="h-8 w-8"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>

                {/* Voice Button */}
                <Button
                  type="button"
                  size="icon"
                  variant={getVoiceButtonVariant()}
                  onClick={toggleVoiceRecording}
                  title={
                    isRecording ? "Dừng ghi âm (Space)" : 
                    recordedAudio ? "Đã ghi âm - Nhấn để ghi lại (Space)" : 
                    "Ghi âm giọng nói (Space)"
                  }
                  className={`h-8 w-8 ${getVoiceButtonClasses()}`}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>

                {/* Send Button */}
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || (!inputValue.trim() && !selectedImage && !recordedAudio)}
                  className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white"
                  title="Gửi tin nhắn (Enter)"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Recording Help Tooltip */}
            {showRecordingHelp && !isRecording && (
              <div className="bg-muted border rounded-lg p-3 text-sm">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Hướng dẫn ghi âm:</p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Thời gian tối đa: <span className="font-medium">2 phút 11 giây</span></li>
                      <li>• Nhấn nút micro hoặc phím <kbd className="px-1 py-0.5 bg-muted rounded">Space</kbd> để bắt đầu</li>
                      <li>• Nhấn <kbd className="px-1 py-0.5 bg-muted rounded">Escape</kbd> để hủy</li>
                      <li>• Bạn có thể nghe lại và ghi lại nếu cần</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Recording Status with Waveform */}
            {isRecording && (
              <div className="bg-muted border rounded-lg p-4">
                {/* Mobile Layout */}
                <div className="flex flex-col space-y-3 sm:hidden">
                  {/* Recording Status with Timer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Đang ghi âm...</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {formatTime(recordingTime)} / {formatTime(maxRecordingTime)}
                    </div>
                  </div>

                  {/* Scrolling Waveform */}
                  <div className="flex items-center justify-center space-x-1 h-16 bg-background rounded-lg p-3">
                    {waveformData.map((height, index) => (
                      <div
                        key={index}
                        className="bg-red-500 rounded-full transition-all duration-200 ease-out"
                        style={{
                          width: '3px',
                          height: `${Math.max(6, height * 0.8)}px`,
                          opacity: height > 1 ? 0.9 : 0.3,
                          boxShadow: height > 15 ? '0 0 8px rgba(239, 68, 68, 0.9)' : 'none'
                        }}
                      />
                    ))}
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={cancelRecording}
                      title="Hủy ghi âm (Escape)"
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={stopRecording}
                      title="Dừng ghi âm"
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Xong
                    </Button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between space-x-4">
                  {/* Left side - Status and Timer */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Recording</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {formatTime(recordingTime)} / {formatTime(maxRecordingTime)}
                    </div>
                  </div>
                  
                  {/* Center - Scrolling Waveform */}
                  <div className="flex items-center space-x-0.5 h-8 bg-background rounded px-3 py-1">
                    {waveformData.slice(0, 24).map((height, index) => (
                      <div
                        key={index}
                        className="bg-red-500 rounded-full transition-all duration-200 ease-out"
                        style={{
                          width: '2px',
                          height: `${Math.max(4, height * 0.5)}px`,
                          opacity: height > 1 ? 0.9 : 0.3,
                          boxShadow: height > 20 ? '0 0 6px rgba(239, 68, 68, 0.9)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Right side - Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={cancelRecording}
                      title="Hủy ghi âm (Escape)"
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={stopRecording}
                      title="Dừng ghi âm"
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* File Status */}
            <div className="space-y-2">
              {selectedImage && (
                <div className="flex items-center justify-between text-sm bg-muted rounded-lg p-2">
                  <span className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>{selectedImage.name}</span>
                  </span>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setSelectedImage(null)}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {recordedAudio && (
                <div className="flex items-center justify-between text-sm bg-muted rounded-lg p-2">
                  <span className="flex items-center space-x-2">
                    <Mic className="h-4 w-4" />
                    <span>Đã ghi âm ({formatTime(recordingTime)})</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="ghost" 
                      onClick={playRecordedAudio}
                      title={isPlaying ? "Dừng phát" : "Phát audio"}
                      className="text-blue-600 hover:text-blue-700 h-6 px-2"
                    >
                      {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="ghost" 
                      onClick={clearRecordedAudio}
                      title="Xóa recording"
                      className="text-red-500 hover:text-red-600 h-6 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 