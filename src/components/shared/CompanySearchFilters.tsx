import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

interface FiltersState {
  destination?: string
  tripType?: string
  rate?: number
  searchQuery: string
  showFilters: boolean

  className?: string
  classNameSearchBar?: string
  classNameFilter?: string
  classNameSearch?: string
  classNameFilterBody?: string
  classNameSearchInput?: string
  bgInput?: string
}

interface FiltersHandlers {
  onSearch: () => void
  onToggleFilters: () => void
  onResetFilters: () => void

  setSearchQuery: (value: string) => void
  setDestination: (value: string) => void
  setTripType: (value: string) => void
  setRate: (value: number) => void
}

interface Props extends FiltersState, FiltersHandlers {}

const CompanySearchFilters = ({
  destination,
  tripType,
  rate,
  searchQuery,
  showFilters,
  
  className,
  classNameSearchBar,
  classNameFilter,
  classNameSearch,
  classNameFilterBody,
  classNameSearchInput,
  bgInput,

  setDestination,
  setTripType,
  setRate,
  setSearchQuery,

  onSearch,
  onToggleFilters,
  onResetFilters,
}: Props) => {
  const { t } = useTranslation()
  const Star = ({ filled, onClick }: { filled: boolean; onClick: () => void }) => {
    return (
      <div
        onClick={onClick}
        className="w-9 h-9 cursor-pointer flex items-center justify-center"
      >
        {filled ? (
          // ⭐ Filled Star
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none">
            <path
              d="M21.861 3.34874L25.0291 9.73693C25.4611 10.6261 26.6131 11.4793 27.5851 11.6413L33.3255 12.6043C36.9976 13.2217 37.8616 15.9073 35.2155 18.5569L30.7514 23.0569C29.9954 23.8183 29.5814 25.2889 29.8154 26.3419L31.0934 31.9129C32.1014 36.3229 29.7794 38.0275 25.9093 35.7235L20.5272 32.5105C19.5551 31.9309 17.9531 31.9309 16.9631 32.5105L11.5845 35.7235C7.73243 38.0275 5.39237 36.3031 6.4004 31.9129L7.67843 26.3419C7.91244 25.2889 7.49843 23.8183 6.74241 23.0569L2.27829 18.5569C-0.347972 15.9055 0.498049 13.2217 4.16834 12.6043L9.91049 11.6413C10.8645 11.4793 12.0165 10.6261 12.4485 9.73693L15.6166 3.34874C17.3447 -0.116248 20.1527 -0.116248 21.8628 3.34874"
              fill="#FFD41D"
            />
          </svg>
        ) : (
          // ⭐ Empty Star
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none">
            <path
              d="M21.861 3.34874L25.0291 9.73693C25.4611 10.6261 26.6131 11.4793 27.5851 11.6413L33.3255 12.6043C36.9976 13.2217 37.8616 15.9073 35.2155 18.5569L30.7514 23.0569C29.9954 23.8183 29.5814 25.2889 29.8154 26.3419L31.0934 31.9129C32.1014 36.3229 29.7794 38.0275 25.9093 35.7235L20.5272 32.5105C19.5551 31.9309 17.9531 31.9309 16.9631 32.5105L11.5845 35.7235C7.73243 38.0275 5.39237 36.3031 6.4004 31.9129L7.67843 26.3419C7.91244 25.2889 7.49843 23.8183 6.74241 23.0569L2.27829 18.5569C-0.347972 15.9055 0.498049 13.2217 4.16834 12.6043L9.91049 11.6413C10.8645 11.4793 12.0165 10.6261 12.4485 9.73693L15.6166 3.34874C17.3447 -0.116248 20.1527 -0.116248 21.8628 3.34874"
              stroke="#535353"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "w-full min-h-70 flex flex-col justify-end items-center",
        className
      )}
    >
      {/* Search Bar */}
      <div
        className={cn(
          "max-w-226 flex flex-col sm:flex-row gap-3.5 w-full pb-10.75",
          classNameSearchBar
        )}
      >
        <button
          onClick={() => {
            if (showFilters) onResetFilters()
            onToggleFilters()
          }}
          className={cn(
            "hidden lg:flex w-full sm:w-28 h-16 p-4 bg-white rounded-xl outline -outline-offset-1 outline-black/10 justify-center items-center gap-2 cursor-pointer",
            classNameFilter
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ease-in-out ${
              showFilters ? "rotate-90" : "rotate-0"
            }`}
          >
            <path d="M19 22V11" stroke="#8CA9FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 7V2" stroke="#8CA9FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V17" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 13V2" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 22V11" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 7V2" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 11H7" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 11H21" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 13H14" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className='justify-start text-neutral-600 text-lg font-normal leading-7'>
            {t("filter.filter", "Filter")}
          </span>
        </button>
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex w-full sm:w-28 h-16 p-4 bg-white rounded-xl outline -outline-offset-1 outline-black/10 justify-center items-center gap-2 cursor-pointer",
                  classNameFilter
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ease-in-out ${
                    showFilters ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <path d="M19 22V11" stroke="#8CA9FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 7V2" stroke="#8CA9FF" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22V17" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13V2" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 22V11" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 7V2" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 11H7" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 11H21" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13H14" stroke="#263859" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
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

                    {/* Trip Type */}
                    <div className="w-full flex flex-col justify-start items-start gap-2">
                      <div className="text-black placeholder:text-black text-base font-semibold capitalize">
                        {t("filter.tripType", "Trip Type")}
                      </div>

                      <Select value={tripType} onValueChange={setTripType}>
                        <SelectTrigger
                          className="
                            p-3 bg-neutral-100 rounded-lg
                            inline-flex justify-between items-center gap-6
                            w-full
                            border-0 focus:ring-0
                            cursor-pointer
                          "
                        >
                          <span className="justify-start text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"><SelectValue placeholder={t("filter.selectTripType")}/></span>
                          {/* custom arrow (same as HTML) */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" viewBox="0 0 12 6" fill="none">
                            <path d="M0.930583 0.157712L5.61558 4.76871C5.7178 4.86984 5.85579 4.92656 5.99958 4.92656C6.14337 4.92656 6.28136 4.86984 6.38358 4.76871L11.0696 0.158712C11.1724 0.0576367 11.3109 0.0010004 11.4551 0.0010004C11.5993 0.0010004 11.7377 0.0576367 11.8406 0.158712C11.8912 0.208089 11.9315 0.267105 11.959 0.332282C11.9865 0.397459 12.0006 0.467478 12.0006 0.538212C12.0006 0.608947 11.9865 0.678966 11.959 0.744143C11.9315 0.809319 11.8912 0.868335 11.8406 0.917712L7.15658 5.52771C6.84806 5.83064 6.43296 6.00036 6.00058 6.00036C5.56821 6.00036 5.15311 5.83064 4.84458 5.52771L0.160583 0.917712C0.109781 0.86832 0.0693989 0.809242 0.0418243 0.743973C0.0142498 0.678703 4.19617e-05 0.608568 4.19617e-05 0.537713C4.19617e-05 0.466857 0.0142498 0.396721 0.0418243 0.331452C0.0693989 0.266183 0.109781 0.207105 0.160583 0.157712C0.263439 0.0566368 0.401876 0 0.546083 0C0.69029 0 0.828728 0.0566368 0.931583 0.157712" fill="black"/>
                          </svg>
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="beach">{t("TripType.beach", "Beach")}</SelectItem>
                          <SelectItem value="Hurghada">{t("TripType.hurghada", "Hurghada")}</SelectItem>
                          <SelectItem value="Dahab">{t("TripType.dahab", "Dahab")}</SelectItem>
                          <SelectItem value="Marsa Alam">{t("TripType.marsa", "Marsa Alam")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rate */}
                    <div className="w-full flex flex-col gap-2">
                      <div className="text-black text-base font-semibold">
                        {t("filter.rate", "Rate")}
                      </div>

                      <div className="flex items-center gap-3 bg-[#F6F6F6] p-3 rounded-xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            filled={(rate || 0) >= star}
                            onClick={() => setRate(star)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <SheetFooter className='flex-row gap-2 justify-end rtl:justify-start'>
                  {/* Search button (unchanged) */}
                  <button onClick={onSearch} type="submit" className="w-36 m-0 px-3.5 py-3 bg-slate-700 rounded-xl flex justify-center items-center gap-2.5 shrink-0 cursor-pointer">
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
        <div 
          className={cn(
            "w-full sm:w-[calc(100%-126px)] h-16 ps-3 pe-2 py-2 bg-white rounded-xl outline -outline-offset-1 outline-black/10 inline-flex justify-start items-center gap-3",
            classNameSearch
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 22L20 20" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder={t("filter.search", "Search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-[calc(100%-192px)] bg-transparent outline-none text-neutral-600 text-base font-normal font-['Inter'] leading-6",
              classNameSearchInput
            )}
          />
          <button             
            onClick={onSearch}
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
          w-full overflow-visible
          hidden lg:grid
          transition-[grid-template-rows,opacity,transform]
          duration-500 ease-in-out z-45
          ${showFilters 
            ? "grid-rows-[1fr] opacity-100 translate-y-0" 
            : "grid-rows-[0fr] opacity-0 -translate-y-4 pointer-events-none"}
        `}
      >
        <div className="overflow-hidden">
          <div className={cn(
            "w-full px-4 py-4 bg-white rounded-2xl flex flex-col lg:flex-row items-center justify-between lg:items-end gap-8",
            classNameFilterBody
          )}
          >
            <div className="w-full lg:w-[calc(100%-176px)] flex justify-start items-center gap-4 flex-wrap">

              {/* Destination */}
              <div className="inline-flex flex-col justify-start items-start gap-2">
                <div className="text-black placeholder:text-black text-lg font-semibold capitalize">
                  {t("filter.destination", "Destination")}
                </div>

                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger
                    className={cn(
                      "p-3 bg-neutral-100 rounded-lg inline-flex justify-between items-center gap-6 w-47 border-0 focus:ring-0 cursor-pointer ",
                      bgInput
                    )}
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

              {/* Trip Type */}
              <div className="inline-flex flex-col justify-start items-start gap-2">
                <div className="text-black placeholder:text-black text-lg font-semibold capitalize">
                  {t("filter.tripType", "Trip Type")}
                </div>

                <Select value={tripType} onValueChange={setTripType}>
                  <SelectTrigger
                    className={cn(
                      "p-3 bg-neutral-100 rounded-lg inline-flex justify-between items-center gap-6 w-47 border-0 focus:ring-0 cursor-pointer ",
                      bgInput
                    )}
                  >
                    <span className="justify-start text-black placeholder:text-black text-base font-normal font-['Poppins'] capitalize"><SelectValue placeholder={t("filter.selectTripType")}/></span>
                    {/* custom arrow (same as HTML) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="6" viewBox="0 0 12 6" fill="none">
                      <path d="M0.930583 0.157712L5.61558 4.76871C5.7178 4.86984 5.85579 4.92656 5.99958 4.92656C6.14337 4.92656 6.28136 4.86984 6.38358 4.76871L11.0696 0.158712C11.1724 0.0576367 11.3109 0.0010004 11.4551 0.0010004C11.5993 0.0010004 11.7377 0.0576367 11.8406 0.158712C11.8912 0.208089 11.9315 0.267105 11.959 0.332282C11.9865 0.397459 12.0006 0.467478 12.0006 0.538212C12.0006 0.608947 11.9865 0.678966 11.959 0.744143C11.9315 0.809319 11.8912 0.868335 11.8406 0.917712L7.15658 5.52771C6.84806 5.83064 6.43296 6.00036 6.00058 6.00036C5.56821 6.00036 5.15311 5.83064 4.84458 5.52771L0.160583 0.917712C0.109781 0.86832 0.0693989 0.809242 0.0418243 0.743973C0.0142498 0.678703 4.19617e-05 0.608568 4.19617e-05 0.537713C4.19617e-05 0.466857 0.0142498 0.396721 0.0418243 0.331452C0.0693989 0.266183 0.109781 0.207105 0.160583 0.157712C0.263439 0.0566368 0.401876 0 0.546083 0C0.69029 0 0.828728 0.0566368 0.931583 0.157712" fill="black"/>
                    </svg>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="beach">{t("destinations.beach", "Beach")}</SelectItem>
                    <SelectItem value="Hurghada">{t("destinations.hurghada", "Hurghada")}</SelectItem>
                    <SelectItem value="Dahab">{t("destinations.dahab", "Dahab")}</SelectItem>
                    <SelectItem value="Marsa Alam">{t("destinations.marsa", "Marsa Alam")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Divider */}
              <div className="block w-px h-16 bg-orange-500" />

              {/* Rate */}
              <div className="flex flex-col gap-1">
                <div className="text-black placeholder:text-black text-lg font-semibold capitalize">
                  {t("filter.rate", "Rate")}
                </div>

                <div className="flex items-center gap-3 bg-[#F6F6F6] p-1 rounded-xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      filled={(rate || 0) >= star}
                      onClick={() => setRate(star)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Search button (unchanged) */}
            <button onClick={onSearch} className="w-36 px-3.5 py-3 bg-slate-700 rounded-xl flex justify-center items-center gap-2.5 shrink-0 cursor-pointer">
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
  )
}

export default CompanySearchFilters
