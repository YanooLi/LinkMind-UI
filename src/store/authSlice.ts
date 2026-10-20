import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, errorMessage, tokens } from '@/api/client'
import type { Profile } from '@/api/types'

interface AuthState { profile: Profile | null; loggedIn: boolean; status: 'idle' | 'loading' | 'failed'; error: string | null }
const initialState: AuthState = { profile: null, loggedIn: !!tokens.access(), status: 'idle', error: null }

export const login = createAsyncThunk('auth/login', async (p: { username: string; password: string }, { rejectWithValue }) => {
  try {
    const t = await api.login(p.username, p.password)
    tokens.save(t.access_token, t.refresh_token)
    return await api.me()
  } catch (e) { return rejectWithValue(errorMessage(e)) }
})

export const register = createAsyncThunk('auth/register',
  async (p: { username: string; email: string; password: string; invite_code?: string }, { dispatch, rejectWithValue }) => {
    try { await api.register(p) } catch (e) { return rejectWithValue(errorMessage(e)) }
    return dispatch(login({ username: p.username, password: p.password })).unwrap()
  })

export const loadProfile = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { return await api.me() } catch (e) { return rejectWithValue(errorMessage(e)) }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) { tokens.clear(); state.profile = null; state.loggedIn = false },
    setProfile(state, a: { payload: Profile }) { state.profile = a.payload },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(login.fulfilled, (s, a) => { s.status = 'idle'; s.loggedIn = true; s.profile = a.payload })
      .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload as string })
      .addCase(register.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(register.rejected, (s, a) => { s.status = 'failed'; s.error = (a.payload as string) ?? a.error.message ?? 'Sign-up failed' })
      .addCase(loadProfile.fulfilled, (s, a) => { s.profile = a.payload; s.loggedIn = true })
      .addCase(loadProfile.rejected, (s) => { if (!tokens.access()) { s.loggedIn = false; s.profile = null } })
  },
})

export const { logout, setProfile } = authSlice.actions
export default authSlice.reducer
