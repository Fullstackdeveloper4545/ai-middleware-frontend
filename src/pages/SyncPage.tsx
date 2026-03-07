import SyncQueue from "../components/SyncQueue";

type Props = {
  items: any[];
  onEnqueue: () => Promise<void>;
  onProcess: () => Promise<void>;
};

export default function SyncPage({ items, onEnqueue, onProcess }: Props) {
  return (
    <>
      <section className="page-header">
        <div>
          <h1>Sync Queue</h1>
          <p>Queue approved items and process Shopify sync.</p>
        </div>
      </section>
      <SyncQueue items={items} onEnqueue={onEnqueue} onProcess={onProcess} />
    </>
  );
}
