import { useState } from 'react'
import Input from '@/components/ui/InputSafarny'
import { FormItem, Form } from '@/components/ui/FormSafarny'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import type { ReactNode } from 'react'
import Button from '../ui/ButtonSafarny'
import { signInUserData } from '@/mock/data/authData'
import { useTranslation } from 'react-i18next'

interface ForgetPasswordFormProps extends CommonProps {
    disableSubmit?: boolean
    passwordHint?: string | ReactNode
    setMessage?: (message: string) => void
    onSuccess?: () => void
}

type ForgetPasswordFormSchema = {
    email: string
}

const validationSchema: ZodType<ForgetPasswordFormSchema> = z.object({
    email: z
        .string({ required_error: 'auth.validation.emailRequired' })
        .email({ message: "auth.validation.emailInvalid" }),
})

const ForgetPasswordForm = (props: ForgetPasswordFormProps) => {
    const { t } = useTranslation();
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { disableSubmit = false, className, passwordHint, onSuccess } = props
    const defaultUser = signInUserData[0];

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ForgetPasswordFormSchema>({
        defaultValues: {
            email: defaultUser.email,
        },
        resolver: zodResolver(validationSchema),
    })


    const onSignIn = async (values: ForgetPasswordFormSchema) => {

        if (!disableSubmit) {
            setSubmitting(true)
            console.log('result?.status : ', values);
            if (onSuccess) {
                onSuccess()
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
                {passwordHint}
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                    className='text-white w-full mt-4 sm:mt-8 md:mt-10'
                >
                    {t("auth.send","Send")}
                </Button>
            </Form>
        </div>
    )
}

export default ForgetPasswordForm
