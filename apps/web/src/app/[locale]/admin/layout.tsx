import type { Metadata } from 'next';
import { PremiumAdminSidebar } from '@/components/admin/PremiumAdminSidebar';
import { MotionConfig } from 'framer-motion';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        /* ────────────────────────────────────────────────────
           Admin overrides: full-viewport app shell
           Every ancestor in the chain must be a constrained
           flex container to keep the admin fitting the viewport.
           ──────────────────────────────────────────────────── */
        body {
          display: flex !important;
          flex-direction: column !important;
          min-height: 0 !important;
          height: 100dvh !important;
          overflow: hidden !important;
          background: linear-gradient(135deg, #f0f5fa 0%, #f5f8fc 25%, #edf2f7 50%, #f0f5fa 75%, #e8f0f8 100%);
          background-attachment: fixed;
        }
        /* Hide public header & footer in admin */
        header, footer { display: none !important; }
        #main-content {
          display: flex !important;
          flex: 1 !important;
          min-height: 0 !important;
          max-width: none !important;
          margin: 0 !important;
          overflow: hidden !important;
        }
        .admin-wrap {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        /* ── Premium scrollbar ── */
        .admin-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .admin-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-scroll::-webkit-scrollbar-thumb {
          background: rgba(0,153,255,0.2);
          border-radius: 999px;
        }
        .admin-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(0,153,255,0.35);
        }
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0,153,255,0.12);
          border-radius: 999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0,153,255,0.3);
        }
        /* ── Tech-grid background ── */
        .admin-grid-bg {
          background-image:
            linear-gradient(rgba(0,153,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,153,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        /* ── Mobile adjustments ── */
        @media (max-width: 1023px) {
          /* Hamburger button is fixed top-left; push content below it */
          .admin-scroll { padding-top: 52px !important; }
          input, select, textarea, button { font-size: 16px !important; }
        }
      `}</style>
      <MotionConfig
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="admin-wrap">
          <PremiumAdminSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="admin-scroll flex-1 overflow-y-auto px-3 py-3 lg:px-6 lg:py-5">
              <div className="mx-auto w-full max-w-[1400px] flex flex-col min-h-0">
                {children}
              </div>
            </div>
          </div>
        </div>
      </MotionConfig>
    </>
  );
}
