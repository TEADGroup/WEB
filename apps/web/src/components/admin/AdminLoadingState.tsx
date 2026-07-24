'use client';

import { motion } from 'framer-motion';

export function AdminLoadingState() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.5 }}
          className="h-8 bg-slate-200 rounded w-48"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-4 bg-slate-200 rounded w-32"
        />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl bg-white/40 backdrop-blur-xl p-6 shadow-premium border border-white/20"
          >
            <div className="space-y-3">
              <motion.div
                animate={{ opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-4 bg-slate-200 rounded w-20"
              />
              <motion.div
                animate={{ opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className="h-10 bg-slate-200 rounded w-16"
              />
              <motion.div
                animate={{ opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                className="h-3 bg-slate-200 rounded w-24"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity feed skeleton */}
      <div className="rounded-2xl bg-white/40 backdrop-blur-xl p-6 shadow-premium border border-white/20">
        <motion.div
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-6 bg-slate-200 rounded w-32 mb-6"
        />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-xl bg-white/30 px-4 py-3"
            >
              <motion.div
                animate={{ opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className="h-10 w-10 rounded-full bg-slate-200"
              />
              <div className="flex-1 space-y-2">
                <motion.div
                  animate={{ opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className="h-4 bg-slate-200 rounded w-3/4"
                />
                <motion.div
                  animate={{ opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                  className="h-3 bg-slate-200 rounded w-1/2"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}