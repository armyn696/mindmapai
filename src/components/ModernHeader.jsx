import React from 'react';
import { Sparkles } from 'lucide-react';

const ModernHeader = () => {
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main header content */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">نمودار ذهنی آنلاین</h1>
          </div>
          
          {/* Decorative elements */}
          <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
            <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm animate-float" />
            <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm animate-float-delayed" />
          </div>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-purple-500/20 blur-2xl" />
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />
    </div>
  );
};

export default ModernHeader;
