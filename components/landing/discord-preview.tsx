"use client";

import { AtSign, Clock, Hash, Inbox, Menu, PlusCircle, Search, Smile, UserCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AnimatedList } from "@/components/ui/animated-list";

export interface PreviewMessage {
  time: string;
  emoji: string;
  title: string;
  description: string;
  fields: { name: string; value: string; wide?: boolean }[];
}

/** One Analytica bot message, styled like a Discord embed. */
function BotMessage({ message }: { message: PreviewMessage }) {
  return (
    <article className="flex w-full items-start gap-3">
      <Image src="/logo-mark-v3.png" alt="" width={40} height={40} className="size-8 rounded-full object-cover lg:size-10" />
      <div className="w-full max-w-xl">
        <header className="flex items-center gap-1.5 text-white">
          <span className="text-sm lg:text-base lg:font-semibold">Analytica</span>
          <span className="rounded bg-gradient-to-r from-blue-500 to-emerald-500 px-1 py-0.5 text-[10px] lg:text-xs lg:font-semibold">
            APP
          </span>
          <span className="text-[10px] text-gray-400 lg:text-xs">{message.time}</span>
        </header>
        <div className="mb-4 mt-1.5 rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-900/30 to-black/50 p-2 lg:p-3">
          <p className="mb-2 text-sm leading-5 text-white lg:text-base lg:font-semibold lg:leading-7">
            {message.emoji} New Event: {message.title}
          </p>
          <p className="mb-2 text-xs leading-5 text-[#dcddde] lg:text-sm lg:leading-6">{message.description}</p>
          <dl className="grid grid-cols-2 gap-2 text-xs leading-5 text-[#dcddde] lg:text-sm lg:leading-6">
            {message.fields.map((f) => (
              <div key={f.name} className={f.wide ? "col-span-2" : ""}>
                <dt className="inline font-bold text-[#b9bbbe]">{f.name}: </dt>
                <dd className="inline">{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 flex items-center text-[10px] text-[#72767d] lg:text-xs">
            <Clock className="mr-1 size-2.5 stroke-[1.5] lg:size-3" />
            {message.time}
          </p>
        </div>
      </div>
    </article>
  );
}

const CONTACTS = ["Analytica", "Design team", "Release bot", "On-call"];

/**
 * A static Discord-style DM window showing what Analytica's event alerts look
 * like. On small screens the contact list opens as a drawer.
 */
export default function DiscordPreview({ messages }: { messages: PreviewMessage[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative flex min-h-[800px] w-full overflow-hidden rounded-xl text-white">
      {drawerOpen && (
        <button aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute inset-0 z-10 bg-black/60 md:hidden" />
      )}

      <aside
        className={`${drawerOpen ? "absolute inset-y-0 left-0 z-20 flex bg-slate-950 shadow-2xl" : "hidden"} w-64 flex-col border-r border-blue-400/10 bg-blue-950/20 md:static md:flex md:shadow-none`}
      >
        <div className="flex h-16 items-center border-b border-blue-400/10 px-4">
          <div className="flex h-8 w-full items-center gap-2 rounded border border-blue-400/10 bg-black/40 px-2 text-xs text-gray-500">
            <Search className="size-3.5" /> Find a conversation
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2 text-xs lg:text-sm">
          <p className="flex items-center gap-3 rounded px-2 py-1.5 text-[#dcddde]">
            <UserCircle className="size-5 text-[#b9bbbe]" /> Friends
          </p>
          <h3 className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase text-[#8e9297] lg:text-xs">Direct Messages</h3>
          {CONTACTS.map((name, i) => (
            <p
              key={name}
              className={`flex items-center gap-3 rounded px-2 py-1.5 ${i === 0 ? "bg-blue-500/15 text-white" : "text-gray-600"}`}
            >
              {i === 0 ? (
                <Image src="/logo-mark-v3.png" alt="" width={24} height={24} className="rounded-full lg:size-8" />
              ) : (
                <span className="size-6 rounded-full bg-blue-500/10 lg:size-8" />
              )}
              {name}
            </p>
          ))}
        </nav>
        <footer className="flex items-center gap-2 border-t border-blue-400/10 bg-black/30 p-2 text-xs lg:text-sm">
          <span className="size-6 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 lg:size-8" />
          <span>
            You
            <span className="block text-[10px] text-[#b9bbbe] lg:text-xs">@your_account</span>
          </span>
        </footer>
      </aside>

      <section className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-blue-400/10 px-4">
          <button aria-label="Open menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)} className="md:hidden">
            <Menu className="size-5 text-[#b9bbbe] hover:text-white" />
          </button>
          <span className="relative">
            <Image src="/logo-mark-v3.png" alt="" width={32} height={32} className="rounded-full lg:size-10" />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-slate-950 bg-green-500 lg:size-3" />
          </span>
          <span className="text-sm lg:text-base lg:font-semibold">Analytica</span>
          <span className="ml-auto hidden items-center gap-4 text-[#b9bbbe] sm:flex">
            <Hash className="size-5" />
            <AtSign className="size-5" />
            <Inbox className="size-5" />
          </span>
        </header>

        <div className="flex flex-1 flex-col-reverse overflow-y-auto px-4">
          <AnimatedList delay={800}>
            {messages.map((m) => (
              <BotMessage key={m.title} message={m} />
            ))}
          </AnimatedList>
        </div>

        <footer className="p-4">
          <div className="flex items-center gap-3 rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-2.5 text-xs text-[#72767d] lg:text-sm">
            <PlusCircle className="size-5 text-[#b9bbbe]" />
            <span className="flex-1">Message @Analytica</span>
            <Smile className="size-5 text-[#b9bbbe]" />
          </div>
        </footer>
      </section>
    </div>
  );
}
