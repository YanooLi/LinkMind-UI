import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, errorMessage, tokenStore } from '@/api/client'
import type { User } from '@/api/types'

interface AuthState {
  user: User | null
  token: string | null
  status: 'idle' | 'loading' | 'failed'
  error: string | null
}

const initialState: AuthState = { user: null, token: tokenStore.get(), status: 'idle', error: null }

export const login = createAsyncThunk('auth/login', async (p: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.login(p.email, p.password)
    tokenStore.set(data.access_token)
    return { token: data.access_token, user: (await api.me()).data }
  } catch (e) {
    return rejectWithValue(errorMessage(e))
  }
})

export const register = createAsyncThunk('auth/register', async (p: { email: string; password: string }, { dispatch, rejectWithValue }) => {
  try {
    await api.register(p.email, p.password)
  } catch (e) {
    return rejectWithValue(errorMessage(e))
  }
  return dispatch(login(p)).unwrap()
})

export const loadMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    return (await api.me()).data
  } catch (e) {
    tokenStore.clear()
    return rejectWithValue(errorMessage(e))
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      tokenStore.clear()
      state.user = null
      state.token = null
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(login.fulfilled, (s, a) => { s.status = 'idle'; s.token = a.payload.token; s.user = a.payload.user })
      .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload as string })
      .addCase(register.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(register.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload as string })
      .addCase(loadMe.fulfilled, (s, a) => { s.user = a.payload })
      .addCase(loadMe.rejected, (s) => { s.user = null; s.token = null })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
