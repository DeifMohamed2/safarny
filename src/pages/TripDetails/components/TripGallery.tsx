import img1 from '@assets/trip/trip.jpg';
import img2 from '@assets/trip/card1.jpg';
import img3 from '@assets/trip/card2.jpg';
import img4 from '@assets/trip/trip.jpg';
import { useState } from 'react';

interface GalleryImage {
  id: number;
  image: string;
  mainImage: boolean;
}

const TripGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([
    { id: 1, image: img1, mainImage: true },
    { id: 2, image: img2, mainImage: false },
    { id: 3, image: img3, mainImage: false },
    { id: 4, image: img4, mainImage: false },
    { id: 5, image: img1, mainImage: false },
    { id: 6, image: img2, mainImage: false },
    { id: 7, image: img3, mainImage: false },
    { id: 8, image: img4, mainImage: false },
  ]);

  const handleThumbnailClick = (clickedId: number) => {
    setImages((prevImages) =>
      prevImages.map((img) => {
        if (img.id === clickedId) return { ...img, mainImage: true };
        if (img.mainImage) return { ...img, mainImage: false };
        return img;
      })
    );
  };

  const mainImageObj = images.find((img) => img.mainImage)!;
  const thumbnails = images.filter((img) => !img.mainImage);

  return (
    <div className="w-full flex flex-col lg:flex-row items-center gap-6.5 lg:h-139">
      {/* Main Image */}
      <div
        className="w-full lg:w-[calc(100%-298px)] h-80 sm:h-90 md:h-110 lg:h-full rounded-3xl md:rounded-4xl lg:rounded-[49px] border-8 md:border-10 border-white/50 shadow-inner"
        style={{
          backgroundImage: `url(${mainImageObj.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Thumbnails */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto sm:overflow-y-auto [-ms-overflow-style:none]
              [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full lg:w-74.5 h-full pr-2">
        {thumbnails.map((img) => (
          <div
            key={img.id}
            className="w-50 md:w-74.5 lg:w-full h-30 md:h-40.75 rounded-[18px] border-4 border-white/60 bg-cover bg-center shrink-0 cursor-pointer"
            style={{ backgroundImage: `url(${img.image})` }}
            onClick={() => handleThumbnailClick(img.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default TripGallery
