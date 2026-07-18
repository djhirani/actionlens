import { ActionInbox } from "@/components/action-inbox";

export default function InboxPage() {
  return (
    <main className="main">
      <p className="eyebrow">Saved locally</p>
      <h1>Action Inbox</h1>
      <p className="lede">
        Review overdue, due, upcoming, and completed actions stored in this browser.
      </p>
      <ActionInbox />
    </main>
  );
}
