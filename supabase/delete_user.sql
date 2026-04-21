-- RPC function: allows the calling authenticated user to delete their own account.
-- Called client-side via supabase.rpc('delete_user').
-- Uses SECURITY DEFINER to access auth.users, but checks auth.uid() to ensure
-- a user can only delete themselves.
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only delete if the calling user matches
  delete from auth.users where id = auth.uid();
end;
$$;

-- Grant execute to authenticated users only
revoke execute on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated;
