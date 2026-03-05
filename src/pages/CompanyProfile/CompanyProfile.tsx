import Quotes from './components/Quotes'
import TripsSection from '../../components/shared/TripsSection'
import TripCard from '@/components/shared/TripCard'
import trip from "@assets/trip/trip.jpg"
import company from "@assets/companies/company.png"
import { useState } from 'react'

// import { useTranslation } from 'react-i18next'
import TripsCarousel from '@/components/shared/TripsCarousel'
import Header from './components/Header'

const CompanyProfile = () => {
  // const { i18n } = useTranslation()
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

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
  ]
  const destinationsCovered = [
    "companyProfile.destinations.sharmElSheikh",
    "companyProfile.destinations.hurghada",
    "companyProfile.destinations.dahab",
    "companyProfile.destinations.marsaAlam",
    "companyProfile.destinations.elGouna",
    "companyProfile.destinations.somaBay"
  ]
  return (
    <div className='relative min-h-dvh sm:h-full max-w-340 w-full px-4 pt-32.5 mb-4 mx-auto'>
      <Header 
        title='Wanderlust Journeys'
        subTitle='companyProfile.subTitle'
        rate={4.8}
        reviews={2347}
        image={company}
        description='companyProfile.description'
        destinationsCovered={destinationsCovered}
        contactNumber='201227375904'
      />
      <TripsSection
        title1='home.exclusive-Travel.title1'
        title2='home.exclusive-Travel.title2'
        title3='home.exclusive-Travel.title3'
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
      <TripsSection
        title1='home.popular-Trips.title1'
        title2='home.popular-Trips.title2'
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
      <Quotes />
    </div>
  )
}

export default CompanyProfile
