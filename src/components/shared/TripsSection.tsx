import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom';

interface TripsSectionProps extends PropsWithChildren {
  title1?: string
  title2?: string
  title3?: string
  description?: string
  actionText?: string
  actionLink?: string
}

const TripsSection = ({
  children,
  title1,
  title2,
  title3,
  description,
  actionText,
  actionLink
}: TripsSectionProps) => {
  const { t } = useTranslation();

  return (<>
    <div className="max-w-340 w-full px-4 flex flex-col items-center gap-7 pt-15 mx-auto">
      <div className="w-full flex justify-between items-end gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex flex-col items-start gap-2">
          {[title1, title2, title3].some(Boolean) && (
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold capitalize">
              {title1 && (
                <span className="text-sky-950">{t(title1)} </span>
              )}
              {title2 && (
                <span className="text-orange-500">{t(title2)}</span>
              )}
              {title3 && (
                <span className="text-sky-950"> {t(title3)}</span>
              )}
            </h2>
          )}
          {description && (
            <p className="text-sky-950 tetx-sm sm:text-base lg:text-xl font-normal capitalize">
              {t(description)}
            </p>
          )}
        </div>
        {actionText && actionLink && (
          <Link to={actionLink} className="text-sky-950 text-sm sm:text-base lg:text-xl font-normal underline capitalize">
            {t(actionText)}
          </Link>
        )}
      </div>

      {children}
    </div>
  </>)
}

export default TripsSection
