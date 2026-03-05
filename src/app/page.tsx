"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Plus, Share2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Tribute Wall
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          )}
          <Link href="/create">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Wall
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-3xl leading-tight">
          Celebrate the people who matter most
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl">
          Create a beautiful, shareable tribute page for birthdays, retirements,
          memorials, weddings, or any meaningful milestone.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/create">
            <Button size="lg" className="text-base px-8">
              <Plus className="w-5 h-5 mr-2" />
              Create a Wall
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl w-full">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Create</h3>
            <p className="text-sm text-muted-foreground">
              Set up your tribute wall in under 2 minutes with a title, cover image, and description.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Share</h3>
            <p className="text-sm text-muted-foreground">
              Share the unique link with friends, family, or colleagues. No sign-up needed to contribute.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Celebrate</h3>
            <p className="text-sm text-muted-foreground">
              Watch tributes pour in from everyone who wants to share their love and appreciation.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 px-6 py-6 text-center text-sm text-muted-foreground">
        Tribute Wall &mdash; Built with love
      </footer>
    </div>
  );
}
