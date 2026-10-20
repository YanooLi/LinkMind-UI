import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, errorMessage } from '@/api/client'
import type { QrItem, UrlItem } from '@/api/types'

/** The signed-in user's short links and QR codes (most recent 100 of each), shared by Home and All Resources. */
interface ResourcesState { urls: UrlItem[]; qrs: QrItem[]; totalUrls: number; totalQrs: number; loaded: boolean; error: string | null }
const initialState: ResourcesState = { urls: [], qrs: [], totalUrls: 0, totalQrs: 0, loaded: false, error: null }

export const fetchResources = createAsyncThunk('resources/fetch', async (_, { rejectWithValue }) => {
  try {
    const [u, q] = await Promise.all([api.urlHistory({ limit: 100 }), api.qrHistory({ limit: 100 })])
    return { urls: u.urls, qrs: q.qrcodes, totalUrls: u.total, totalQrs: q.total }
  } catch (e) { return rejectWithValue(errorMessage(e)) }
})

export const deleteResource = createAsyncThunk('resources/delete', async (r: { type: 'url' | 'qrcode'; id: string }) => {
  if (r.type === 'url') await api.deleteUrl(r.id)
  else await api.deleteQr(r.id)
  return r
})

const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    addUrl(s, a: { payload: UrlItem }) { s.urls.unshift(a.payload); s.totalUrls += 1 },
    addQr(s, a: { payload: QrItem }) { s.qrs.unshift(a.payload); s.totalQrs += 1 },
    clear() { return initialState },
  },
  extraReducers: (b) => {
    b.addCase(fetchResources.fulfilled, (_s, a) => ({ ...a.payload, loaded: true, error: null }))
      .addCase(fetchResources.rejected, (s, a) => { s.loaded = true; s.error = a.payload as string })
      .addCase(deleteResource.fulfilled, (s, a) => {
        if (a.payload.type === 'url') { s.urls = s.urls.filter((u) => u.short_code !== a.payload.id); s.totalUrls -= 1 }
        else { s.qrs = s.qrs.filter((q) => q.qr_code_id !== a.payload.id); s.totalQrs -= 1 }
      })
  },
})

export const { addUrl, addQr, clear } = resourcesSlice.actions
export default resourcesSlice.reducer
