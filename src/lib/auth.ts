'use client'

import { supabase } from './supabase'

export async function signUp(email: string, password: string, name: string) {
  // Criar usuário na tabela users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([{ email, name }])
    .select()
    .single()

  if (userError) throw userError
  
  return { user: userData }
}

export async function signIn(email: string, password: string) {
  // Buscar usuário
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) throw new Error('Usuário não encontrado')
  
  return { user }
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('visualiza_user')
  return userStr ? JSON.parse(userStr) : null
}

export function setCurrentUser(user: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem('visualiza_user', JSON.stringify(user))
}

export function clearCurrentUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('visualiza_user')
}
