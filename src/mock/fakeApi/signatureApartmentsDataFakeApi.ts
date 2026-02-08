import { mock } from '../MockAdapter';
import { signatureApartmentsData } from '../data/signatureApartmentsData';

mock.onGet('/api/signatureApartments').reply((config) => {
  const lang = config.headers?.['Accept-Language'] || 'en';
  const currencyHeader = config.headers?.['Currency'] || 'SAR';

  const resp = signatureApartmentsData.map((room) => {
    const isUSD = currencyHeader === 'USD';
    const currency = isUSD ? (lang === 'ar' ? room.currencyUSDAr : room.currencyUSDEn)
                          : (lang === 'ar' ? room.currencySarAr : room.currencySarEn);
    const price = isUSD ? room.priceUsd : room.priceSar;

    return {
      id: room.id,
      name: lang === 'ar' ? room.nameAr : room.nameEn,
      price: price,
      currency,
      mainImage: room.mainImage,
      showScreen: room.showScreen,
      showDosh: room.showDosh,
      showWifi: room.showWifi,
    };
  });

  return [200, resp];
});