"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS, type Notif } from "@/store/useOS";
import Icon from "@/components/ui/Icon";

/** Transient toasts (auto-dismiss) + the notification center panel. */
export default function Notifications() {
  const notifs = useOS((s) => s.notifs);
  const dismiss = useOS((s) => s.dismissNotif);
  const clear = useOS((s) => s.clearNotifs);
  const centerOpen = useOS((s) => s.notifCenterOpen);
  const setCenter = useOS((s) => s.setNotifCenter);

  const [toasts, setToasts] = useState<Notif[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fresh = notifs.filter((n) => !seen.current.has(n.id));
    if (fresh.length) {
      fresh.forEach((n) => seen.current.add(n.id));
      setToasts((t) => [...fresh, ...t].slice(0, 4));
      fresh.forEach((n) =>
        setTimeout(
          () => setToasts((t) => t.filter((x) => x.id !== n.id)),
          5000,
        ),
      );
    }
  }, [notifs]);

  return (
    <>
      {/* toasts */}
      <div className="pointer-events-none fixed right-3 top-9 z-[145] flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl glass-strong p-3 shadow-2xl"
              onClick={() => setToasts((t) => t.filter((x) => x.id !== n.id))}
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{ background: `${n.color || "#7c6cff"}22` }}
              >
                <Icon name={n.icon || "Bell"} size={18} color={n.color || "#7c6cff"} />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-text0">{n.title}</div>
                <div className="truncate text-[12px] text-text2">{n.body}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* notification center */}
      <AnimatePresence>
        {centerOpen && (
          <>
            <div className="fixed inset-0 z-[140]" onClick={() => setCenter(false)} />
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.18 }}
              className="fixed right-2 top-9 z-[150] w-80 rounded-3xl glass-strong p-3 shadow-2xl"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[13px] font-semibold">Notifications</span>
                {notifs.length > 0 && (
                  <button
                    onClick={clear}
                    className="text-[11px] text-text3 hover:text-text0"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-[60vh] space-y-2 overflow-y-auto scroll-thin">
                {notifs.length === 0 && (
                  <div className="grid place-items-center gap-2 py-10 text-center text-text3">
                    <Icon name="BellOff" size={22} />
                    <span className="text-[12px]">You&apos;re all caught up</span>
                  </div>
                )}
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    className="group flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3"
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      style={{ background: `${n.color || "#7c6cff"}22` }}
                    >
                      <Icon name={n.icon || "Bell"} size={16} color={n.color || "#7c6cff"} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-text0">{n.title}</div>
                      <div className="text-[12px] text-text2">{n.body}</div>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="opacity-0 transition group-hover:opacity-100"
                    >
                      <Icon name="X" size={13} className="text-text3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
