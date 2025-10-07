'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Delete user data (RLS policies will handle cascading deletes)
    // The database has ON DELETE CASCADE, so deleting the user will clean up:
    // - intents
    // - queries
    // - brand_mentions
    // - models
    // - user_api_keys
    // - paraphrases
    // - query_statistics
    
    // Delete the auth user (this triggers cascade deletes)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return { success: false, error: deleteError.message }
    }

    // Sign out
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error in deleteAccount:', error)
    return { success: false, error: 'Failed to delete account' }
  }

  // Redirect to home page
  redirect('/')
}

