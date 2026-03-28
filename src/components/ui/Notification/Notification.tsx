import { useCallback, useState } from 'react'
import classNames from 'classnames'
import CloseButton from '../CloseButton'
import StatusIcon from '../StatusIcon'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type { ReactNode, MouseEvent, Ref } from 'react'
import useTimeout from '@/utils/hooks/useTimeout'

export interface NotificationProps extends CommonProps {
    closable?: boolean
    customIcon?: ReactNode | string
    duration?: number
    onClose?: (e: MouseEvent<HTMLSpanElement>) => void
    ref?: Ref<HTMLDivElement>
    title?: string
    subtitle?: string
    triggerByToast?: boolean
    safarny?: boolean
    type?: TypeAttributes.Status
    width?: number | string
}

const Notification = (props: NotificationProps) => {
    const {
        className,
        children,
        closable = false,
        customIcon,
        duration = 3000,
        onClose,
        style,
        ref,
        title,
        subtitle,
        triggerByToast,
        safarny = false,
        type,
        width = 350,
        ...rest
    } = props

    const [display, setDisplay] = useState('show')

    const { clear } = useTimeout(onClose as () => void, duration, duration > 0)

    const handleClose = useCallback(
        (e: MouseEvent<HTMLSpanElement>) => {
            setDisplay('hiding')
            onClose?.(e)
            clear()
            if (!triggerByToast) {
                setTimeout(() => {
                    setDisplay('hide')
                }, 400)
            }
        },
        [onClose, clear, triggerByToast],
    )

    const notificationClass = classNames('notification', className)

    if (display === 'hide') {
        return null
    }

    return (
        <div
            ref={ref}
            {...rest}
            className={notificationClass}
            style={{ width: width, ...style }}
        >
            {safarny ? (
                <div className='flex flex-col items-center font-sans rtl:font-arabic
                    py-6.5 px-4 gap-5.5 w-101.75 bg-white border 
                    border-[#263859] shadow-[0_0_6.3px_rgba(38,56,89,0.24)] rounded-xl' 
                >
                  <svg className="mx-auto" width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M43.0963 17.8291C42.3221 17.02 41.5212 16.1863 41.2193 15.4531C40.94 14.7816 40.9236 13.6686 40.9071 12.5904C40.8763 10.5862 40.8435 8.31491 39.2643 6.73571C37.6851 5.15652 35.4138 5.12366 33.4096 5.09286C32.3314 5.07643 31.2184 5.06 30.5469 4.78071C29.8158 4.47884 28.98 3.67795 28.1709 2.90375C26.7539 1.54223 25.1439 0 23 0C20.8561 0 19.2481 1.54223 17.8291 2.90375C17.02 3.67795 16.1863 4.47884 15.4531 4.78071C14.7857 5.06 13.6686 5.07643 12.5904 5.09286C10.5862 5.12366 8.31491 5.15652 6.73571 6.73571C5.15652 8.31491 5.13393 10.5862 5.09286 12.5904C5.07643 13.6686 5.06 14.7816 4.78071 15.4531C4.47884 16.1842 3.67795 17.02 2.90375 17.8291C1.54223 19.2461 0 20.8561 0 23C0 25.1439 1.54223 26.7519 2.90375 28.1709C3.67795 28.98 4.47884 29.8138 4.78071 30.5469C5.06 31.2184 5.07643 32.3314 5.09286 33.4096C5.12366 35.4138 5.15652 37.6851 6.73571 39.2643C8.31491 40.8435 10.5862 40.8763 12.5904 40.9071C13.6686 40.9236 14.7816 40.94 15.4531 41.2193C16.1842 41.5212 17.02 42.3221 17.8291 43.0963C19.2461 44.4578 20.8561 46 23 46C25.1439 46 26.7519 44.4578 28.1709 43.0963C28.98 42.3221 29.8138 41.5212 30.5469 41.2193C31.2184 40.94 32.3314 40.9236 33.4096 40.9071C35.4138 40.8763 37.6851 40.8435 39.2643 39.2643C40.8435 37.6851 40.8763 35.4138 40.9071 33.4096C40.9236 32.3314 40.94 31.2184 41.2193 30.5469C41.5212 29.8158 42.3221 28.98 43.0963 28.1709C44.4578 26.7539 46 25.1439 46 23C46 20.8561 44.4578 19.2481 43.0963 17.8291ZM40.7244 25.8976C39.7407 26.9244 38.7221 27.9861 38.1821 29.2901C37.6646 30.5428 37.642 31.9741 37.6214 33.3603C37.6009 34.7978 37.5783 36.303 36.9396 36.9396C36.301 37.5763 34.806 37.6009 33.3603 37.6214C31.9741 37.642 30.5428 37.6646 29.2901 38.1821C27.9861 38.7221 26.9244 39.7407 25.8976 40.7244C24.8708 41.708 23.8214 42.7143 23 42.7143C22.1786 42.7143 21.121 41.7039 20.1024 40.7244C19.0838 39.7448 18.0139 38.7221 16.7099 38.1821C15.4572 37.6646 14.0259 37.642 12.6397 37.6214C11.2022 37.6009 9.69696 37.5783 9.06036 36.9396C8.42375 36.301 8.39911 34.806 8.37857 33.3603C8.35804 31.9741 8.33545 30.5428 7.81795 29.2901C7.27786 27.9861 6.25929 26.9244 5.27562 25.8976C4.29196 24.8708 3.28571 23.8214 3.28571 23C3.28571 22.1786 4.29607 21.121 5.27562 20.1024C6.25518 19.0838 7.27786 18.0139 7.81795 16.7099C8.33545 15.4572 8.35804 14.0259 8.37857 12.6397C8.39911 11.2022 8.4217 9.69696 9.06036 9.06036C9.69902 8.42375 11.194 8.39911 12.6397 8.37857C14.0259 8.35804 15.4572 8.33545 16.7099 7.81795C18.0139 7.27786 19.0756 6.25929 20.1024 5.27562C21.1292 4.29196 22.1786 3.28571 23 3.28571C23.8214 3.28571 24.879 4.29607 25.8976 5.27562C26.9162 6.25518 27.9861 7.27786 29.2901 7.81795C30.5428 8.33545 31.9741 8.35804 33.3603 8.37857C34.7978 8.39911 36.303 8.4217 36.9396 9.06036C37.5763 9.69902 37.6009 11.194 37.6214 12.6397C37.642 14.0259 37.6646 15.4572 38.1821 16.7099C38.7221 18.0139 39.7407 19.0756 40.7244 20.1024C41.708 21.1292 42.7143 22.1786 42.7143 23C42.7143 23.8214 41.7039 24.879 40.7244 25.8976ZM32.3766 16.9091C32.5294 17.0617 32.6505 17.2429 32.7332 17.4423C32.8159 17.6418 32.8584 17.8555 32.8584 18.0714C32.8584 18.2873 32.8159 18.5011 32.7332 18.7005C32.6505 18.9 32.5294 19.0812 32.3766 19.2338L20.8766 30.7338C20.724 30.8865 20.5428 31.0077 20.3434 31.0904C20.144 31.173 19.9302 31.2156 19.7143 31.2156C19.4984 31.2156 19.2846 31.173 19.0852 31.0904C18.8857 31.0077 18.7045 30.8865 18.552 30.7338L13.6234 25.8052C13.3151 25.4969 13.1419 25.0788 13.1419 24.6429C13.1419 24.2069 13.3151 23.7888 13.6234 23.4805C13.9317 23.1723 14.3498 22.9991 14.7857 22.9991C15.2217 22.9991 15.6398 23.1723 15.948 23.4805L19.7143 27.2488L30.052 16.9091C30.2045 16.7564 30.3857 16.6352 30.5852 16.5525C30.7846 16.4698 30.9984 16.4273 31.2143 16.4273C31.4302 16.4273 31.644 16.4698 31.8434 16.5525C32.0428 16.6352 32.224 16.7564 32.3766 16.9091Z" fill="#EF7722"/>
                  </svg>
                  {title && (
                    <h2 className='font-medium text-lg leading-6.75 text-center capitalize text-black'>
                        {title}
                    </h2>
                  )}
                  {subtitle && (
                    <h2 className='text-center font-normal text-lg leading-6.75 capitalize text-black'>
                        {subtitle}
                    </h2>
                  )}
                  {children && (
                    <p className='text-[12px] leading-4.5 text-center capitalize text-[#232323]'>
                        {children}
                    </p>
                  )}
                </div>
            ) : (
                <div
                    className={classNames(
                        'notification-content',
                        !children && 'no-child',
                    )}
                >
                    {type && !customIcon ? (
                        <div className="mr-3 mt-0.5">
                            <StatusIcon type={type} />
                        </div>
                    ) : null}
                    {customIcon && <div className="mr-3">{customIcon}</div>}
                    <div className="mr-4">
                        {title && (
                            <div
                                className={classNames(
                                    'notification-title',
                                    children ? 'mb-2' : '',
                                )}
                            >
                                {title}
                            </div>
                        )}
                        <div
                            className={classNames(
                                'notification-description',
                                !title && children ? 'mt-1' : '',
                            )}
                        >
                            {children}
                        </div>
                    </div>
                </div>
            )}
            {closable && !safarny && (
                <CloseButton
                    className="notification-close"
                    absolute={true}
                    onClick={handleClose}
                />
            )}
        </div>
    )
}

export default Notification
