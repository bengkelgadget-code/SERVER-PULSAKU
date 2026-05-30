import { createClient } from '@/infrastructure/supabase/server'
import { createAdminClient } from '@/infrastructure/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  // Only superadmin can create staff (admin creates staff)
  if (!currentUser?.role || !['superadmin', 'admin'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Admin can only create staff, superadmin can create admin or staff
  const allowedRoles = ['staff']
  if (currentUser.role === 'superadmin') {
    allowedRoles.push('admin')
  }

  try {
    const body = await request.json()
    const { email, password, role, nama_toko } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Validate role
    const requestedRole = role || 'staff'
    if (!allowedRoles.includes(requestedRole)) {
      return NextResponse.json({ error: 'Cannot create user with this role' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    const updatePayload: Record<string, string | null> = {
      role: requestedRole,
      nama_toko: nama_toko || null,
    }

    if (currentUser.role === 'admin' && requestedRole === 'staff') {
      updatePayload.admin_id = user.id
    }

    const { error: updateError } = await adminClient
      .from('users')
      .update(updatePayload)
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Failed to update user profile:', updateError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: requestedRole,
        nama_toko: nama_toko || null,
      },
      message: 'User created successfully'
    })

  } catch (error: unknown) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}