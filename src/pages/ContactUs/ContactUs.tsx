import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { isValidPhoneNumber } from "react-phone-number-input"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PhoneInput } from "@/components/ui/phoneNumber"
import { useTranslation } from "react-i18next"

const contactSchema = z.object({
  fullName: z
    .string()
    .min(2, "contactUs.errors.fullname"),
  email: z
    .string()
    .email("contactUs.errors.email"),
  phone: z
    .string()
    .refine((value) => isValidPhoneNumber(value), {
      message: "contactUs.errors.phone",
    }),
  message: z
    .string()
    .min(10, "contactUs.errors.message"),
})

type ContactFormValues = z.infer<typeof contactSchema>

const ContactUs = () => {
  const { t } = useTranslation()

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      message: "",
    },
  })

  function onSubmit(values: ContactFormValues) {
    console.log(values)
  }

  return (
    <div className="relative min-h-dvh sm:h-full max-w-340 w-full px-4 pt-32.5 mx-auto">
      <div className="flex flex-col gap-10 sm:gap-20 lg:gap-32.5">

        {/* Heading */}
        <h1 className="max-w-275 font-bold text-[30px] leading-10 
                       sm:text-[40px] sm:leading-15 
                       md:text-[60px] md:leading-20 
                       lg:text-[90px] lg:leading-25 
                       text-black">
          {t("contactUs.title", "Get in touch with us. We're here to assist you.")}
        </h1>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-12 pb-10 sm:pb-25"
          >
            {/* First Row */}
            <div className="flex flex-col lg:flex-row gap-6">

              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="w-full lg:max-w-103">
                    <FormLabel className="text-lg font-medium text-[#333]">
                      {t("contactUs.fullName", "Full Name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-11.25 bg-[#F6F6F6] border-[#D4D7DE] 
                                   rounded-md px-3 text-[14px]"
                        placeholder="Ahmed Ali"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full lg:max-w-103">
                    <FormLabel className="text-lg font-medium text-[#333]">
                      {t("contactUs.email", "Email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className="h-11.25 bg-[#F6F6F6] border-[#D4D7DE] 
                                   rounded-md px-3 text-[14px]"
                        placeholder="info@gmail.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="w-full lg:max-w-103">
                    <FormLabel className="text-lg font-medium text-[#333]">
                      {t("contactUs.phoneNumber", "Phone Number")}
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        defaultCountry="GB"
                        placeholder={t("contactUs.phoneNumberPlaceholder", "Enter phone number")}
                        className="h-11.25 bg-[#F6F6F6] border-[#D4D7DE]
                                  rounded-md text-[14px]"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-[#333]">
                    {t("contactUs.message", "Message")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="h-23.25 bg-[#F6F6F6] border-[#D4D7DE] 
                                 rounded-md px-3 text-[14px] resize-none"
                      placeholder={t("contactUs.messagePlaceholder", "Write your message...")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Button */}
            <Button
              type="submit"
              className="w-full sm:w-70.5 h-12.75 rounded-xl 
                         bg-[#263859] hover:bg-[#1f2c45] 
                         text-white text-lg font-medium"
            >
              {t("contactUs.submit", "Leave Us A Message")}
            </Button>

          </form>
        </Form>
      </div>
    </div>
  )
}

export default ContactUs
