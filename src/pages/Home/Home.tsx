import HeroSection from './components/HeroSection'
import Quotes from './components/Quotes'
import TripsSection from '../../components/shared/TripsSection'
import TripCard from '@/components/shared/TripCard'
import trip from "@assets/trip/trip.jpg"
import { useState } from 'react'
import TripsCarousel from '@/components/shared/TripsCarousel'

const Home = () => {
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
    <>
      <HeroSection />
      <TripsSection
        title1='home.exclusive-Travel.title1'
        title2='home.exclusive-Travel.title2'
        title3='home.exclusive-Travel.title3'
        description="home.exclusive-Travel.subtitle"
        actionText="shared.seeMore"
        actionLink="/trips"
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
      <TripsSection
        title1='home.popular-Trips.title1'
        title2='home.popular-Trips.title2'
        description="home.popular-Trips.subtitle"
        actionText="shared.seeMore"
        actionLink="/trips"
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
      <TripsSection
        title1='home.recommended-Umrah.title1'
        title2='home.recommended-Umrah.title2'
        title3='home.recommended-Umrah.title3'
        description="home.recommended-Umrah.subtitle"
        actionText="shared.seeMore"
        actionLink="/umrah"
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

      <Quotes />
    </>
  )
}

export default Home
