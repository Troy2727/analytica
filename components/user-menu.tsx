"use client";

import type { User } from "@supabase/supabase-js";
import { Key, LayoutDashboard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

/** Avatar button with links to the dashboard and settings, and sign-out. */
export default function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const firstName = String(user.user_metadata?.full_name ?? "").split(" ")[0] || "User";
  const initial = user.email?.charAt(0).toUpperCase() || "U";

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Account menu">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={firstName} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        forceMount
        className="w-56 rounded-xl border-blue-400/20 bg-gradient-to-br from-navy-900 to-black text-white shadow-2xl shadow-blue-950/50 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="space-y-1 font-normal">
          <p className="text-sm font-medium leading-none">Hello, {firstName}!</p>
          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Key className="mr-2 h-4 w-4" />
          Settings & API Keys
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
