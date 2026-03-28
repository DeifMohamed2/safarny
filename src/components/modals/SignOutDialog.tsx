import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import Dialog from "../ui/Dialog";

interface SignOutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SignOutDialog= ({
  isOpen,
  onClose,
  onConfirm,
}: SignOutDialogProps) => {
  const { t } = useTranslation();
  
  return (
    <Dialog closable={false} overlayClassName='bg-transparent! flex justify-center items-center' isOpen={isOpen} onClose={onClose} onRequestClose={onClose} style={{ content: { marginTop: 0, }, }}>
      <div className="w-full flex flex-col items-center gap-5.5 px-4 py-6.5">
        <p className="w-full text-center text-lg leading-6.75 font-medium capitalize text-black">
          {t("shared.wantLogout", "Are you sure you want to log out ?!")}
        </p>
        <div className="flex justify-center items-center gap-8.5 w-full">
          <Button
            className="w-full max-w-43.5 flex items-center justify-center px-3.5 py-3 
                  border border-[#263859] bg-white rounded-xl 
                  text-lg leading-6.75 font-medium text-[#122445] hover:bg-[#263859] hover:text-white capitalize"
            onClick={onClose}
          >
            {t("shared.no", "No")}
          </Button>
          <Button
            className="w-full max-w-43.5 flex items-center justify-center px-3.5 py-3 
                  border border-[#263859] bg-[#263859] rounded-xl 
                  text-lg leading-6.75 font-medium text-white hover:bg-white hover:text-[#263859] capitalize"
            onClick={onConfirm}
          >
            {t("shared.yes", "Yes")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default SignOutDialog;
