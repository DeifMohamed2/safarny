import { useTranslation } from "react-i18next";
import Dialog from "../ui/Dialog";
import Button from "../ui/ButtonSafarny";
import toast from "@/components/ui/toastSafarny";
import Notification from "@/components/ui/Notification";

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const bookingNotification = (
  <Notification 
    className='flex flex-col items-center
        gap-5.5 w-101.75! bg-white
        border border-[#263859] shadow-[0_0_6.3px_rgba(38,56,89,0.24)] rounded-xl' 
    safarny
    title="Booking Request Submitted!"
  >
    Your booking request has been submitted, and our team will contact you shortly to complete the details.
  </Notification>
)

function openBookingNotification() {
  toast.push(bookingNotification, {
    placement: 'top-center',
  })
}

const BookingDialog= ({
  isOpen,
  onClose,
  onConfirm,
}: BookingDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog overlayClassName='bg-transparent! flex justify-center items-center' isOpen={isOpen} onClose={onClose} onRequestClose={onClose} style={{ content: { marginTop: 0, }, }}>
      <div className="w-full flex flex-col items-center gap-5.5 p-5.5">
        <div className="w-full flex flex-col gap-5.5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <h1 className="text-[22px] leading-8.25 font-semibold capitalize text-black">
                {t("tripDetails.bookingDialog.summary", "Booking Summary")}
              </h1>
              <p className="text-base leading-6 font-normal text-[#263859]">
                {t("tripDetails.bookingDialog.company", "Red Sea Getaways")}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.875 6.75C10.875 7.24728 10.6775 7.72419 10.3258 8.07582C9.97419 8.42746 9.49728 8.625 9 8.625C8.50272 8.625 8.02581 8.42746 7.67417 8.07582C7.32254 7.72419 7.125 7.24728 7.125 6.75C7.125 6.25272 7.32254 5.77581 7.67417 5.42417C8.02581 5.07254 8.50272 4.875 9 4.875C9.49728 4.875 9.97419 5.07254 10.3258 5.42417C10.6775 5.77581 10.875 6.25272 10.875 6.75Z" stroke="#8CA9FF" stroke-width="1.5"/>
                <path d="M9.94262 13.1205C9.68929 13.3642 9.35141 13.5004 8.99987 13.5004C8.64833 13.5004 8.31045 13.3642 8.05712 13.1205C5.74037 10.8757 2.63612 8.3685 4.14962 4.728C4.96937 2.75925 6.93437 1.5 8.99987 1.5C11.0654 1.5 13.0311 2.76 13.8501 4.728C15.3621 8.36325 12.2654 10.8832 9.94262 13.1205Z" stroke="#8CA9FF" stroke-width="1.5"/>
                <path d="M13.5 15C13.5 15.8288 11.4855 16.5 9 16.5C6.5145 16.5 4.5 15.8288 4.5 15" stroke="#8CA9FF" stroke-width="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-sm leading-5.25 text-[#535353]">
                {t("tripDetails.bookingDialog.route", "Sharm El Sheikh – Hurghada")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6.5 max-h-[50vh] overflow-y-scroll pe-1.5">
            <div className="flex flex-col gap-6.5">
              <div className="flex flex-col gap-3.25 bg-[#F6F6F6] rounded-xl p-3">
                <h3 className="text-base leading-6 font-normal text-black">
                  {t("tripDetails.bookingDialog.tripSummary", "Trip Summary")}
                </h3>

                <div className="flex flex-col gap-2 w-full">

                  <div className="flex flex-col min-[500px]:flex-row text-center justify-between items-center text-sm leading-5.25">
                    <span className="text-[#535353]">
                      {t("tripDetails.bookingDialog.duration", "Duration")}
                    </span>
                    <span className="text-black">5 {t("tripDetails.durationDays", "Days")} / 4 {t("tripDetails.durationNights", "Nights")}</span>
                  </div>

                  <div className="flex flex-col min-[500px]:flex-row text-center justify-between items-center text-sm leading-5.25">
                    <span className="text-[#535353]">
                      {t("tripDetails.bookingDialog.schedule", "Schedule")}
                    </span>
                    <span className="text-black">Daily</span>
                  </div>

                  <div className="flex flex-col min-[500px]:flex-row text-center justify-between items-center text-sm leading-5.25">
                    <span className="text-[#535353]">
                      {t("tripDetails.bookingDialog.location", "Location")}
                    </span>
                    <span className="text-black">Sharm El Sheikh – Hurghada, Egypt</span>
                  </div>

                  <div className="flex flex-col min-[500px]:flex-row text-center justify-between items-center text-sm leading-5.25">
                    <span className="text-[#535353]">
                      {t("tripDetails.bookingDialog.pricePerPerson", "Price per person")}
                    </span>
                    <span className="text-black capitalize">8,500 {t("shared.egp", "EGP")}</span>
                  </div>

                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3.5">
                  <h3 className="font-normal text-[16px] leading-4.75 capitalize text-black">
                    {t("tripDetails.bookingDialog.selectedDateTime", "Selected Date & Time")}
                  </h3>
                  <div className="flex flex-col items-start gap-3">
                    <div className="flex flex-row items-center gap-3.5">
                      {/* Calendar Icon */}
                      <div className="flex justify-center items-center p-1.5 gap-2.5 bg-[#D8E5FD] border border-[#557BEB] rounded-lg">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.5833 6.5H5.41667C4.22005 6.5 3.25 7.47005 3.25 8.66667V20.5833C3.25 21.78 4.22005 22.75 5.41667 22.75H20.5833C21.78 22.75 22.75 21.78 22.75 20.5833V8.66667C22.75 7.47005 21.78 6.5 20.5833 6.5Z" stroke="#557BEB"/>
                          <path d="M3.25 10.8333C3.25 8.79017 3.25 7.76967 3.88483 7.13483C4.51967 6.5 5.54017 6.5 7.58333 6.5H18.4167C20.4598 6.5 21.4803 6.5 22.1152 7.13483C22.75 7.76967 22.75 8.79017 22.75 10.8333H3.25Z" fill="#557BEB"/>
                          <path d="M7.5835 3.25V6.5M18.4168 3.25V6.5" stroke="#557BEB" strokeLinecap="round"/>
                          <path d="M11.3752 13H8.12516C7.82601 13 7.5835 13.2425 7.5835 13.5417V14.625C7.5835 14.9242 7.82601 15.1667 8.12516 15.1667H11.3752C11.6743 15.1667 11.9168 14.9242 11.9168 14.625V13.5417C11.9168 13.2425 11.6743 13 11.3752 13Z" fill="#557BEB"/>
                          <path d="M11.3752 17.3333H8.12516C7.82601 17.3333 7.5835 17.5758 7.5835 17.875V18.9583C7.5835 19.2575 7.82601 19.5 8.12516 19.5H11.3752C11.6743 19.5 11.9168 19.2575 11.9168 18.9583V17.875C11.9168 17.5758 11.6743 17.3333 11.3752 17.3333Z" fill="#557BEB"/>
                          <path d="M17.8752 13H14.6252C14.326 13 14.0835 13.2425 14.0835 13.5417V14.625C14.0835 14.9242 14.326 15.1667 14.6252 15.1667H17.8752C18.1743 15.1667 18.4168 14.9242 18.4168 14.625V13.5417C18.4168 13.2425 18.1743 13 17.8752 13Z" fill="#557BEB"/>
                          <path d="M17.8752 17.3333H14.6252C14.326 17.3333 14.0835 17.5758 14.0835 17.875V18.9583C14.0835 19.2575 14.326 19.5 14.6252 19.5H17.8752C18.1743 19.5 18.4168 19.2575 18.4168 18.9583V17.875C18.4168 17.5758 18.1743 17.3333 17.8752 17.3333Z" fill="#557BEB"/>
                        </svg>
                      </div>
                      {/* Start Date Text */}
                      <div className="flex flex-col">
                        <p className="font-normal text-[12px] leading-4.5 text-[#535353]">
                          {t("tripDetails.bookingDialog.startDate", "Start Date")}
                        </p>
                        <p className="font-normal text-sm leading-5.25 text-black">
                          12 Mar 2026
                        </p>
                      </div>
                    </div>
                    {/* Start Time */}
                    <div className="flex flex-row items-center gap-3.5">
                      {/* Clock Icon */}
                      <div className="flex justify-center items-center p-1.5 gap-2.5 bg-[#D8E5FD] border border-[#557BEB] rounded-lg">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.7917 10.7708C20.7917 13.4285 19.7359 15.9774 17.8566 17.8566C15.9774 19.7359 13.4285 20.7917 10.7708 20.7917C8.11314 20.7917 5.5643 19.7359 3.68503 17.8566C1.80576 15.9774 0.75 13.4285 0.75 10.7708C0.75 8.11314 1.80576 5.5643 3.68503 3.68503C5.5643 1.80576 8.11314 0.75 10.7708 0.75C13.4285 0.75 15.9774 1.80576 17.8566 3.68503C19.7359 5.5643 20.7917 8.11314 20.7917 10.7708Z" stroke="#557BEB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9.9585 5.08331V11.5833H14.2918" stroke="#557BEB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {/* Start Date Text */}
                      <div className="flex flex-col">
                        <p className="font-normal text-[12px] leading-4.5 text-[#535353]">
                          {t("tripDetails.bookingDialog.startTime", "Start Time")}
                        </p>
                        <p className="font-normal text-sm leading-5.25 text-black">
                          8:00 AM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3.5">
                  <h3 className="font-normal text-[16px] leading-4.75 capitalize text-black">
                    {t("tripDetails.bookingDialog.selectedDateTime", "Selected Date & Time")}
                  </h3>
                  <div className="flex flex-row items-center gap-3.5">
                    {/* User Icon */}
                    <div className="flex justify-center items-center p-1.5 gap-2.5 bg-[#D8E5FD] border border-[#557BEB] rounded-lg">
                      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.95817 8.66665C5.95817 7.94835 6.24351 7.25948 6.75142 6.75157C7.25933 6.24365 7.94821 5.95831 8.6665 5.95831C9.3848 5.95831 10.0737 6.24365 10.5816 6.75157C11.0895 7.25948 11.3748 7.94835 11.3748 8.66665C11.3748 9.38494 11.0895 10.0738 10.5816 10.5817C10.0737 11.0896 9.3848 11.375 8.6665 11.375C7.94821 11.375 7.25933 11.0896 6.75142 10.5817C6.24351 10.0738 5.95817 9.38494 5.95817 8.66665ZM8.6665 4.33331C7.51723 4.33331 6.41503 4.78986 5.60237 5.60252C4.78972 6.41517 4.33317 7.51737 4.33317 8.66665C4.33317 9.81592 4.78972 10.9181 5.60237 11.7308C6.41503 12.5434 7.51723 13 8.6665 13C9.81578 13 10.918 12.5434 11.7306 11.7308C12.5433 10.9181 12.9998 9.81592 12.9998 8.66665C12.9998 7.51737 12.5433 6.41517 11.7306 5.60252C10.918 4.78986 9.81578 4.33331 8.6665 4.33331ZM16.7915 9.74998C16.7915 9.319 16.9627 8.90568 17.2675 8.60093C17.5722 8.29618 17.9855 8.12498 18.4165 8.12498C18.8475 8.12498 19.2608 8.29618 19.5656 8.60093C19.8703 8.90568 20.0415 9.319 20.0415 9.74998C20.0415 10.181 19.8703 10.5943 19.5656 10.899C19.2608 11.2038 18.8475 11.375 18.4165 11.375C17.9855 11.375 17.5722 11.2038 17.2675 10.899C16.9627 10.5943 16.7915 10.181 16.7915 9.74998ZM18.4165 6.49998C17.5546 6.49998 16.7279 6.84239 16.1184 7.45188C15.5089 8.06138 15.1665 8.88803 15.1665 9.74998C15.1665 10.6119 15.5089 11.4386 16.1184 12.0481C16.7279 12.6576 17.5546 13 18.4165 13C19.2785 13 20.1051 12.6576 20.7146 12.0481C21.3241 11.4386 21.6665 10.6119 21.6665 9.74998C21.6665 8.88803 21.3241 8.06138 20.7146 7.45188C20.1051 6.84239 19.2785 6.49998 18.4165 6.49998ZM15.4352 20.6245C16.1968 20.9332 17.1728 21.125 18.4176 21.125C20.8898 21.125 22.3024 20.3699 23.0727 19.4371C23.4464 18.9843 23.636 18.5271 23.7335 18.1772C23.7893 17.9745 23.8231 17.7664 23.8343 17.5565V17.5272C23.834 16.9013 23.5852 16.301 23.1425 15.8584C22.6999 15.4157 22.0996 15.1669 21.4737 15.1666H15.3615C15.3312 15.1666 15.3016 15.1674 15.2727 15.1688C15.6995 15.613 16.0093 16.1709 16.1567 16.7916H21.4737C21.8767 16.7916 22.2038 17.1156 22.2093 17.5164L22.206 17.5511C22.2017 17.593 22.1883 17.658 22.1659 17.7461C22.099 17.987 21.9807 18.2106 21.8193 18.4015C21.4401 18.863 20.5496 19.5 18.4176 19.5C17.3559 19.5 16.6019 19.3418 16.0668 19.1262C15.9498 19.5596 15.7569 20.0828 15.4352 20.6245ZM4.604 15.1666C3.95754 15.1666 3.33755 15.4235 2.88043 15.8806C2.42331 16.3377 2.1665 16.9577 2.1665 17.6041V17.9053C2.16764 17.9806 2.1727 18.0559 2.18167 18.1306C2.27172 18.9366 2.56141 19.7074 3.0245 20.3731C3.91067 21.6385 5.60284 22.75 8.6665 22.75C11.7302 22.75 13.4223 21.6396 14.3085 20.3721C14.7716 19.7063 15.0613 18.9355 15.1513 18.1296C15.159 18.055 15.164 17.9802 15.1665 17.9053V17.6041C15.1665 16.9577 14.9097 16.3377 14.4526 15.8806C13.9955 15.4235 13.3755 15.1666 12.729 15.1666H4.604ZM3.7915 17.8826V17.6041C3.7915 17.3887 3.87711 17.182 4.02948 17.0296C4.18185 16.8772 4.38852 16.7916 4.604 16.7916H12.729C12.9445 16.7916 13.1512 16.8772 13.3035 17.0296C13.4559 17.182 13.5415 17.3887 13.5415 17.6041V17.8826L13.5339 17.9692C13.4716 18.4978 13.2804 19.003 12.9771 19.4404C12.443 20.2041 11.2903 21.125 8.6665 21.125C6.04267 21.125 4.89 20.2041 4.35484 19.4404C4.05194 19.0029 3.86111 18.4977 3.79909 17.9692L3.7915 17.8826Z" fill="#557BEB"/>
                      </svg>
                    </div>
                    {/* Start Date Text */}
                    <div className="flex flex-col">
                      <p className="font-normal text-[12px] leading-4.5 text-[#535353] capitalize">
                          {t("tripDetails.bookingDialog.availableSpots", "Available spots")}
                      </p>
                      <p className="font-normal text-sm leading-5.25 text-black">
                        12 {t("tripDetails.bookingDialog.persons", "Persons")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col py-3.5 px-3 gap-2.25 bg-[rgba(250,165,51,0.1)] border border-[#EF7722] rounded-xl">
              {/* Header Container */}
              <div className="flex items-center gap-2">
                {/* Icon */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_1059_16973)">
                    <path d="M9.99984 18.3334C14.6022 18.3334 18.3332 14.6024 18.3332 10C18.3332 5.39765 14.6022 1.66669 9.99984 1.66669C5.39746 1.66669 1.6665 5.39765 1.6665 10C1.6665 14.6024 5.39746 18.3334 9.99984 18.3334Z" stroke="#EF7722" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 13.3333V10" stroke="#EF7722" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 6.66669H10.0083" stroke="#EF7722" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_1059_16973">
                      <rect width="20" height="20" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>

                {/* Header Title */}
                <p className="text-base leading-6 text-black">
                  {t("tripDetails.bookingDialog.importantInfo", "Important Info")}
                </p>
              </div>

              {/* List of Important Notes */}
              <div className="flex flex-col sm:px-7.5 gap-1.5">
                <p className="text-sm leading-5.25 text-[#232323]">
                  • {t("tripDetails.bookingDialog.info.perPerson","Prices are per person")}
                </p>
                <p className="text-sm leading-5.25 text-[#232323]">
                  • {t("tripDetails.bookingDialog.info.availability","Subject to availability")}
                </p>
                <p className="text-sm leading-5.25 text-[#232323]">
                  • {t("tripDetails.bookingDialog.info.confirmation","Provider confirmation required")}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            openBookingNotification()
            onConfirm()
          }}
          variant="solid"
          className='text-white w-full'
        >
          {t("tripDetails.sendRequest","send request")}
        </Button>
      </div>
    </Dialog>
  );
};

export default BookingDialog;
