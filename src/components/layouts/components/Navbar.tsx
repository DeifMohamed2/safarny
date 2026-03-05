import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import Sidebar from "react-sidebar";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import navigationConfig from "@/configs/navigation.config";
import { useAuth } from "@/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import logo from "@assets/logo.svg";
import user from "@assets/profile/user.png";
import usFlag from "@assets/icons/flags/UnitedStates.svg";
import egFlag from "@assets/icons/flags/Egypt.png";
import { localStorageService } from '@/services/localStorageService';
import { StorageKeys } from '@/constants/localStorageConstants';
import SignOutDialog from "@/components/modals/SignOutDialog";
import SignInDialog from "@/components/modals/SignInDialog";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [dialogIsOpen, setIsOpen] = useState(false);
  const [dialogSignInIsOpen, setSignInIsOpen] = useState(false);
  const navigate = useNavigate();
  const { authenticated, signOut } = useAuth();
  const openDialog = () => {
    setIsOpen(true)
  }

  const onDialogOk = () => {
    signOut();
    navigate('/');
    setIsOpen(false);
  }

  const isArabic = i18n.language === "ar";

  const currentLanguage = {
    label: isArabic ? "العربية" : "English",
    flag: isArabic ? egFlag : usFlag,
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    localStorageService.setItem(StorageKeys.LANGUAGE, newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    setIsLangMenuOpen(false);
  };

  useEffect(() => {
    const savedLang = localStorageService.getItem<string>(StorageKeys.LANGUAGE);
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    }
  }, [i18n]);

  
  // Sidebar content for mobile
  const sidebarContent = (
    <div className="bg-white backdrop-blur-sm border-r border-gray-300 h-full text-slate-700 w-64 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300">
        <Link
          to={"/"}
          className="flex flex-col cursor-pointer select-none outline-none"
        >
          <img src={logo} alt="logo" className="h-11 w-28 outline-none" />
        </Link>
        <button
          aria-label="close button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-2 hover:text-slate-900 cursor-pointer"
        >
          <X />
        </button>
      </div>
      <div className="h-full flex flex-col items-center justify-between gap-4">
        <nav className="px-6 py-6 space-y-2 flex flex-col gap-2 w-full">
          {navigationConfig.map((link, idx) => {
            return (
              <motion.div
                key={link.key}
                className="w-full"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <NavLink
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block w-full p-3 text-center text-base font-normal capitalize leading-4 transition-all duration-200 hover:bg-slate-100 rounded-md ${
                      isActive
                        ? "bg-slate-100 text-slate-700 hover:text-slate-900"
                        : "bg-transparent text-slate-900"
                    }`
                  }
                >
                  {t(link.translateKey)}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>
        <div className="w-full flex justify-center items-center gap-3 border-t border-gray-300 p-7">
          {/* English */}
          <button
            onClick={toggleLanguage}
            disabled={!isArabic}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
              ${!isArabic
                ? "bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              }`}
          >
            <img src={usFlag} alt="English" className="w-5 h-5 rounded-full" />
            <span className="text-sm font-medium">English</span>
          </button>

          {/* Arabic */}
          <button
            onClick={toggleLanguage}
            disabled={isArabic}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
              ${isArabic
                ? "bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              }`}
          >
            <img src={egFlag} alt="Arabic" className="w-5 h-5 rounded-full" />
            <span className="text-sm font-medium">العربية</span>
          </button>
        </div>
      </div>
    </div>
  );
  return (
    <>
      {/* Only render Sidebar on mobile */}
      <div className="lg:hidden">
        <Sidebar
          sidebar={sidebarContent}
          open={isMobileMenuOpen}
          onSetOpen={setIsMobileMenuOpen}
          pullRight={i18n.language === "ar"}
          docked={false}
          styles={{
            root: {
              visibility: isMobileMenuOpen ? "visible" : "hidden",
              pointerEvents: isMobileMenuOpen ? "auto" : "none",
            },
            sidebar: {
              position: "fixed",
              top: "0",
              left: "0",
              zIndex: "999",
              width: "16rem",
              height: "100dvh",
            },
            overlay: {
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: "998",
            },
          }}
        >
          <div></div>
        </Sidebar>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 py-5 bg-white border-b border-gray-300 flex justify-center items-center">
        <div className="max-w-340 w-full px-4 flex justify-between items-center">
          {/* Left Side - Logo and Navigation */}
          <div className="flex justify-start items-center gap-14">
            {/* Logo */}
            <Link
              to={"/"}
              className="w-28 h-11 relative overflow-hidden cursor-pointer"
            >
              <img src={logo} alt="logo" className="w-full h-full object-contain" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex justify-center items-center gap-2 overflow-hidden">
              {navigationConfig.map((link, idx) => {
                return (
                  <motion.div
                    key={link.key}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                  >
                    <NavLink
                      to={link.path}
                      className={({ isActive }) =>
                        `p-1 flex justify-start items-start transition-all duration-200 ${
                          isActive
                            ? "rounded-[3px] border-b-[1.5px] border-orange-400"
                            : "hover:rounded-[3px] hover:border-b-[1.5px] hover:border-orange-400"
                        }`
                      }
                    >
                      <div className="flex justify-center items-center gap-1">
                        <div className="text-center justify-start text-slate-700 text-base font-normal capitalize leading-4">
                          {t(link.translateKey)}
                        </div>
                      </div>
                    </NavLink>
                  </motion.div>
                );
              })}
            </nav>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="hidden lg:block">
                <DropdownMenu open={isLangMenuOpen} onOpenChange={setIsLangMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-[#263859] text-white hover:bg-[#2a4d7f] hover:text-white px-3 py-1.5 rounded-lg backdrop-blur-[2px] inline-flex justify-center items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" viewBox="0 0 12 6" fill="none">
                        <path d="M0.930583 0.157712L5.61558 4.76871C5.7178 4.86984 5.85579 4.92656 5.99958 4.92656C6.14337 4.92656 6.28136 4.86984 6.38358 4.76871L11.0696 0.158712C11.1724 0.0576367 11.3109 0.0010004 11.4551 0.0010004C11.5993 0.0010004 11.7377 0.0576367 11.8406 0.158712C11.8912 0.208089 11.9315 0.267105 11.959 0.332282C11.9865 0.397459 12.0006 0.467478 12.0006 0.538212C12.0006 0.608947 11.9865 0.678966 11.959 0.744143C11.9315 0.809319 11.8912 0.868335 11.8406 0.917712L7.15658 5.52771C6.84806 5.83064 6.43296 6.00036 6.00058 6.00036C5.56821 6.00036 5.15311 5.83064 4.84458 5.52771L0.160583 0.917712C0.109781 0.86832 0.0693989 0.809242 0.0418243 0.743973C0.0142498 0.678703 4.19617e-05 0.608568 4.19617e-05 0.537713C4.19617e-05 0.466857 0.0142498 0.396721 0.0418243 0.331452C0.0693989 0.266183 0.109781 0.207105 0.160583 0.157712C0.263439 0.0566368 0.401876 0 0.546083 0C0.69029 0 0.828728 0.0566368 0.931583 0.157712" fill="white"/>
                      </svg>
                      <span className="text-center justify-start text-white text-sm font-normal font-['Inter'] rtl:font-arabic leading-5">
                        {currentLanguage.label}
                      </span>
                      <img src={currentLanguage.flag} alt="flag" className="w-4 h-4 bg-white rounded-full overflow-hidden" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className={`${isArabic? 'min-w-24' : 'min-w-28.5'} p-1 bg-white rounded-lg shadow-[0px_0px_6.3px_rgba(38,56,89,0.24)] border border-slate-700 flex flex-col gap-1`}
                  >
                    {/* English */}
                    <button
                      disabled={!isArabic}
                      onClick={() => toggleLanguage()}
                      className={`w-full px-2 py-1 flex items-center gap-2 rounded-md
                        ${!isArabic
                          ? "bg-slate-100 cursor-not-allowed"
                          : "hover:bg-slate-100 cursor-pointer"
                        }`}
                    >
                      <span className="text-black text-sm capitalize">
                        English
                      </span>
                    </button>
                    {/* Arabic */}
                    <button
                      disabled={isArabic}
                      onClick={() => toggleLanguage()}
                      className={`w-full px-2 py-1 flex items-center gap-2 rounded-md
                        ${isArabic
                          ? "bg-slate-100 cursor-not-allowed"
                          : "hover:bg-slate-100 cursor-pointer"
                        }`}
                    >
                      <span className="text-black text-sm font-arabic capitalize">
                        العربية
                      </span>
                    </button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {authenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="ps-3 pe-0.75 py-1 bg-[#263859] text-white hover:bg-[#2a4d7f] rounded-lg backdrop-blur-[2px] inline-flex justify-center items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" viewBox="0 0 12 6" fill="none">
                        <path d="M0.930583 0.157712L5.61558 4.76871C5.7178 4.86984 5.85579 4.92656 5.99958 4.92656C6.14337 4.92656 6.28136 4.86984 6.38358 4.76871L11.0696 0.158712C11.1724 0.0576367 11.3109 0.0010004 11.4551 0.0010004C11.5993 0.0010004 11.7377 0.0576367 11.8406 0.158712C11.8912 0.208089 11.9315 0.267105 11.959 0.332282C11.9865 0.397459 12.0006 0.467478 12.0006 0.538212C12.0006 0.608947 11.9865 0.678966 11.959 0.744143C11.9315 0.809319 11.8912 0.868335 11.8406 0.917712L7.15658 5.52771C6.84806 5.83064 6.43296 6.00036 6.00058 6.00036C5.56821 6.00036 5.15311 5.83064 4.84458 5.52771L0.160583 0.917712C0.109781 0.86832 0.0693989 0.809242 0.0418243 0.743973C0.0142498 0.678703 4.19617e-05 0.608568 4.19617e-05 0.537713C4.19617e-05 0.466857 0.0142498 0.396721 0.0418243 0.331452C0.0693989 0.266183 0.109781 0.207105 0.160583 0.157712C0.263439 0.0566368 0.401876 0 0.546083 0C0.69029 0 0.828728 0.0566368 0.931583 0.157712" fill="white"/>
                      </svg>
                      <div className="max-w-22.5 truncate text-center justify-center text-white text-sm font-normal capitalize leading-5">Andy Smith</div>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#897FFF] outline outline-offset-[-0.5px] outline-slate-700">
                        <img
                          alt="user"
                          src={user}
                          className="w-full h-12 object-cover object-top"
                        />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="w-36 p-1 bg-white rounded-lg shadow-[0px_0px_6.3px_rgba(38,56,89,0.24)] border border-slate-700"
                  >
                    {/* Profile */}
                    <DropdownMenuItem asChild className="hover:bg-slate-100!">
                      <Link
                        to="/profile"
                        className="w-full px-2 py-1 flex rtl:justify-end items-center gap-2 rounded-md cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                          <path d="M11.0833 4C11.0833 5.06087 10.6531 6.07828 9.88735 6.82843C9.12158 7.57857 8.08297 8 7 8C5.91703 8 4.87842 7.57857 4.11265 6.82843C3.34687 6.07828 2.91667 5.06087 2.91667 4C2.91667 2.93913 3.34687 1.92172 4.11265 1.17157C4.87842 0.421427 5.91703 0 7 0C8.08297 0 9.12158 0.421427 9.88735 1.17157C10.6531 1.92172 11.0833 2.93913 11.0833 4ZM9.91667 4C9.91667 3.24224 9.60938 2.51551 9.06239 1.97969C8.51541 1.44388 7.77355 1.14286 7 1.14286C6.22645 1.14286 5.48459 1.44388 4.9376 1.97969C4.39062 2.51551 4.08333 3.24224 4.08333 4C4.08333 4.75776 4.39062 5.48449 4.9376 6.02031C5.48459 6.55612 6.22645 6.85714 7 6.85714C7.77355 6.85714 8.51541 6.55612 9.06239 6.02031C9.60938 5.48449 9.91667 4.75776 9.91667 4ZM2.04167 9.14286C1.50018 9.14286 0.980877 9.35357 0.59799 9.72864C0.215104 10.1037 0 10.6124 0 11.1429V11.4286C0 12.796 0.888417 13.9526 2.14958 14.7389C3.41775 15.5297 5.1345 16 7 16C8.8655 16 10.5817 15.5297 11.8504 14.7389C13.1116 13.9526 14 12.796 14 11.4286V11.1429C14 10.6124 13.7849 10.1037 13.402 9.72864C13.0191 9.35357 12.4998 9.14286 11.9583 9.14286H2.04167ZM1.16667 11.1429C1.16667 10.9155 1.25885 10.6975 1.42295 10.5368C1.58704 10.376 1.8096 10.2857 2.04167 10.2857H11.9583C12.1904 10.2857 12.413 10.376 12.5771 10.5368C12.7411 10.6975 12.8333 10.9155 12.8333 11.1429V11.4286C12.8333 12.2703 12.285 13.1137 11.2239 13.7749C10.1698 14.432 8.67825 14.8571 7 14.8571C5.32175 14.8571 3.83017 14.432 2.77608 13.7749C1.71442 13.1143 1.16667 12.2697 1.16667 11.4286V11.1429Z" fill="black"/>
                        </svg>
                        <span className="text-black text-sm capitalize">
                          {t("nav.profile", "profile")}
                        </span>
                      </Link>
                    </DropdownMenuItem>

                    {/* Saved */}
                    <DropdownMenuItem asChild className="hover:bg-slate-100!">
                      <button className="w-full px-2 py-1 flex rtl:justify-end items-center gap-2 rounded-md cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 15 14" fill="none">
                          <path d="M4.19444 0.5C2.15433 0.5 0.5 2.22824 0.5 4.35947C0.5 8.625 7.5 13.5 7.5 13.5C7.5 13.5 14.5 8.625 14.5 4.35947C14.5 1.71894 12.8457 0.5 10.8056 0.5C9.35889 0.5 8.10667 1.36871 7.5 2.63353C6.89333 1.36871 5.64111 0.5 4.19444 0.5Z" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-black text-sm capitalize">
                          {t("nav.saved", "saved")}
                        </span>
                      </button>
                    </DropdownMenuItem>

                    {/* Message */}
                    <DropdownMenuItem asChild className="hover:bg-slate-100!">
                      <button className="w-full px-2 py-1 flex rtl:justify-end items-center gap-2 rounded-md cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10" fill="none">
                          <path d="M1.61538 0C0.723692 0 0 0.746667 0 1.66667V8.33333C0 9.25333 0.723692 10 1.61538 10H12.3846C13.2763 10 14 9.25333 14 8.33333V1.66667C14 0.746667 13.2763 0 12.3846 0H1.61538ZM1.61538 1.11111H12.3846C12.6813 1.11111 12.9231 1.36056 12.9231 1.66667V1.94444L7 5.24333L1.07692 1.94444V1.66667C1.07692 1.36056 1.31869 1.11111 1.61538 1.11111ZM1.07692 2.10056L4.59362 4.93056L1.14423 8.57667L5.35123 5.48611L7 6.58L8.64931 5.48611L12.8558 8.57667L9.40639 4.93056L12.9231 2.10056V8.33333C12.9201 8.41888 12.897 8.50239 12.8558 8.57667C12.7669 8.75722 12.5941 8.88889 12.3846 8.88889H1.61538C1.40592 8.88889 1.23308 8.75778 1.14423 8.57667C1.10309 8.50255 1.07999 8.41869 1.07692 8.33333V2.10056Z" fill="black"/>
                        </svg>
                        <span className="text-black text-sm capitalize">
                          {t("nav.message", "message")}
                        </span>
                      </button>
                    </DropdownMenuItem>

                    {/* Logout */}
                    <DropdownMenuItem asChild className="hover:bg-red-50!">
                      <button onClick={() => openDialog()} className="w-full px-2 py-1 flex rtl:justify-end items-center gap-2 rounded-md cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                          <path d="M2.44207 0.25H6.8262C7.40757 0.25 7.96513 0.482894 8.37623 0.897448C8.78732 1.312 9.01827 1.87426 9.01827 2.46053V5.04255C9.01827 5.24432 8.8547 5.40789 8.65292 5.40789C8.45115 5.40789 8.28758 5.24432 8.28758 5.04255V2.46053C8.28758 2.06968 8.13361 1.69484 7.85955 1.41847C7.58549 1.1421 7.21378 0.986842 6.8262 0.986842H2.44207C2.05449 0.986842 1.68278 1.1421 1.40872 1.41847C1.13465 1.69484 0.980689 2.06968 0.980689 2.46053V12.0395C0.980689 12.4303 1.13465 12.8052 1.40872 13.0815C1.68278 13.3579 2.05449 13.5132 2.44207 13.5132H6.8262C7.21378 13.5132 7.58549 13.3579 7.85955 13.0815C8.13361 12.8052 8.28758 12.4303 8.28758 12.0395V9.45745C8.28758 9.25568 8.45115 9.0921 8.65292 9.0921C8.8547 9.0921 9.01827 9.25568 9.01827 9.45745V12.0395C9.01827 12.6257 8.78732 13.188 8.37623 13.6026C7.96513 14.0171 7.40757 14.25 6.8262 14.25H2.44207C1.86069 14.25 1.30313 14.0171 0.892042 13.6026C0.480949 13.188 0.25 12.6257 0.25 12.0395V2.46053C0.25 1.87426 0.480949 1.312 0.892042 0.897448C1.30313 0.482894 1.86069 0.25 2.44207 0.25ZM4.63413 7.25C4.63413 7.04653 4.79908 6.88158 5.00255 6.88158H10.4544C11.3433 6.88158 11.7904 5.80861 11.1645 5.17744L10.7193 4.72849C10.5842 4.5923 10.5773 4.37494 10.7034 4.23043C10.8431 4.0704 11.0892 4.06256 11.2387 4.21337L13.5517 6.54586C13.9383 6.9357 13.9383 7.5643 13.5517 7.95414L11.2387 10.2866C11.0892 10.4374 10.8431 10.4296 10.7034 10.2696C10.5773 10.1251 10.5842 9.9077 10.7193 9.77151L11.1645 9.32256C11.7904 8.69139 11.3433 7.61842 10.4544 7.61842H5.00255C4.79908 7.61842 4.63413 7.45347 4.63413 7.25Z" fill="black" stroke="black" strokeWidth="0.5"/>
                        </svg>
                        <span className="text-black text-sm capitalize">
                          {t("shared.logOut", "log out")}
                        </span>
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {!authenticated && (
              <Button
                onClick={() => setSignInIsOpen(true)} 
                className="w-36 px-3.5 py-3 bg-[#263859] text-white hover:bg-[#2a4d7f] rounded-xl flex justify-center items-center gap-2.5 transition-colors"
              >
                <div className="text-white text-lg font-medium capitalize">
                  {t("shared.signIn","sign in")}
                </div>
              </Button>
            )}

            <div className="lg:hidden">
              <button
                aria-label="Menu icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Menu />
              </button>
            </div>
          </div>
        </div>
      </header>
      <SignOutDialog
        isOpen={dialogIsOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={onDialogOk}
      />
      <SignInDialog
        isOpen={dialogSignInIsOpen}
        onClose={() => setSignInIsOpen(false)}
        onConfirm={() => setSignInIsOpen(false)}
      />
    </>
  );
}