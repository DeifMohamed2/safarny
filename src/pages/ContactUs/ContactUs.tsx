import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
// import { useTranslation } from "react-i18next"

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

const contactSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters"),
  email: z
    .string()
    .email("Invalid email address"),
  phone: z
    .string()
    .refine((value) => isValidPhoneNumber(value), {
      message: "Invalid phone number",
    }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters"),
})

type ContactFormValues = z.infer<typeof contactSchema>

const ContactUs = () => {
  // const { i18n } = useTranslation()

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
          Get in touch with us. We're here to assist you.
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
                    <FormLabel className="text-[18px] font-medium text-[#333]">
                      Full Name
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
                    <FormLabel className="text-[18px] font-medium text-[#333]">
                      Email
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
                    <FormLabel className="text-[18px] font-medium text-[#333]">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        defaultCountry="GB"
                        placeholder="Enter phone number"
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
                  <FormLabel className="text-[18px] font-medium text-[#333]">
                    Message
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="h-23.25 bg-[#F6F6F6] border-[#D4D7DE] 
                                 rounded-md px-3 text-[14px] resize-none"
                      placeholder="Write your message..."
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
                         text-white text-[18px] font-medium"
            >
              Leave Us A Message
            </Button>

          </form>
        </Form>
      </div>
    </div>
  )
}

export default ContactUs
