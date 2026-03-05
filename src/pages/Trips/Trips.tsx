import SearchFilters from '@/components/shared/SearchFilters';
import TripCard from '@/components/shared/TripCard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next'
import trip from "@assets/trip/trip.jpg"
import ResponsivePagination from "react-responsive-pagination"
import "react-responsive-pagination/themes/classic.css"
import TripsSection from '@/components/shared/TripsSection';
import TripsCarousel from '@/components/shared/TripsCarousel';

const Trips = () => {
  const { t, i18n } = useTranslation();
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [guestsCount, setGuestsCount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [destination, setDestination] = useState("Sharm El Sheikh")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 10

  const resetFilters = () => {
    setRoomCount("");
    setGuestsCount("");
    console.log("guestsCount: ",guestsCount," roomCount:",roomCount);
  };

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
  return (
    <section
      className="relative min-h-dvh sm:h-full max-w-340 w-full px-4 pt-32.5 mb-12 sm:mb-18 lg:mb-25 mx-auto"
    >
      <div className='w-full flex flex-col gap-2'>
        <h1 className='font-semibold text-2xl sm:text-3xl lg:text-4xl leading-12.75 capitalize text-[#122445] flex-none order-0 self-stretch grow-0'>{t("trips.title","Trips")}</h1>
        <p className='font-normal tetx-sm sm:text-base lg:text-xl leading-7.5 capitalize text-[#122445] flex-none order-1 grow-0'>{t("trips.subtitle","Browse available trips and choose your next destination.")}</p>
      </div>

      <SearchFilters
        className='min-h-0 pt-18'
        classNameSearchBar='max-w-282.5'
        classNameFilter='bg-[#F6F6F6]'
        classNameSearch='bg-[#F6F6F6]'
        classNameFilterBody='bg-[#F6F6F6] mb-[40px]'
        bgInput='bg-white'
        classNameSearchInput='text-[#4F4F4F] placeholder:text-[#4F4F4F]'
        destination={destination}
        date={date}
        searchQuery={searchQuery}
        roomCount={roomCount}
        guestsCount={guestsCount}
        showFilters={showFilters}

        setDestination={setDestination}
        setDate={setDate}
        setSearchQuery={setSearchQuery}
        setRoomCount={setRoomCount}
        setGuestsCount={setGuestsCount}

        onToggleFilters={() => setShowFilters(prev => !prev)}
        onResetFilters={resetFilters}
        onSearch={() => {
          console.log({
            destination,
            date,
            searchQuery,
            roomCount,
            guestsCount,
          })
        }}
      />

      <div className='w-full flex flex-col gap-7'>
        <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-7 gap-y-6.5'>
          {trips.map(tripItem => (
            <TripCard
              className='w-full'
              key={tripItem.id}
              data={{
                id: tripItem.id,
                image: trip,
                title: tripItem.title,
                category: "Red Sea Getaways",
                duration: "5 Days / 4 Nights",
                location: tripItem.location,
                frequency: "Daily",
                availableSpots: 12,
                price: 8500,
                isFavorite: favorites[tripItem.id] ?? false,
                href: `/trips/${tripItem.id}`,
                onViewDetails: () => console.log("view", tripItem.id),
                onToggleFavorite: handleToggleFavorite,
              }}
            />
          ))}
        </div>
        <div
          className={`w-full flex justify-center mt-7 ${
            i18n.dir() === "rtl" ? "rtl-pagination" : ""
          }`}
        >
          <ResponsivePagination
            current={currentPage}
            total={totalPages}
            onPageChange={setCurrentPage}
            className="pagination-custom"
          />
        </div>
      </div>
      <TripsSection
        title2='trips.offers'
        description='trips.offerDescription'
        actionText="shared.seeMore"
        actionLink="/trips/offers"
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
                duration: "5 Days / 4 Nights",
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
    </section>
  )
}

export default Trips
