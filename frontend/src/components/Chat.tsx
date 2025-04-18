'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Moon, Sun, Send, Loader2, User, Bot } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface ApiError {
  detail: string;
}

const BASE_URL = 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/chat`;
const HEALTH_URL = `${BASE_URL}/health`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const CONNECTION_CHECK_INTERVAL = 5000; // Check every 5 seconds

export default function Chat() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    let isSubscribed = true;

    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(HEALTH_URL, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeoutId);
        if (isSubscribed) {
          setIsServerConnected(response.ok);
          setConnectionError(null);
        }
      } catch (error) {
        if (isSubscribed) {
          setIsServerConnected(false);
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            setConnectionError('Unable to connect to the server. Please make sure the backend is running and CORS is properly configured.');
          } else {
            setConnectionError('Connection error: ' + (error instanceof Error ? error.message : 'Unknown error'));
          }
          if (isInitialCheck) {
            console.log('Initial connection check failed, retrying...');
          } else {
            console.error('Server connection error:', error);
          }
        }
      } finally {
        if (isSubscribed) {
          setIsInitialCheck(false);
        }
      }
    };

    checkConnection();
    const intervalId = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [isInitialCheck]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setIsServerConnected(true);
      return response;
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying... ${retries} attempts left`);
        await sleep(RETRY_DELAY);
        return fetchWithRetry(url, options, retries - 1);
      }
      setIsServerConnected(false);
      throw error;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isServerConnected) return;

    const userMessage = { role: 'user' as const, content: input, id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(({ role, content }) => ({ role, content }));
      conversationHistory.push({ role: userMessage.role, content: userMessage.content });

      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let assistantMessage = { role: 'assistant' as const, content: '', id: (Date.now() + 1).toString() };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              assistantMessage.content += data.content;
              setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = !isServerConnected
        ? 'Unable to connect to the server. Please make sure the backend is running.'
        : error instanceof Error ? error.message : 'Sorry, there was an error processing your request.';
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage,
        id: Date.now().toString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-background/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold tracking-tight">Jina AI Chat</h2>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isServerConnected
                ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20'
                : 'bg-red-500/10 text-red-500 dark:bg-red-500/20'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isServerConnected ? 'bg-emerald-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span>
              {isInitialCheck
                ? 'Connecting...'
                : isServerConnected
                ? 'Connected'
                : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center gap-2 border-l pl-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full h-8 w-8 hover:bg-muted"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Avatar className="h-8 w-8 bg-primary/10 hover:bg-primary/20 transition-colors">
              <AvatarFallback className="text-primary">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-4 py-4">
        <ScrollArea className="h-full px-4">
          {!isServerConnected && !isInitialCheck && (
            <div className="mb-4">
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-3 text-red-500 flex items-center gap-2 text-sm">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  {connectionError ||
                    'Unable to connect to server. Please make sure the backend is running.'}
                </CardContent>
              </Card>
            </div>
          )}
          
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                } ${index === messages.length - 1 ? 'mb-3' : 'mb-4'}`}
              >
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div className={`flex items-center gap-2 mb-1.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className={`${
                      message.role === 'user' 
                        ? 'bg-gradient-to-br from-primary to-primary/90 dark:from-primary/90 dark:to-primary/70'
                        : 'bg-gradient-to-br from-violet-500/90 to-purple-600/90 dark:from-violet-500/80 dark:to-purple-600/80'
                    } h-6 w-6 ring-2 ring-background shadow-sm flex-shrink-0`}>
                      <AvatarFallback className="text-white">
                        {message.role === 'user' 
                          ? <User className="h-3.5 w-3.5" /> 
                          : <Bot className="h-3.5 w-3.5" />
                        }
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] text-muted-foreground/80 font-medium">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                  <div
                    className={`group relative rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground dark:from-primary/90 dark:to-primary/80'
                        : 'bg-muted/30 dark:bg-muted/20 hover:bg-muted/40 dark:hover:bg-muted/30'
                    } shadow-sm hover:shadow transition-all duration-200`}
                  >
                    <div className={`absolute top-3 ${message.role === 'user' ? '-right-1.5' : '-left-1.5'} 
                      w-1.5 h-1.5 transform rotate-45 ${
                      message.role === 'user'
                        ? 'bg-primary dark:bg-primary/90'
                        : 'bg-muted/30 dark:bg-muted/20'
                    }`} />
                    <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{message.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isInitialCheck
                ? "Connecting to server..."
                : isServerConnected
                ? "Type your message..."
                : "Waiting for server connection..."
            }
            disabled={isLoading || !isServerConnected}
            className="flex-1 px-4 py-2 text-sm bg-background/60 dark:bg-muted/10"
          />
          <Button
            type="submit"
            disabled={isLoading || !isServerConnected}
            className="px-4 h-[38px] shadow-sm"
            variant="default"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
} 