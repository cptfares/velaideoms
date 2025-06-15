import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, PhoneOff, Globe, Terminal, Trash2, Clock, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error";
}

export default function Home() {
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const vapiClientRef = useRef<any>(null);

  // Initialize Vapi client
  useEffect(() => {
    const initializeVapi = async () => {
      try {
        // Import Vapi dynamically
        const { default: Vapi } = await import('@vapi-ai/web');
        
        // Get API key from environment variables
        const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY || 
                          import.meta.env.VITE_VAPI_KEY || 
                          process.env.VAPI_PUBLIC_KEY || 
                          "your-vapi-public-key";
        
        vapiClientRef.current = new Vapi(publicKey);
        
        // Set up event listeners
        vapiClientRef.current.on('call-start', () => {
          addLog('Call started successfully', 'success');
          setCallStatus('connected');
          setIsLoading(false);
          callStartTimeRef.current = Date.now();
          
          // Start duration timer
          durationIntervalRef.current = setInterval(() => {
            if (callStartTimeRef.current) {
              setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
            }
          }, 1000);
        });
        
        vapiClientRef.current.on('call-end', () => {
          addLog('Call ended', 'info');
          handleCallEnd();
        });
        
        vapiClientRef.current.on('error', (error: any) => {
          addLog(`Error: ${error.message || 'Unknown error occurred'}`, 'error');
          setCallStatus('error');
          setIsLoading(false);
          handleCallEnd();
        });
        
        vapiClientRef.current.on('speech-start', () => {
          addLog('User started speaking', 'info');
        });
        
        vapiClientRef.current.on('speech-end', () => {
          addLog('User stopped speaking', 'info');
        });
        
        addLog('Voice agent initialized and ready', 'success');
        addLog('Multilingual AI voice agent ready for conversations', 'info');
        
      } catch (error) {
        console.error('Failed to initialize Vapi:', error);
        addLog('Failed to initialize voice agent. Please check your API key.', 'error');
      }
    };

    initializeVapi();

    // Cleanup on unmount
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (vapiClientRef.current) {
        vapiClientRef.current.stop();
      }
    };
  }, []);

  const addLog = (message: string, type: LogEntry["type"]) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleCallEnd = () => {
    setCallStatus('idle');
    setCallDuration(0);
    setIsLoading(false);
    callStartTimeRef.current = null;
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const startCall = async () => {
    if (!vapiClientRef.current) {
      addLog('Voice agent not initialized', 'error');
      return;
    }

    setIsLoading(true);
    setCallStatus('connecting');
    addLog('Initiating call...', 'info');

    try {
      // Get assistant ID from environment variables
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID || 
                          import.meta.env.VITE_ASSISTANT_ID || 
                          process.env.VAPI_ASSISTANT_ID || 
                          "your-assistant-id";

      await vapiClientRef.current.start(assistantId);
    } catch (error) {
      console.error('Failed to start call:', error);
      addLog(`Failed to start call: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setCallStatus('error');
      setIsLoading(false);
    }
  };

  const stopCall = () => {
    if (vapiClientRef.current) {
      vapiClientRef.current.stop();
      addLog('Call stopped by user', 'info');
    }
    handleCallEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusConfig = () => {
    switch (callStatus) {
      case 'connected':
        return {
          className: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
          dotClassName: "bg-green-500 animate-pulse-slow",
          text: "Call in Progress...",
          icon: CheckCircle
        };
      case 'connecting':
        return {
          className: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400",
          dotClassName: "bg-blue-500 animate-pulse",
          text: "Connecting...",
          icon: Loader2
        };
      case 'error':
        return {
          className: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
          dotClassName: "bg-red-500",
          text: "Connection Error",
          icon: AlertCircle
        };
      default:
        return {
          className: "bg-gray-100 dark:bg-gray-800/20 text-gray-800 dark:text-gray-400",
          dotClassName: "bg-gray-400",
          text: "Ready to Connect",
          icon: Info
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Company Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold vela-dark dark:text-white">Vela AI</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Multilingual Voice Intelligence</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Text */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold vela-dark dark:text-white mb-6">
            Experience the Future of{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              AI Voice Agents
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
            Discover our cutting-edge multilingual AI voice agent. Engage in natural conversations 
            across multiple languages with advanced understanding and human-like responses.
          </p>
          
          {/* AI Agent Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1">Inbound Calls</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">Handle incoming customer inquiries</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1">Outbound Calls</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">Proactive customer outreach</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1">Customer Service</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">24/7 support and assistance</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1">Lead Qualification</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">Intelligent lead scoring and routing</div>
            </div>
          </div>
        </div>

        {/* Demo Interface */}
        <Card className="mb-12 shadow-xl">
          <CardContent className="p-8">
            {/* Company Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4">
                <svg 
                  viewBox="0 0 40 40" 
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                >
                  <path d="M20 2L35 12v16L20 38 5 28V12L20 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="20" cy="20" r="6" fill="currentColor"/>
                  <path d="M14 16l6 4 6-4" stroke="white" strokeWidth="1.5" fill="none"/>
                  <path d="M14 24l6-4 6 4" stroke="white" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Client Company Demo</div>
            </div>

            {/* Call Status Display */}
            <div className="text-center mb-8">
              <Badge 
                variant="secondary" 
                className={`inline-flex items-center space-x-3 px-6 py-3 text-sm font-medium ${statusConfig.className}`}
              >
                <div className={`w-3 h-3 rounded-full ${statusConfig.dotClassName}`}></div>
                <span>{statusConfig.text}</span>
              </Badge>
              
              {/* Call Duration */}
              {callStatus === 'connected' && (
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Duration: {formatDuration(callDuration)}</span>
                </div>
              )}
            </div>

            {/* Call Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              {/* Start Call Button */}
              <Button 
                onClick={startCall}
                disabled={callStatus === 'connected' || isLoading}
                size="lg"
                className="relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 h-auto transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-3" />
                    Start Call
                  </>
                )}
              </Button>

              {/* Stop Call Button */}
              <Button 
                onClick={stopCall}
                disabled={callStatus !== 'connected'}
                variant="destructive"
                size="lg"
                className="font-semibold py-4 px-8 h-auto transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none"
              >
                <PhoneOff className="w-5 h-5 mr-3" />
                Stop Call
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Multilingual Capabilities Highlight */}
            <div className="text-center">
              <div className="mb-4">
                <h3 className="text-lg font-semibold vela-dark dark:text-white mb-2 flex items-center justify-center">
                  <Globe className="w-5 h-5 mr-2 vela-blue" />
                  Multilingual Support
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Our AI agent communicates fluently in multiple languages</p>
              </div>
              
              {/* Language Flags */}
              <div className="flex justify-center space-x-6 text-2xl">
                {[
                  { flag: "🇺🇸", title: "English" },
                  { flag: "🇪🇸", title: "Spanish" },
                  { flag: "🇫🇷", title: "French" },
                  { flag: "🇩🇪", title: "German" },
                  { flag: "🇨🇳", title: "Chinese" },
                  { flag: "🇸🇦", title: "Arabic" }
                ].map((lang) => (
                  <span 
                    key={lang.title}
                    title={lang.title} 
                    className="hover:scale-110 transition-transform cursor-pointer"
                  >
                    {lang.flag}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Panel */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold vela-dark dark:text-white flex items-center">
                <Terminal className="w-5 h-5 mr-2 vela-blue" />
                Call Logs
              </h3>
              <Button 
                onClick={clearLogs}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
            
            <ScrollArea className="h-40 w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <div className="p-4">
                {logs.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    <Info className="w-4 h-4 inline mr-2" />
                    Call logs will appear here...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => {
                      const IconComponent = log.type === 'success' ? CheckCircle : 
                                          log.type === 'error' ? AlertCircle : Info;
                      const iconColor = log.type === 'success' ? 'text-green-500' : 
                                       log.type === 'error' ? 'text-red-500' : 'text-blue-500';
                      
                      return (
                        <div key={log.id} className="flex items-start space-x-2 text-sm">
                          <IconComponent className={`w-4 h-4 mt-0.5 ${iconColor}`} />
                          <span className="text-gray-500 dark:text-gray-400">[{log.timestamp}]</span>
                          <span className="text-gray-700 dark:text-gray-300 flex-1">{log.message}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold vela-dark dark:text-white mb-4">Contact Vela AI</h4>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-gray-600 dark:text-gray-400">
              <a 
                href="https://www.velaagencies.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span>www.velaagencies.com</span>
              </a>
              <div className="flex items-center space-x-4">
                <a 
                  href="tel:+15715239063" 
                  className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  <span>+1 (571) 523-9063</span>
                </a>
                <span className="text-gray-400">/</span>
                <a 
                  href="tel:+21695926440" 
                  className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  <span>+216 95 926 440</span>
                </a>
              </div>
              <a 
                href="https://instagram.com/vela_agencies" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>@vela_agencies</span>
              </a>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">© 2024 Vela AI. Powered by advanced voice intelligence technology.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
