import BookingCard from "@/components/shared/BookingCard";
import trip from "@assets/trip/trip.jpg"
import { useState } from "react";

import { useTranslation } from 'react-i18next'
import ResponsivePaginationComponent from "react-responsive-pagination";

const BookingHistory = () => {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  const bookings = [
    {
      id: 1,
      title: "Sharm El Sheikh Getaway",
      status: "confirmed",
      category: "Red Sea Getaways",
      location: "Hurghada, Egypt",
      bookingDate: "1/8/2026",
      travelDate: "3/10/2026",
      duration: "4 Days / 3 Nights",
      adults: 2,
      price: 1270,
      image: trip,
      statusColor: "#02bb02",
      statusBg: "rgba(19,103,65,0.2)",
      categoryIconColor: "#557BEB"
    },
    {
      id: 2,
      title: "Cairo City Tour",
      status: "pending",
      category: "City Tours",
      location: "Cairo, Egypt",
      bookingDate: "5/8/2026",
      travelDate: "7/10/2026",
      duration: "2 Days / 1 Night",
      adults: 1,
      price: 850,
      image: trip,
      statusColor: "#FFA500",
      statusBg: "rgba(255,165,0,0.2)",
      categoryIconColor: "#FF7F50"
    },
    {
      id: 3,
      title: "Luxor Historical Tour",
      status: "cancelled",
      category: "Historical Tours",
      location: "Luxor, Egypt",
      bookingDate: "10/8/2026",
      travelDate: "15/10/2026",
      duration: "5 Days / 4 Nights",
      adults: 3,
      price: 2000,
      image: trip,
      statusColor: "#FF383B", // red for cancelled
      statusBg: "rgba(255,56,59,0.2)",
      categoryIconColor: "#FF383B"
    },
  ];

  return (
    <div className='relative min-h-dvh sm:h-full max-w-340 w-full px-4 pt-32.5 mx-auto'>
      <div className='w-full flex flex-col gap-5 sm:gap-7 md:gap-10'>
        <h1 className='font-medium text-2xl md:text-3xl lg:text-[43px] leading-16 capitalize text-[#122445]'>
          {t("profile.bookingHistory","Booking History")}
        </h1>
        <div className="flex flex-col items-center gap-7.5">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              data={{
                imageSrc: booking.image,
                title: booking.title,
                status: booking.status,
                statusColor: booking.statusColor,
                companyName: booking.category,
                companyColor: booking.categoryIconColor,
                location: booking.location,
                bookingDate: booking.bookingDate,
                travelDate: booking.travelDate,
                duration: booking.duration,
                adults: String(booking.adults),
                pricePerPerson: String(booking.price),
              }}
            />
          ))}
          <div
            className={`w-full flex justify-center mb-11 ${
              i18n.dir() === "rtl" ? "rtl-pagination" : ""
            }`}
          >
            <ResponsivePaginationComponent
              current={currentPage}
              total={totalPages}
              onPageChange={setCurrentPage}
              className="pagination-custom"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingHistory
