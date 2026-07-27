'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, MessagesSquare, Send } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  getAiChatEmployees,
  getAiChatHistory,
  sendAiChatMessage,
  type ChatEmployee,
  type ChatMessageView,
} from '@/app/lib/actions/ai-chat';
import { DashboardPage } from '@/app/components/dashboard/DashboardPage';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Select } from '@/app/components/ui/Select';
import { Textarea } from '@/app/components/ui/Textarea';
import { Spinner } from '@/app/components/ui/Spinner';
import { useToast } from '@/app/components/ui/Toast';

/**
 * One shared thread per AI employee, for the whole team — the AI is a
 * colleague, not a private assistant. Replies are advice; anything that
 * changes a case still goes through the proposal queue.
 */

const NETWORK_ERROR = 'Could not reach the server. Reload the page and try again.';

export default function AiChatPage() {
  const { t } = useLanguage();
  const { showError } = useToast();
  const c = t.dashboard?.aiChat;

  const [employees, setEmployees] = useState<ChatEmployee[]>([]);
  // Active AI employees that exist but cannot be chatted with here, because
  // they work through their own API key. Without this the empty state claims
  // no AI employees are set up while the admin screen plainly lists one.
  const [externalCount, setExternalCount] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // Which employee's thread the user is LOOKING at right now. Thread loads
  // check against this before writing state, so a slow response for employee A
  // can never overwrite the view after switching to employee B.
  const selectedIdRef = useRef('');
  selectedIdRef.current = selectedId;

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getAiChatEmployees();
        if (result.success && result.data) {
          setEmployees(result.data.employees);
          setExternalCount(result.data.externalCount);
          if (result.data.employees.length > 0) {
            setSelectedId(result.data.employees[0].profileId);
          }
        } else if (!result.success) {
          showError(result.error);
        }
      } catch {
        showError(NETWORK_ERROR);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [showError]);

  const loadThread = useCallback(
    async (aiProfileId: string) => {
      if (!aiProfileId) return;
      setIsLoadingThread(true);
      try {
        const result = await getAiChatHistory({ aiProfileId });
        // Stale response? The user switched employees while this was in
        // flight — drop it, or A's messages render under B's name.
        if (selectedIdRef.current !== aiProfileId) return;
        if (result.success && result.data) setMessages(result.data.messages);
        else if (!result.success) showError(result.error);
      } catch {
        if (selectedIdRef.current === aiProfileId) showError(NETWORK_ERROR);
      } finally {
        if (selectedIdRef.current === aiProfileId) setIsLoadingThread(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    const load = async () => {
      await loadThread(selectedId);
    };
    load();
  }, [selectedId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isSending]);

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || !selectedId || isSending) return;
    const sendingTo = selectedId;
    setIsSending(true);

    // Optimistic: show the outgoing message immediately; the reload after the
    // reply replaces this with the stored rows.
    setMessages((prev) => [
      ...prev,
      {
        id: `pending-${prev.length}`,
        author: 'staff',
        content: message,
        created_at: new Date().toISOString(),
        staffName: null,
      },
    ]);
    setDraft('');

    try {
      const result = await sendAiChatMessage({ aiProfileId: sendingTo, message });
      if (!result.success) {
        showError(result.error);
        // Failures BEFORE the message was stored (budget spent, paused,
        // no rulebook) mean the reload wipes the optimistic bubble — the
        // typed text must come back rather than vanish.
        setDraft((d) => d || message);
      }
    } catch {
      showError(NETWORK_ERROR);
      setDraft((d) => d || message);
    } finally {
      // Reload on every outcome, bound to the employee this was SENT to —
      // switching employees mid-send must not repaint the new thread with the
      // old one's messages (loadThread drops stale responses).
      await loadThread(sendingTo);
      setIsSending(false);
    }
  };

  const selected = employees.find((e) => e.profileId === selectedId);

  return (
    <DashboardPage title={c?.title || 'AI chat'}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-4 max-w-2xl text-sm text-slate-600">{c?.intro}</p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : employees.length === 0 ? (
          <Card className="p-8 text-center">
            <Bot className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">
              {externalCount > 0 ? c?.onlyExternalEmployees : c?.noEmployees}
            </p>
          </Card>
        ) : (
          // dvh (not vh) so mobile browser chrome is accounted for; the
          // minimum keeps the thread readable on short/landscape viewports.
          <div
            className="flex flex-col"
            style={{ height: 'min(48rem, calc(100dvh - 16rem))', minHeight: '20rem' }}
          >
            {employees.length > 1 && (
              <div className="mb-3 max-w-xs">
                <Select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  options={employees.map((employee) => ({
                    value: employee.profileId,
                    label: employee.fullName,
                  }))}
                />
              </div>
            )}
            {selected?.isPaused && (
              <div className="mb-3">
                <Badge variant="warning">{c?.pausedNote || 'This AI employee is paused.'}</Badge>
              </div>
            )}

            <Card className="flex min-h-0 flex-1 flex-col p-0">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {isLoadingThread ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessagesSquare className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-500">{c?.emptyThread}</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={m.author === 'staff' ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div
                        className={
                          m.author === 'staff'
                            ? 'max-w-[85%] rounded-2xl rounded-br-md bg-amber-600 px-4 py-2.5 text-white sm:max-w-[70%]'
                            : 'max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 text-slate-900 sm:max-w-[70%]'
                        }
                      >
                        <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                        <p
                          className={
                            m.author === 'staff'
                              ? 'mt-1 text-right text-[11px] text-amber-100'
                              : 'mt-1 text-[11px] text-slate-400'
                          }
                        >
                          {m.author === 'staff'
                            ? (m.staffName ?? t.dashboard?.nav?.profile ?? '')
                            : (selected?.fullName ?? 'AI')}
                          {' · '}
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5">
                      <Spinner size="sm" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-100 p-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // isComposing: for IME users (Chinese/Japanese/Korean),
                      // Enter confirms the composed characters — that must not
                      // fire a half-finished message into the shared thread.
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={c?.inputPlaceholder || 'Ask your AI colleague something...'}
                    rows={2}
                    className="min-h-0 resize-none"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isSending || !draft.trim() || !selectedId || selected?.isPaused}
                    className="gap-1.5"
                  >
                    {isSending ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
                    {c?.send || 'Send'}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-400">{c?.disclaimer}</p>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </DashboardPage>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}
