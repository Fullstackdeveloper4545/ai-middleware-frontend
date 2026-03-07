import ImportHistory from "../components/ImportHistory";
import UploadPanel from "../components/UploadPanel";
import { ImportItem, Supplier } from "../api";

type Props = {
  suppliers: Supplier[];
  imports: ImportItem[];
  selectedSupplier: string;
  onSelectSupplier: (id: string) => void;
  onUpload: (file: File) => Promise<void>;
};

export default function ImportsPage({ suppliers, imports, selectedSupplier, onSelectSupplier, onUpload }: Props) {
  return (
    <>
      <section className="page-header">
        <div>
          <h1>Imports</h1>
          <p>Upload supplier CSV files and track imports.</p>
        </div>
      </section>
      <UploadPanel onUpload={onUpload} suppliers={suppliers} onSelectSupplier={onSelectSupplier} selectedSupplier={selectedSupplier} />
      <ImportHistory items={imports} />
    </>
  );
}
