import { useState } from "react";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { FormItem, Form } from "@/components/ui/FormSafarny";
import Input from "@/components/ui/InputSafarny";
import { PhoneInput } from "@/components/ui/phoneNumber";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ZodType } from 'zod';
import { isValidPhoneNumber } from "react-phone-number-input";
import { Button } from "../ui/button";
import Dialog from "../ui/Dialog";
import toast from "@/components/ui/toastSafarny";
import Notification from "@/components/ui/Notification";
import userImage from "@assets/profile/user.png";
import { useSessionUser } from "@/store/authStore";

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (values: EditProfileValues) => void;
}

type EditProfileValues = {
  avatar?: string;
  fullName: string;
  email: string;
  phone: string;
};

const EditProfileDialog= ({
  isOpen,
  onClose,
  onConfirm,
}: EditProfileDialogProps) => {
  const { t } = useTranslation();
  const { user } = useSessionUser();
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar || userImage);

  const editSchema: ZodType<EditProfileValues> = z.object({
    fullName: z.string().min(1, { message: t("auth.validation.fullNameRequired") }),
    email: z.string().email({ message: t("auth.validation.emailInvalid") }),
    phone: z.string().refine((val) => isValidPhoneNumber(val), { message: t("auth.validation.phoneInvalid") }),
    avatar: z.string().optional(),
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditProfileValues>({
    defaultValues: {
      avatar: user.avatar || '',
      fullName: user.userName || '',
      email: user.email || '',
      phone: (user as any).phone || '',
    },
    resolver: zodResolver(editSchema),
  });

  const profileNotification = (
    <Notification 
      className='flex flex-col items-center
          gap-5.5 w-101.75! bg-white
          border border-[#263859] shadow-[0_0_6.3px_rgba(38,56,89,0.24)] rounded-xl' 
      safarny
      subtitle={t("notification.bookingDialog.subtitle", "Your account information has been updated successfully.")}
    />
  )

  function openProfileNotification() {
    toast.push(profileNotification, {
      placement: 'top-center',
    })
  }

  const onSubmit = (values: EditProfileValues) => {
    onConfirm({
      ...values,
      avatar: avatarPreview,
    });
    openProfileNotification();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog overlayClassName='bg-transparent! flex justify-center items-center' isOpen={isOpen} onClose={onClose} onRequestClose={onClose} style={{ content: { marginTop: 0, }, }}>
      <div className="w-full flex flex-col items-center gap-5.5 p-5.5">
        <h2 className="w-full text-center text-3xl md:text-[34px] leading-12.75 font-semibold text-black capitalize border-b border-[#E8E8E8] m-0 pt-5">
          {t("profile.edit","edit profile")}
        </h2>

        <Form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <div className='max-h-[55vh] overflow-y-auto pe-2 pb-2 mb-2'>
            {/* avatar section */}
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-full flex justify-between p-3.5 gap-4 bg-[#AAC4F5] rounded-[22px]">
                <div className="w-30 h-30">
                  <img
                    src={avatarPreview || '/default-avatar.png'}
                    alt="avatar"
                    className="w-30 h-30 rounded-full border-4 border-white object-cover"
                  />
                </div>
                <label
                  className="relative mt-2 w-30 h-12 flex items-center justify-center bg-white hover:bg-[#263859] border border-[#263859] rounded-xl text-lg font-medium text-[#122445] hover:text-white cursor-pointer"
                >
                  {t("profile.upload", "Upload")}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Upload avatar"
                  />
                </label>
              </div>
            </div>

            {/* inputs */}
            <div className="w-full flex flex-col mt-6">
              <FormItem 
                label={t("auth.fullName", "Full Name")} 
                invalid={!!errors.fullName} 
                errorMessage={errors.fullName?.message}
              >
                <Controller
                  name="fullName"
                  control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            placeholder={t("auth.fullName", "Full Name")}
                            autoComplete="off"
                            {...field}
                        />
                    )}
                />
              </FormItem>

              <FormItem 
                label={t("auth.email", "Email")} 
                invalid={!!errors.email} 
                errorMessage={errors.email?.message}
              >
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <Input
                            type="text"
                            placeholder={t("auth.email", "Email")}
                            autoComplete="off"
                            {...field}
                        />
                    )}
                />
              </FormItem>

              <FormItem 
                label={t("profile.phoneNumber","Phone Number")} 
                invalid={!!errors.phone} 
                errorMessage={errors.phone?.message}
              >
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      {...field}
                      defaultCountry="GB"
                      placeholder={t("contactUs.phoneNumberPlaceholder", "Enter phone number")}
                      className="h-11.25 bg-[#F6F6F6] border-[#D4D7DE]
                                  rounded-md text-[14px]"
                    />
                  )}
                />
              </FormItem>
            </div>
          </div>
          <div className="flex justify-between gap-4 mt-4">
            <Button 
              variant="secondary" 
              onClick={onClose} 
              type="button"
              className="flex-1 flex justify-center items-center px-3.5 py-3 gap-2.5 bg-white hover:bg-[#263859] border border-[#263859] rounded-xl text-lg leading-6.75 font-medium capitalize text-[#122445] hover:text-white"
            >
              {t("shared.cancel", "Cancel")}
            </Button>
            <Button 
              type="submit" 
              className="flex-1 flex justify-center items-center px-3.5 py-3 gap-2.5 bg-[#263859] hover:bg-white text-white hover:text-[#263859] border border-[#263859] rounded-xl text-lg leading-6.75 font-medium capitalize"
            >
              {t("shared.saveChanges", "save changes")}
            </Button>
          </div>
        </Form>
      </div>
    </Dialog>
  );
};

export default EditProfileDialog;
