import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";

interface SignOutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SignOutDialog= ({
  onClose,
  onConfirm,
}: SignOutDialogProps) => {
  const { t } = useTranslation();
  
  return (<>
    {/* // <Dialog overlayClassName='bg-transparent!' isOpen={isOpen} onClose={onClose} onRequestClose={onClose}> */}
      <p className="text-xl font-normal mt-6 pb-4">
        {t("shared.confirmSignOut", "Are you sure you want to Sign Out?")}
      </p>

      <div className="flex justify-between mt-6">
        <Button
          className="px-4 py-3 bg-white rounded-xl outline -outline-offset-1 outline-[#D4AF7A]"
          variant="default"
          onClick={onClose}
        >
          {t("shared.cancel", "Cancel")}
        </Button>

        <Button
          className="px-9 py-3 rounded-xl!"
          title={t("shared.confirm", "Confirm")}
          onClick={onConfirm}
        />
      </div>
      {/* </Dialog> */}
    </>
  );
};

export default SignOutDialog;
