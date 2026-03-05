import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { useRef, useState } from "react";

interface Review {
  name: string;
  message: string;
  avatar: string;
}

const reviews: Review[] = [
  { name: "Ahmed Ali", message: "Great trips, great prices, and smooth booking", avatar: "https://placehold.co/78x78" },
  { name: "Said Ahmed", message: "Great trips, great prices, and smooth booking", avatar: "https://placehold.co/78x78" },
  { name: "Mohamed Ali", message: "Great trips, great prices, and smooth booking", avatar: "https://placehold.co/78x78" },
  { name: "Ahmed Ali", message: "Great trips, great prices, and smooth booking", avatar: "https://placehold.co/78x78" },
  { name: "Said Ahmed", message: "Great trips, great prices, and smooth booking", avatar: "https://placehold.co/78x78" },
  { name: "Mohamed Ali", message: "Great trips, great prices, and smooth booking", avatar: "https://placehold.co/78x78" },
  { name: "Said Ahmed", message: "Great trips, great prices, and smooth booking", avatar: "https://placehold.co/78x78" },
  { name: "Ahmed Ali", message: "Great trips, great prices, and smooth booking", avatar: "https://placehold.co/78x78" },
];

const Quotes = () => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0))
    setScrollLeft(scrollRef.current?.scrollLeft || 0)
  }

  const onMouseLeave = () => {
    setIsDragging(false)
  }

  const onMouseUp = () => {
    setIsDragging(false)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0)
    const walk = (x - startX) * 1.5 
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - walk
  }
  return (
    <section className="max-w-340 w-full px-4 mx-auto flex flex-col items-center gap-12 pt-20 pb-25">
      {/* Header */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-orange-500 text-2xl sm:text-3xl lg:text-4xl font-semibold font-poppins capitalize">
            {t("home.quotes.title", "Quotes")}
          </h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="20" viewBox="0 0 28 20" fill="none">
            <path opacity="0.2" d="M11.0526 2.10512V11.5788H2.10524C1.82607 11.5788 1.55833 11.4679 1.36092 11.2705C1.16351 11.0731 1.05261 10.8054 1.05261 10.5262V2.10512C1.05261 1.82595 1.16351 1.55821 1.36092 1.3608C1.55833 1.16339 1.82607 1.05249 2.10524 1.05249H9.99998C10.2792 1.05249 10.5469 1.16339 10.7443 1.3608C10.9417 1.55821 11.0526 1.82595 11.0526 2.10512ZM25.2631 1.05249H17.3684C17.0892 1.05249 16.8215 1.16339 16.6241 1.3608C16.4267 1.55821 16.3158 1.82595 16.3158 2.10512V10.5262C16.3158 10.8054 16.4267 11.0731 16.6241 11.2705C16.8215 11.4679 17.0892 11.5788 17.3684 11.5788H26.3158V2.10512C26.3158 1.82595 26.2049 1.55821 26.0075 1.3608C25.8101 1.16339 25.5423 1.05249 25.2631 1.05249Z" fill="#EF7722"/>
             <path d="M10 0H2.10526C1.54691 0 1.01143 0.221804 0.616617 0.616617C0.221804 1.01143 0 1.54691 0 2.10526V10.5263C0 11.0847 0.221804 11.6201 0.616617 12.015C1.01143 12.4098 1.54691 12.6316 2.10526 12.6316H10V13.6842C10 14.8009 9.55639 15.8719 8.76677 16.6615C7.97714 17.4511 6.90618 17.8947 5.78947 17.8947C5.5103 17.8947 5.24256 18.0056 5.04515 18.203C4.84774 18.4005 4.73684 18.6682 4.73684 18.9474C4.73684 19.2265 4.84774 19.4943 5.04515 19.6917C5.24256 19.8891 5.5103 20 5.78947 20C7.46399 19.9983 9.06942 19.3323 10.2535 18.1482C11.4376 16.9642 12.1035 15.3587 12.1053 13.6842V2.10526C12.1053 1.54691 11.8835 1.01143 11.4886 0.616617C11.0938 0.221804 10.5584 0 10 0ZM10 10.5263H2.10526V2.10526H10V10.5263ZM25.2632 0H17.3684C16.8101 0 16.2746 0.221804 15.8798 0.616617C15.485 1.01143 15.2632 1.54691 15.2632 2.10526V10.5263C15.2632 11.0847 15.485 11.6201 15.8798 12.015C16.2746 12.4098 16.8101 12.6316 17.3684 12.6316H25.2632V13.6842C25.2632 14.8009 24.8195 15.8719 24.0299 16.6615C23.2403 17.4511 22.1693 17.8947 21.0526 17.8947C20.7735 17.8947 20.5057 18.0056 20.3083 18.203C20.1109 18.4005 20 18.6682 20 18.9474C20 19.2265 20.1109 19.4943 20.3083 19.6917C20.5057 19.8891 20.7735 20 21.0526 20C22.7271 19.9983 24.3326 19.3323 25.5166 18.1482C26.7007 16.9642 27.3667 15.3587 27.3684 13.6842V2.10526C27.3684 1.54691 27.1466 1.01143 26.7518 0.616617C26.357 0.221804 25.8215 0 25.2632 0ZM25.2632 10.5263H17.3684V2.10526H25.2632V10.5263Z" fill="#EF7722"/>
          </svg>
        </div>
        <p className="text-center text-sky-950 tetx-sm sm:text-base lg:text-xl font-normal font-poppins capitalize">
          {t("home.quotes.subtitle","Experiences shared by travelers who found their trips here")}
        </p>
      </div>

      {/* Reviews slider row */}
      <div 
        ref={scrollRef}
        className={`w-full p-1 flex gap-6 overflow-x-auto scrollbar-hide
        cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {reviews.map((review, index) => (
          <Card
            key={index}
            className="min-w-90 rounded-2xl shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)]"
          >
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-sky-950 object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-black tetx-base sm:text-xl lg:text-2xl font-medium font-poppins leading-5 sm:leading-7">
                    {review.name}
                  </span>
                </div>
              </div>
              <p className="text-neutral-600 text-sm sm:text-base lg:text-lg font-normal font-poppins leading-5 sm:leading-7">
                {review.message}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default Quotes;