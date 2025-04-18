'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto rounded-xl overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-2xl border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <h1 className="text-2xl font-bold">Jina AI Chat</h1>
        <div className="w-8 h-8"></div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="flex space-x-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-4 h-4 bg-blue-500 rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.2
              }}
              className="w-4 h-4 bg-purple-500 rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.4
              }}
              className="w-4 h-4 bg-blue-500 rounded-full"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading chat...</p>
        </motion.div>
      </div>
    </div>
  );
} 