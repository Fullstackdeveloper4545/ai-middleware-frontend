import SupplierPanel from "../components/SupplierPanel";
import { Supplier } from "../api";

type Props = {
  suppliers: Supplier[];
  onCreate: (payload: { name: string; code: string }) => Promise<void>;
  onUpdate: (id: string, payload: { name?: string; code?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNotify: (message: string) => void;
};

export default function SuppliersPage({ suppliers, onCreate, onUpdate, onDelete, onNotify }: Props) {
  return (
    <>
      <section className="page-header">
        <div>
          <h1>Suppliers</h1>
          <p>Create and manage supplier records.</p>
        </div>
      </section>
      <SupplierPanel
        items={suppliers}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onNotify={onNotify}
      />
    </>
  );
}
