import TripCard from '@/components/shared/TripCard';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next'
import trip from "@assets/trip/trip.jpg"
import "react-responsive-pagination/themes/classic.css"
import TripsSection from '@/components/shared/TripsSection';
import TripsCarousel from '@/components/shared/TripsCarousel';
import companyLogo from '@assets/companies/company.png';
import { Button } from '@/components/ui/button';
import TripGallery from './components/TripGallery';
import AvailableDatesDialog from '@/components/modals/AvailableDatesDialog';
import BookingDialog from '@/components/modals/BookingDialog';
import { useNavigate } from 'react-router'

interface TripData {
  id: string;
  date: string;
  availableSpots: number;
  duration: {
    days: number;
    nights: number;
  };
}

const tripsData = [
  {
    id: "1",
    date: "Jan 10–13, 2026",
    availableSpots: 5,
    duration: { days: 4, nights: 3 }
  },
  {
    id: "2",
    date: "Feb 5–10, 2026",
    availableSpots: 3,
    duration: { days: 5, nights: 4 }
  },
  {
    id: "3",
    date: "Jan 10–13, 2026",
    availableSpots: 5,
    duration: { days: 4, nights: 3 }
  },
  {
    id: "4",
    date: "Feb 5–10, 2026",
    availableSpots: 3,
    duration: { days: 5, nights: 4 }
  },
  {
    id: "5",
    date: "Jan 10–13, 2026",
    availableSpots: 5,
    duration: { days: 4, nights: 3 }
  },
  {
    id: "6",
    date: "Feb 5–10, 2026",
    availableSpots: 3,
    duration: { days: 5, nights: 4 }
  },
  {
    id: "7",
    date: "Jan 10–13, 2026",
    availableSpots: 5,
    duration: { days: 4, nights: 3 }
  },
  {
    id: "8",
    date: "Feb 5–10, 2026",
    availableSpots: 3,
    duration: { days: 5, nights: 4 }
  },
];

const TripDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [dialogIsOpen, setIsOpen] = useState(false);
  const [dialogBookingIsOpen, setBookingIsOpen] = useState(false);
  const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>(tripsData[0].id);
  const selectedTrip: TripData | undefined = tripsData.find(trip => trip.id === selectedTripId);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const trips = [
    { id: "1", title: "Sharm El Sheikh Getaway", location: "Hurghada, Egypt" },
    { id: "2", title: "Luxor Ancient Tour", location: "Luxor, Egypt" },
    { id: "3", title: "Aswan Nile Cruise", location: "Aswan, Egypt" },
    { id: "4", title: "Siwa Oasis Escape", location: "Siwa, Egypt" },
    { id: "5", title: "Dahab Adventure", location: "Dahab, Egypt" },
    { id: "6", title: "Alexandria Weekend", location: "Alexandria, Egypt" },
    { id: "7", title: "Sharm El Sheikh Getaway", location: "Hurghada, Egypt" },
    { id: "8", title: "Luxor Ancient Tour", location: "Luxor, Egypt" },
    { id: "9", title: "Aswan Nile Cruise", location: "Aswan, Egypt" },
    { id: "10", title: "Siwa Oasis Escape", location: "Siwa, Egypt" },
    { id: "11", title: "Dahab Adventure", location: "Dahab, Egypt" },
    { id: "12", title: "Alexandria Weekend", location: "Alexandria, Egypt" },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsTripDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <section
      className="min-h-dvh sm:h-full max-w-340 w-full px-4 pt-32.5 mb-12 sm:mb-18 lg:mb-25 mx-auto"
    >
      <div className='flex flex-col gap-5 sm:gap-11.5'>
        <div className='flex justify-between items-center gap-2.5'>
          <div className="flex justify-center items-center gap-2.5">
            {/* Image */}
            <img
              src={companyLogo}
              alt="Sarah Johnson"
              className="w-10 h-10 lg:w-15 lg:h-15 rounded-full object-cover"
            />

            {/* Text */}
            <h1 className="font-semibold text-2xl lg:text-[34px] leading-12.75 capitalize text-[#122445] min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
              SunWay Travel
            </h1>
          </div>
          <Button
            className="w-fit flex items-center justify-center gap-2.5 rounded-xl bg-[#263859] px-3.5 py-3 font-medium text-base sm:text-lg leading-6.75 text-white"
            onClick={()=>navigate('/chat')}
          >
            <span className='hidden sm:block'>{t("shared.contact", "contact company")}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.3393 7.31427L4.33927 0.314269C3.78676 0.0392781 3.16289 -0.0586206 2.55271 0.0339206C1.94252 0.126462 1.37573 0.404939 0.929602 0.831385C0.483474 1.25783 0.179724 1.81149 0.0597636 2.41688C-0.0601964 3.02227 0.00947219 3.64992 0.259271 4.21427L2.65927 9.58427C2.71373 9.7141 2.74177 9.85348 2.74177 9.99427C2.74177 10.1351 2.71373 10.2744 2.65927 10.4043L0.259271 15.7743C0.055971 16.231 -0.0299735 16.7313 0.00924794 17.2296C0.0484693 17.728 0.211613 18.2087 0.483853 18.628C0.756092 19.0473 1.1288 19.3919 1.56809 19.6305C2.00739 19.8691 2.49935 19.9941 2.99927 19.9943C3.4675 19.9896 3.92876 19.8803 4.34927 19.6743L18.3493 12.6743C18.8459 12.4245 19.2633 12.0416 19.555 11.5683C19.8466 11.0951 20.0011 10.5502 20.0011 9.99427C20.0011 9.43838 19.8466 8.89342 19.555 8.42019C19.2633 7.94696 18.8459 7.56408 18.3493 7.31427H18.3393ZM17.4493 10.8843L3.44927 17.8843C3.26543 17.9725 3.059 18.0025 2.85766 17.9701C2.65631 17.9377 2.46968 17.8446 2.32278 17.7031C2.17589 17.5617 2.07575 17.3787 2.0358 17.1787C1.99585 16.9787 2.018 16.7713 2.09927 16.5843L4.48927 11.2143C4.52021 11.1426 4.54692 11.0691 4.56927 10.9943H11.4593C11.7245 10.9943 11.9788 10.8889 12.1664 10.7014C12.3539 10.5138 12.4593 10.2595 12.4593 9.99427C12.4593 9.72905 12.3539 9.4747 12.1664 9.28716C11.9788 9.09963 11.7245 8.99427 11.4593 8.99427H4.56927C4.54692 8.91944 4.52021 8.84598 4.48927 8.77427L2.09927 3.40427C2.018 3.21723 1.99585 3.00982 2.0358 2.80984C2.07575 2.60986 2.17589 2.42687 2.32278 2.28542C2.46968 2.14396 2.65631 2.0508 2.85766 2.01842C3.059 1.98604 3.26543 2.016 3.44927 2.10427L17.4493 9.10427C17.6131 9.18819 17.7505 9.31568 17.8465 9.47271C17.9425 9.62975 17.9933 9.81022 17.9933 9.99427C17.9933 10.1783 17.9425 10.3588 17.8465 10.5158C17.7505 10.6729 17.6131 10.8004 17.4493 10.8843Z" fill="white"/>
            </svg>
          </Button>
        </div>
        <div className='flex flex-col gap-5 lg:gap-10 w-full'>
          {/* images */}
          <div className='flex items-center gap-6.5 w-full'>
            <TripGallery />
          </div>
          <div className='flex flex-col gap-3 lg:gap-7.5'>
            <h2 className='font-semibold text-2xl lg:text-[34px] leading-12.75 text-[#122445]'>
              Sharm El Sheikh Getaway
            </h2>
            <div className='w-full flex flex-col lg:flex-row gap-6.5'>
              <div className='w-full lg:w-[calc(100%-441px)] flex flex-col gap-7.5'>
                <div className='flex items-center flex-wrap gap-3 sm:gap-7.5'>
                  <p className="text-[#122445] capitalize">
                    <span className="font-semibold text-2xl lg:text-[30px] leading-10.25">8,500 {t("shared.egp", "EGP")}</span>
                    <span className="text-sm md:text-base leading-4.75">/{t("tripDetails.pricePerNight", "Night")} 10,000 {t("shared.egp", "EGP")}</span>
                  </p>
                  <div className="flex items-center justify-center px-3 py-1.5 bg-[#EF7722] rounded-md">
                    <p className="text-sm font-normal text-white">
                      20 % {t("tripDetails.off", "Off")}
                    </p>
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2.5'>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M25.6666 14C25.6666 20.4435 20.4434 25.6666 13.9999 25.6666C7.55642 25.6666 2.33325 20.4435 2.33325 14C2.33325 7.55648 7.55642 2.33331 13.9999 2.33331C20.4434 2.33331 25.6666 7.55648 25.6666 14Z" fill="#263859"/>
                      <path d="M18.1906 11.5535L16.4605 9.82214C15.2786 8.63798 14.6871 8.04648 14.0525 8.18648C13.4178 8.32648 13.1308 9.11281 12.5545 10.6831L12.1648 11.7471C12.0108 12.1671 11.935 12.376 11.7961 12.537C11.7343 12.6099 11.6638 12.6749 11.5861 12.7306C11.4135 12.8555 11.1988 12.915 10.7695 13.034C9.80112 13.3 9.31579 13.433 9.13379 13.7503C9.05522 13.8873 9.01417 14.0427 9.01479 14.2006C9.01712 14.567 9.37179 14.9216 10.0823 15.6333L10.6038 16.156L8.71379 18.0483C8.5498 18.2126 8.45779 18.4353 8.45801 18.6675C8.45823 18.8996 8.55065 19.1222 8.71496 19.2861C8.87926 19.4501 9.10197 19.5421 9.33411 19.5419C9.56625 19.5417 9.7888 19.4493 9.95279 19.285L11.8405 17.3938L12.3923 17.9456C13.1075 18.6608 13.4656 19.019 13.8331 19.019C13.9882 19.0194 14.1406 18.9792 14.2753 18.9023C14.595 18.7203 14.7291 18.2326 14.9975 17.2573C15.1141 16.828 15.1748 16.6133 15.2985 16.4406C15.3529 16.3644 15.4151 16.296 15.4851 16.2353C15.6461 16.0953 15.8538 16.0171 16.2703 15.862L17.346 15.4571C18.9 14.8738 19.677 14.5821 19.8135 13.9486C19.95 13.3151 19.3643 12.7283 18.1906 11.5535Z" fill="#263859"/>
                    </svg>
                    <h3 className='font-medium text-lg sm:text-xl leading-7.5 text-[#122445]'>
                      {t("tripDetails.aboutTrip", "About This Trip")}
                    </h3>
                  </div>
                  <p className='text-base sm:text-lg leading-6.75 text-black'>
                    Relax and enjoy a memorable getaway in Sharm El Sheikh. This trip offers the perfect balance between comfort and adventure, with beautiful beaches, clear waters, and carefully selected resorts.
                  </p>
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2.5'>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M25.6666 14C25.6666 20.4435 20.4434 25.6666 13.9999 25.6666C7.55642 25.6666 2.33325 20.4435 2.33325 14C2.33325 7.55648 7.55642 2.33331 13.9999 2.33331C20.4434 2.33331 25.6666 7.55648 25.6666 14Z" fill="#263859"/>
                      <path d="M18.1906 11.5535L16.4605 9.82214C15.2786 8.63798 14.6871 8.04648 14.0525 8.18648C13.4178 8.32648 13.1308 9.11281 12.5545 10.6831L12.1648 11.7471C12.0108 12.1671 11.935 12.376 11.7961 12.537C11.7343 12.6099 11.6638 12.6749 11.5861 12.7306C11.4135 12.8555 11.1988 12.915 10.7695 13.034C9.80112 13.3 9.31579 13.433 9.13379 13.7503C9.05522 13.8873 9.01417 14.0427 9.01479 14.2006C9.01712 14.567 9.37179 14.9216 10.0823 15.6333L10.6038 16.156L8.71379 18.0483C8.5498 18.2126 8.45779 18.4353 8.45801 18.6675C8.45823 18.8996 8.55065 19.1222 8.71496 19.2861C8.87926 19.4501 9.10197 19.5421 9.33411 19.5419C9.56625 19.5417 9.7888 19.4493 9.95279 19.285L11.8405 17.3938L12.3923 17.9456C13.1075 18.6608 13.4656 19.019 13.8331 19.019C13.9882 19.0194 14.1406 18.9792 14.2753 18.9023C14.595 18.7203 14.7291 18.2326 14.9975 17.2573C15.1141 16.828 15.1748 16.6133 15.2985 16.4406C15.3529 16.3644 15.4151 16.296 15.4851 16.2353C15.6461 16.0953 15.8538 16.0171 16.2703 15.862L17.346 15.4571C18.9 14.8738 19.677 14.5821 19.8135 13.9486C19.95 13.3151 19.3643 12.7283 18.1906 11.5535Z" fill="#263859"/>
                    </svg>
                    <h3 className='font-medium text-lg sm:text-xl leading-7.5 text-[#122445]'>
                      {t("tripDetails.tripOverview", "Trip Overview")}
                    </h3>
                  </div>
                  <p className='text-base sm:text-lg leading-7.5 text-black'>
                    {t("tripDetails.tripType", "Trip Type")}: <span className='font-normal text-lg leading-6.75 text-black'>{t("tripDetails.tripTypeValue", "Leisure / Beach")}</span>
                  </p>
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2.5'>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path opacity="0.5" d="M25.6666 14C25.6666 20.4435 20.4434 25.6667 13.9999 25.6667C7.55642 25.6667 2.33325 20.4435 2.33325 14C2.33325 7.55654 7.55642 2.33337 13.9999 2.33337C20.4434 2.33337 25.6666 7.55654 25.6666 14Z" fill="#263859"/>
                      <path d="M12.1485 9.91437L12.3398 9.57137C13.0783 8.24604 13.4482 7.58337 14 7.58337C14.5518 7.58337 14.9217 8.24604 15.6602 9.57137L15.8515 9.91437C16.0615 10.2912 16.1665 10.479 16.3298 10.6027C16.4932 10.7275 16.6985 10.7742 17.1057 10.8664L17.4767 10.9504C18.9117 11.2747 19.6292 11.4369 19.7995 11.9864C19.971 12.5347 19.481 13.1064 18.5033 14.2509L18.2502 14.5472C17.9725 14.8715 17.8337 15.0349 17.7718 15.2355C17.7077 15.4362 17.7287 15.6532 17.7718 16.0872L17.8092 16.4815C17.9573 18.0075 18.0308 18.7705 17.584 19.11C17.1372 19.4484 16.4663 19.1404 15.1223 18.522L14.7747 18.361C14.3932 18.186 14.203 18.0974 14 18.0974C13.7982 18.0974 13.6068 18.186 13.2253 18.361L12.8777 18.522C11.5337 19.1404 10.8628 19.4495 10.416 19.11C9.96915 18.7717 10.0427 18.0075 10.1908 16.4815L10.2282 16.0872C10.2713 15.6532 10.2923 15.4362 10.2282 15.2355C10.1663 15.0349 10.0275 14.8715 9.74982 14.5472L9.49665 14.2509C8.51898 13.1075 8.02898 12.5359 8.20048 11.9864C8.37082 11.438 9.08715 11.2747 10.5222 10.9504L10.8943 10.8664C11.3027 10.773 11.5057 10.7275 11.6702 10.6039C11.8335 10.479 11.9385 10.29 12.1485 9.91437Z" fill="#263859"/>
                    </svg>
                    <h3 className='font-medium text-lg sm:text-xl leading-7.5 text-[#122445]'>
                      {t("tripDetails.whatsIncluded", "What’s Included")}
                    </h3>
                  </div>
                  <p className='text-base sm:text-lg leading-6.75 text-black'>
                    {t("tripDetails.included.hotel", "Hotel accommodation")}
                  </p>
                  <p className='text-base sm:text-lg leading-6.75 text-black'>
                    {t("tripDetails.included.breakfast", "Daily breakfast")}
                  </p>
                  <p className='text-base sm:text-lg leading-6.75 text-black'>
                    {t("tripDetails.included.transport", "Transportation")}
                  </p>
                  <p className='text-base sm:text-lg leading-6.75 text-black'>
                    {t("tripDetails.included.activities", "Guided activities")}
                  </p>
                </div>
              </div>
              <div className='flex flex-col items-center gap-4 w-full sm:w-103.75 bg-white shadow-[0_0_6.3px_rgba(38,56,89,0.24)] rounded-[18px] mx-auto'>
                <div className='relative w-full flex items-center px-3 p-4 gap-2.5 bg-[rgba(239,119,34,0.06)] border-2 border-[#EF7722] rounded-2xl box-border'>
                  <div className='w-full flex items-center gap-4.5'>
                    <div className='w-[calc(100%-34px)] flex flex-col justify-center gap-2'>
                      <div className="flex justify-center items-center gap-2.5 border-b border-[#EF7722] box-border">
                        <p className="text-xl sm:text-[26px] leading-6 text-center text-black pb-2">
                          {selectedTrip?.date}
                        </p>
                      </div>
                      <div className='flex justify-between items-center gap-2.5'>
                        <div className='flex justify-center items-center gap-1'>
                          <div className='flex items-center p-1 bg-white border border-[#EF7722] rounded-md'>
                            <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9.24909 9.24776H14.7491M12.7491 16.7478L9.74909 20.7478M9.74909 20.7478H4.74909M9.74909 20.7478H14.7491M5.23109 16.7478H14.7211C15.8411 16.7478 16.7491 15.8558 16.7491 14.7548C16.7491 13.2478 14.7211 12.7618 14.7211 12.7618C14.7211 12.7618 11.0331 11.3438 6.74909 12.7478C6.74909 12.7478 6.61009 7.62076 4.45909 1.91776C4.03409 0.793764 2.65009 0.409764 1.63409 1.07476C1.30787 1.28642 1.05278 1.59123 0.901928 1.94964C0.751073 2.30805 0.711412 2.70353 0.788089 3.08476L3.24209 15.1448C3.33817 15.6002 3.5886 16.0085 3.95102 16.3006C4.31344 16.5927 4.76562 16.7506 5.23109 16.7478Z" stroke="#EF7722" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <p className='text-sm sm:text-base leading-6 text-black'>
                            {t("tripDetails.availableSpots", "Available spots")}: {selectedTrip?.availableSpots}
                          </p>
                        </div>
                        <div className='flex justify-center items-center gap-1'>
                          <div className='flex items-center p-1 bg-white border border-[#EF7722] rounded-md'>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V14.25C2.25 15.0784 2.92157 15.75 3.75 15.75H14.25C15.0784 15.75 15.75 15.0784 15.75 14.25V6C15.75 5.17157 15.0784 4.5 14.25 4.5Z" stroke="#EF7722"/>
                              <path d="M2.25 7.5C2.25 6.0855 2.25 5.379 2.6895 4.9395C3.129 4.5 3.8355 4.5 5.25 4.5H12.75C14.1645 4.5 14.871 4.5 15.3105 4.9395C15.75 5.379 15.75 6.0855 15.75 7.5H2.25Z" fill="#EF7722"/>
                              <path d="M5.25 2.25V4.5M12.75 2.25V4.5" stroke="#EF7722" strokeLinecap="round"/>
                              <path d="M7.875 9H5.625C5.41789 9 5.25 9.16789 5.25 9.375V10.125C5.25 10.3321 5.41789 10.5 5.625 10.5H7.875C8.08211 10.5 8.25 10.3321 8.25 10.125V9.375C8.25 9.16789 8.08211 9 7.875 9Z" fill="#EF7722"/>
                              <path d="M7.875 12H5.625C5.41789 12 5.25 12.1679 5.25 12.375V13.125C5.25 13.3321 5.41789 13.5 5.625 13.5H7.875C8.08211 13.5 8.25 13.3321 8.25 13.125V12.375C8.25 12.1679 8.08211 12 7.875 12Z" fill="#EF7722"/>
                              <path d="M12.375 9H10.125C9.91789 9 9.75 9.16789 9.75 9.375V10.125C9.75 10.3321 9.91789 10.5 10.125 10.5H12.375C12.5821 10.5 12.75 10.3321 12.75 10.125V9.375C12.75 9.16789 12.5821 9 12.375 9Z" fill="#EF7722"/>
                              <path d="M12.375 12H10.125C9.91789 12 9.75 12.1679 9.75 12.375V13.125C9.75 13.3321 9.91789 13.5 10.125 13.5H12.375C12.5821 13.5 12.75 13.3321 12.75 13.125V12.375C12.75 12.1679 12.5821 12 12.375 12Z" fill="#EF7722"/>
                            </svg>
                          </div>
                          <p className='text-sm sm:text-base leading-6 text-black'>
                            {selectedTrip?.duration.days} {t("tripDetails.durationDays", "Days")} / {selectedTrip?.duration.nights} {t("tripDetails.durationNights", "Nights")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <svg onClick={() => setIsTripDropdownOpen(prev => !prev)} className='cursor-pointer' width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.90735e-06 3.48399C-0.000988007 4.32532 0.283253 5.14134 0.804922 5.7948L8.17171 14.8603C8.45031 15.2158 8.80425 15.5029 9.20718 15.7002C9.61011 15.8975 10.0517 16 10.499 16C10.9463 16 11.3878 15.8975 11.7908 15.7002C12.1937 15.5029 12.5477 15.2158 12.8263 14.8603L20.193 5.7948C20.6235 5.24903 20.8944 4.59141 20.9748 3.89686C21.0553 3.20231 20.942 2.49877 20.648 1.86642C20.4095 1.31685 20.0204 0.848624 19.527 0.517661C19.0337 0.186699 18.4569 0.00699139 17.8658 0H3.1322C2.54101 0.00699139 1.9643 0.186699 1.47094 0.517661C0.977583 0.848624 0.588434 1.31685 0.349968 1.86642C0.120966 2.37405 0.0016346 2.9256 1.90735e-06 3.48399Z" fill="#122445"/>
                    </svg>
                  </div>
                  {isTripDropdownOpen && (
                    <div ref={dropdownRef} className='absolute right-0 left-0 top-27 flex flex-col items-start px-1.5 py-2.5 gap-1.5 h-63 bg-white shadow-[0px_0px_6.3px_rgba(38,56,89,0.24)] rounded-2xl'>
                      <div className='w-full flex flex-col items-start px-1 gap-1.75 h-52.75 overflow-y-scroll'>
                        {tripsData.map((trip) => (
                          <div 
                            key={trip.id} 
                            onClick={() => setSelectedTripId(trip.id)}
                            className={`w-full flex flex-col items-center p-3 gap-2.5 border rounded-xl cursor-pointer transition-colors duration-200
                                      ${trip.id === selectedTripId ? "border-[#EF7722] bg-[#FFF6F0]" : "border-[#D8E5FD] bg-white"}`}
                          >
                            <div className="flex justify-center items-center gap-2.5 border-b border-[#D8E5FD] box-border">
                              <p className="text-xl sm:text-[26px] leading-6 text-center text-black pb-2">
                                {trip.date}
                              </p>
                            </div>
                            <div className='flex justify-between items-center gap-2.5'>
                              <div className='flex justify-center items-center gap-1'>
                                <div className={`flex items-center p-1 bg-white border ${trip.id === selectedTripId ? "border-[#EF7722]" : "border-[#8CA9FF]"} rounded-md`}>
                                  <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.24909 9.24778H14.7491M12.7491 16.7478L9.74909 20.7478M9.74909 20.7478H4.74909M9.74909 20.7478H14.7491M5.23109 16.7478H14.7211C15.8411 16.7478 16.7491 15.8558 16.7491 14.7548C16.7491 13.2478 14.7211 12.7618 14.7211 12.7618C14.7211 12.7618 11.0331 11.3438 6.74909 12.7478C6.74909 12.7478 6.61009 7.62078 4.45909 1.91778C4.03409 0.793779 2.65009 0.409779 1.63409 1.07478C1.30787 1.28643 1.05278 1.59124 0.901928 1.94965C0.751073 2.30807 0.711412 2.70355 0.788089 3.08478L3.24209 15.1448C3.33817 15.6002 3.5886 16.0085 3.95102 16.3006C4.31344 16.5927 4.76562 16.7507 5.23109 16.7478Z" stroke={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </div>
                                <p className='text-sm sm:text-base leading-6 text-black'>
                                  {t("tripDetails.availableSpots", "Available spots")}: {trip.availableSpots}
                                </p>
                              </div>
                              <div className='flex justify-center items-center gap-1'>
                                <div className={`flex items-center p-1 bg-white border ${trip.id === selectedTripId ? "border-[#EF7722]" : "border-[#8CA9FF]"} rounded-md`}>
                                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V14.25C2.25 15.0784 2.92157 15.75 3.75 15.75H14.25C15.0784 15.75 15.75 15.0784 15.75 14.25V6C15.75 5.17157 15.0784 4.5 14.25 4.5Z" stroke={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                                    <path d="M2.25 7.5C2.25 6.0855 2.25 5.379 2.6895 4.9395C3.129 4.5 3.8355 4.5 5.25 4.5H12.75C14.1645 4.5 14.871 4.5 15.3105 4.9395C15.75 5.379 15.75 6.0855 15.75 7.5H2.25Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                                    <path d="M5.25 2.25V4.5M12.75 2.25V4.5" stroke={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`} stroke-linecap="round"/>
                                    <path d="M7.875 9H5.625C5.41789 9 5.25 9.16789 5.25 9.375V10.125C5.25 10.3321 5.41789 10.5 5.625 10.5H7.875C8.08211 10.5 8.25 10.3321 8.25 10.125V9.375C8.25 9.16789 8.08211 9 7.875 9Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                                    <path d="M7.875 12H5.625C5.41789 12 5.25 12.1679 5.25 12.375V13.125C5.25 13.3321 5.41789 13.5 5.625 13.5H7.875C8.08211 13.5 8.25 13.3321 8.25 13.125V12.375C8.25 12.1679 8.08211 12 7.875 12Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                                    <path d="M12.375 9H10.125C9.91789 9 9.75 9.16789 9.75 9.375V10.125C9.75 10.3321 9.91789 10.5 10.125 10.5H12.375C12.5821 10.5 12.75 10.3321 12.75 10.125V9.375C12.75 9.16789 12.5821 9 12.375 9Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                                    <path d="M12.375 12H10.125C9.91789 12 9.75 12.1679 9.75 12.375V13.125C9.75 13.3321 9.91789 13.5 10.125 13.5H12.375C12.5821 13.5 12.75 13.3321 12.75 13.125V12.375C12.75 12.1679 12.5821 12 12.375 12Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                                  </svg>
                                </div>
                                <p className='text-sm sm:text-base leading-6 text-black'>
                                  {trip.duration.days} {t("tripDetails.durationDays", "Days")} / {trip.duration.nights} {t("tripDetails.durationNights", "Nights")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setIsOpen(true);
                          setIsTripDropdownOpen(false)
                        }}
                        className='text-[10px] font-light leading-3.75 underline text-black bg-transparent cursor-pointer'
                      >
                        {t("shared.see_all", "See All")}
                      </button>
                    </div>
                  )}
                </div>
                <div className='w-full flex flex-col p-5 sm:p-9 pt-0! gap-4.5'>
                  <div className="w-full flex justify-center items-center py-3 border border-[#EF7722] rounded-xl">
                    <h3 className="font-medium text-lg sm:text-[20px] leading-6 text-[#122445]">
                      {t("tripDetails.tripItinerary", "Trip Itinerary")}
                    </h3>
                  </div>
                  <div className='w-full'>
                    <div className='min-h-28 flex gap-4'>
                      <div className='flex flex-col items-center gap-1 pb-1'>
                        <div className='flex justify-center items-center w-10 h-10 bg-[#EF7722] rounded-full'>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.16667 18.1084C9.42003 18.2546 9.70744 18.3316 10 18.3316C10.2926 18.3316 10.58 18.2546 10.8333 18.1084L16.6667 14.775C16.9198 14.6289 17.13 14.4188 17.2763 14.1657C17.4225 13.9127 17.4997 13.6256 17.5 13.3334V6.66669C17.4997 6.37442 17.4225 6.08736 17.2763 5.83432C17.13 5.58128 16.9198 5.37116 16.6667 5.22502L10.8333 1.89169C10.58 1.74541 10.2926 1.6684 10 1.6684C9.70744 1.6684 9.42003 1.74541 9.16667 1.89169L3.33333 5.22502C3.08022 5.37116 2.86998 5.58128 2.72372 5.83432C2.57745 6.08736 2.5003 6.37442 2.5 6.66669V13.3334C2.5003 13.6256 2.57745 13.9127 2.72372 14.1657C2.86998 14.4188 3.08022 14.6289 3.33333 14.775L9.16667 18.1084Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 18.3333V10" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2.7417 5.83331L10 9.99998L17.2584 5.83331" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6.25 3.55835L13.75 7.85002" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className='w-0.5 h-[calc(100%-44px)] bg-[#263859]'></div>
                      </div>
                      <div className='flex flex-col gap-1'>
                        <h4 className='font-sans rtl:font-arabic font-normal text-base leading-6 text-[#122445]'>
                          {t("tripDetails.itinerary.day1Title", "Day 1 – Arrival")}
                        </h4>
                        <p className='font-sans rtl:font-arabic font-normal text-sm leading-5 text-[#535353]'>
                          {t("tripDetails.itinerary.day1Desc", "Arrival, hotel check-in, and free time.")}
                        </p>
                      </div>
                    </div>
                    <div className='min-h-28 flex gap-4'>
                      <div className='flex flex-col items-center gap-1 pb-1'>
                        <div className='flex justify-center items-center w-10 h-10 bg-[#EF7722] rounded-full'>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.16667 18.1084C9.42003 18.2546 9.70744 18.3316 10 18.3316C10.2926 18.3316 10.58 18.2546 10.8333 18.1084L16.6667 14.775C16.9198 14.6289 17.13 14.4188 17.2763 14.1657C17.4225 13.9127 17.4997 13.6256 17.5 13.3334V6.66669C17.4997 6.37442 17.4225 6.08736 17.2763 5.83432C17.13 5.58128 16.9198 5.37116 16.6667 5.22502L10.8333 1.89169C10.58 1.74541 10.2926 1.6684 10 1.6684C9.70744 1.6684 9.42003 1.74541 9.16667 1.89169L3.33333 5.22502C3.08022 5.37116 2.86998 5.58128 2.72372 5.83432C2.57745 6.08736 2.5003 6.37442 2.5 6.66669V13.3334C2.5003 13.6256 2.57745 13.9127 2.72372 14.1657C2.86998 14.4188 3.08022 14.6289 3.33333 14.775L9.16667 18.1084Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 18.3333V10" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2.7417 5.83331L10 9.99998L17.2584 5.83331" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6.25 3.55835L13.75 7.85002" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className='w-0.5 h-[calc(100%-44px)] bg-[#263859]'></div>
                      </div>
                      <div className='flex flex-col gap-1'>
                        <h4 className='font-sans rtl:font-arabic font-normal text-base leading-6 text-[#122445]'>
                          {t("tripDetails.itinerary.day2Title", "Day 2 – Activities")}
                        </h4>
                        <p className='font-sans rtl:font-arabic font-normal text-sm leading-5 text-[#535353]'>
                          {t("tripDetails.itinerary.day2Title", "Snorkeling trip and beach time.")}
                        </p>
                      </div>
                    </div>
                    <div className='min-h-28 flex gap-4'>
                      <div className='flex flex-col items-center gap-1 pb-1'>
                        <div className='flex justify-center items-center w-10 h-10 bg-[#EF7722] rounded-full'>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.16667 18.1084C9.42003 18.2546 9.70744 18.3316 10 18.3316C10.2926 18.3316 10.58 18.2546 10.8333 18.1084L16.6667 14.775C16.9198 14.6289 17.13 14.4188 17.2763 14.1657C17.4225 13.9127 17.4997 13.6256 17.5 13.3334V6.66669C17.4997 6.37442 17.4225 6.08736 17.2763 5.83432C17.13 5.58128 16.9198 5.37116 16.6667 5.22502L10.8333 1.89169C10.58 1.74541 10.2926 1.6684 10 1.6684C9.70744 1.6684 9.42003 1.74541 9.16667 1.89169L3.33333 5.22502C3.08022 5.37116 2.86998 5.58128 2.72372 5.83432C2.57745 6.08736 2.5003 6.37442 2.5 6.66669V13.3334C2.5003 13.6256 2.57745 13.9127 2.72372 14.1657C2.86998 14.4188 3.08022 14.6289 3.33333 14.775L9.16667 18.1084Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 18.3333V10" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2.7417 5.83331L10 9.99998L17.2584 5.83331" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6.25 3.55835L13.75 7.85002" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className='w-0.5 h-[calc(100%-44px)] bg-[#263859]'></div>
                      </div>
                      <div className='flex flex-col gap-1'>
                        <h4 className='font-sans rtl:font-arabic font-normal text-base leading-6 text-[#122445]'>
                          {t("tripDetails.itinerary.day3Title", "Day 3 – Free Day")}
                        </h4>
                        <p className='font-sans rtl:font-arabic font-normal text-sm leading-5 text-[#535353]'>
                          {t("tripDetails.itinerary.day3Title", "Leisure time or optional activities.")}
                        </p>
                      </div>
                    </div>
                    <div className='min-h-28 flex gap-4'>
                      <div className='flex flex-col items-center gap-1 pb-1'>
                        <div className='flex justify-center items-center w-10 h-10 bg-[#EF7722] rounded-full'>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.16667 18.1084C9.42003 18.2546 9.70744 18.3316 10 18.3316C10.2926 18.3316 10.58 18.2546 10.8333 18.1084L16.6667 14.775C16.9198 14.6289 17.13 14.4188 17.2763 14.1657C17.4225 13.9127 17.4997 13.6256 17.5 13.3334V6.66669C17.4997 6.37442 17.4225 6.08736 17.2763 5.83432C17.13 5.58128 16.9198 5.37116 16.6667 5.22502L10.8333 1.89169C10.58 1.74541 10.2926 1.6684 10 1.6684C9.70744 1.6684 9.42003 1.74541 9.16667 1.89169L3.33333 5.22502C3.08022 5.37116 2.86998 5.58128 2.72372 5.83432C2.57745 6.08736 2.5003 6.37442 2.5 6.66669V13.3334C2.5003 13.6256 2.57745 13.9127 2.72372 14.1657C2.86998 14.4188 3.08022 14.6289 3.33333 14.775L9.16667 18.1084Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 18.3333V10" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2.7417 5.83331L10 9.99998L17.2584 5.83331" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6.25 3.55835L13.75 7.85002" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className='w-0.5 h-[calc(100%-44px)] bg-[#263859]'></div>
                      </div>
                      <div className='flex flex-col gap-1'>
                        <h4 className='font-sans rtl:font-arabic font-normal text-base leading-6 text-[#122445]'>
                          {t("tripDetails.itinerary.day4Title", "Day 4 – Departure")}
                        </h4>
                        <p className='font-sans rtl:font-arabic font-normal text-sm leading-5 text-[#535353]'>
                          {t("tripDetails.itinerary.day4Title", "Check-out and departure.")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button
              className="flex justify-center items-center px-3.5 py-3 w-full max-w-110.25 bg-[#263859] rounded-xl font-medium text-lg leading-6.75 text-white capitalize mx-auto lg:mx-0"
              onClick={() => setBookingIsOpen(true)}
            >
              {t("tripDetails.book", "Book")}
            </Button>
          </div>
        </div>
      </div>
      <TripsSection
        title2='tripDetails.recommended.title1'
        title3='tripDetails.recommended.title2'
        description='tripDetails.recommended.description'
        actionText='tripDetails.recommended.seeMore'
        actionLink='/trips'
      >
        <TripsCarousel>
          {trips.map(tripItem => (
            <TripCard
              key={tripItem.id}
              data={{
                id: tripItem.id,
                image: trip,
                title: tripItem.title,
                category: "Red Sea Getaways",
                days: 5,
                nights: 4,
                location: tripItem.location,
                frequency: "Daily",
                availableSpots: 12,
                price: 8500,
                oldPrice: 9000,
                discountPercent: 10,
                isFavorite: favorites[tripItem.id] ?? false,
                href: `/trips/${tripItem.id}`,
                onViewDetails: () => console.log("view", tripItem.id),
                onToggleFavorite: handleToggleFavorite,
              }}
            />
          ))}
        </TripsCarousel>
      </TripsSection>
      
      <AvailableDatesDialog
        isOpen={dialogIsOpen}
        onClose={() => setIsOpen(false)}
      >
        <div className='w-full h-[50vh] grid md:grid-cols-2 gap-4.5 overflow-y-scroll pe-1.5'>
          {tripsData.map((trip) => (
            <div 
              key={trip.id} 
              onClick={() => {
                setSelectedTripId(trip.id);
                setIsOpen(false);
              }}
              className={`w-full flex flex-col items-center p-3 gap-2.5 border rounded-xl cursor-pointer transition-colors duration-200
                        ${trip.id === selectedTripId ? "border-[#EF7722] bg-[#FFF6F0]" : "border-[#D8E5FD] bg-white"}`}
            >
              <div className="flex justify-center items-center gap-2.5 border-b border-[#D8E5FD] box-border">
                <p className="text-xl sm:text-[26px] leading-6 text-center text-black pb-2">
                  {trip.date}
                </p>
              </div>
              <div className='flex justify-between items-center gap-2.5'>
                <div className='flex justify-center items-center gap-1'>
                  <div className={`flex items-center p-1 bg-white border ${trip.id === selectedTripId ? "border-[#EF7722]" : "border-[#8CA9FF]"} rounded-md`}>
                    <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.24909 9.24778H14.7491M12.7491 16.7478L9.74909 20.7478M9.74909 20.7478H4.74909M9.74909 20.7478H14.7491M5.23109 16.7478H14.7211C15.8411 16.7478 16.7491 15.8558 16.7491 14.7548C16.7491 13.2478 14.7211 12.7618 14.7211 12.7618C14.7211 12.7618 11.0331 11.3438 6.74909 12.7478C6.74909 12.7478 6.61009 7.62078 4.45909 1.91778C4.03409 0.793779 2.65009 0.409779 1.63409 1.07478C1.30787 1.28643 1.05278 1.59124 0.901928 1.94965C0.751073 2.30807 0.711412 2.70355 0.788089 3.08478L3.24209 15.1448C3.33817 15.6002 3.5886 16.0085 3.95102 16.3006C4.31344 16.5927 4.76562 16.7507 5.23109 16.7478Z" stroke={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <p className='text-sm sm:text-base leading-6 text-black'>
                    {t("tripDetails.availableSpots", "Available spots")}: {trip.availableSpots}
                  </p>
                </div>
                <div className='flex justify-center items-center gap-1'>
                  <div className={`flex items-center p-1 bg-white border ${trip.id === selectedTripId ? "border-[#EF7722]" : "border-[#8CA9FF]"} rounded-md`}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V14.25C2.25 15.0784 2.92157 15.75 3.75 15.75H14.25C15.0784 15.75 15.75 15.0784 15.75 14.25V6C15.75 5.17157 15.0784 4.5 14.25 4.5Z" stroke={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                      <path d="M2.25 7.5C2.25 6.0855 2.25 5.379 2.6895 4.9395C3.129 4.5 3.8355 4.5 5.25 4.5H12.75C14.1645 4.5 14.871 4.5 15.3105 4.9395C15.75 5.379 15.75 6.0855 15.75 7.5H2.25Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                      <path d="M5.25 2.25V4.5M12.75 2.25V4.5" stroke={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`} stroke-linecap="round"/>
                      <path d="M7.875 9H5.625C5.41789 9 5.25 9.16789 5.25 9.375V10.125C5.25 10.3321 5.41789 10.5 5.625 10.5H7.875C8.08211 10.5 8.25 10.3321 8.25 10.125V9.375C8.25 9.16789 8.08211 9 7.875 9Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                      <path d="M7.875 12H5.625C5.41789 12 5.25 12.1679 5.25 12.375V13.125C5.25 13.3321 5.41789 13.5 5.625 13.5H7.875C8.08211 13.5 8.25 13.3321 8.25 13.125V12.375C8.25 12.1679 8.08211 12 7.875 12Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                      <path d="M12.375 9H10.125C9.91789 9 9.75 9.16789 9.75 9.375V10.125C9.75 10.3321 9.91789 10.5 10.125 10.5H12.375C12.5821 10.5 12.75 10.3321 12.75 10.125V9.375C12.75 9.16789 12.5821 9 12.375 9Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                      <path d="M12.375 12H10.125C9.91789 12 9.75 12.1679 9.75 12.375V13.125C9.75 13.3321 9.91789 13.5 10.125 13.5H12.375C12.5821 13.5 12.75 13.3321 12.75 13.125V12.375C12.75 12.1679 12.5821 12 12.375 12Z" fill={`${trip.id === selectedTripId ? "#EF7722" : "#8CA9FF"}`}/>
                    </svg>
                  </div>
                  <p className='text-sm sm:text-base leading-6 text-black'>
                    {trip.duration.days} {t("tripDetails.durationDays", "Days")} / {trip.duration.nights} {t("tripDetails.durationNights", "Nights")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AvailableDatesDialog>
      
      <BookingDialog
        isOpen={dialogBookingIsOpen}
        onClose={() => setBookingIsOpen(false)}
        onConfirm={() => setBookingIsOpen(false)}
      />
    </section>
  )
}

export default TripDetails
