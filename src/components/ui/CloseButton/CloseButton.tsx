import classNames from 'classnames'
import type { MouseEvent, ButtonHTMLAttributes, Ref } from 'react'
import type { CommonProps } from '@/@types/common'

export interface CloseButtonProps
    extends CommonProps,
        ButtonHTMLAttributes<HTMLButtonElement> {
    absolute?: boolean
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void
    ref?: Ref<HTMLButtonElement>
    resetDefaultClass?: boolean
}

const CloseButton = (props: CloseButtonProps) => {
    const { absolute, className, resetDefaultClass, ref, ...rest } = props
    const closeButtonAbsoluteClass = 'absolute z-10'

    const closeButtonClass = classNames(
        !resetDefaultClass && 'close-button button-press-feedback p-0',
        absolute && closeButtonAbsoluteClass,
        className,
    )

    return (
        <button ref={ref} className={closeButtonClass} type="button" {...rest}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.4" d="M24.285 3H11.715C6.255 3 3 6.255 3 11.715V24.27C3 29.745 6.255 33 11.715 33H24.27C29.73 33 32.985 29.745 32.985 24.285V11.715C33 6.255 29.745 3 24.285 3Z" fill="#263859"/>
                <path d="M19.59 18L23.04 14.55C23.475 14.115 23.475 13.395 23.04 12.96C22.605 12.525 21.885 12.525 21.45 12.96L18 16.41L14.55 12.96C14.115 12.525 13.395 12.525 12.96 12.96C12.525 13.395 12.525 14.115 12.96 14.55L16.41 18L12.96 21.45C12.525 21.885 12.525 22.605 12.96 23.04C13.185 23.265 13.47 23.37 13.755 23.37C14.04 23.37 14.325 23.265 14.55 23.04L18 19.59L21.45 23.04C21.675 23.265 21.96 23.37 22.245 23.37C22.53 23.37 22.815 23.265 23.04 23.04C23.475 22.605 23.475 21.885 23.04 21.45L19.59 18Z" fill="#263859"/>
            </svg>
        </button>
    )
}

export default CloseButton
