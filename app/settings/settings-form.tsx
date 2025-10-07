'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { deleteAccount } from './actions'

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      return
    }

    setIsDeleting(true)
    const result = await deleteAccount()
    
    if (!result.success) {
      alert(`Error: ${result.error}`)
      setIsDeleting(false)
    }
    // If successful, user will be redirected by the action
  }

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email Address</Label>
            <Input value={user.email || ''} disabled className="mt-1" />
          </div>
          
          <div>
            <Label>User ID</Label>
            <Input value={user.id} disabled className="mt-1" />
          </div>

          <div>
            <Label>Account Created</Label>
            <Input 
              value={new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} 
              disabled 
              className="mt-1" 
            />
          </div>

          <div>
            <Label>Status</Label>
            <div className="mt-1">
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Usage */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
          <CardDescription>Monitor your LLM API usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            You&apos;re using your own API keys, so you pay LLM providers directly. We don&apos;t charge for API usage.
          </p>
          <p>
            Check your OpenAI dashboard for detailed billing information.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">Delete Account</h4>
                <p className="text-sm text-red-700 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <p className="text-sm text-red-700 mb-3">
                  This will delete:
                </p>
                <ul className="text-sm text-red-700 mb-3 list-disc list-inside space-y-1">
                  <li>All your prompts and categories</li>
                  <li>All query history and results</li>
                  <li>All analytics data</li>
                  <li>Your API keys (from our database)</li>
                  <li>Your account and profile</li>
                </ul>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account Permanently?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p className="font-semibold">This action cannot be undone.</p>
              <p>
                All your data will be permanently deleted:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Prompts, categories, and intents</li>
                <li>Query history and brand mentions</li>
                <li>Analytics and statistics</li>
                <li>API keys and model configurations</li>
              </ul>
              <div className="pt-4">
                <Label htmlFor="delete-confirm">
                  Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm:
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="mt-2"
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmText('')
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

