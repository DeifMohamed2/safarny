import { useState } from 'react'
import Input from '@/components/ui/InputSafarny'
import { FormItem, Form } from '@/components/ui/FormSafarny'
import PasswordInput from '@/components/shared/PasswordInput'
import classNames from '@/utils/classNames'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import Button from '../ui/ButtonSafarny'
import { useTranslation } from 'react-i18next'
import { isValidPhoneNumber } from "react-phone-number-input"
import { PhoneInput } from "@/components/ui/phoneNumber"
import Checkbox from '../ui/Checkbox'
import { Link } from 'react-router-dom'

interface SignUpFormProps extends CommonProps {
    disableSubmit?: boolean
    onSuccess?: () => void
    onSwitchToSignIn: () => void
}

type SignUpFormSchema = {
    fullName: string
    email: string
    phone: string
    password: string
    subscribe: boolean
}

const validationSchema: ZodType<SignUpFormSchema> = z.object({
    fullName: z
        .string({ required_error: 'auth.validation.fullNameRequired' })
        .min(1, { message: 'auth.validation.fullNameRequired' }),
    email: z
        .string({ required_error: 'auth.validation.emailRequired' })
        .email({ message: "auth.validation.emailInvalid" }),
    phone: z
        .string({ required_error: 'contactUs.errors.phone' })
        .refine((value) => isValidPhoneNumber(value), {
            message: "contactUs.errors.phone",
        }),
    password: z
        .string({ required_error: 'auth.validation.passwordRequired' })
        .min(1, { message: 'auth.validation.passwordRequired' }),
    subscribe: z.boolean(),
})

const SignUpForm = (props: SignUpFormProps) => {
    const { t } = useTranslation();
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { disableSubmit = false, className, onSuccess, onSwitchToSignIn } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<SignUpFormSchema>({
        defaultValues: {
            subscribe: false,
        },
        resolver: zodResolver(validationSchema),
    })

    const { signUp } = useAuth()

    const onSignIn = async (values: SignUpFormSchema) => {
        const { fullName, phone, email, password } = values

        if (!disableSubmit) {
            setSubmitting(true)

            const result = await signUp({ userName: fullName, phone, email, password })
            console.log('result?.status : ', result);
            if (onSuccess) {
                onSuccess()
            }
        }
        setSubmitting(false)
    }

    return (
        <div className={className}>
            <div className='w-full flex flex-col items-center gap-3.5 pb-4'>
                <div className='w-full flex flex-col items-center gap-3.5'>
                    <div className='flex items-center gap-5.5'>
                        <Button
                            className='flex-1 h-11 px-21 bg-[#F6F6F6] rounded-lg'
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21.1663 8.18242C21.0271 8.29043 18.5692 9.67537 18.5692 12.7549C18.5692 16.3168 21.6967 17.577 21.7904 17.6082C21.7759 17.685 21.2935 19.3339 20.1414 21.0141C19.1141 22.4926 18.0412 23.9688 16.409 23.9688C14.7769 23.9688 14.3568 23.0207 12.4726 23.0207C10.6364 23.0207 9.98357 24 8.49062 24C6.99767 24 5.95597 22.6319 4.75825 20.9517C3.37091 18.9787 2.25 15.9136 2.25 13.0045C2.25 8.33843 5.2839 5.86379 8.2698 5.86379C9.85636 5.86379 11.1789 6.90549 12.175 6.90549C13.1231 6.90549 14.6016 5.80138 16.4066 5.80138C17.0907 5.80138 19.5485 5.86379 21.1663 8.18242ZM15.5497 3.82598C16.2962 2.94029 16.8243 1.71137 16.8243 0.482448C16.8243 0.312031 16.8099 0.139214 16.7787 0C15.5641 0.0456046 14.1192 0.808881 13.2479 1.81938C12.5638 2.59706 11.9254 3.82598 11.9254 5.07171C11.9254 5.25893 11.9566 5.44614 11.971 5.50615C12.0478 5.52055 12.1726 5.53735 12.2974 5.53735C13.3871 5.53735 14.7576 4.80768 15.5497 3.82598Z" fill="#0A0B0C"/>
                            </svg>
                        </Button>
                        <Button
                            className='flex-1 h-11 px-21 bg-[#F6F6F6] rounded-lg'
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_5253_10954)">
                                    <g clip-path="url(#clip1_5253_10954)">
                                        <path d="M23.8154 12.2244C23.8154 11.2412 23.7356 10.5236 23.5629 9.77954H12.335V14.2175H18.9255C18.7927 15.3204 18.0752 16.9813 16.4806 18.0974L16.4583 18.246L20.0084 20.9962L20.2543 21.0207C22.5132 18.9346 23.8154 15.8652 23.8154 12.2244Z" fill="#4285F4"/>
                                        <path d="M12.3351 23.9177C15.5639 23.9177 18.2746 22.8546 20.2545 21.021L16.4808 18.0976C15.471 18.8019 14.1156 19.2935 12.3351 19.2935C9.17267 19.2935 6.48859 17.2074 5.53179 14.324L5.39154 14.3359L1.7001 17.1927L1.65182 17.3269C3.61837 21.2335 7.65782 23.9177 12.3351 23.9177Z" fill="#34A853"/>
                                        <path d="M5.5317 14.324C5.27924 13.58 5.13314 12.7826 5.13314 11.9589C5.13314 11.135 5.27924 10.3378 5.51842 9.59366L5.51173 9.43519L1.77405 6.53247L1.65176 6.59064C0.841259 8.21174 0.37619 10.0322 0.37619 11.9589C0.37619 13.8855 0.841259 15.7059 1.65176 17.327L5.5317 14.324Z" fill="#FBBC05"/>
                                        <path d="M12.335 4.62403C14.5806 4.62403 16.0953 5.59402 16.9591 6.40461L20.3341 3.10928C18.2613 1.1826 15.5639 0 12.335 0C7.65778 0 3.61836 2.68406 1.65182 6.59057L5.51848 9.59359C6.48856 6.7102 9.17262 4.62403 12.335 4.62403Z" fill="#EB4335"/>
                                    </g>
                                </g>
                                <defs>
                                    <clipPath id="clip0_5253_10954">
                                        <rect width="24" height="24" fill="white"/>
                                    </clipPath>
                                    <clipPath id="clip1_5253_10954">
                                        <rect width="23.4528" height="24" fill="white" transform="translate(0.375)"/>
                                    </clipPath>
                                </defs>
                            </svg>
                        </Button>
                    </div>
                    <Button
                        variant='default'
                        className='w-full font-medium text-lg leading-6.75 capitalize text-[#122445] border border-[#263859] rounded-xl'
                    >
                        {t("auth.continueSignIn", "continue with signal sign in")}
                    </Button>
                </div>
                <div className='flex justify-center items-center px-35.5 pb-1 gap-2.5 w-77.5 border-b border-[#D4D7DE]'>
                    <p className='font-medium text-[22px] leading-8.25 capitalize text-black'>
                        {t("auth.or", "Or")}
                    </p>
                </div>
            </div>
            <Form onSubmit={handleSubmit(onSignIn)}>
                <div className='max-h-[28vh] overflow-y-auto pe-2 pb-2 mb-2'>
                    <FormItem
                        label={t("auth.fullName", "Full Name")}
                        invalid={Boolean(errors.fullName)}
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
                        invalid={Boolean(errors.email)}
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
                        label={t("contactUs.phoneNumber", "Phone Number")}
                        invalid={Boolean(errors.phone)}
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
                    <FormItem
                        label={t("auth.password", "Password")}
                        invalid={Boolean(errors.password)}
                        errorMessage={errors.password?.message}
                        className={classNames(
                            errors.password?.message ? 'mb-4' : 'mb-0',
                        )}
                    >
                        <Controller
                            name="password"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <PasswordInput
                                    type="text"
                                    placeholder={t("auth.password", "Password")}
                                    autoComplete="off"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>
                <FormItem
                    invalid={Boolean(errors.subscribe)}
                    errorMessage={errors.subscribe?.message && t(errors.subscribe.message)}
                    className='mb-2'
                >
                    <Controller
                        name="subscribe"
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                            <Checkbox defaultChecked onChange={field.onChange} checked={field.value}>
                                {t(
                                    "auth.subscribeMarketing",
                                    "I want to receive information, offers, recommendations, and updates from Safarni."
                                )}
                            </Checkbox>
                        )}
                    />
                </FormItem>
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                    className='text-white w-full'
                >
                    {t("auth.confirm", "Confirm")}
                </Button>
                <div className="w-full mt-2 text-center">
                    <p className="text-[14px] leading-5.25 font-light text-black">
                        {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
                        <button
                            type="button"
                            onClick={onSwitchToSignIn}
                            className="underline font-medium cursor-pointer"
                        >
                            {t("shared.signIn","sign in")}
                        </button>
                    </p>
                </div>
                <div className="w-full mt-4">
                    <p className="text-[12px] leading-4.5 font-light text-[#535353]">
                        {t("auth.acceptTermsPrefix", "By signing up, you accept our")}{" "}
                        <Link
                            to="/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium"
                        >
                            {t("auth.termsAndConditions", "Terms and Conditions")}
                        </Link>.
                    </p>

                    <p className="text-[12px] leading-4.5 font-light text-[#535353] mt-1">
                        {t("auth.privacyPrefix", "Please read our")}{" "}
                        <Link
                            to="/privacy-notice"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium"
                        >
                            {t("auth.privacyNotice", "Privacy Notice")}
                        </Link>.
                    </p>
                </div>
            </Form>
        </div>
    )
}

export default SignUpForm
