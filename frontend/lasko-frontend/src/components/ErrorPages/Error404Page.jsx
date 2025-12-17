import React from 'react';
import { Link } from 'react-router-dom';
import error404Image from '../../assets/images/errors/404.png';

const Error404Page = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-[#0a0a0a] to-black px-6">
      {/* Gradient Grid Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#1DCD9F]/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#0D7A61]/10 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* Grafika błędu na środku */}
        <div className="mb-12 flex justify-center">
          <img
            src={error404Image}
            alt="404 - Strona nie znaleziona"
            className="max-w-lg md:max-w-xl w-full h-auto drop-shadow-[0_10px_40px_rgba(16,185,129,.3)]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="group relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 active:scale-[0.98]"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0D7A61] to-[#1DCD9F] opacity-90 transition-opacity group-hover:opacity-100" />
            <span className="absolute inset-0 -z-10 rounded-full blur-md bg-emerald-500/20 group-hover:bg-emerald-500/30" />
            <span className="relative">Powrót do strony głównej</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-full border-2 border-emerald-400/60 px-7 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-400/10 transition-colors"
          >
            Przejdź do Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Error404Page;

