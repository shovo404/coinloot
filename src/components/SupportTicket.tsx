import { useState, useEffect, useRef } from "react";
import {
  Send, PlusCircle, MessageSquare, HelpCircle, ArrowLeft,
  CheckCircle, Clock, User, ShieldCheck,
} from "lucide-react";
import { UserProfile } from "../types";
import { isDeveloperMode } from "./DeveloperModeBanner";

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "admin";
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  username: string;
  email: string;
  subject: string;
  category: "billing" | "survey-credit" | "account" | "bug-report";
  message: string;
  status: "OPEN" | "ANSWERED" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

const STORAGE_KEY = "coinloot_support_tickets";

function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveTickets(tickets: Ticket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function loadMessages(ticketId: string): TicketMessage[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_messages_${ticketId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveMessages(ticketId: string, messages: TicketMessage[]) {
  localStorage.setItem(`${STORAGE_KEY}_messages_${ticketId}`, JSON.stringify(messages));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface SupportTicketProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
}

export default function SupportTicket({ user, setUser }: SupportTicketProps) {
  const [tickets, setTickets] = useState<Ticket[]>(loadTickets);
  const [view, setView] = useState<"list" | "create" | "chat">("list");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState<Ticket["category"]>("survey-credit");
  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filter tickets for current user
  const userTickets = tickets.filter((t) => t.userId === user.id);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new admin replies every 5 seconds
  useEffect(() => {
    if (!activeTicket) return;
    const interval = setInterval(() => {
      const updated = loadMessages(activeTicket.id);
      if (updated.length !== messages.length) {
        setMessages(updated);
        // Also reload ticket to check status change
        const allTickets = loadTickets();
        const updatedTicket = allTickets.find((t) => t.id === activeTicket.id);
        if (updatedTicket) setActiveTicket(updatedTicket);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTicket, messages.length]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    if (isDeveloperMode()) { alert("Support is temporarily disabled — site under development."); return; }

    const now = new Date().toISOString();
    const ticket: Ticket = {
      id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      email: user.email,
      subject: newSubject,
      category: newCategory,
      message: newMessage,
      status: "OPEN",
      createdAt: now,
    };

    const initialMessage: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ticketId: ticket.id,
      senderId: user.id,
      senderName: user.username,
      senderRole: "user",
      text: newMessage,
      createdAt: now,
    };

    const updated = [...tickets, ticket];
    setTickets(updated);
    saveTickets(updated);
    saveMessages(ticket.id, [initialMessage]);

    setNewSubject("");
    setNewCategory("survey-credit");
    setNewMessage("");
    setActiveTicket(ticket);
    setMessages([initialMessage]);
    setView("chat");
  };

  const openChat = (ticket: Ticket) => {
    setActiveTicket(ticket);
    setMessages(loadMessages(ticket.id));
    setView("chat");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const now = new Date().toISOString();
    const msg: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ticketId: activeTicket.id,
      senderId: user.id,
      senderName: user.username,
      senderRole: "user",
      text: replyText,
      createdAt: now,
    };

    const updatedMessages = [...messages, msg];
    setMessages(updatedMessages);
    saveMessages(activeTicket.id, updatedMessages);
    setReplyText("");
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto animate-fade-in min-h-[80vh]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {view !== "list" && (
          <button onClick={() => { setView("list"); setActiveTicket(null); }} className="p-2 rounded-xl bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Support</h1>
          <p className="text-[10px] text-slate-500 font-mono">
            {view === "list" ? "Your tickets" : view === "create" ? "New ticket" : activeTicket?.subject}
          </p>
        </div>
      </div>

      {/* ─── TICKET LIST ─── */}
      {view === "list" && (
        <div className="space-y-4">
          <button onClick={() => setView("create")} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs tracking-wide hover:scale-[1.01] transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 cursor-pointer">
            <PlusCircle className="w-4 h-4" />
            Create New Ticket
          </button>

          {userTickets.length === 0 && (
            <div className="text-center py-16 glass rounded-3xl border border-dashed border-cyan-500/10">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No support tickets yet</p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">Create one above to get help</p>
            </div>
          )}

          {userTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => openChat(ticket)}
              className="w-full text-left glass rounded-3xl p-4 hover:border-cyan-400/30 transition-all border border-white/5 cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-mono ${
                      ticket.status === "OPEN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      ticket.status === "ANSWERED" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>{ticket.status}</span>
                    <span className="text-[9px] text-slate-600 font-mono">{timeAgo(ticket.createdAt)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">{ticket.subject}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{ticket.message}</p>
                </div>
                <ChevronRightIcon />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ─── CREATE TICKET ─── */}
      {view === "create" && (
        <div className="glass rounded-3xl p-6 space-y-6">
          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-sans">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Subject</label>
              <input type="text" required value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g. Withdrawal issue" className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/20" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Category</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400/20 font-sans">
                <option value="survey-credit">Survey credit issue</option>
                <option value="billing">Withdrawal / Billing</option>
                <option value="account">Account credentials</option>
                <option value="bug-report">Bug report / Feedback</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Message</label>
              <textarea required rows={5} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Describe your issue in detail..." className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/20 resize-none" />
            </div>
            <button type="submit" className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold tracking-wide text-white text-xs hover:scale-[1.01] transition-transform shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5">
              <Send className="w-4 h-4" />
              <span>Submit Ticket</span>
            </button>
          </form>
        </div>
      )}

      {/* ─── CHAT / MESSENGER VIEW ─── */}
      {view === "chat" && activeTicket && (
        <div className="flex flex-col h-[calc(80vh-100px)]">
          {/* Ticket info bar */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-mono ${
                activeTicket.status === "OPEN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                activeTicket.status === "ANSWERED" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>{activeTicket.status}</span>
              <span className="text-[9px] text-slate-600 font-mono">{activeTicket.category}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3" style={{ maxHeight: "calc(100% - 60px)" }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderRole === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.senderRole === "user"
                    ? "bg-gradient-to-br from-cyan-500 to-purple-600 text-white rounded-br-md"
                    : "bg-slate-800/80 border border-white/5 text-slate-200 rounded-bl-md"
                }`}>
                  {msg.senderRole === "admin" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      <span className="text-[9px] font-bold text-cyan-400 font-mono">Support</span>
                    </div>
                  )}
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <span className={`block text-[8px] mt-1.5 font-mono ${msg.senderRole === "user" ? "text-white/60" : "text-slate-500"}`}>
                    {timeAgo(msg.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Reply input */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2 glass rounded-2xl p-2 border border-white/5">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-slate-600 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
