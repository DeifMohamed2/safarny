import { Button } from "@/components/ui/button"
import user from "@assets/profile/user.png"
import { Link, useNavigate } from "react-router-dom"

import { useTranslation } from 'react-i18next'
import SignOutDialog from "@/components/modals/SignOutDialog"
import { useState } from "react"
import { useAuth } from "@/auth"

const Profile = () => {
  const { t } = useTranslation();
  const [dialogIsOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const openDialog = () => {
    setIsOpen(true)
  }

  const onDialogOk = () => {
    signOut();
    navigate('/');
    setIsOpen(false);
  }

  return (
    <div className='relative min-h-dvh sm:h-full max-w-340 w-full px-4 pt-32.5 mb-4 mx-auto'>
      <div className='w-full flex flex-col gap-5 sm:gap-9 md:gap-12.5'>
        <h1 className='font-medium text-2xl md:text-3xl lg:text-[43px] leading-16 capitalize text-[#122445]'>
          {t("profile.title","My Profile")}
        </h1>
        <div className='w-full flex flex-col items-center sm:items-start gap-10'>
          <div className='flex flex-col gap-5.5 p-5.5 sm:min-w-131 bg-[#D8E5FD] rounded-[22px]'>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-30 h-30 rounded-full border-4 border-white overflow-hidden bg-white">
                <img src={user} alt="Profile"
                    className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start gap-1">
                <h3 className="w-full font-medium text-base sm:text-lg leading-6.75 capitalize text-black">
                  Sarah Ahmed
                </h3>
                <div className="flex flex-col items-start">
                  <p className="w-full text-sm sm:text-base leading-6 capitalize text-black">
                    sarah.ahmed@email.com
                  </p>
                  <p className="w-full text-sm sm:text-base leading-6 capitalize text-black">
                    0123456789
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <Button
              className="p-3 bg-white border border-[#D4D7DE] rounded-xl font-medium 
              text-lg sm:text-xl leading-7.5 capitalize text-[#122445]
              transition-all duration-300 active:scale-95
              hover:bg-[#122445] hover:text-white hover:border-[#122445]"
            >
              {t("profile.edit","Edit Profile")}
            </Button>
            <Link
              to='/booking-history'
              className="p-3 bg-white border border-[#D4D7DE] rounded-xl font-medium 
              text-lg sm:text-xl leading-7.5 capitalize text-[#122445]
              transition-all duration-300 active:scale-95 text-center
              hover:bg-[#122445] hover:text-white hover:border-[#122445]"
            >
              {t("profile.bookingHistory","Booking History")}
            </Link>
            <Link
              to='/contact-us'
              className="p-3 bg-white border border-[#D4D7DE] rounded-xl font-medium 
              text-lg sm:text-xl leading-7.5 capitalize text-[#122445]
              transition-all duration-300 active:scale-95 text-center
              hover:bg-[#122445] hover:text-white hover:border-[#122445]"
            >
              {t("profile.contactUs","Contact Us")}
            </Link>
            <Button
              onClick={() => openDialog()}
              className="p-3 bg-white border border-[#FF383B] rounded-xl font-medium 
              text-lg sm:text-xl leading-7.5 capitalize text-[#FF383B]
              transition-all duration-300 active:scale-95 hover:bg-[#FF383B]/20 hover:text-[#FF383B]"
            >
              {t("shared.logOut","Log Out")}
            </Button>
          </div>
        </div>
      </div>
      <SignOutDialog
        isOpen={dialogIsOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={onDialogOk}
      />
    </div>
  )
}

export default Profile
