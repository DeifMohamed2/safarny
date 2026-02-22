import { Button } from "@/components/ui/button"

interface BookingCardData {
  imageSrc: string;
  title: string;
  status: string;
  statusColor: string;
  companyName: string;
  companyColor: string;
  location: string;
  bookingDate: string;
  travelDate: string;
  duration: string;
  adults: string;
  pricePerPerson: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

interface Props {
  data: BookingCardData
  className?: string
}

const BookingCard = ({ data }: Props) => {
  const {
    imageSrc,
    title,
    status,
    statusColor,
    companyName,
    companyColor,
    location,
    bookingDate,
    travelDate,
    duration,
    adults,
    pricePerPerson,
    onPrimaryClick,
    onSecondaryClick,
  } = data

  return (
    <div className="w-full relative flex flex-col lg:flex-row items-center p-4 gap-6.5 bg-white shadow-[0px_0px_6.3px_rgba(38,56,89,0.24)] rounded-[22px]">
      <div className="w-full lg:w-[400px] xl:w-[526px] h-66.75 rounded-[20px] overflow-hidden">
        <img 
          src={imageSrc}
          alt="Red Sea Diving Adventure"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4.5 w-full lg:w-[calc(100%-426px)] xl:w-[calc(100%-552px)] min-h-68.75">
        <div className="flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[22px] md:text-[24px] leading-8 text-black flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
              {title}
            </h3>
            <div 
              className="flex absolute sm:relative top-6 sm:top-0 end-6 sm:end-0 items-center justify-center px-3 py-1.5 gap-2 w-30.5 h-7.25
              bg-[rgba(19,103,65,0.2)] border border-[#136741] rounded-lg"
              style={{
                backgroundColor: `${statusColor}33`,
                borderColor: statusColor,
              }}
            >
              <p className="text-[14px] leading-[140%]" style={{ color: statusColor }}>
                {status}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex justify-center items-center p-1 gap-2.5 w-5.5 h-5.5 
            border rounded-[28px]"
            style={{ borderColor: companyColor, backgroundColor: `${companyColor}33` }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.0625 1.75H8.20312C8.505 1.75 8.75 1.995 8.75 2.29688V6.125C8.75 6.24103 8.79609 6.35231 8.87814 6.43436C8.96019 6.51641 9.07147 6.5625 9.1875 6.5625H10.8281C11.13 6.5625 11.375 6.8075 11.375 7.10938V12.25H10.0625V10.7188C10.0625 10.5447 9.99336 10.3778 9.87029 10.2547C9.74722 10.1316 9.5803 10.0625 9.40625 10.0625H4.59375C4.4197 10.0625 4.25278 10.1316 4.12971 10.2547C4.00664 10.3778 3.9375 10.5447 3.9375 10.7188V12.25H2.625V2.1875C2.625 2.07147 2.67109 1.96019 2.75314 1.87814C2.83519 1.79609 2.94647 1.75 3.0625 1.75ZM9.1875 12.25H7.4375V10.9375H9.1875V12.25ZM6.5625 12.25H4.8125V10.9375H6.5625V12.25ZM11.8125 13.125C11.9285 13.125 12.0398 13.0789 12.1219 12.9969C12.2039 12.9148 12.25 12.8035 12.25 12.6875V7.10938C12.25 6.92265 12.2132 6.73776 12.1418 6.56525C12.0703 6.39274 11.9656 6.23599 11.8335 6.10396C11.7015 5.97192 11.5448 5.86719 11.3723 5.79573C11.1997 5.72428 11.0148 5.6875 10.8281 5.6875H9.625V2.29688C9.625 2.11015 9.58822 1.92526 9.51677 1.75275C9.44531 1.58024 9.34058 1.42349 9.20854 1.29146C9.07651 1.15942 8.91976 1.05469 8.74725 0.983234C8.57474 0.911778 8.38985 0.875 8.20312 0.875H3.0625C2.7144 0.875 2.38056 1.01328 2.13442 1.25942C1.88828 1.50556 1.75 1.8394 1.75 2.1875V12.6875C1.75 12.8035 1.79609 12.9148 1.87814 12.9969C1.96019 13.0789 2.07147 13.125 2.1875 13.125H11.8125ZM4.59375 4.375C4.7678 4.375 4.93472 4.30586 5.05779 4.18279C5.18086 4.05972 5.25 3.8928 5.25 3.71875C5.25 3.5447 5.18086 3.37778 5.05779 3.25471C4.93472 3.13164 4.7678 3.0625 4.59375 3.0625C4.4197 3.0625 4.25278 3.13164 4.12971 3.25471C4.00664 3.37778 3.9375 3.5447 3.9375 3.71875C3.9375 3.8928 4.00664 4.05972 4.12971 4.18279C4.25278 4.30586 4.4197 4.375 4.59375 4.375ZM4.59375 6.5625C4.7678 6.5625 4.93472 6.49336 5.05779 6.37029C5.18086 6.24722 5.25 6.0803 5.25 5.90625C5.25 5.7322 5.18086 5.56528 5.05779 5.44221C4.93472 5.31914 4.7678 5.25 4.59375 5.25C4.4197 5.25 4.25278 5.31914 4.12971 5.44221C4.00664 5.56528 3.9375 5.7322 3.9375 5.90625C3.9375 6.0803 4.00664 6.24722 4.12971 6.37029C4.25278 6.49336 4.4197 6.5625 4.59375 6.5625ZM5.25 8.09375C5.25 8.2678 5.18086 8.43472 5.05779 8.55779C4.93472 8.68086 4.7678 8.75 4.59375 8.75C4.4197 8.75 4.25278 8.68086 4.12971 8.55779C4.00664 8.43472 3.9375 8.2678 3.9375 8.09375C3.9375 7.9197 4.00664 7.75278 4.12971 7.62971C4.25278 7.50664 4.4197 7.4375 4.59375 7.4375C4.7678 7.4375 4.93472 7.50664 5.05779 7.62971C5.18086 7.75278 5.25 7.9197 5.25 8.09375ZM6.78125 4.375C6.9553 4.375 7.12222 4.30586 7.24529 4.18279C7.36836 4.05972 7.4375 3.8928 7.4375 3.71875C7.4375 3.5447 7.36836 3.37778 7.24529 3.25471C7.12222 3.13164 6.9553 3.0625 6.78125 3.0625C6.6072 3.0625 6.44028 3.13164 6.31721 3.25471C6.19414 3.37778 6.125 3.5447 6.125 3.71875C6.125 3.8928 6.19414 4.05972 6.31721 4.18279C6.44028 4.30586 6.6072 4.375 6.78125 4.375ZM7.4375 5.90625C7.4375 6.0803 7.36836 6.24722 7.24529 6.37029C7.12222 6.49336 6.9553 6.5625 6.78125 6.5625C6.6072 6.5625 6.44028 6.49336 6.31721 6.37029C6.19414 6.24722 6.125 6.0803 6.125 5.90625C6.125 5.7322 6.19414 5.56528 6.31721 5.44221C6.44028 5.31914 6.6072 5.25 6.78125 5.25C6.9553 5.25 7.12222 5.31914 7.24529 5.44221C7.36836 5.56528 7.4375 5.7322 7.4375 5.90625ZM6.78125 8.75C6.9553 8.75 7.12222 8.68086 7.24529 8.55779C7.36836 8.43472 7.4375 8.2678 7.4375 8.09375C7.4375 7.9197 7.36836 7.75278 7.24529 7.62971C7.12222 7.50664 6.9553 7.4375 6.78125 7.4375C6.6072 7.4375 6.44028 7.50664 6.31721 7.62971C6.19414 7.75278 6.125 7.9197 6.125 8.09375C6.125 8.2678 6.19414 8.43472 6.31721 8.55779C6.44028 8.68086 6.6072 8.75 6.78125 8.75ZM9.625 8.09375C9.625 8.2678 9.55586 8.43472 9.43279 8.55779C9.30972 8.68086 9.1428 8.75 8.96875 8.75C8.7947 8.75 8.62778 8.68086 8.50471 8.55779C8.38164 8.43472 8.3125 8.2678 8.3125 8.09375C8.3125 7.9197 8.38164 7.75278 8.50471 7.62971C8.62778 7.50664 8.7947 7.4375 8.96875 7.4375C9.1428 7.4375 9.30972 7.50664 9.43279 7.62971C9.55586 7.75278 9.625 7.9197 9.625 8.09375Z" fill={companyColor}/>
              </svg>
            </div>
            <p className="font-medium text-[14px] leading-5.25 text-[#232323]">
              {companyName}
            </p>
          </div>
        </div>
        <div className="flex flex-col p-3 gap-2 w-full border border-[#D8E5FD] rounded-[22px]">
          <div className="flex items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.0827 7.49984C12.0827 8.05237 11.8632 8.58228 11.4725 8.97298C11.0818 9.36368 10.5519 9.58317 9.99935 9.58317C9.44681 9.58317 8.91691 9.36368 8.52621 8.97298C8.13551 8.58228 7.91602 8.05237 7.91602 7.49984C7.91602 6.9473 8.13551 6.4174 8.52621 6.0267C8.91691 5.636 9.44681 5.4165 9.99935 5.4165C10.5519 5.4165 11.0818 5.636 11.4725 6.0267C11.8632 6.4174 12.0827 6.9473 12.0827 7.49984Z" stroke="#557BEB" stroke-width="1.5"/>
              <path d="M11.0472 14.5782C10.7658 14.849 10.3904 15.0003 9.99975 15.0003C9.60915 15.0003 9.23373 14.849 8.95225 14.5782C6.37808 12.084 2.92892 9.29817 4.61058 5.25317C5.52142 3.06567 7.70475 1.6665 9.99975 1.6665C12.2947 1.6665 14.4789 3.0665 15.3889 5.25317C17.0689 9.29234 13.6281 12.0923 11.0472 14.5782Z" stroke="#557BEB" stroke-width="1.5"/>
              <path d="M15 16.6665C15 17.5873 12.7617 18.3332 10 18.3332C7.23833 18.3332 5 17.5873 5 16.6665" stroke="#557BEB" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p className="text-base leading-6 text-[#232323]">
              {location}
            </p>
          </div>
          <div className="w-full flex flex-wrap sm:flex-nowrap justify-between items-center gap-5 bg-white rounded-xl">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V14.25C2.25 15.0784 2.92157 15.75 3.75 15.75H14.25C15.0784 15.75 15.75 15.0784 15.75 14.25V6C15.75 5.17157 15.0784 4.5 14.25 4.5Z" stroke="#557BEB"/>
                <path d="M2.25 7.5C2.25 6.0855 2.25 5.379 2.6895 4.9395C3.129 4.5 3.8355 4.5 5.25 4.5H12.75C14.1645 4.5 14.871 4.5 15.3105 4.9395C15.75 5.379 15.75 6.0855 15.75 7.5H2.25Z" fill="#557BEB"/>
                <path d="M5.25 2.25V4.5M12.75 2.25V4.5" stroke="#557BEB" stroke-linecap="round"/>
                <path d="M7.875 9H5.625C5.41789 9 5.25 9.16789 5.25 9.375V10.125C5.25 10.3321 5.41789 10.5 5.625 10.5H7.875C8.08211 10.5 8.25 10.3321 8.25 10.125V9.375C8.25 9.16789 8.08211 9 7.875 9Z" fill="#557BEB"/>
                <path d="M7.875 12H5.625C5.41789 12 5.25 12.1679 5.25 12.375V13.125C5.25 13.3321 5.41789 13.5 5.625 13.5H7.875C8.08211 13.5 8.25 13.3321 8.25 13.125V12.375C8.25 12.1679 8.08211 12 7.875 12Z" fill="#557BEB"/>
                <path d="M12.375 9H10.125C9.91789 9 9.75 9.16789 9.75 9.375V10.125C9.75 10.3321 9.91789 10.5 10.125 10.5H12.375C12.5821 10.5 12.75 10.3321 12.75 10.125V9.375C12.75 9.16789 12.5821 9 12.375 9Z" fill="#557BEB"/>
                <path d="M12.375 12H10.125C9.91789 12 9.75 12.1679 9.75 12.375V13.125C9.75 13.3321 9.91789 13.5 10.125 13.5H12.375C12.5821 13.5 12.75 13.3321 12.75 13.125V12.375C12.75 12.1679 12.5821 12 12.375 12Z" fill="#557BEB"/>
              </svg>
              <div className="flex flex-col items-start">
                <p className="font-poppins font-normal text-[12px] leading-4 text-[#6A7282] flex-none order-0">
                  Booking Date
                </p>
                <p className="font-poppins font-normal text-[14px] leading-5 text-[#101828] flex-none order-1">
                  {bookingDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V14.25C2.25 15.0784 2.92157 15.75 3.75 15.75H14.25C15.0784 15.75 15.75 15.0784 15.75 14.25V6C15.75 5.17157 15.0784 4.5 14.25 4.5Z" stroke="#557BEB"/>
                <path d="M2.25 7.5C2.25 6.0855 2.25 5.379 2.6895 4.9395C3.129 4.5 3.8355 4.5 5.25 4.5H12.75C14.1645 4.5 14.871 4.5 15.3105 4.9395C15.75 5.379 15.75 6.0855 15.75 7.5H2.25Z" fill="#557BEB"/>
                <path d="M5.25 2.25V4.5M12.75 2.25V4.5" stroke="#557BEB" stroke-linecap="round"/>
                <path d="M7.875 9H5.625C5.41789 9 5.25 9.16789 5.25 9.375V10.125C5.25 10.3321 5.41789 10.5 5.625 10.5H7.875C8.08211 10.5 8.25 10.3321 8.25 10.125V9.375C8.25 9.16789 8.08211 9 7.875 9Z" fill="#557BEB"/>
                <path d="M7.875 12H5.625C5.41789 12 5.25 12.1679 5.25 12.375V13.125C5.25 13.3321 5.41789 13.5 5.625 13.5H7.875C8.08211 13.5 8.25 13.3321 8.25 13.125V12.375C8.25 12.1679 8.08211 12 7.875 12Z" fill="#557BEB"/>
                <path d="M12.375 9H10.125C9.91789 9 9.75 9.16789 9.75 9.375V10.125C9.75 10.3321 9.91789 10.5 10.125 10.5H12.375C12.5821 10.5 12.75 10.3321 12.75 10.125V9.375C12.75 9.16789 12.5821 9 12.375 9Z" fill="#557BEB"/>
                <path d="M12.375 12H10.125C9.91789 12 9.75 12.1679 9.75 12.375V13.125C9.75 13.3321 9.91789 13.5 10.125 13.5H12.375C12.5821 13.5 12.75 13.3321 12.75 13.125V12.375C12.75 12.1679 12.5821 12 12.375 12Z" fill="#557BEB"/>
              </svg>
              <div className="flex flex-col items-start">
                <p className="font-poppins font-normal text-[12px] leading-4 text-[#6A7282] flex-none order-0">
                  Travel Date
                </p>
                <p className="font-poppins font-normal text-[14px] leading-5 text-[#101828] flex-none order-1">
                  {travelDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.9375 9C15.9375 10.8399 15.2066 12.6045 13.9056 13.9056C12.6045 15.2066 10.8399 15.9375 9 15.9375C7.16006 15.9375 5.39548 15.2066 4.09445 13.9056C2.79341 12.6045 2.0625 10.8399 2.0625 9C2.0625 7.16006 2.79341 5.39548 4.09445 4.09445C5.39548 2.79341 7.16006 2.0625 9 2.0625C10.8399 2.0625 12.6045 2.79341 13.9056 4.09445C15.2066 5.39548 15.9375 7.16006 15.9375 9Z" stroke="#557BEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8.4375 5.0625V9.5625H11.4375" stroke="#557BEB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div className="flex flex-col items-start">
                <p className="font-poppins font-normal text-[12px] leading-4 text-[#6A7282] flex-none order-0">
                  Duration
                </p>
                <p className="font-poppins font-normal text-[14px] leading-5 text-[#101828] flex-none order-1">
                  {duration}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="19" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.6667 4.75C12.6667 6.00978 12.175 7.21796 11.2998 8.10876C10.4247 8.99955 9.23768 9.5 8 9.5C6.76232 9.5 5.57534 8.99955 4.70017 8.10876C3.825 7.21796 3.33333 6.00978 3.33333 4.75C3.33333 3.49022 3.825 2.28204 4.70017 1.39124C5.57534 0.500445 6.76232 0 8 0C9.23768 0 10.4247 0.500445 11.2998 1.39124C12.175 2.28204 12.6667 3.49022 12.6667 4.75ZM11.3333 4.75C11.3333 3.85016 10.9821 2.98717 10.357 2.35089C9.7319 1.7146 8.88406 1.35714 8 1.35714C7.11595 1.35714 6.2681 1.7146 5.64298 2.35089C5.01786 2.98717 4.66667 3.85016 4.66667 4.75C4.66667 5.64984 5.01786 6.51283 5.64298 7.14911C6.2681 7.7854 7.11595 8.14286 8 8.14286C8.88406 8.14286 9.7319 7.7854 10.357 7.14911C10.9821 6.51283 11.3333 5.64984 11.3333 4.75ZM2.33333 10.8571C1.71449 10.8571 1.121 11.1074 0.683418 11.5528C0.245833 11.9982 0 12.6023 0 13.2321V13.5714C0 15.1952 1.01533 16.5687 2.45667 17.5024C3.906 18.4415 5.868 19 8 19C10.132 19 12.0933 18.4415 13.5433 17.5024C14.9847 16.5687 16 15.1952 16 13.5714V13.2321C16 12.6023 15.7542 11.9982 15.3166 11.5528C14.879 11.1074 14.2855 10.8571 13.6667 10.8571H2.33333ZM1.33333 13.2321C1.33333 12.9622 1.43869 12.7033 1.62623 12.5124C1.81376 12.3215 2.06812 12.2143 2.33333 12.2143H13.6667C13.9319 12.2143 14.1862 12.3215 14.3738 12.5124C14.5613 12.7033 14.6667 12.9622 14.6667 13.2321V13.5714C14.6667 14.571 14.04 15.5725 12.8273 16.3576C11.6227 17.138 9.918 17.6429 8 17.6429C6.082 17.6429 4.37733 17.138 3.17267 16.3576C1.95933 15.5732 1.33333 14.5703 1.33333 13.5714V13.2321Z" fill="#557BEB"/>
              </svg>
              <div className="flex flex-col items-start">
                <p className="font-poppins font-normal text-[12px] leading-4 text-[#6A7282] flex-none order-0">
                  Group
                </p>
                <p className="font-poppins font-normal text-[14px] leading-5 text-[#101828] flex-none order-1">
                  {adults} Adults
                </p>
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col sm:flex-row justify-between sm:items-center pt-4 gap-5 border-t border-[#D8E5FD]">
            <p className="font-inter font-semibold text-[22px] lg:text-base xl:text-[22px] leading-8 capitalize text-black">
              {pricePerPerson} egp / person
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={onPrimaryClick}
                className="flex-1 sm:flex-none text-center px-3.5 py-3 bg-white border border-[#263859] rounded-xl 
                text-[#122445] text-base xl:text-lg font-medium capitalize
                transition-all duration-300 active:scale-95 hover:bg-[#122445] hover:text-white hover:border-[#122445]"
              >
                View details
              </Button>
              <Button
                onClick={onSecondaryClick} 
                className="flex-1 sm:flex-none text-center px-3.5 py-3 bg-white border border-[#FF383B] rounded-xl 
                text-[#FF383B] text-base xl:text-lg font-medium capitalize
                transition-all duration-300 active:scale-95 hover:bg-[#FF383B]/20 hover:text-[#FF383B]"
              >
                View details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingCard
