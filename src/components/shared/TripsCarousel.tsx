import { Swiper, SwiperSlide } from "swiper/react"
import { Swiper as SwiperType } from 'swiper'
// import { Navigation } from "swiper/modules"
// import { useTranslation } from "react-i18next"
import { useRef, useState } from "react"
import PrevArrow from "../ui/PrevArrow"
import NextArrow from "../ui/NextArrow"

interface TripsCarouselProps {
  children: React.ReactNode[]
}

const TripsCarousel = ({ children }: TripsCarouselProps) => {
  // const { i18n } = useTranslation()
  // const isRTL = i18n.dir() === "rtl"
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState(false)
  const swiperRef = useRef<SwiperType | null>(null)

  return (
    <div className="relative w-full">
      {/* Previous Button */}
      <div className="absolute top-[50%] -left-2.5 min-[460px]:left-0 min-[1350px]:-left-1 z-10">
        <NextArrow onClick={() => swiperRef.current?.slidePrev()} disabled={isBeginning}/>
      </div>
      {/* Next Button */}
      <div className="absolute top-[50%] -right-2.5 min-[460px]:right-0 z-10">
        <PrevArrow onClick={() => swiperRef.current?.slideNext()} disabled={isEnd}/>
      </div>
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper
          setIsBeginning(swiper.isBeginning)
          setIsEnd(swiper.isEnd)
        }}
        onSlideChange={(swiper) => {
          setIsBeginning(swiper.isBeginning)
          setIsEnd(swiper.isEnd)
        }}
        spaceBetween={12}
        slidesPerView={4}
        dir='ltr'
        breakpoints={{
          0: { slidesPerView: 1 },
          460: { slidesPerView: 1.15 },
          500: { slidesPerView: 1.2 },
          520: { slidesPerView: 1.3 },
          540: { slidesPerView: 1.35 },
          560: { slidesPerView: 1.4 },
          580: { slidesPerView: 1.5 },
          600: { slidesPerView: 1.6 },
          640: { slidesPerView: 1.7 },
          660: { slidesPerView: 1.8 },
          700: { slidesPerView: 2 },
          740: { slidesPerView: 2.1 },
          780: { slidesPerView: 2.2 },
          820: { slidesPerView: 2.3 },
          860: { slidesPerView: 2.4 },
          900: { slidesPerView: 2.6 },
          960: { slidesPerView: 2.8 },
          1024: { slidesPerView: 3 },
          1100: { slidesPerView: 3.2 },
          1150: { slidesPerView: 3.4 },
          1220: { slidesPerView: 3.6 },
          1280: { slidesPerView: 3.8 },
          1300: { slidesPerView: 4 },
        }}
        className="w-full [@media_(min-width:460px)]:w-[calc(100%-80px)]"
      >
        {children.map((child, index) => (
          <SwiperSlide key={index}>
            {child}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default TripsCarousel
