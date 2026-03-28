import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { Input } from '../InputSafarny'
import useMergedRef from '@/utils/hooks/useMergeRef'
// import { HiOutlineCalendar } from 'react-icons/hi'
import CloseButton from '../CloseButton'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type {
    ReactNode,
    FocusEvent,
    HTMLInputTypeAttribute,
    KeyboardEvent,
    MouseEvent,
    ChangeEvent,
    Ref,
} from 'react'
import {
    useFloating,
    useInteractions,
    useDismiss,
    useRole,
    useFocus,
    useClick,
    useId,
    autoUpdate,
    offset,
    flip,
    shift,
} from '@floating-ui/react'

dayjs.extend(localizedFormat)

export interface BasePickerSharedProps {
    clearable?: boolean
    clearButton?: string | ReactNode
    disabled?: boolean
    inputtable?: boolean
    inputPrefix?: string | ReactNode
    inputSuffix?: string | ReactNode
    name?: string
    onBlur?: (event: FocusEvent<HTMLInputElement, Element>) => void
    onDropdownOpen?: () => void
    onDropdownClose?: () => void
    onFocus?: (event: FocusEvent<HTMLInputElement, Element>) => void
    placeholder?: string
    size?: TypeAttributes.ControlSize
    type?: HTMLInputTypeAttribute
}

interface BasePickerProps extends CommonProps, BasePickerSharedProps {
    dropdownOpened: boolean
    inputtableBlurClose?: boolean
    inputLabel?: string
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
    onClear?: (event: MouseEvent<HTMLElement>) => void
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void
    setDropdownOpened: (opened: boolean) => void
    ref?: Ref<HTMLInputElement>
}

const BasePicker = (props: BasePickerProps) => {
    const {
        className,
        clearable = true,
        clearButton,
        children,
        disabled,
        dropdownOpened,
        inputtable,
        inputtableBlurClose = false,
        inputLabel,
        inputPrefix,
        // inputSuffix = <HiOutlineCalendar className="text-lg" />,
        inputSuffix = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 9.0625C9.75136 9.0625 9.5129 9.16127 9.33709 9.33709C9.16127 9.5129 9.0625 9.75136 9.0625 10V10.0125C9.0625 10.53 9.4825 10.95 10 10.95H10.0125C10.2611 10.95 10.4996 10.8512 10.6754 10.6754C10.8512 10.4996 10.95 10.2611 10.95 10.0125V10C10.95 9.75136 10.8512 9.5129 10.6754 9.33709C10.4996 9.16127 10.2611 9.0625 10.0125 9.0625H10ZM5 14.0625C4.75136 14.0625 4.5129 14.1613 4.33709 14.3371C4.16127 14.5129 4.0625 14.7514 4.0625 15V15.0125C4.0625 15.53 4.4825 15.95 5 15.95H5.0125C5.26114 15.95 5.4996 15.8512 5.67541 15.6754C5.85123 15.4996 5.95 15.2611 5.95 15.0125V15C5.95 14.7514 5.85123 14.5129 5.67541 14.3371C5.4996 14.1613 5.26114 14.0625 5.0125 14.0625H5ZM7.5 14.0625C7.25136 14.0625 7.0129 14.1613 6.83709 14.3371C6.66127 14.5129 6.5625 14.7514 6.5625 15V15.0125C6.5625 15.53 6.9825 15.95 7.5 15.95H7.5125C7.76114 15.95 7.9996 15.8512 8.17541 15.6754C8.35123 15.4996 8.45 15.2611 8.45 15.0125V15C8.45 14.7514 8.35123 14.5129 8.17541 14.3371C7.9996 14.1613 7.76114 14.0625 7.5125 14.0625H7.5ZM9.0625 15C9.0625 14.7514 9.16127 14.5129 9.33709 14.3371C9.5129 14.1613 9.75136 14.0625 10 14.0625H10.0125C10.2611 14.0625 10.4996 14.1613 10.6754 14.3371C10.8512 14.5129 10.95 14.7514 10.95 15V15.0125C10.95 15.2611 10.8512 15.4996 10.6754 15.6754C10.4996 15.8512 10.2611 15.95 10.0125 15.95H10C9.75136 15.95 9.5129 15.8512 9.33709 15.6754C9.16127 15.4996 9.0625 15.2611 9.0625 15.0125V15ZM12.5 11.5625C12.2514 11.5625 12.0129 11.6613 11.8371 11.8371C11.6613 12.0129 11.5625 12.2514 11.5625 12.5V12.5125C11.5625 13.03 11.9825 13.45 12.5 13.45H12.5125C12.7611 13.45 12.9996 13.3512 13.1754 13.1754C13.3512 12.9996 13.45 12.7611 13.45 12.5125V12.5C13.45 12.2514 13.3512 12.0129 13.1754 11.8371C12.9996 11.6613 12.7611 11.5625 12.5125 11.5625H12.5ZM12.5 14.0625C12.2514 14.0625 12.0129 14.1613 11.8371 14.3371C11.6613 14.5129 11.5625 14.7514 11.5625 15V15.0125C11.5625 15.53 11.9825 15.95 12.5 15.95H12.5125C12.7611 15.95 12.9996 15.8512 13.1754 15.6754C13.3512 15.4996 13.45 15.2611 13.45 15.0125V15C13.45 14.7514 13.3512 14.5129 13.1754 14.3371C12.9996 14.1613 12.7611 14.0625 12.5125 14.0625H12.5ZM14.0625 12.5C14.0625 12.2514 14.1613 12.0129 14.3371 11.8371C14.5129 11.6613 14.7514 11.5625 15 11.5625H15.0125C15.2611 11.5625 15.4996 11.6613 15.6754 11.8371C15.8512 12.0129 15.95 12.2514 15.95 12.5V12.5125C15.95 12.7611 15.8512 12.9996 15.6754 13.1754C15.4996 13.3512 15.2611 13.45 15.0125 13.45H15C14.7514 13.45 14.5129 13.3512 14.3371 13.1754C14.1613 12.9996 14.0625 12.7611 14.0625 12.5125V12.5ZM11.5625 10.0063C11.5625 9.485 11.985 9.0625 12.5063 9.0625H15.0063C15.2565 9.0625 15.4966 9.16193 15.6736 9.33892C15.8506 9.51591 15.95 9.75595 15.95 10.0063C15.95 10.2565 15.8506 10.4966 15.6736 10.6736C15.4966 10.8506 15.2565 10.95 15.0063 10.95H12.5063C12.256 10.95 12.0159 10.8506 11.8389 10.6736C11.6619 10.4966 11.5625 10.2565 11.5625 10.0063ZM5.00625 11.5625C4.88232 11.5625 4.75959 11.5869 4.64509 11.6343C4.53059 11.6818 4.42655 11.7513 4.33892 11.8389C4.25128 11.9266 4.18177 12.0306 4.13434 12.1451C4.08691 12.2596 4.0625 12.3823 4.0625 12.5063C4.0625 12.6302 4.08691 12.7529 4.13434 12.8674C4.18177 12.9819 4.25128 13.0859 4.33892 13.1736C4.42655 13.2612 4.53059 13.3307 4.64509 13.3782C4.75959 13.4256 4.88232 13.45 5.00625 13.45H10.0063C10.1302 13.45 10.2529 13.4256 10.3674 13.3782C10.4819 13.3307 10.5859 13.2612 10.6736 13.1736C10.7612 13.0859 10.8307 12.9819 10.8782 12.8674C10.9256 12.7529 10.95 12.6302 10.95 12.5063C10.95 12.3823 10.9256 12.2596 10.8782 12.1451C10.8307 12.0306 10.7612 11.9266 10.6736 11.8389C10.5859 11.7513 10.4819 11.6818 10.3674 11.6343C10.2529 11.5869 10.1302 11.5625 10.0063 11.5625H5.00625Z" fill="#263859"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M4.6875 0C4.93614 0 5.1746 0.0987719 5.35041 0.274587C5.52623 0.450403 5.625 0.68886 5.625 0.9375V2.5H14.375V0.9375C14.375 0.68886 14.4738 0.450403 14.6496 0.274587C14.8254 0.0987719 15.0639 0 15.3125 0C15.5611 0 15.7996 0.0987719 15.9754 0.274587C16.1512 0.450403 16.25 0.68886 16.25 0.9375V2.5H16.5625C17.4742 2.5 18.3485 2.86216 18.9932 3.50682C19.6378 4.15148 20 5.02582 20 5.9375V16.5625C20 17.4742 19.6378 18.3485 18.9932 18.9932C18.3485 19.6378 17.4742 20 16.5625 20H3.4375C2.52582 20 1.65148 19.6378 1.00682 18.9932C0.362164 18.3485 0 17.4742 0 16.5625V5.9375C0 5.02582 0.362164 4.15148 1.00682 3.50682C1.65148 2.86216 2.52582 2.5 3.4375 2.5H3.75V0.9375C3.75 0.68886 3.84877 0.450403 4.02459 0.274587C4.2004 0.0987719 4.43886 0 4.6875 0ZM3.4375 6.875C2.575 6.875 1.875 7.575 1.875 8.4375V16.5625C1.875 17.425 2.575 18.125 3.4375 18.125H16.5625C17.425 18.125 18.125 17.425 18.125 16.5625V8.4375C18.125 7.575 17.425 6.875 16.5625 6.875H3.4375Z" fill="#263859"/>
                      </svg>,
        name,
        onDropdownOpen,
        onDropdownClose,
        onBlur,
        onFocus,
        onChange,
        onKeyDown,
        onClear,
        placeholder,
        ref = null,
        setDropdownOpened,
        size,
        type,
    } = props

    const handleInputClick = () => {
        inputtable ? openDropdown() : toggleDropdown(!dropdownOpened)
    }

    const closeDropdown = () => {
        setDropdownOpened(false)
        onDropdownClose?.()
    }

    const suffixIconSlot = clearable ? (
        clearButton ? (
            <div role="presentation" onClick={onClear}>
                {clearButton}
            </div>
        ) : (
            <CloseButton className="text-base bg-transparent p-0 shadow-none ring-0" onClick={onClear} />
        )
    ) : inputSuffix ? (
        <>{inputSuffix}</>
    ) : null

    const toggleDropdown = (open: boolean) => {
        setDropdownOpened(open)
        open ? onDropdownOpen?.() : onDropdownClose?.()
    }

    const openDropdown = () => {
        setDropdownOpened(true)
        onDropdownOpen?.()
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        typeof onKeyDown === 'function' && onKeyDown(event)
        if ((event.key === 'Space' || event.key === 'Enter') && !inputtable) {
            event.preventDefault()
            openDropdown()
        }
    }

    const handleInputBlur = (event: FocusEvent<HTMLInputElement, Element>) => {
        onBlur?.(event)
        if (inputtable && inputtableBlurClose) {
            closeDropdown()
        }
    }

    const handleInputFocus = (event: FocusEvent<HTMLInputElement, Element>) => {
        onFocus?.(event)
    }

    const { refs, floatingStyles, context } = useFloating({
        open: dropdownOpened,
        onOpenChange: toggleDropdown,
        placement: 'bottom-start',
        middleware: [
            offset(10),
            flip({
                fallbackAxisSideDirection: 'start',
            }),
            shift(),
        ],
        whileElementsMounted: autoUpdate,
    })

    const focus = useFocus(context)
    const click = useClick(context)
    const dismiss = useDismiss(context)
    const role = useRole(context)

    const { getReferenceProps, getFloatingProps } = useInteractions([
        inputtable ? focus : click,
        dismiss,
        role,
    ])

    const headingId = useId()

    return (
        <>
            <Input
                ref={useMergedRef(ref, refs.setReference)}
                className={className}
                placeholder={placeholder}
                size={size}
                name={name}
                value={inputLabel}
                readOnly={!inputtable}
                suffix={suffixIconSlot}
                prefix={inputPrefix}
                autoComplete="off"
                type={type}
                disabled={disabled}
                asElement={'input'}
                onKeyDown={handleKeyDown}
                onClick={handleInputClick}
                onChange={onChange}
                {...getReferenceProps({
                    onBlur: handleInputBlur,
                    onFocus: handleInputFocus,
                })}
            />
            {dropdownOpened && (
                <div
                    ref={refs.setFloating}
                    className="picker"
                    style={floatingStyles}
                    aria-labelledby={headingId}
                    {...getFloatingProps()}
                >
                    <div className="picker-panel">{children}</div>
                </div>
            )}
        </>
    )
}

export default BasePicker
