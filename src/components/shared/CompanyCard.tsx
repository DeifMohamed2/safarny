import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

interface CompanyCardData {
  id: string
  image: string
  title: string
  location: string
  years: number
  description: string
  badges?: string[]
  packages: number
  reviews: number
  rating?: number
  href: string
  onViewDetails?: () => void
}

interface Props {
  data: CompanyCardData
  className?: string
}

const CompanyCard = ({ data, className }: Props) => {
  const {
    image,
    title,
    location,
    years,
    description,
    badges,
    packages,
    reviews,
    rating,
    href,
    onViewDetails,
  } = data

  const getInitials = (title: string) => {
    if (!title) return ""
    const words = title.trim().split(" ")
    if (words.length === 1) return words[0][0].toUpperCase() // single word
    return (words[0][0] + words[1][0]).toUpperCase() // first char of first two words
  }

  return (
    <div
      className={cn(
        "w-76 h-106.5 m-2 sm:mx-auto [@media_(min-width:460px)]:m-1 flex flex-col justify-between items-center gap-2 p-[8px_8px_24px] bg-white rounded-[22px] shadow-[0px_0px_6.3px_rgba(38,56,89,0.24)] overflow-hidden",
        className
      )}
    >
      <div className="w-full h-full flex flex-col justify-between gap-2">
        {/* IMAGE */}
        <div className="relative w-full h-33.75 rounded-2xl overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full rounded-2xl object-cover"
          />
          
          {/* TOP BADGES */}
          {rating && (
            <div className={`w-full -start-2.5 top-2.5 absolute flex justify-end items-center`}>
              <div 
                className="flex rtl:flex-row-reverse items-center px-1.5 py-1 gap-1
                w-14.75 h-8
                bg-white/20 border border-white rounded-[23px]"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.3933 0.820567C9.7917 -0.273522 8.2083 -0.273522 7.60576 0.820567C6.8134 2.26124 6.16023 3.77428 5.65512 5.33911C5.6313 5.40033 5.58939 5.45284 5.53499 5.48962C5.48059 5.5264 5.41627 5.54572 5.35062 5.545C3.99695 5.58021 2.64768 5.71475 1.31369 5.94755C0.0800096 6.16268 -0.463476 7.64362 0.474014 8.56044C0.592122 8.67616 0.711462 8.79126 0.832031 8.90575C1.73521 9.76147 2.69152 10.5592 3.69525 11.2943C3.74085 11.3246 3.7754 11.3688 3.7937 11.4205C3.812 11.4721 3.81307 11.5282 3.79675 11.5805C3.29002 13.1018 2.92794 14.6675 2.71531 16.2569C2.54 17.5717 3.93147 18.3786 5.01752 17.821C6.33598 17.1448 7.59667 16.3614 8.78685 15.4786C8.84918 15.4345 8.92365 15.4108 9 15.4108C9.07635 15.4108 9.15082 15.4345 9.21315 15.4786C10.4026 16.3624 11.6634 17.1459 12.9825 17.821C14.0685 18.3786 15.46 17.5717 15.2847 16.2569C15.0724 14.6676 14.7106 13.1018 14.2042 11.5805C14.1879 11.5282 14.1889 11.4721 14.2072 11.4205C14.2255 11.3688 14.2601 11.3246 14.3057 11.2943C15.4429 10.4614 16.5191 9.54807 17.526 8.56136C18.4635 7.64362 17.92 6.16268 16.6863 5.94755C15.352 5.71471 14.0024 5.58016 12.6485 5.545C12.583 5.54553 12.5188 5.52613 12.4646 5.48936C12.4104 5.45258 12.3686 5.40018 12.3449 5.33911C11.8414 3.77368 11.1872 2.26049 10.3933 0.820567Z" fill="#FFD41D"/>
                </svg>
                <p className="w-6.25 h-6 font-medium text-base leading-6 text-white">{rating}</p>
              </div>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="w-full h-[calc(100%-143px)] flex flex-col gap-3">
          <div className="w-full h-full flex flex-col gap-3 justify-between">
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center p-0 gap-3">
                <div className="flex justify-center items-center w-11 h-11 bg-[#263859] border-2 border-[#AAC4F5] rounded-xl">
                  <p className="font-inter font-bold text-base leading-6 tracking-[-0.3125px] text-white">
                    {getInitials(title)}
                  </p>
                </div>
                <div className="w-[calc(100%-56px)] flex flex-col gap-1 order-1 grow">
                  <h3 className="font-bold text-base leading-5 tracking-[-0.3125px] text-[#0A0A0A] line-clamp-1">
                    {title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex justify-center items-center gap-1">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.1239 10.0246C11.2323 10.0246 12.1308 9.12609 12.1308 8.01769C12.1308 6.90928 11.2323 6.01074 10.1239 6.01074C9.01548 6.01074 8.11694 6.90928 8.11694 8.01769C8.11694 9.12609 9.01548 10.0246 10.1239 10.0246Z" fill="white"/>
                        <path d="M13.4927 8.08627C13.4927 5.49877 11.5113 3.39404 9.07521 3.39404C6.6391 3.39404 4.65771 5.49877 4.65771 8.08738C4.65827 8.21654 4.71966 11.3121 8.25772 16.7665C8.33051 16.9162 8.44093 17.0444 8.57814 17.1386C8.71536 17.2327 8.87467 17.2897 9.04049 17.3038C9.5516 17.3038 9.89994 16.741 9.93383 16.6838C13.4947 11.2263 13.4947 8.20932 13.4927 8.08627ZM9.07521 9.97627C8.68608 9.97627 8.30568 9.86087 7.98213 9.64468C7.65858 9.42849 7.4064 9.12121 7.25748 8.76169C7.10857 8.40218 7.0696 8.00658 7.14552 7.62493C7.22144 7.24327 7.40882 6.89269 7.68398 6.61753C7.95914 6.34237 8.30972 6.15499 8.69137 6.07907C9.07303 6.00315 9.46863 6.04212 9.82814 6.19103C10.1877 6.33995 10.4949 6.59213 10.7111 6.91568C10.9273 7.23923 11.0427 7.61963 11.0427 8.00877C11.0422 8.53042 10.8347 9.03056 10.4659 9.39943C10.097 9.7683 9.59687 9.97575 9.07521 9.97627Z" fill="#D22F27"/>
                        <path d="M13.4923 8.08627C13.4923 5.49877 11.5109 3.39404 9.07483 3.39404C8.71214 3.39572 8.35122 3.44474 8.00122 3.53988C10.3332 3.66488 12.1957 5.71293 12.1957 8.22043C12.1973 8.34349 12.1973 11.3602 8.6365 16.8177C8.58843 16.8958 8.53398 16.9699 8.47372 17.039C8.61817 17.2013 8.82289 17.2968 9.04039 17.304C9.55122 17.304 9.89955 16.741 9.93344 16.6838C13.4943 11.2263 13.4943 8.20932 13.4923 8.08627Z" fill="#EA5A47"/>
                        <path d="M9.04028 17.304C8.87448 17.2899 8.7152 17.2329 8.57804 17.1386C8.44087 17.0444 8.33052 16.9162 8.25778 16.7665C4.71945 11.3121 4.65806 8.21682 4.65723 8.08738C4.65723 5.49849 6.63889 3.39404 9.075 3.39404C11.5111 3.39404 13.4925 5.49877 13.4925 8.08626C13.4944 8.2096 13.4944 11.2263 9.93362 16.6835C9.89973 16.741 9.55111 17.304 9.04028 17.304Z" stroke="black" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.07492 9.9765C8.68579 9.9765 8.30539 9.86111 7.98184 9.64492C7.65828 9.42873 7.40611 9.12145 7.25719 8.76193C7.10827 8.40242 7.06931 8.00682 7.14523 7.62516C7.22114 7.24351 7.40853 6.89293 7.68369 6.61777C7.95885 6.34261 8.30942 6.15523 8.69108 6.07931C9.07274 6.00339 9.46834 6.04236 9.82785 6.19127C10.1874 6.34019 10.4946 6.59237 10.7108 6.91592C10.927 7.23947 11.0424 7.61987 11.0424 8.009C11.0419 8.53066 10.8345 9.0308 10.4656 9.39967C10.0967 9.76853 9.59658 9.97599 9.07492 9.9765Z" stroke="black" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p className="text-[12px] font-normal leading-4 text-[#4A5565]">
                        {location}
                      </p>
                    </div>
                    <div className="flex justify-center items-center gap-1">
                      <svg width="11" height="14" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.56 0H9.4515C9.753 0 10 0.255 10 0.57V3.465C10 3.665 9.896 3.855 9.728 3.955L7.825 5.105L7.02 5.543V5.815H3.02V5.54L2.22 5.105L0.2775 3.955C0.192776 3.90435 0.122659 3.83256 0.0740149 3.74666C0.0253707 3.66077 -0.000133168 3.56371 5.22909e-07 3.465V0.57C5.22909e-07 0.255 0.2525 0 0.56 0Z" fill="#0074BA"/>
                        <path d="M2.21997 5.105V0H3.51997L3.52497 5.815L2.21997 5.105ZM6.51997 5.815V0H7.82497V5.105L6.51997 5.815Z" fill="#D3D3D3"/>
                        <path d="M6.52002 0H3.52002V5.815H6.52002V0Z" fill="#F8312F"/>
                        <path d="M5.02 14C7.7925 14 10.04 11.6965 10.04 8.85496C10.04 6.01346 7.7925 3.70996 5.02 3.70996C2.2475 3.70996 0 6.01346 0 8.85496C0 11.6965 2.2475 14 5.02 14Z" fill="#FFB02E"/>
                        <path d="M5.02491 13.3801C3.84491 13.3801 2.73491 12.9101 1.90491 12.0551C1.06965 11.2 0.604465 10.0505 0.609911 8.85512C0.609911 7.64512 1.06991 6.51012 1.90491 5.65512C2.31006 5.23642 2.79527 4.90348 3.33169 4.6761C3.86811 4.44872 4.44479 4.33154 5.02741 4.33154C5.61003 4.33154 6.18671 4.44872 6.72313 4.6761C7.25955 4.90348 7.74477 5.23642 8.14991 5.65512C9.86991 7.42012 9.86991 10.2901 8.14991 12.0551C7.30991 12.9101 6.19991 13.3801 5.02491 13.3801ZM5.01991 4.94512C4.04491 4.94512 3.06491 5.32512 2.32491 6.09012C1.60497 6.82986 1.20453 7.82288 1.20991 8.85512C1.20991 9.90012 1.60491 10.8801 2.32491 11.6201C2.67401 11.9824 3.09262 12.2706 3.5557 12.4673C4.01877 12.6641 4.51678 12.7654 5.01991 12.7651C6.03991 12.7651 6.99491 12.3601 7.71491 11.6201C9.19991 10.0951 9.19991 7.61512 7.71491 6.09012C7.36616 5.72734 6.94762 5.43888 6.48447 5.24211C6.02131 5.04533 5.52313 4.94431 5.01991 4.94512Z" fill="#FCD53F"/>
                        <path d="M5.32505 6.82977L5.74005 7.68977C5.79005 7.78977 5.88505 7.86477 5.99505 7.87977L6.92005 8.01977C7.19505 8.05977 7.31005 8.40977 7.10505 8.60977L6.46505 9.24977C6.37005 9.34477 6.34005 9.48477 6.38005 9.61477L6.67505 10.4698C6.77505 10.7548 6.49505 11.0248 6.22005 10.9048L5.15005 10.4248C5.10776 10.4051 5.06169 10.3949 5.01505 10.3949C4.96841 10.3949 4.92233 10.4051 4.88005 10.4248L3.81005 10.9048C3.54005 11.0248 3.25505 10.7548 3.35505 10.4698L3.65005 9.61477C3.69505 9.48477 3.66005 9.34477 3.56505 9.24977L2.92505 8.60977C2.72505 8.40977 2.83505 8.05977 3.11005 8.01977L4.03505 7.87977C4.14505 7.86477 4.24005 7.79477 4.29005 7.68977L4.70505 6.82977C4.84005 6.56977 5.20005 6.56977 5.32505 6.82977Z" fill="#6D4534"/>
                      </svg>
                      <p className="text-[12px] font-normal leading-4 text-[#4A5565]">{years} years</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[12px] font-normal leading-5 text-[#364153] line-clamp-2">
                {description}
              </p>
              {badges && (
                <div className="w-full flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <div
                      key={index} 
                      className="flex h-8 items-center justify-center gap-2.5 rounded-2xl border border-[#EF7722] bg-[rgba(239,119,34,0.06)] px-2.5 py-2"
                    >
                      <p className="text-xs font-medium text-[#EF7722] line-clamp-1">
                        {badge}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex w-full items-center justify-between gap-5 border-t border-[#D8E5FD] pt-1.5">
              <div className="flex items-center gap-4 p-0">
                <div className="flex flex-col items-center gap-1 p-0">
                  <p className="text-[20px] font-bold leading-5 tracking-[-0.449219px] text-[#0A0A0A] text-center">
                    {packages}
                  </p>
                  <p className="font-inter font-normal text-[10px] leading-2.5 text-center tracking-[0.117188px] text-[#6A7282]">
                    Packages
                  </p>
                </div>
                
                <div className="w-px h-8 bg-[#E5E7EB] rounded-none"></div>
                
                <div className="flex flex-col items-center gap-1 p-0">
                  <p className="text-[20px] font-bold leading-5 tracking-[-0.449219px] text-[#0A0A0A] text-center">
                    {reviews}
                  </p>
                  <p className="font-inter font-normal text-[10px] leading-2.5 text-center tracking-[0.117188px] text-[#6A7282]">
                    Reviews
                  </p>
                </div>
              </div>
              {/* ACTION */}
              <Link
                to={href}
                className="flex items-center justify-center gap-2.5 rounded-xl bg-[#263859] px-3.5 py-3 text-white"
                onClick={() => onViewDetails?.()}
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyCard
