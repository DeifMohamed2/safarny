import { useState } from 'react'
import { FormItem, Form } from '@/components/ui/FormSafarny'
import PasswordInput from '@/components/shared/PasswordInput'
import classNames from '@/utils/classNames'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import Button from '../ui/ButtonSafarny'
import { useTranslation } from 'react-i18next'

interface ResetPasswordFormProps extends CommonProps {
    disableSubmit?: boolean
    onSuccess?: () => void
}

type ResetPasswordFormSchema = {
    password: string
    confirmPassword: string
}

const validationSchema: ZodType<ResetPasswordFormSchema> = z.object({
    password: z
      .string({ message: "auth.validation.passwordRequired" })
      .min(1, "auth.validation.passwordRequired"),

    confirmPassword: z
      .string({ message: "auth.validation.passwordRequired" })
      .min(1, "auth.validation.passwordRequired")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.validation.passwordsNotMatch",
    path: ["confirmPassword"],
  });

const ResetPasswordForm = (props: ResetPasswordFormProps) => {
    const { t } = useTranslation();
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { disableSubmit = false, className, onSuccess } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ResetPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
    })


    const onResetPassword = async (values: ResetPasswordFormSchema) => {

        if (!disableSubmit) {
            console.log("values: ", values);
        
            setSubmitting(true)
            if (onSuccess) {
                onSuccess()
            }
        }
        setSubmitting(false)

    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onResetPassword)}>
                <FormItem
                    label={t("auth.newPassword", "New Password")}
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                    className={classNames(
                        errors.password?.message ? 'mb-6' : 'mb-3',
                    )}
                >
                    <Controller
                        name="password"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <PasswordInput
                                type="text"
                                placeholder={t("auth.newPassword", "New Password")}
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label={t("auth.confirmPassword", "Confirm New Password")}
                    invalid={Boolean(errors.confirmPassword)}
                    errorMessage={errors.confirmPassword?.message}
                    className={classNames(
                        errors.confirmPassword?.message ? 'mb-6' : 'mb-0',
                    )}
                >
                    <Controller
                        name="confirmPassword"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <PasswordInput
                                type="text"
                                placeholder={t("auth.confirmPassword", "Confirm New Password")}
                                autoComplete="off"
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
                    {t("shared.signIn","sign in")}
                </Button>
            </Form>
        </div>
    )
}

export default ResetPasswordForm
