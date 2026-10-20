import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, errorMessage } from '@/api/client'
import type { Link, RiskLevel } from '@/api/types'

interface LinksState {
  items: Link[]
  nextCursor: number | null
  filter: { risk: RiskLevel | ''; q: string }
  loading: boolean
  error: string | null
}

const initialState: LinksState = { items: [], nextCursor: null, filter: { risk: '', q: '' }, loading: false, error: null }

type RootLike = { links: LinksState }

export const fetchLinks = createAsyncThunk('links/fetch', async (append: boolean, { getState, rejectWithValue }) => {
  const { links } = getState() as RootLike
  try {
    const { data } = await api.listLinks({ ...links.filter, cursor: append ? links.nextCursor : null })
    return { ...data, append }
  } catch (e) {
    return rejectWithValue(errorMessage(e))
  }
})

/** Re-read links whose analysis is still pending (the worker finishes them asynchronously). */
export const refreshPending = createAsyncThunk('links/refreshPending', async (_, { getState }) => {
  const { links } = getState() as RootLike
  const pending = links.items.filter((l) => l.status === 'pending')
  const fresh = await Promise.all(pending.map((l) => api.getLink(l.id).then((r) => r.data).catch(() => null)))
  return fresh.filter((l): l is Link => l !== null)
})

export const createLink = createAsyncThunk('links/create', async (p: { url: string; alias?: string }, { rejectWithValue }) => {
  try {
    return (await api.createLink(p.url, p.alias)).data
  } catch (e) {
    return rejectWithValue(errorMessage(e))
  }
})

export const createBatch = createAsyncThunk('links/batch', async (urls: string[], { rejectWithValue }) => {
  try {
    return (await api.createBatch(urls)).data.created
  } catch (e) {
    return rejectWithValue(errorMessage(e))
  }
})

export const deleteLink = createAsyncThunk('links/delete', async (id: number) => {
  await api.deleteLink(id)
  return id
})

const linksSlice = createSlice({
  name: 'links',
  initialState,
  reducers: {
    setFilter(state, a: { payload: Partial<LinksState['filter']> }) {
      state.filter = { ...state.filter, ...a.payload }
    },
    upsert(state, a: { payload: Link }) {
      const i = state.items.findIndex((l) => l.id === a.payload.id)
      if (i >= 0) state.items[i] = a.payload
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchLinks.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchLinks.fulfilled, (s, a) => {
        s.loading = false
        s.items = a.payload.append ? [...s.items, ...a.payload.items] : a.payload.items
        s.nextCursor = a.payload.next_cursor
      })
      .addCase(fetchLinks.rejected, (s, a) => { s.loading = false; s.error = a.payload as string })
      .addCase(refreshPending.fulfilled, (s, a) => {
        for (const l of a.payload) {
          const i = s.items.findIndex((x) => x.id === l.id)
          if (i >= 0) s.items[i] = l
        }
      })
      .addCase(createLink.fulfilled, (s, a) => { s.items.unshift(a.payload) })
      .addCase(createBatch.fulfilled, (s, a) => { s.items = [...[...a.payload].reverse(), ...s.items] })
      .addCase(deleteLink.fulfilled, (s, a) => { s.items = s.items.filter((l) => l.id !== a.payload) })
  },
})

export const { setFilter, upsert } = linksSlice.actions
export default linksSlice.reducer
