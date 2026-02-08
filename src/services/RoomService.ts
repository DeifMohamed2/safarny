import ApiService from './ApiService';

export async function apiGetSignatureApartments<T>(
  lang = 'en',
  currency = 'SAR'
) {
  return ApiService.fetchDataWithAxios<T>({
    url: '/api/rooms/signature',
    method: 'get',
    headers: {
      'Accept-Language': lang,
      'Currency': currency,
    },
  });
}

export async function apiGetOffers<T>(
  lang = 'en',
  currency = 'SAR'
) {
  return ApiService.fetchDataWithAxios<T>({
    url: '/api/packages',
    method: 'get',
    headers: {
      'Accept-Language': lang,
      'Currency': currency,
    },
  });
}

export async function apiGetAllOffers<T>(
  lang = 'en',
  currency = 'SAR',
  buildingType = 'el_souq'
) {
  return ApiService.fetchDataWithAxios<T>({
    url: '/api/packages/all',
    method: 'get',
    headers: {
      'Accept-Language': lang,
      'Currency': currency,
      'Building-Type': buildingType,
    },
  });
}

export async function apiOfferDetails<T>({
  id,
  lang = 'en',
  currency = 'SAR',
}: {
  id?: string;
  lang?: string;
  currency?: string;
}) {
  return ApiService.fetchDataWithAxios<T>({
    url: `/api/packages/${id}`,
    method: 'get',
    headers: {
      'Accept-Language': lang,
      'Currency': currency,
    },
  });
}

export async function apiSearchRooms<T>({
  building,
  search,
  guests,
  checkinMonth,
  checkoutMonth,
  roomType,
  availability,
  season,
  roomCount,
  lang = 'en',
  currency = 'SAR',
}: {
  building?: string;
  search?: string;
  guests?: number;
  checkinMonth?: string;
  checkoutMonth?: string;
  roomType?: string;
  availability?: string;
  season?: string;
  roomCount?: number;
  lang?: string;
  currency?: string;
}) {
  const params: Record<string, any> = {
    building,
    search,
    guests,
    checkinMonth,
    checkoutMonth,
    roomType,
    availability,
    season,
    roomCount,
  };

  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
  );

  return ApiService.fetchDataWithAxios<T>({
    url: '/api/rooms/search',
    method: 'get',
    params: filteredParams,
    headers: {
      'Accept-Language': lang,
      'Currency': currency,
    },
  });
}

export async function apiRoomDetails<T>({
  id,
  lang = 'en',
  currency = 'SAR',
}: {
  id?: string;
  lang?: string;
  currency?: string;
}) {
  return ApiService.fetchDataWithAxios<T>({
    url: `/api/rooms/${id}`,
    method: 'get',
    headers: {
      'Accept-Language': lang,
      'Currency': currency,
    },
  });
}

export async function apiGetBuilding<T>(
  building: string,
  lang: string = 'en',
) {
  return ApiService.fetchDataWithAxios<T>({
    url: `/api/buildings/${building}`,
    method: 'get',
    headers: {
      'Accept-Language': lang,
    },
  });
}

export async function apiRecommendedRooms<T>({
  roomId,
  limit,
  building,
  roomType,
  lang = 'en',
  currency = 'SAR',
}: {
  roomId?: string; 
  limit?: number;
  building?: string;
  roomType?: string;
  lang?: string;
  currency?: string;
}) {
  const params: Record<string, any> = {
    roomId,
    limit,
    building,
    roomType,
  };


  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
  );

  return ApiService.fetchDataWithAxios<T>({
    url: '/api/rooms/recommended',
    method: 'get',
    params: filteredParams,
    headers: {
      'Accept-Language': lang,
      'Currency': currency,
    },
  });
}

export async function apiGetRoomsCalendarAvailability<T>({
  building,
  selectedMonths,
  facilities,
  lang = 'en',
  currency = 'SAR',
}: {
  building: string;
  selectedMonths: string;
  facilities?: string;
  lang?: string;
  currency?: string;
}) {
  const params: Record<string, any> = {
    building,
    selectedMonths,
  };
  if (facilities) params.facilities = facilities;

  return ApiService.fetchDataWithAxios<T>({
    url: '/api/rooms/calendar/availability',
    method: 'get',
    params,
    headers: {
      'Accept-Language': lang,
      'Currency': currency,
    },
  });
}

export async function apiNotifyMeForRoom<T>({
  id,
  lang = 'en',
}: {
  id: string;
  lang?: string;
}) {
  return ApiService.fetchDataWithAxios<T>({
    url: `/api/rooms/${id}/notify-me`,
    method: 'post',
    headers: {
      'Accept-Language': lang,
    },
  });
}