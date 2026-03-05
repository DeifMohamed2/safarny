import { useTranslation } from "react-i18next";
import Dialog from "../ui/Dialog";
import SignInForm from "../forms/SignInForm";
import { useState } from "react";
import ForgetPasswordForm from "../forms/ForgetPasswordForm";
import ForgetPasswordVerifyForm from "../forms/ForgetPasswordVerifyForm";
import ResetPasswordForm from "../forms/ResetPasswordForm";
import SignUpForm from "../forms/SignUpForm";
import Button from "../ui/ButtonSafarny";

type AuthView =
  | "accountExists"
  | "signin"
  | "signup"
  | "forgetpassword"
  | "forgetpasswordVerifaycode"
  | "resetpassword";

interface SignInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SignInDialog= ({
  isOpen,
  onClose,
  onConfirm,
}: SignInDialogProps) => {
  const { t } = useTranslation();
  const [authView, setAuthView] = useState<AuthView>("signin");

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setAuthView("signin");
    }, 1000);
  };

  const renderForm = () => {
    switch (authView) {
      case "signin":
        return (
          <>
            <h2 className="text-center text-3xl md:text-[34px] leading-12.75 font-semibold text-black capitalize pt-5">
              {t("shared.signIn","sign in")}
            </h2>
            <SignInForm
              className="w-full"
              onSuccess={onConfirm}
              onSwitchToSignUp={() => setAuthView("signup")}
              onForgetPassword={() => setAuthView("forgetpassword")}
            />
          </>
        );

      case "signup":
        return (
          <>
            <h2 className="text-center text-3xl md:text-[34px] leading-12.75 font-semibold text-black capitalize pt-5">
              {t("auth.signUp","sign up")}
            </h2>
            <SignUpForm
              className="w-full"
              onSuccess={onConfirm}
              onSwitchToSignIn={() => setAuthView("signin")}
            />
          </>
        );

      case "forgetpassword":
        return (
          <>
            <div className="w-full flex flex-col justify-center items-center">
              <h2 className="text-center text-3xl md:text-[34px] leading-12.75 font-semibold text-black capitalize pt-5">
                {t("auth.forgotPassword","forget your password ?")}
              </h2>
              <p className="w-full text-center text-sm leading-5.25 capitalize text-[#232323]">
                {t("auth.forgotPasswordSubtitle","Don’t worry! It happens. Please enter the email associated with your account.")}
              </p>
            </div>
            <ForgetPasswordForm
              className="w-full"
              onSuccess={()=>setAuthView("forgetpasswordVerifaycode")}
            />
          </>
        );

      case "forgetpasswordVerifaycode":
        return (
          <>
            <div className="w-full flex flex-col justify-center items-center">
              <h2 className="text-center text-3xl md:text-[34px] leading-12.75 font-semibold text-black capitalize pt-5">
                {t("auth.forgotPassword","forget your password ?")}
              </h2>
              <p className="w-full text-center text-sm leading-5.25 capitalize text-[#232323]">
                {t("auth.forgotPasswordVerify","Please check your email")}
              </p>
            </div>
            <ForgetPasswordVerifyForm
              className="w-full"
              onSuccess={()=>setAuthView("resetpassword")}
            />
          </>
        );

      case "resetpassword":
        return (
          <>
            <div className="w-full flex flex-col justify-center items-center">
              <h2 className="text-center text-3xl md:text-[34px] leading-12.75 font-semibold text-black capitalize pt-5">
                {t("auth.resetPassword","Reset Password")}
              </h2>
              <p className="w-full text-center text-sm leading-5.25 capitalize text-[#232323]">
                {t("auth.resetPasswordSubtitle","Type something you will remember")}
              </p>
            </div>
            <ResetPasswordForm
              className="w-full"
              onSuccess={handleClose}
            />
          </>
        );

      case "accountExists":
        return (
          <>
            <div className="w-full flex flex-col items-center gap-5.5">
              <div className="w-full flex flex-col justify-center items-center gap-3">
                <h2 className="w-full text-center font-medium text-lg leading-6.75 capitalize text-black">
                  {t("auth.accountExists","Account Already Exists")}
                </h2>
                <p className="w-full text-center text-sm leading-5.25 capitalize text-[#232323]">
                  {t("auth.resetPasswordSubtitle","Type something you will remember")}
                </p>
              </div>
              <div className="w-full flex items-center gap-8.5">
                <Button
                  onClick={handleClose}
                  variant="default"
                  className='flex-1 text-[#122445] border border-[#263859] font-medium text-lg leading-6.75 capitalize'
                >
                  {t("shared.cancel","Cancel")}
                </Button>
                <Button
                  onClick={()=>setAuthView("signin")}
                  variant="solid"
                  className='flex-1 text-white font-medium text-lg leading-6.75 capitalize'
                >
                  {t("shared.signIn","sign in")}
                </Button>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };
  
  return (
    <Dialog closable={authView != 'accountExists'} overlayClassName='bg-transparent! flex justify-center items-center' isOpen={isOpen} onClose={handleClose} onRequestClose={handleClose} style={{ content: { marginTop: 0, }, }}>
      <div className="w-full flex flex-col items-center gap-5.5 p-5.5">
        {renderForm()}
      </div>
    </Dialog>
  );
};

export default SignInDialog;
