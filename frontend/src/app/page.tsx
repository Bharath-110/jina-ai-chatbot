'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';

// Import Chat component dynamically to avoid hydration issues
const Chat = dynamic(() => import('@/components/Chat'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Chat />
        </motion.div>
      </div>
    </main>
  );
}
