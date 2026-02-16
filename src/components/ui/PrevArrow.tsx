import React from 'react';
import { ChevronRight } from 'lucide-react'


interface PrevArrowProps {
    onClick: () => void;
}

const PrevArrow: React.FC<PrevArrowProps> = ({ onClick }) => {
    return (
        <button
            aria-label='Prev'
            onClick={onClick}
            className="w-10 h-10 shadow-lg flex items-center justify-center text-[#122445] bg-white
                        border border-[#122445] hover:text-white hover:bg-[#122445]
                        rounded-xl hover:scale-105 transition cursor-pointer"
        >
            <ChevronRight size={22} />
        </button>
    );
};

export default PrevArrow;
