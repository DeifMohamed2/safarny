import { mock } from './MockAdapter'
import './fakeApi/authFakeApi'
import './fakeApi/signatureApartmentsDataFakeApi'

mock.onAny().passThrough()
