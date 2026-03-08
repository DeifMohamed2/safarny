import { useState } from 'react'
import { FormItem, Form } from '@/components/ui/FormSafarny'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import Button from '../ui/ButtonSafarny'
import { useTranslation } from 'react-i18next'
import OTPInput from '../shared/OtpInput'

interface ForgetPasswordVerifyFormProps extends CommonProps {
    disableSubmit?: boolean
    setMessage?: (message: string) => void
    onSuccess?: () => void
}


type ForgotPasswordFormSchema = {
    otp: string
}

const OTP_LENGTH = 4

const validationSchema: ZodType<ForgotPasswordFormSchema> = z.object({
    otp: z
    .string({ required_error: 'auth.validation.OTPRequired' })
    .min(OTP_LENGTH, { message: 'auth.validation.OTPRequired' }),
})

// const otpVerificationNotification = (
//     <Notification 
//         className='flex flex-col items-center
//             gap-5.5 w-101.75! bg-white
//             border border-[#263859] shadow-[0_0_6.3px_rgba(38,56,89,0.24)] rounded-xl' 
//         safarny
//         title="Code verified successfully!"
//     >
//         You can now proceed to reset your password.
//     </Notification>
// )

// function openOTPNotification() {
//     toast.push(otpVerificationNotification, {
//         placement: 'top-center',
//     })
// }

const ForgetPasswordVerifyForm = (props: ForgetPasswordVerifyFormProps) => {
    const { t } = useTranslation();
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { disableSubmit = false, className, onSuccess } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ForgotPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
    })


    const onOtpSend = async (values: ForgotPasswordFormSchema) => {

        if (!disableSubmit) {
            setSubmitting(true)
            console.log('result?.status : ', values);
            if (onSuccess) {
                onSuccess()
                // openOTPNotification()
            }
        }
        setSubmitting(false)

    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onOtpSend)}>
                <FormItem
                    invalid={Boolean(errors.otp)}
                    errorMessage={errors.otp?.message}
                    className='w-fit mx-auto'
                >
                    <Controller
                        name="otp"
                        control={control}
                        render={({ field }) => (
                            <OTPInput
                                placeholder=""
                                inputClass="h-[58px]"
                                length={OTP_LENGTH}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                    className='text-white w-full mt-4 sm:mt-8 md:mt-10'
                >
                    {t("auth.verify","Verify")}
                </Button>
                <div className="flex items-center justify-center gap-1.25 mt-6">
                    <button
                        type="button"
                        className="text-base leading-6 font-semibold capitalize text-black/70 hover:text-black transition cursor-pointer"
                    >
                        {t("auth.sendCodeAgain", "Send code again")}
                    </button>

                    <span className="text-base leading-6 font-normal text-black/70">
                        00:20
                    </span>
                </div>
            </Form>
        </div>
    )
}

export default ForgetPasswordVerifyForm
