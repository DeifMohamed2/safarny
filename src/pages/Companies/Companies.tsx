import CompanySearchFilters from '@/components/shared/CompanySearchFilters';
import { useState } from 'react';
import { useTranslation } from 'react-i18next'
import company from "@assets/companies/company.png"
import trip from "@assets/trip/trip.jpg"
import "react-responsive-pagination/themes/classic.css"
import CompanyCard from '@/components/shared/CompanyCard';
import TripsSection from '@/components/shared/TripsSection';
import TripsCarousel from '@/components/shared/TripsCarousel';
import { useNavigate } from 'react-router-dom';

const Companies = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [guestsCount, setGuestsCount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [destination, setDestination] = useState("Sharm El Sheikh")
  const [tripType, setTripType] = useState("beach")
  const [rate, setRate] = useState(0)
  const navigate = useNavigate()

  const resetFilters = () => {
    setRoomCount("");
    setGuestsCount("");
    console.log("guestsCount: ",guestsCount," roomCount:",roomCount);
  };

  const companies = [
    {
      id: "1",
      image: company,
      title: "Red Sea Adventures",
      description: "Your gateway to the Red Sea with world-class diving experiences and beach adventures.",
      location: "Hurghada",
      years: 12,
      packages: 98,
      reviews: 289,
      rating: 4.6,
      badges: ["Diving & Snorkeling", "Beach Resorts", "Water Sports"],
      onViewDetails: (id: string) => console.log("View", id),
    },
    {
      id: "2",
      image: trip,
      title: "Red Sea Adventures",
      description: "Your gateway to the Red Sea with world-class diving experiences and beach adventures.",
      location: "Hurghada",
      years: 12,
      packages: 98,
      reviews: 289,
      rating: 4.6,
      badges: ["Diving & Snorkeling", "Beach Resorts", "Water Sports"],
      onViewDetails: (id: string) => console.log("View", id),
    },
    {
      id: "3",
      image: company,
      title: "Red Sea Adventures",
      description: "Your gateway to the Red Sea with world-class diving experiences and beach adventures.",
      location: "Hurghada",
      years: 12,
      packages: 98,
      reviews: 289,
      rating: 4.6,
      badges: ["Diving & Snorkeling", "Beach Resorts", "Water Sports"],
      onViewDetails: (id: string) => console.log("View", id),
    },
    {
      id: "4",
      image: trip,
      title: "Red Sea Adventures",
      description: "Your gateway to the Red Sea with world-class diving experiences and beach adventures.",
      location: "Hurghada",
      years: 12,
      packages: 98,
      reviews: 289,
      rating: 4.6,
      badges: ["Diving & Snorkeling", "Beach Resorts", "Water Sports"],
      onViewDetails: (id: string) => console.log("View", id),
    },
    {
      id: "5",
      image: company,
      title: "Red Sea Adventures",
      description: "Your gateway to the Red Sea with world-class diving experiences and beach adventures.",
      location: "Hurghada",
      years: 12,
      packages: 98,
      reviews: 289,
      rating: 4.6,
      badges: ["Diving & Snorkeling", "Beach Resorts", "Water Sports"],
      onViewDetails: (id: string) => console.log("View", id),
    },
    {
      id: "6",
      image: trip,
      title: "Red Sea Adventures",
      description: "Your gateway to the Red Sea with world-class diving experiences and beach adventures.",
      location: "Hurghada",
      years: 12,
      packages: 98,
      reviews: 289,
      rating: 4.6,
      badges: ["Diving & Snorkeling", "Beach Resorts", "Water Sports"],
      onViewDetails: (id: string) => console.log("View", id),
    },
    {
      id: "7",
      image: company,
      title: "Red Sea Adventures",
      description: "Your gateway to the Red Sea with world-class diving experiences and beach adventures.",
      location: "Hurghada",
      years: 12,
      packages: 98,
      reviews: 289,
      rating: 4.6,
      badges: ["Diving & Snorkeling", "Beach Resorts", "Water Sports"],
      onViewDetails: (id: string) => console.log("View", id),
    },
    {
      id: "8",
      image: trip,
      title: "Red Sea Adventures",
      description: "Your gateway to the Red Sea with world-class diving experiences and beach adventures.",
      location: "Hurghada",
      years: 12,
      packages: 98,
      reviews: 289,
      rating: 4.6,
      badges: ["Diving & Snorkeling", "Beach Resorts", "Water Sports"],
      onViewDetails: (id: string) => console.log("View", id),
    },
  ]
  return (
    <section
      className="relative min-h-dvh sm:h-full max-w-340 w-full px-4 pt-32.5 mx-auto"
    >
      <div className='w-full flex flex-col gap-2'>
        <h1 className='font-semibold text-2xl sm:text-3xl lg:text-4xl leading-12.75 capitalize text-[#122445] flex-none order-0 self-stretch grow-0'>{t("companies.title", "Companies")}</h1>
        <p className='font-normal tetx-sm sm:text-base lg:text-xl leading-7.5 capitalize text-[#122445] flex-none order-1 grow-0'>
          {t("companies.subtitle", "Find the best travel companies offering trips across multiple destinations.")}
        </p>
      </div>

      <CompanySearchFilters
        className='min-h-0 pt-18'
        classNameSearchBar='max-w-282.5'
        classNameFilter='bg-[#F6F6F6]'
        classNameSearch='bg-[#F6F6F6]'
        classNameFilterBody='bg-[#F6F6F6] mb-[40px]'
        bgInput='bg-white'
        classNameSearchInput='text-[#4F4F4F] placeholder:text-[#4F4F4F]'
        destination={destination}
        tripType={tripType}
        rate={rate}
        searchQuery={searchQuery}
        showFilters={showFilters}

        setDestination={setDestination}
        setSearchQuery={setSearchQuery}
        setTripType={setTripType}
        setRate={setRate}

        onToggleFilters={() => setShowFilters(prev => !prev)}
        onResetFilters={resetFilters}
        onSearch={() => {
          console.log({
            destination,
            tripType,
            searchQuery,
          })
          navigate('/companies/search')
        }}
      />

      <TripsSection
        title1='companies.topCompanies1'
        title2='companies.topCompanies2'
        description='companies.description'
      >
        <TripsCarousel>
          {companies.map(companyItem => (
            <CompanyCard
              className='w-full'
              key={companyItem.id}
              data={{
                id: companyItem.id,
                image: companyItem.image,
                title: companyItem.title,
                description: companyItem.description,
                location: companyItem.location,
                years: companyItem.years,
                packages: companyItem.packages,
                reviews: companyItem.reviews,
                rating: companyItem.rating,
                badges: companyItem.badges,
                href: `/companies/${companyItem.id}`,
                onViewDetails: () => console.log("view", companyItem.id),
              }}
            />
          ))}
        </TripsCarousel>
      </TripsSection>

      <TripsSection
        title1='companies.all'
        title2='companies.title'
        description='companies.description'
      >
        <div className='w-full flex flex-col gap-6.5 pb-23'>
          <TripsCarousel>
            {companies.map(companyItem => (
              <CompanyCard
                className='w-full'
                key={companyItem.id}
                data={{
                  id: companyItem.id,
                  image: companyItem.image,
                  title: companyItem.title,
                  description: companyItem.description,
                  location: companyItem.location,
                  years: companyItem.years,
                  packages: companyItem.packages,
                  reviews: companyItem.reviews,
                  rating: companyItem.rating,
                  badges: companyItem.badges,
                  href: `/companies/${companyItem.id}`,
                  onViewDetails: () => console.log("view", companyItem.id),
                }}
              />
            ))}
          </TripsCarousel>
          <TripsCarousel>
            {companies.map(companyItem => (
              <CompanyCard
                className='w-full'
                key={companyItem.id}
                data={{
                  id: companyItem.id,
                  image: companyItem.image,
                  title: companyItem.title,
                  description: companyItem.description,
                  location: companyItem.location,
                  years: companyItem.years,
                  packages: companyItem.packages,
                  reviews: companyItem.reviews,
                  rating: companyItem.rating,
                  badges: companyItem.badges,
                  href: `/companies/${companyItem.id}`,
                  onViewDetails: () => console.log("view", companyItem.id),
                }}
              />
            ))}
          </TripsCarousel>
        </div>
      </TripsSection>
    </section>
  )
}

export default Companies
