import { ActionCapture } from "@/components/action-capture";
import { DocumentCheck } from "@/components/document-check";

export default function HomePage() {
  return (
    <main className="main">
      <section className="hero">
        <p className="eyebrow">Human-confirmed action capture</p>
        <h1>Turn an instruction into a clear next step.</h1>
        <p className="lede">
          ActionLens prepares an editable draft using your local time. Review it before anything is
          saved.
        </p>
      </section>
      <ActionCapture />
      <DocumentCheck />
    </main>
  );
}
