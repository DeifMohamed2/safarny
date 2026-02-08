import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ScrollToTop from "./components/ScrollToTop";
import Loading from "../shared/Loading";
// const Footer = lazy(() => import('./components/Footer'))
const Navbar = lazy(() => import('./components/Navbar'));
const Footer = lazy(() => import('./components/Footer'));
export default function Layout() {
  const { i18n } = useTranslation();
  useEffect(() => {
    i18n.changeLanguage(i18n.language)
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return <>
    <div className="min-h-dvh bg-white overflow-x-hidden">
      <ScrollToTop />
      <Navbar />
      <Toaster />
      <Suspense
        fallback={
          <div className="flex flex-auto flex-col h-dvh">
            <Loading loading={true} />
          </div>
        }
      >
        <Outlet />
      </Suspense>
      <Footer />
    </div>
  </>
}