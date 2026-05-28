import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { AuthMeResponse } from "@/lib/api-types";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/", credentials: "include" }),
  tagTypes: ["Me"],
  endpoints: (builder) => ({
    getMe: builder.query<AuthMeResponse, void>({
      query: () => "auth/me",
      providesTags: ["Me"],
    }),
    login: builder.mutation<void, { email: string; password: string }>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Me"],
    }),
    register: builder.mutation<void, { email: string; password: string }>({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Me"],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "auth/logout", method: "POST" }),
      invalidatesTags: ["Me"],
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
} = authApi;
