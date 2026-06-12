"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Routes } from "@/app/constants/routes";
import Dropdown from "../dropdown";
import Section from "../section";
import { isAdminSession } from "@/app/lib/auth";
import { BookOpen, FolderOpen } from "lucide-react";
import NavButton from "../navButton";
import { handleLogout } from "@/app/api/auth/[...nextauth]/route";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isAdmin = isAdminSession(session);

  // 🔹 Hiệu ứng ẩn/hiện khi cuộn
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setShowNavbar(current < lastScrollY || current < 50);
      setLastScrollY(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <AnimatePresence>
        {showNavbar && (
          <motion.nav
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 bg-linear-to-r 
                       from-[#0E4BA9]/95 via-[#007BCE]/95 to-[#00A6FB]/95 
                       backdrop-blur-md shadow-md"
          >
            <div
              className="max-w-8xl h-25 mx-auto flex items-center justify-between 
                            px-4 sm:px-6 md:px-8 lg:px-10 gap-3"
            >
              {/* 🔹 Logo */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Logo />
              </div>

              {/* 🔹 Menu chính (ẩn với admin) */}
              {
                <div className="hidden lg:flex items-center justify-center gap-4 xl:gap-6 mx-auto">
                  {/* Menu 1: Tests */}
                  {session && !isAdmin && (
                    <Dropdown
                      title="Tests"
                      icon={<IconDoc />}
                      items={[
                        { href: Routes.TEST_IELTS, label: "🎙 IELTS Test" },
                      ]}
                    />
                  )}

                  {/* Menu 2: Resources (cùng cấp) */}
                  {/* {!isAdmin && (
                    <NavButton
                      title="Resources"
                      icon={
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 20h9M3 20h9M9 4h6M9 8h6M4 12h16M4 16h16"
                          />
                        </svg>
                      }
                      href={Routes.RESOURCES_LISTS}
                    />
                  )} */}
                </div>
              }

              {/* 🔹 User / Login */}
              <div className="flex items-center gap-3 shrink-0">
                <UserSection
                  session={session}
                  isAdmin={isAdmin}
                  setMenuOpen={setMenuOpen}
                />
                <BurgerButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
              </div>
            </div>

            {/* 🔹 Mobile Menu */}
            <MobileMenu
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              session={session}
              isAdmin={isAdmin}
            />
          </motion.nav>
        )}
      </AnimatePresence>

      {/* spacer tránh bị che */}
      <div className="h-[10.5vh]" />
    </>
  );
}

/* 🔹 Components phụ tách gọn */
function Logo() {
  return (
    <Link href={Routes.HOME} className="flex items-center gap-3">
      <div className="relative group flex items-center">

        {/* 🔹 Hiệu ứng sáng chỉnh gọn, không còn phình */}
        <div
          className="absolute inset-0 scale-95 
          bg-blue-300/20 
          blur-sm 
          opacity-0 group-hover:opacity-40 
          transition-all duration-300 rounded-xl"
        />

        {/* 🔹 Logo chính (đã fix lỗi className) */}
        <Image
          src="/logo.png"
          alt="WeWIN Logo"
          width={200}   // <-- to hơn nhưng không phá layout
          height={120}
          className="relative shadow-lg transition-all duration-300 group-hover:scale-105"
        />
      </div>

      <span className="text-2xl font-bold tracking-wide text-[#E4C28E] hidden sm:block drop-shadow-lg">
        WeWIN IELTS
      </span>
    </Link>
  );
}


function IconDoc() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function UserSection({ session, setMenuOpen }: any) {
  if (!session)
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => signIn()}
        className="
        hidden lg:flex         
        items-center gap-2 
        px-5 py-2.5 rounded-xl 
        font-semibold 
        bg-white text-[#0E4BA9] 
        shadow-lg hover:shadow-xl 
        transition-all duration-300
      "
      >
        🔐 Đăng nhập
      </motion.button>
    );

  return (
    <div className="hidden lg:flex items-center gap-3">
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 
                   backdrop-blur-md text-white border border-white/30 shadow-md"
      >
        <div
          className="w-8 h-8 rounded-full bg-linear-to-br from-amber-400 to-yellow-500 
                        flex items-center justify-center text-white font-bold text-sm shadow-lg"
        >
          {session.user?.name?.charAt(0).toUpperCase()}
        </div>
        <span className="hidden lg:block font-semibold text-sm truncate max-w-[120px]">
          {session.user?.name}
        </span>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleLogout()}
        className="hidden lg:block px-5 py-2.5 rounded-xl font-bold shadow-lg 
                   bg-[#E4C28E] text-[#0E4BA9] hover:bg-[#ffd666] transition-all"
      >
        Đăng xuất
      </motion.button>
    </div>
  );
}

function BurgerButton({ menuOpen, setMenuOpen }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => setMenuOpen(!menuOpen)}
      className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 lg:hidden
        ${
          menuOpen
            ? "bg-[#c29450] shadow-lg"
            : "bg-white/20 hover:bg-white/30 backdrop-blur-md shadow-inner"
        }`}
    >
      <motion.span
        animate={menuOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -6 }}
        transition={{ duration: 0.25 }}
        className="absolute w-6 h-[3px] rounded-full bg-white"
      />
      <motion.span
        animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="absolute w-6 h-[3px] rounded-full bg-white"
      />
      <motion.span
        animate={menuOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 6 }}
        transition={{ duration: 0.25 }}
        className="absolute w-6 h-[3px] rounded-full bg-white"
      />
    </motion.button>
  );
}

function MobileMenu({ menuOpen, setMenuOpen, session, isAdmin }: any) {
  if (!menuOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="lg:hidden overflow-hidden bg-linear-to-b 
                   from-[#007BCE] to-[#00A6FB] border-t border-white/20"
      >
        <div className="px-6 py-6 space-y-4">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <div
              className="bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 
                            border border-white/30 text-center"
            >
              <span className="text-xl font-bold text-[#E4C28E]">
                WeWIN IELTS
              </span>
            </div>
          </Link>

          {/* chỉ user thường mới có menu */}
          {session && !isAdmin && (
            <Section
              title="Tests"
              items={[
                { href: Routes.TEST_IELTS, icon: "🎙", label: "IELTS Test" },
              ]}
              setMenuOpen={setMenuOpen}
            />
          )}

          {/* {!isAdmin && (
            <Section
              title="Resources"
              items={[
                {
                  href: Routes.RESOURCES_LISTS,
                  icon: <BookOpen className="w-5 h-5" />,
                  label: "Learning Resources",
                },
              ]}
              setMenuOpen={setMenuOpen}
            />
          )} */}

          {session && isAdmin && (
            <Section
              title="Class Management"
              items={[
                {
                  href: Routes.MANAGE_CLASS,
                  icon: <BookOpen className="w-5 h-5" />,
                  label: "Class",
                },
                {
                  href: Routes.MANAGE_CLASS_CATEGORY,
                  icon: <FolderOpen className="w-5 h-5" />,
                  label: "Category",
                },
              ]}
              setMenuOpen={setMenuOpen}
            />
          )}

          {session && isAdmin && (
            <Section
              title="Student Management"
              items={[
                {
                  href: Routes.MANAGE_STUDENT,
                  icon: <BookOpen className="w-5 h-5" />,
                  label: "Student",
                },
              ]}
              setMenuOpen={setMenuOpen}
            />
          )}

          {/* user info */}
          <div className="pt-4 border-t border-white/20">
            {!session ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signIn();
                }}
                className="w-full bg-white text-[#0E4BA9] py-3 rounded-xl font-bold shadow-lg"
              >
                🔐 Đăng nhập
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg px-4 py-3 flex items-center gap-3 border border-white/20">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold shadow-lg">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-semibold">
                    {session.user?.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full bg-[#E4C28E] text-[#0E4BA9] py-3 rounded-xl font-bold shadow-lg"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
