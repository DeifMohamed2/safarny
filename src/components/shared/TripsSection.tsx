import type { PropsWithChildren, ReactNode } from 'react';
// import { useTranslation } from 'react-i18next'

interface TripsSectionProps extends PropsWithChildren {
  title: ReactNode
  description?: ReactNode
  actionText?: ReactNode
}

const TripsSection = ({
  children,
  title,
  description,
  actionText,
}: TripsSectionProps) => {
  // const { t } = useTranslation();

  return (<>
    <div className="max-w-340 w-full px-4 flex flex-col items-center gap-7 pt-15 mx-auto">
      <div className="w-full flex justify-between items-end gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex flex-col items-start gap-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold capitalize">
            {title}
          </h2>
          <p className="text-sky-950 tetx-sm sm:text-base lg:text-xl font-normal capitalize">
            {description}
          </p>
        </div>
        <div className="text-sky-950 text-sm sm:text-base lg:text-xl font-normal underline capitalize">{actionText}</div>
      </div>

      {children}
    </div>
  </>)
}

export default TripsSection
