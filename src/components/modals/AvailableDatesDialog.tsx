import { useTranslation } from "react-i18next";
import Dialog from "../ui/Dialog";
import type { CommonProps } from "@/@types/common";

interface AvailableDatesDialogProps extends CommonProps {
  isOpen: boolean;
  onClose: () => void;
}

const AvailableDatesDialog= ({
  children,
  isOpen,
  onClose,
}: AvailableDatesDialogProps) => {
  const { t } = useTranslation();
  
  return (
    <Dialog 
      closable={false} 
      overlayClassName='bg-transparent! flex justify-center items-center' 
      className='mx-auto w-full! sm:w-[90%]! lg:w-214!' 
      contentClassName='border-0' 
      isOpen={isOpen} onClose={onClose} onRequestClose={onClose} 
    >
      <div className="w-full flex flex-col px-4 py-6.5">
        <div className="flex items-center gap-2.5 px-4.5 py-3 min-w-59.75 min-h-12 bg-[#D8E5FD] border-l-4 border-[#263859] rounded-lg box-border mb-6">
          <h2 className="h-6 text-center text-black text-[26px] leading-6 font-normal">
            {t("shared.availableDates", "Available Dates")}
          </h2>
        </div>
        {children}
      </div>
    </Dialog>
  );
};

export default AvailableDatesDialog;
