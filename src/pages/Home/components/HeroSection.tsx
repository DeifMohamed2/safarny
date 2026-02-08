import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"

import { Calendar } from "@/components/ui/calendar"
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [guestsCount, setGuestsCount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [destination, setDestination] = useState("Sharm El Sheikh")
  const [date, setDate] = useState<Date | undefined>(new Date())

  const resetFilters = () => {
    setRoomCount("");
    setGuestsCount("");
    console.log("guestsCount: ",guestsCount," roomCount:",roomCount);
    
  };
  return (<>
      <section
        className="relative min-h-dvh sm:h-full flex items-center overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url('../../../../attached_assets/homePage/bg.jpg')`,
          transition: "background-image 0.5s ease-in-out",
        }}
      >
        <div className="w-full h-full left-0 top-0 absolute bg-indigo-300/30"></div>
        <div className="max-w-340 w-full h-[calc(100%-340px)] px-4 relative z-10 text-start text-white mx-auto">
          <h1 className="max-w-166 justify-start text-white text-[26px] sm:text-[40px] md:text-[53px] font-semibold capitalize leading-normal pt-15">
            {t("home.hero.title", "Explore where comfort")}
          </h1>
          <div className="w-full min-h-70 flex flex-col justify-end items-center">
            {/* Search Bar */}
            <div
              className="max-w-226 flex flex-col sm:flex-row gap-3.5 w-full pb-10.75"
            >
              <button
                onClick={() => {
                  if (showFilters) {
                    resetFilters();
                  }
                  setShowFilters(!showFilters);
                }}
                className="hidden lg:flex w-full sm:w-28 h-16 p-4 bg-white rounded-xl outline -outline-offset-1 outline-black/10 justify-center items-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ease-in-out ${
                    showFilters ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <path d="M19 22V11" stroke="#8CA9FF" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M19 7V2" stroke="#8CA9FF" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 22V17" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 13V2" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5 22V11" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5 7V2" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3 11H7" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 11H21" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 13H14" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span className='justify-start text-neutral-600 text-lg font-normal leading-7'>
                  {t("filter.filter", "Filter")}
                </span>
              </button>
              <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className="flex w-full sm:w-28 h-16 p-4 bg-white rounded-xl outline -outline-offset-1 outline-black/10 justify-center items-center gap-2 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ease-in-out ${
                        showFilters ? "rotate-90" : "rotate-0"
                      }`}
                    >
                      <path d="M19 22V11" stroke="#8CA9FF" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M19 7V2" stroke="#8CA9FF" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12 22V17" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12 13V2" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M5 22V11" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M5 7V2" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M3 11H7" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M17 11H21" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M10 13H14" stroke="#263859" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span className='justify-start text-neutral-600 text-lg font-normal leading-7'>
                      {t("filter.filter", "Filter")}
                    </span>
                  </button>
                </SheetTrigger>

                <SheetContent side="right" className="sm:w-105 overflow-y-auto py-4 px-4">
                  <SheetHeader className='text-start'>
                    {t("filter.filter", "Filter")}
                  </SheetHeader>
                  <div className='h-[calc(100%-24px)] flex flex-col justify-between'>
                    <div className="w-full py-4 bg-white rounded-2xl flex flex-col lg:flex-row justify-between lg:items-end gap-8">
                      <div className="w-full flex flex-col justify-start items-start gap-4 flex-wrap">
                        {/* Destination */}
                        <div className="w-full flex flex-col justify-start items-start gap-2">
                          <div className="text-black placeholder:text-black text-base font-semibold capitalize">
                            {t("filter.destination", "Destination")}
                          </div>

                          <Select value={destination} onValueChange={setDestination}>
                            <SelectTrigger
                              className="
                                p-3 bg-neutral-100 rounded-lg
                                inline-flex justify-between items-center gap-6
                                w-full
                                border-0 focus:ring-0
                                cursor-pointer
                              "
                            >
                              <span className="justify-start text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"><SelectValue placeholder={t("filter.selectDestination")}/></span>
                              {/* custom arrow (same as HTML) */}
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" viewBox="0 0 12 6" fill="none">
                                <path d="M0.930583 0.157712L5.61558 4.76871C5.7178 4.86984 5.85579 4.92656 5.99958 4.92656C6.14337 4.92656 6.28136 4.86984 6.38358 4.76871L11.0696 0.158712C11.1724 0.0576367 11.3109 0.0010004 11.4551 0.0010004C11.5993 0.0010004 11.7377 0.0576367 11.8406 0.158712C11.8912 0.208089 11.9315 0.267105 11.959 0.332282C11.9865 0.397459 12.0006 0.467478 12.0006 0.538212C12.0006 0.608947 11.9865 0.678966 11.959 0.744143C11.9315 0.809319 11.8912 0.868335 11.8406 0.917712L7.15658 5.52771C6.84806 5.83064 6.43296 6.00036 6.00058 6.00036C5.56821 6.00036 5.15311 5.83064 4.84458 5.52771L0.160583 0.917712C0.109781 0.86832 0.0693989 0.809242 0.0418243 0.743973C0.0142498 0.678703 4.19617e-05 0.608568 4.19617e-05 0.537713C4.19617e-05 0.466857 0.0142498 0.396721 0.0418243 0.331452C0.0693989 0.266183 0.109781 0.207105 0.160583 0.157712C0.263439 0.0566368 0.401876 0 0.546083 0C0.69029 0 0.828728 0.0566368 0.931583 0.157712" fill="black"/>
                              </svg>
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="Sharm El Sheikh">{t("destinations.sharm", "Sharm El Sheikh")}</SelectItem>
                              <SelectItem value="Hurghada">{t("destinations.hurghada", "Hurghada")}</SelectItem>
                              <SelectItem value="Dahab">{t("destinations.dahab", "Dahab")}</SelectItem>
                              <SelectItem value="Marsa Alam">{t("destinations.marsa", "Marsa Alam")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date */}
                        <div className="w-full flex flex-col justify-start items-start gap-2">
                          <div className="text-black placeholder:text-black text-base font-semibold capitalize">
                            {t("filter.date", "Date")}
                          </div>

                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className="
                                  w-full pl-5 pr-3 py-3 bg-neutral-100 rounded-lg
                                  inline-flex justify-between items-center
                                  text-black placeholder:text-black text-base
                                  cursor-pointer
                                "
                              >
                                <span>
                                  {date
                                    ? date.toLocaleDateString("en-GB")
                                    : t("filter.selectDate", "Select date")}
                                </span>

                                {/* calendar icon placeholder (HTML style) */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                  <path d="M10 9.0625C9.75136 9.0625 9.5129 9.16127 9.33709 9.33709C9.16127 9.5129 9.0625 9.75136 9.0625 10V10.0125C9.0625 10.53 9.4825 10.95 10 10.95H10.0125C10.2611 10.95 10.4996 10.8512 10.6754 10.6754C10.8512 10.4996 10.95 10.2611 10.95 10.0125V10C10.95 9.75136 10.8512 9.5129 10.6754 9.33709C10.4996 9.16127 10.2611 9.0625 10.0125 9.0625H10ZM5 14.0625C4.75136 14.0625 4.5129 14.1613 4.33709 14.3371C4.16127 14.5129 4.0625 14.7514 4.0625 15V15.0125C4.0625 15.53 4.4825 15.95 5 15.95H5.0125C5.26114 15.95 5.4996 15.8512 5.67541 15.6754C5.85123 15.4996 5.95 15.2611 5.95 15.0125V15C5.95 14.7514 5.85123 14.5129 5.67541 14.3371C5.4996 14.1613 5.26114 14.0625 5.0125 14.0625H5ZM7.5 14.0625C7.25136 14.0625 7.0129 14.1613 6.83709 14.3371C6.66127 14.5129 6.5625 14.7514 6.5625 15V15.0125C6.5625 15.53 6.9825 15.95 7.5 15.95H7.5125C7.76114 15.95 7.9996 15.8512 8.17541 15.6754C8.35123 15.4996 8.45 15.2611 8.45 15.0125V15C8.45 14.7514 8.35123 14.5129 8.17541 14.3371C7.9996 14.1613 7.76114 14.0625 7.5125 14.0625H7.5ZM9.0625 15C9.0625 14.7514 9.16127 14.5129 9.33709 14.3371C9.5129 14.1613 9.75136 14.0625 10 14.0625H10.0125C10.2611 14.0625 10.4996 14.1613 10.6754 14.3371C10.8512 14.5129 10.95 14.7514 10.95 15V15.0125C10.95 15.2611 10.8512 15.4996 10.6754 15.6754C10.4996 15.8512 10.2611 15.95 10.0125 15.95H10C9.75136 15.95 9.5129 15.8512 9.33709 15.6754C9.16127 15.4996 9.0625 15.2611 9.0625 15.0125V15ZM12.5 11.5625C12.2514 11.5625 12.0129 11.6613 11.8371 11.8371C11.6613 12.0129 11.5625 12.2514 11.5625 12.5V12.5125C11.5625 13.03 11.9825 13.45 12.5 13.45H12.5125C12.7611 13.45 12.9996 13.3512 13.1754 13.1754C13.3512 12.9996 13.45 12.7611 13.45 12.5125V12.5C13.45 12.2514 13.3512 12.0129 13.1754 11.8371C12.9996 11.6613 12.7611 11.5625 12.5125 11.5625H12.5ZM12.5 14.0625C12.2514 14.0625 12.0129 14.1613 11.8371 14.3371C11.6613 14.5129 11.5625 14.7514 11.5625 15V15.0125C11.5625 15.53 11.9825 15.95 12.5 15.95H12.5125C12.7611 15.95 12.9996 15.8512 13.1754 15.6754C13.3512 15.4996 13.45 15.2611 13.45 15.0125V15C13.45 14.7514 13.3512 14.5129 13.1754 14.3371C12.9996 14.1613 12.7611 14.0625 12.5125 14.0625H12.5ZM14.0625 12.5C14.0625 12.2514 14.1613 12.0129 14.3371 11.8371C14.5129 11.6613 14.7514 11.5625 15 11.5625H15.0125C15.2611 11.5625 15.4996 11.6613 15.6754 11.8371C15.8512 12.0129 15.95 12.2514 15.95 12.5V12.5125C15.95 12.7611 15.8512 12.9996 15.6754 13.1754C15.4996 13.3512 15.2611 13.45 15.0125 13.45H15C14.7514 13.45 14.5129 13.3512 14.3371 13.1754C14.1613 12.9996 14.0625 12.7611 14.0625 12.5125V12.5ZM11.5625 10.0063C11.5625 9.485 11.985 9.0625 12.5063 9.0625H15.0063C15.2565 9.0625 15.4966 9.16193 15.6736 9.33892C15.8506 9.51591 15.95 9.75595 15.95 10.0063C15.95 10.2565 15.8506 10.4966 15.6736 10.6736C15.4966 10.8506 15.2565 10.95 15.0063 10.95H12.5063C12.256 10.95 12.0159 10.8506 11.8389 10.6736C11.6619 10.4966 11.5625 10.2565 11.5625 10.0063ZM5.00625 11.5625C4.88232 11.5625 4.75959 11.5869 4.64509 11.6343C4.53059 11.6818 4.42655 11.7513 4.33892 11.8389C4.25128 11.9266 4.18177 12.0306 4.13434 12.1451C4.08691 12.2596 4.0625 12.3823 4.0625 12.5063C4.0625 12.6302 4.08691 12.7529 4.13434 12.8674C4.18177 12.9819 4.25128 13.0859 4.33892 13.1736C4.42655 13.2612 4.53059 13.3307 4.64509 13.3782C4.75959 13.4256 4.88232 13.45 5.00625 13.45H10.0063C10.1302 13.45 10.2529 13.4256 10.3674 13.3782C10.4819 13.3307 10.5859 13.2612 10.6736 13.1736C10.7612 13.0859 10.8307 12.9819 10.8782 12.8674C10.9256 12.7529 10.95 12.6302 10.95 12.5063C10.95 12.3823 10.9256 12.2596 10.8782 12.1451C10.8307 12.0306 10.7612 11.9266 10.6736 11.8389C10.5859 11.7513 10.4819 11.6818 10.3674 11.6343C10.2529 11.5869 10.1302 11.5625 10.0063 11.5625H5.00625Z" fill="#263859"/>
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.6875 0C4.93614 0 5.1746 0.0987719 5.35041 0.274587C5.52623 0.450403 5.625 0.68886 5.625 0.9375V2.5H14.375V0.9375C14.375 0.68886 14.4738 0.450403 14.6496 0.274587C14.8254 0.0987719 15.0639 0 15.3125 0C15.5611 0 15.7996 0.0987719 15.9754 0.274587C16.1512 0.450403 16.25 0.68886 16.25 0.9375V2.5H16.5625C17.4742 2.5 18.3485 2.86216 18.9932 3.50682C19.6378 4.15148 20 5.02582 20 5.9375V16.5625C20 17.4742 19.6378 18.3485 18.9932 18.9932C18.3485 19.6378 17.4742 20 16.5625 20H3.4375C2.52582 20 1.65148 19.6378 1.00682 18.9932C0.362164 18.3485 0 17.4742 0 16.5625V5.9375C0 5.02582 0.362164 4.15148 1.00682 3.50682C1.65148 2.86216 2.52582 2.5 3.4375 2.5H3.75V0.9375C3.75 0.68886 3.84877 0.450403 4.02459 0.274587C4.2004 0.0987719 4.43886 0 4.6875 0ZM3.4375 6.875C2.575 6.875 1.875 7.575 1.875 8.4375V16.5625C1.875 17.425 2.575 18.125 3.4375 18.125H16.5625C17.425 18.125 18.125 17.425 18.125 16.5625V8.4375C18.125 7.575 17.425 6.875 16.5625 6.875H3.4375Z" fill="#263859"/>
                                </svg>
                              </button>
                            </PopoverTrigger>

                            <PopoverContent className="p-0 w-auto">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Price */}
                        <div className="w-full flex flex-col justify-start items-start gap-2">
                          <div className="text-black placeholder:text-black text-base font-semibold capitalize">
                            {t("filter.price", "Price")}
                          </div>
                          <div className="w-full flex gap-3">
                            <Input
                              placeholder={t("filter.from" ,"from")}
                              className="flex-1 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal capitalize"
                            />
                            <Input
                              placeholder={t("filter.to", "to")}
                              className="flex-1 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal capitalize"
                            />
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="w-full flex flex-col justify-start items-start gap-2">
                          <div className="text-black placeholder:text-black text-base font-semibold capitalize">
                            {t("filter.duration", "Duration")}
                          </div>
                          <div className="w-full flex gap-3">
                            <Input
                              placeholder={t("filter.from" ,"from")}
                              className="flex-1 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"
                            />
                            <Input
                              placeholder={t("filter.to", "to")}
                              className="flex-1 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"
                            />
                          </div>
                        </div>

                        {/* Guest */}
                        <div className="w-full flex flex-col justify-start items-start gap-2">
                          <div className="text-black placeholder:text-black text-base font-semibold capitalize">
                            {t("filter.guest", "Guest")}
                          </div>
                          <div className="w-full flex gap-3">
                            <Input
                              placeholder={t("filter.from" ,"from")}
                              className="flex-1 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"
                            />
                            <Input
                              placeholder={t("filter.to", "to")}
                              className="flex-1 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <SheetFooter className='flex-row gap-2 justify-end rtl:justify-start'>
                      {/* Search button (unchanged) */}
                      <button type="submit" className="w-36 m-0 px-3.5 py-3 bg-slate-700 rounded-xl flex justify-center items-center gap-2.5 shrink-0 cursor-pointer">
                        <span className='justify-start text-white text-lg font-medium capitalize'>{t("filter.search", "Search")}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18" fill="none">
                          <path d="M23.9807 2.30897C23.929 1.97782 23.7788 1.67033 23.5499 1.42729C23.3211 1.18425 23.0244 1.01713 22.6992 0.94809L18.7403 0.0703233C18.3157 -0.0230931 17.8763 -0.0234437 17.4516 0.0692948C17.0269 0.162033 16.6269 0.345698 16.2786 0.60787L4.5771 9.20862L1.29933 9.07254C1.03584 9.06302 0.776071 9.13751 0.556927 9.28542C0.337783 9.43333 0.170404 9.64715 0.0785636 9.89649C-0.0132773 10.1458 -0.0249104 10.418 0.0453165 10.6744C0.115543 10.9308 0.26406 11.1584 0.469771 11.3248L3.84196 13.9989C4.24662 14.4956 4.5164 14.4004 11.2136 10.7192L11.8408 17.1289C11.8512 17.3038 11.9106 17.4721 12.0121 17.6142C12.1136 17.7563 12.253 17.8665 12.4141 17.9319C12.5298 17.9786 12.6536 18.0017 12.7783 17.9999C13.0291 17.9922 13.2687 17.8931 13.4527 17.7209L15.0646 16.2376C15.2251 16.0875 15.3338 15.8896 15.3748 15.6728L16.8519 7.57557C19.2596 6.21469 21.5392 4.93546 23.1646 4.00326C23.4554 3.83823 23.6893 3.58759 23.8352 3.28483C23.981 2.98207 24.0318 2.64161 23.9807 2.30897ZM22.4969 2.8193C20.8108 3.78552 18.4503 5.1396 15.9144 6.5413L15.6379 6.6978L14.0664 15.319L13.075 16.2308L12.3331 8.54179L11.4361 9.00449C6.60041 11.7263 4.9885 12.5156 4.43547 12.7605L1.53538 10.4402L4.96153 10.5899L17.1014 1.70338C17.292 1.55906 17.5108 1.45716 17.7433 1.40438C17.9758 1.3516 18.2168 1.34914 18.4503 1.39718L22.3957 2.25453C22.4565 2.26565 22.5122 2.29608 22.5547 2.34136C22.5972 2.38665 22.6242 2.44444 22.6318 2.5063C22.6457 2.56617 22.6401 2.62896 22.6158 2.68534C22.5915 2.74173 22.5498 2.78871 22.4969 2.8193Z" fill="white"/>
                          <path d="M4.57721 5.28929L6.97821 5.96973L8.08429 5.16001L5.38654 4.3707L6.60053 3.62222L10.2897 3.51335L11.8409 2.37701L6.60053 2.54032C6.43532 2.5313 6.27113 2.57153 6.12842 2.65599L4.35465 3.69706C4.20801 3.78471 4.09036 3.91419 4.01654 4.06919C3.94272 4.22418 3.91602 4.39776 3.93983 4.56803C3.96363 4.73831 4.03686 4.89767 4.15029 5.02602C4.26371 5.15437 4.41226 5.24598 4.57721 5.28929Z" fill="white"/>
                        </svg>
                      </button>
                      <SheetClose asChild>
                        <Button variant="outline">{t("shared.close", "Close")}</Button>
                      </SheetClose>
                    </SheetFooter>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
              <div className="w-full sm:w-[calc(100%-126px)] h-16 ps-3 pe-2 py-2 bg-white rounded-xl outline -outline-offset-1 outline-black/10 inline-flex justify-start items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 22L20 20" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <input
                  type="text"
                  placeholder={t("filter.search", "Search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-neutral-600 text-base font-normal font-['Inter'] leading-6"
                />
                <button             
                  onClick={() => {
                    
                  }}
                  className="w-36 px-3.5 py-3 bg-slate-700 rounded-xl inline-flex justify-center items-center gap-2.5 cursor-pointer"
                >
                  <span className='justify-start text-white text-lg font-medium capitalize'>{t("filter.search", "Search")}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18" fill="none">
                    <path d="M23.9807 2.30897C23.929 1.97782 23.7788 1.67033 23.5499 1.42729C23.3211 1.18425 23.0244 1.01713 22.6992 0.94809L18.7403 0.0703233C18.3157 -0.0230931 17.8763 -0.0234437 17.4516 0.0692948C17.0269 0.162033 16.6269 0.345698 16.2786 0.60787L4.5771 9.20862L1.29933 9.07254C1.03584 9.06302 0.776071 9.13751 0.556927 9.28542C0.337783 9.43333 0.170404 9.64715 0.0785636 9.89649C-0.0132773 10.1458 -0.0249104 10.418 0.0453165 10.6744C0.115543 10.9308 0.26406 11.1584 0.469771 11.3248L3.84196 13.9989C4.24662 14.4956 4.5164 14.4004 11.2136 10.7192L11.8408 17.1289C11.8512 17.3038 11.9106 17.4721 12.0121 17.6142C12.1136 17.7563 12.253 17.8665 12.4141 17.9319C12.5298 17.9786 12.6536 18.0017 12.7783 17.9999C13.0291 17.9922 13.2687 17.8931 13.4527 17.7209L15.0646 16.2376C15.2251 16.0875 15.3338 15.8896 15.3748 15.6728L16.8519 7.57557C19.2596 6.21469 21.5392 4.93546 23.1646 4.00326C23.4554 3.83823 23.6893 3.58759 23.8352 3.28483C23.981 2.98207 24.0318 2.64161 23.9807 2.30897ZM22.4969 2.8193C20.8108 3.78552 18.4503 5.1396 15.9144 6.5413L15.6379 6.6978L14.0664 15.319L13.075 16.2308L12.3331 8.54179L11.4361 9.00449C6.60041 11.7263 4.9885 12.5156 4.43547 12.7605L1.53538 10.4402L4.96153 10.5899L17.1014 1.70338C17.292 1.55906 17.5108 1.45716 17.7433 1.40438C17.9758 1.3516 18.2168 1.34914 18.4503 1.39718L22.3957 2.25453C22.4565 2.26565 22.5122 2.29608 22.5547 2.34136C22.5972 2.38665 22.6242 2.44444 22.6318 2.5063C22.6457 2.56617 22.6401 2.62896 22.6158 2.68534C22.5915 2.74173 22.5498 2.78871 22.4969 2.8193Z" fill="white"/>
                    <path d="M4.57721 5.28929L6.97821 5.96973L8.08429 5.16001L5.38654 4.3707L6.60053 3.62222L10.2897 3.51335L11.8409 2.37701L6.60053 2.54032C6.43532 2.5313 6.27113 2.57153 6.12842 2.65599L4.35465 3.69706C4.20801 3.78471 4.09036 3.91419 4.01654 4.06919C3.94272 4.22418 3.91602 4.39776 3.93983 4.56803C3.96363 4.73831 4.03686 4.89767 4.15029 5.02602C4.26371 5.15437 4.41226 5.24598 4.57721 5.28929Z" fill="white"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* filters */}
            <div
              className={`
                w-full overflow-hidden
                hidden lg:grid
                transition-[grid-template-rows,opacity,transform]
                duration-500 ease-in-out
                ${showFilters 
                  ? "grid-rows-[1fr] opacity-100 translate-y-0" 
                  : "grid-rows-[0fr] opacity-0 -translate-y-4 pointer-events-none"}
              `}
            >
              <div className="overflow-hidden">
                <div className="w-full px-4 py-4 bg-white rounded-2xl flex flex-col lg:flex-row items-center justify-between lg:items-end gap-8">
                  <div className="w-full lg:w-[calc(100%-176px)] flex justify-start items-center gap-4 flex-wrap">

                    {/* Destination */}
                    <div className="inline-flex flex-col justify-start items-start gap-2">
                      <div className="text-black placeholder:text-black text-lg font-semibold capitalize">
                        {t("filter.destination", "Destination")}
                      </div>

                      <Select value={destination} onValueChange={setDestination}>
                        <SelectTrigger
                          className="
                            p-3 bg-neutral-100 rounded-lg
                            inline-flex justify-between items-center gap-6
                            w-47
                            border-0 focus:ring-0
                            cursor-pointer
                          "
                        >
                          <span className="justify-start text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"><SelectValue placeholder={t("filter.selectDestination")}/></span>
                          {/* custom arrow (same as HTML) */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" viewBox="0 0 12 6" fill="none">
                            <path d="M0.930583 0.157712L5.61558 4.76871C5.7178 4.86984 5.85579 4.92656 5.99958 4.92656C6.14337 4.92656 6.28136 4.86984 6.38358 4.76871L11.0696 0.158712C11.1724 0.0576367 11.3109 0.0010004 11.4551 0.0010004C11.5993 0.0010004 11.7377 0.0576367 11.8406 0.158712C11.8912 0.208089 11.9315 0.267105 11.959 0.332282C11.9865 0.397459 12.0006 0.467478 12.0006 0.538212C12.0006 0.608947 11.9865 0.678966 11.959 0.744143C11.9315 0.809319 11.8912 0.868335 11.8406 0.917712L7.15658 5.52771C6.84806 5.83064 6.43296 6.00036 6.00058 6.00036C5.56821 6.00036 5.15311 5.83064 4.84458 5.52771L0.160583 0.917712C0.109781 0.86832 0.0693989 0.809242 0.0418243 0.743973C0.0142498 0.678703 4.19617e-05 0.608568 4.19617e-05 0.537713C4.19617e-05 0.466857 0.0142498 0.396721 0.0418243 0.331452C0.0693989 0.266183 0.109781 0.207105 0.160583 0.157712C0.263439 0.0566368 0.401876 0 0.546083 0C0.69029 0 0.828728 0.0566368 0.931583 0.157712" fill="black"/>
                          </svg>
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="Sharm El Sheikh">{t("destinations.sharm", "Sharm El Sheikh")}</SelectItem>
                          <SelectItem value="Hurghada">{t("destinations.hurghada", "Hurghada")}</SelectItem>
                          <SelectItem value="Dahab">{t("destinations.dahab", "Dahab")}</SelectItem>
                          <SelectItem value="Marsa Alam">{t("destinations.marsa", "Marsa Alam")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Divider */}
                    <div className="block w-px h-16 bg-orange-500" />

                    {/* Date */}
                    <div className="inline-flex flex-col justify-start items-start gap-2">
                      <div className="text-black placeholder:text-black text-lg font-semibold capitalize">
                        {t("filter.date", "Date")}
                      </div>

                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="
                              w-48 pl-5 pr-3 py-3 bg-neutral-100 rounded-lg
                              inline-flex justify-between items-center
                              text-black placeholder:text-black text-base
                              cursor-pointer
                            "
                          >
                            <span>
                              {date
                                ? date.toLocaleDateString("en-GB")
                                : t("filter.selectDate", "Select date")}
                            </span>

                            {/* calendar icon placeholder (HTML style) */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 9.0625C9.75136 9.0625 9.5129 9.16127 9.33709 9.33709C9.16127 9.5129 9.0625 9.75136 9.0625 10V10.0125C9.0625 10.53 9.4825 10.95 10 10.95H10.0125C10.2611 10.95 10.4996 10.8512 10.6754 10.6754C10.8512 10.4996 10.95 10.2611 10.95 10.0125V10C10.95 9.75136 10.8512 9.5129 10.6754 9.33709C10.4996 9.16127 10.2611 9.0625 10.0125 9.0625H10ZM5 14.0625C4.75136 14.0625 4.5129 14.1613 4.33709 14.3371C4.16127 14.5129 4.0625 14.7514 4.0625 15V15.0125C4.0625 15.53 4.4825 15.95 5 15.95H5.0125C5.26114 15.95 5.4996 15.8512 5.67541 15.6754C5.85123 15.4996 5.95 15.2611 5.95 15.0125V15C5.95 14.7514 5.85123 14.5129 5.67541 14.3371C5.4996 14.1613 5.26114 14.0625 5.0125 14.0625H5ZM7.5 14.0625C7.25136 14.0625 7.0129 14.1613 6.83709 14.3371C6.66127 14.5129 6.5625 14.7514 6.5625 15V15.0125C6.5625 15.53 6.9825 15.95 7.5 15.95H7.5125C7.76114 15.95 7.9996 15.8512 8.17541 15.6754C8.35123 15.4996 8.45 15.2611 8.45 15.0125V15C8.45 14.7514 8.35123 14.5129 8.17541 14.3371C7.9996 14.1613 7.76114 14.0625 7.5125 14.0625H7.5ZM9.0625 15C9.0625 14.7514 9.16127 14.5129 9.33709 14.3371C9.5129 14.1613 9.75136 14.0625 10 14.0625H10.0125C10.2611 14.0625 10.4996 14.1613 10.6754 14.3371C10.8512 14.5129 10.95 14.7514 10.95 15V15.0125C10.95 15.2611 10.8512 15.4996 10.6754 15.6754C10.4996 15.8512 10.2611 15.95 10.0125 15.95H10C9.75136 15.95 9.5129 15.8512 9.33709 15.6754C9.16127 15.4996 9.0625 15.2611 9.0625 15.0125V15ZM12.5 11.5625C12.2514 11.5625 12.0129 11.6613 11.8371 11.8371C11.6613 12.0129 11.5625 12.2514 11.5625 12.5V12.5125C11.5625 13.03 11.9825 13.45 12.5 13.45H12.5125C12.7611 13.45 12.9996 13.3512 13.1754 13.1754C13.3512 12.9996 13.45 12.7611 13.45 12.5125V12.5C13.45 12.2514 13.3512 12.0129 13.1754 11.8371C12.9996 11.6613 12.7611 11.5625 12.5125 11.5625H12.5ZM12.5 14.0625C12.2514 14.0625 12.0129 14.1613 11.8371 14.3371C11.6613 14.5129 11.5625 14.7514 11.5625 15V15.0125C11.5625 15.53 11.9825 15.95 12.5 15.95H12.5125C12.7611 15.95 12.9996 15.8512 13.1754 15.6754C13.3512 15.4996 13.45 15.2611 13.45 15.0125V15C13.45 14.7514 13.3512 14.5129 13.1754 14.3371C12.9996 14.1613 12.7611 14.0625 12.5125 14.0625H12.5ZM14.0625 12.5C14.0625 12.2514 14.1613 12.0129 14.3371 11.8371C14.5129 11.6613 14.7514 11.5625 15 11.5625H15.0125C15.2611 11.5625 15.4996 11.6613 15.6754 11.8371C15.8512 12.0129 15.95 12.2514 15.95 12.5V12.5125C15.95 12.7611 15.8512 12.9996 15.6754 13.1754C15.4996 13.3512 15.2611 13.45 15.0125 13.45H15C14.7514 13.45 14.5129 13.3512 14.3371 13.1754C14.1613 12.9996 14.0625 12.7611 14.0625 12.5125V12.5ZM11.5625 10.0063C11.5625 9.485 11.985 9.0625 12.5063 9.0625H15.0063C15.2565 9.0625 15.4966 9.16193 15.6736 9.33892C15.8506 9.51591 15.95 9.75595 15.95 10.0063C15.95 10.2565 15.8506 10.4966 15.6736 10.6736C15.4966 10.8506 15.2565 10.95 15.0063 10.95H12.5063C12.256 10.95 12.0159 10.8506 11.8389 10.6736C11.6619 10.4966 11.5625 10.2565 11.5625 10.0063ZM5.00625 11.5625C4.88232 11.5625 4.75959 11.5869 4.64509 11.6343C4.53059 11.6818 4.42655 11.7513 4.33892 11.8389C4.25128 11.9266 4.18177 12.0306 4.13434 12.1451C4.08691 12.2596 4.0625 12.3823 4.0625 12.5063C4.0625 12.6302 4.08691 12.7529 4.13434 12.8674C4.18177 12.9819 4.25128 13.0859 4.33892 13.1736C4.42655 13.2612 4.53059 13.3307 4.64509 13.3782C4.75959 13.4256 4.88232 13.45 5.00625 13.45H10.0063C10.1302 13.45 10.2529 13.4256 10.3674 13.3782C10.4819 13.3307 10.5859 13.2612 10.6736 13.1736C10.7612 13.0859 10.8307 12.9819 10.8782 12.8674C10.9256 12.7529 10.95 12.6302 10.95 12.5063C10.95 12.3823 10.9256 12.2596 10.8782 12.1451C10.8307 12.0306 10.7612 11.9266 10.6736 11.8389C10.5859 11.7513 10.4819 11.6818 10.3674 11.6343C10.2529 11.5869 10.1302 11.5625 10.0063 11.5625H5.00625Z" fill="#263859"/>
                              <path fill-rule="evenodd" clip-rule="evenodd" d="M4.6875 0C4.93614 0 5.1746 0.0987719 5.35041 0.274587C5.52623 0.450403 5.625 0.68886 5.625 0.9375V2.5H14.375V0.9375C14.375 0.68886 14.4738 0.450403 14.6496 0.274587C14.8254 0.0987719 15.0639 0 15.3125 0C15.5611 0 15.7996 0.0987719 15.9754 0.274587C16.1512 0.450403 16.25 0.68886 16.25 0.9375V2.5H16.5625C17.4742 2.5 18.3485 2.86216 18.9932 3.50682C19.6378 4.15148 20 5.02582 20 5.9375V16.5625C20 17.4742 19.6378 18.3485 18.9932 18.9932C18.3485 19.6378 17.4742 20 16.5625 20H3.4375C2.52582 20 1.65148 19.6378 1.00682 18.9932C0.362164 18.3485 0 17.4742 0 16.5625V5.9375C0 5.02582 0.362164 4.15148 1.00682 3.50682C1.65148 2.86216 2.52582 2.5 3.4375 2.5H3.75V0.9375C3.75 0.68886 3.84877 0.450403 4.02459 0.274587C4.2004 0.0987719 4.43886 0 4.6875 0ZM3.4375 6.875C2.575 6.875 1.875 7.575 1.875 8.4375V16.5625C1.875 17.425 2.575 18.125 3.4375 18.125H16.5625C17.425 18.125 18.125 17.425 18.125 16.5625V8.4375C18.125 7.575 17.425 6.875 16.5625 6.875H3.4375Z" fill="#263859"/>
                            </svg>
                          </button>
                        </PopoverTrigger>

                        <PopoverContent className="p-0 w-auto">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="block w-px h-16 bg-orange-500" />

                    {/* Price */}
                    <div className="inline-flex flex-col justify-start items-start gap-2">
                      <div className="text-black placeholder:text-black text-lg font-semibold capitalize">
                        {t("filter.price", "Price")}
                      </div>
                      <div className="inline-flex gap-1.5">
                        <Input
                          placeholder={t("filter.from" ,"from")}
                          className="w-24 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal capitalize"
                        />
                        <Input
                          placeholder={t("filter.to", "to")}
                          className="w-24 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal capitalize"
                        />
                      </div>
                    </div>

                    <div className="block w-px h-16 bg-orange-500" />

                    {/* Duration */}
                    <div className="inline-flex flex-col justify-start items-start gap-2">
                      <div className="text-black placeholder:text-black text-lg font-semibold capitalize">
                        {t("filter.duration", "Duration")}
                      </div>
                      <div className="inline-flex gap-1.5">
                        <Input
                          placeholder={t("filter.from" ,"from")}
                          className="w-24 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"
                        />
                        <Input
                          placeholder={t("filter.to", "to")}
                          className="w-24 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"
                        />
                      </div>
                    </div>

                    <div className="block w-px h-16 bg-orange-500" />

                    {/* Guest */}
                    <div className="inline-flex flex-col justify-start items-start gap-2">
                      <div className="text-black placeholder:text-black text-lg font-semibold capitalize">
                        {t("filter.guest", "Guest")}
                      </div>
                      <div className="inline-flex gap-1.5">
                        <Input
                          placeholder={t("filter.from" ,"from")}
                          className="w-24 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"
                        />
                        <Input
                          placeholder={t("filter.to", "to")}
                          className="w-24 h-12 bg-neutral-100 rounded-lg text-center border-0 text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Search button (unchanged) */}
                  <button className="w-36 px-3.5 py-3 bg-slate-700 rounded-xl flex justify-center items-center gap-2.5 shrink-0 cursor-pointer">
                    <span className='justify-start text-white text-lg font-medium capitalize'>{t("filter.search", "Search")}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18" fill="none">
                      <path d="M23.9807 2.30897C23.929 1.97782 23.7788 1.67033 23.5499 1.42729C23.3211 1.18425 23.0244 1.01713 22.6992 0.94809L18.7403 0.0703233C18.3157 -0.0230931 17.8763 -0.0234437 17.4516 0.0692948C17.0269 0.162033 16.6269 0.345698 16.2786 0.60787L4.5771 9.20862L1.29933 9.07254C1.03584 9.06302 0.776071 9.13751 0.556927 9.28542C0.337783 9.43333 0.170404 9.64715 0.0785636 9.89649C-0.0132773 10.1458 -0.0249104 10.418 0.0453165 10.6744C0.115543 10.9308 0.26406 11.1584 0.469771 11.3248L3.84196 13.9989C4.24662 14.4956 4.5164 14.4004 11.2136 10.7192L11.8408 17.1289C11.8512 17.3038 11.9106 17.4721 12.0121 17.6142C12.1136 17.7563 12.253 17.8665 12.4141 17.9319C12.5298 17.9786 12.6536 18.0017 12.7783 17.9999C13.0291 17.9922 13.2687 17.8931 13.4527 17.7209L15.0646 16.2376C15.2251 16.0875 15.3338 15.8896 15.3748 15.6728L16.8519 7.57557C19.2596 6.21469 21.5392 4.93546 23.1646 4.00326C23.4554 3.83823 23.6893 3.58759 23.8352 3.28483C23.981 2.98207 24.0318 2.64161 23.9807 2.30897ZM22.4969 2.8193C20.8108 3.78552 18.4503 5.1396 15.9144 6.5413L15.6379 6.6978L14.0664 15.319L13.075 16.2308L12.3331 8.54179L11.4361 9.00449C6.60041 11.7263 4.9885 12.5156 4.43547 12.7605L1.53538 10.4402L4.96153 10.5899L17.1014 1.70338C17.292 1.55906 17.5108 1.45716 17.7433 1.40438C17.9758 1.3516 18.2168 1.34914 18.4503 1.39718L22.3957 2.25453C22.4565 2.26565 22.5122 2.29608 22.5547 2.34136C22.5972 2.38665 22.6242 2.44444 22.6318 2.5063C22.6457 2.56617 22.6401 2.62896 22.6158 2.68534C22.5915 2.74173 22.5498 2.78871 22.4969 2.8193Z" fill="white"/>
                      <path d="M4.57721 5.28929L6.97821 5.96973L8.08429 5.16001L5.38654 4.3707L6.60053 3.62222L10.2897 3.51335L11.8409 2.37701L6.60053 2.54032C6.43532 2.5313 6.27113 2.57153 6.12842 2.65599L4.35465 3.69706C4.20801 3.78471 4.09036 3.91419 4.01654 4.06919C3.94272 4.22418 3.91602 4.39776 3.93983 4.56803C3.96363 4.73831 4.03686 4.89767 4.15029 5.02602C4.26371 5.15437 4.41226 5.24598 4.57721 5.28929Z" fill="white"/>
                    </svg>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
  </>)
}

export default HeroSection
