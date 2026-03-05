import { useState } from 'react';
import { useTranslation } from 'react-i18next'
import SearchFilters from '@/components/shared/SearchFilters';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [guestsCount, setGuestsCount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [destination, setDestination] = useState("Sharm El Sheikh")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const navigate = useNavigate()

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
          <SearchFilters
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
              navigate("/search")
            }}
          />
        </div>
      </section>
  </>)
}

export default HeroSection
