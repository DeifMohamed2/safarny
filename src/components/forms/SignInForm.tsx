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
import type { ReactNode } from 'react'
import Button from '../ui/ButtonSafarny'
import { signInUserData } from '@/mock/data/authData'
import { useTranslation } from 'react-i18next'
import toast from '@/components/ui/toastSafarny'
import Notification from '@/components/ui/Notification'

interface SignInFormProps extends CommonProps {
    disableSubmit?: boolean
    passwordHint?: string | ReactNode
    setMessage?: (message: string) => void
    onSuccess?: () => void
    onSwitchToSignUp: () => void
    onForgetPassword: () => void
}

type SignInFormSchema = {
    email: string
    password: string
}

const validationSchema: ZodType<SignInFormSchema> = z.object({
    email: z
        .string({ required_error: 'auth.validation.emailRequired' })
        .email({ message: "auth.validation.emailInvalid" }),
    password: z
        .string({ required_error: 'auth.validation.passwordRequired' })
        .min(1, { message: 'auth.validation.passwordRequired' }),
})

const SignInForm = (props: SignInFormProps) => {
    const { t } = useTranslation();
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { disableSubmit = false, className, setMessage, passwordHint, onSuccess, onSwitchToSignUp, onForgetPassword } = props
    const defaultUser = signInUserData[0];

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<SignInFormSchema>({
        defaultValues: {
            email: defaultUser.email,
            password: defaultUser.password,
        },
        resolver: zodResolver(validationSchema),
    })
       
    const toastNotification = (
        <Notification 
            className='flex flex-col items-center
                gap-5.5 w-101.75! bg-white
                border border-[#263859] shadow-[0_0_6.3px_rgba(38,56,89,0.24)] rounded-xl' 
            safarny
            title={t("notification.signInFrom.title", "You're signed in successfully.")}
        >
            {t("notification.signInFrom.description", "Your booking request has been submitted, and our team will contact you shortly to complete the details.")}
        </Notification>
    )

    function openNotification() {
        toast.push(toastNotification, {
                placement: 'top-center',
            })
    }

    const { signIn } = useAuth()

    const onSignIn = async (values: SignInFormSchema) => {
        const { email, password } = values

        if (!disableSubmit) {
            setSubmitting(true)

            const result = await signIn({ email, password })
            console.log('result?.status : ', result);
            
            if (result?.status === 'failed') {
                setMessage?.(result.message)
            } else {
                if (onSuccess) {
                    onSuccess()
                    openNotification()
                }
            }
        }
        setSubmitting(false)

    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onSignIn)}>
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
                {passwordHint}
                <Button
                    onClick={onForgetPassword}
                    className="font-light text-[12px] leading-4.5 underline text-[#535353] border-0 px-0 pt-0 outline-0 hover:ring-0"
                    data-testid="link-forgot-password"
                >
                    {t("auth.forgotPassword", "Forgot Password?")}
                </Button>
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                    className='text-white w-full mt-4 sm:mt-8 md:mt-10'
                >
                    {t("shared.signIn","sign in")}
                </Button>
                <div className="w-full mt-6 text-center">
                    <p className="text-[14px] leading-5.25 font-light text-black">
                        {t("auth.haveAccount", "Don’t have an account?")}{" "}
                        <button
                            type="button"
                            onClick={onSwitchToSignUp}
                            className="underline font-medium cursor-pointer"
                        >
                            {t("auth.signUp", "Sign Up")}
                        </button>
                    </p>
                </div>
            </Form>
        </div>
    )
}

export default SignInForm
