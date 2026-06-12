"use client";

import { signIn, useSession } from "next-auth/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getPostLoginRoute } from "../lib/auth";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirectedRef.current = false;
      return;
    }

    if (status !== "authenticated" || !session?.user || redirectedRef.current) {
      return;
    }

    redirectedRef.current = true;
    window.location.replace(getPostLoginRoute(session));
  }, [status, session]);

  const handleCredentialsLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Email hoặc mật khẩu không đúng.");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const freshSession = await sessionRes.json();

    if (!freshSession?.user) {
      setLoading(false);
      setError("Không thể xác thực phiên đăng nhập. Vui lòng thử lại.");
      return;
    }

    window.location.replace(getPostLoginRoute(freshSession));
  };

  if (status === "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(90vh-80px)] bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend]">
        <motion.img
          src="/logo.png"
          alt="WeWIN Logo"
          className="w-28 mb-6 drop-shadow-lg"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <p className="text-[#0E4BA9] text-lg font-medium animate-pulse">
          Đang chuyển hướng...
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(90vh-80px)]  bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend]">
        <motion.img
          src="/logo.png"
          alt="WeWIN Logo"
          className="w-28 mb-6 drop-shadow-lg"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <p className="text-[#0E4BA9] text-lg font-medium animate-pulse">
          Đang kiểm tra đăng nhập...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(90vh-80px)] bg-linear-to-b from-[#EAF4FF] to-[#F9FAFB] font-[Lexend]">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white px-10 sm:px-16 py-14 rounded-[40px] shadow-2xl text-center w-full max-w-lg border-t-4 border-[#0E4BA9]"
      >
        <motion.img
          src="/logo.png"
          alt="WeWIN Logo"
          className="mx-auto mb-8 w-40 drop-shadow-lg"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        />
        <h1 className="text-3xl font-bold text-[#0E4BA9] mb-2">
          Welcome to <span className="text-[#00A6FB]">WeWIN IELTS</span>
        </h1>
        <p className="text-gray-600 mb-8 text-base leading-relaxed">
          Đăng nhập bằng email và mật khẩu hoặc tài khoản Google.
        </p>

        <form onSubmit={handleCredentialsLogin} className="space-y-4 text-left">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@wewin.edu.vn"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0E4BA9] focus:ring-2 focus:ring-[#0E4BA9]/20 outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0E4BA9] focus:ring-2 focus:ring-[#0E4BA9]/20 outline-none transition"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-linear-to-r from-[#0E4BA9] to-[#00A6FB] text-white py-4 rounded-full font-medium text-lg shadow-lg hover:brightness-110 transition-all disabled:opacity-60"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </motion.button>
        </form>

        <div className="flex items-center gap-3 my-8">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">hoặc</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signIn("google")}
          className="w-full flex items-center justify-center gap-3 bg-white text-[#0E4BA9] border-2 border-[#0E4BA9]/20 py-4 rounded-full font-medium text-lg shadow hover:bg-[#EAF4FF] transition-all"
        >
          Đăng nhập bằng Google
        </motion.button>
      </motion.div>

      <p className="text-gray-400 text-sm mt-8">
        © {new Date().getFullYear()} <b>WeWIN Education</b> — All Rights
        Reserved.
      </p>
    </div>
  );
}
