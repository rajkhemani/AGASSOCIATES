"use client";

import { useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Settings,
  MessageSquare,
  Zap,
  Activity,
  History
} from "lucide-react";
import { Button, Card, Badge } from "@ag/ui";

export default function VyasaVoiceControl() {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  console.log(audioRef); // Avoid unused warning

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setLastAction("Listening for command...");
    }
  };

  const runMockCommand = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setLastAction("Processed: 'Generate rent agreement for Flat 202'");
    }, 1500);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vyasa Voice Control</h2>
          <p className="text-slate-500">Hands-free legal operations and agent orchestration</p>
        </div>
        <Badge variant={isListening ? "success" : "default"}>
          {isListening ? "Active" : "Standby"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6 flex flex-col items-center justify-center min-h-[300px] bg-slate-50">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full bg-indigo-500/20 animate-ping ${isListening ? "opacity-100" : "opacity-0"}`} />
            <button
              onClick={toggleListening}
              className={`relative z-10 p-8 rounded-full transition-all ${isListening ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"}`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </button>
          </div>

          <div className="mt-8 text-center max-w-md">
            <h3 className="text-lg font-semibold text-slate-900">
              {isListening ? "I'm listening..." : "Tap to speak"}
            </h3>
            <p className="mt-2 text-slate-500 text-sm">
              Try saying: "Aisha, draft a mortgage intimation for HDFC Case #4421" or "Status of my pending filings"
            </p>
          </div>

          {lastTranscript && (
            <div className="mt-8 w-full p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
               <div className="flex items-start gap-3">
                 <div className="mt-0.5 p-1.5 bg-indigo-50 rounded">
                   <MessageSquare className="w-4 h-4 text-indigo-600" />
                 </div>
                 <div>
                   <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Captured Intent</p>
                   <p className="mt-1 text-slate-700 font-medium italic">"{lastTranscript}"</p>
                 </div>
               </div>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Engine Status
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">STT (Whisper)</span>
                <span className="text-emerald-600 font-bold text-xs">ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">TTS (Piper)</span>
                <span className="text-emerald-600 font-bold text-xs">ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">NLU (Gemini)</span>
                <span className="text-emerald-600 font-bold text-xs">ONLINE</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={runMockCommand}
              disabled={isProcessing}
            >
              <Settings className="w-3 h-3 mr-2" />
              Recalibrate Sensors
            </Button>
          </Card>

          <Card className="p-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Active Monitors
            </h4>
            <div className="space-y-3">
              <div className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <div className="flex-1">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-1/3" />
                  </div>
                </div>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center gap-3">
                <History className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-500">Latency: 240ms</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
