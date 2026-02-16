import Quotes from './components/Quotes'
import TripsSection from '../../components/shared/TripsSection'
import TripCard from '@/components/shared/TripCard'
import trip from "@assets/trip/trip.jpg"
import { useState } from 'react'

// import { useTranslation } from 'react-i18next'
import TripsCarousel from '@/components/shared/TripsCarousel'

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
  return (
    <div className='relative min-h-dvh sm:h-full max-w-340 w-full px-4 pt-32.5 mb-4 mx-auto'>
      <TripsSection
        title={
          <>
            <span className="text-sky-950">Exclusive </span>
            <span className="text-orange-500">Travel</span>
            <span className="text-sky-950"> Deals</span>
          </>
        } 
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
                onViewDetails: id => console.log("view", id),
                onToggleFavorite: handleToggleFavorite,
              }}
            />
          ))}
        </TripsCarousel>
      </TripsSection>
      <TripsSection
        title={
          <>
            <span className="text-sky-950">Popular </span>
            <span className="text-orange-500">Trips</span>
          </>
        } 
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
                onViewDetails: id => console.log("view", id),
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
