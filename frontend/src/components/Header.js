import React from 'react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-lg p-4 w-full">
      <div className="w-full flex items-center justify-between">
        {/* Logo */}
        <img
          src="/assets/logo.svg"
          alt="Logo"
          className="h-12 w-auto"
        />

        {/* Title */}
        <h1 className="flex-1 text-left text-xl md:text-xl lg:text-2xl font-semibold text-gray-900 tracking-tight">
          WP Performance Debugger Tool
        </h1>

        {/* Button with Smaller Red Badge */}
        <div className="relative inline-block">
          {/* Button */}
          <a
            href="https://compare.checkmysite.app/"
            className="relative inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-100"
          >
            <span>Compare My Site</span>
          </a>

          {/* Smaller Red Badge */}
          <span className="absolute -top-2 -left-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm transform -rotate-12 origin-top-left shadow-md animate-glow">
            New
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;

