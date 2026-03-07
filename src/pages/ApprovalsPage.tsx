import ApprovalHistory from "../components/ApprovalHistory";

type Props = {
  items: any[];
};

export default function ApprovalsPage({ items }: Props) {
  return (
    <>
      <section className="page-header">
        <div>
          <h1>Approvals</h1>
          <p>Audit approvals and review history.</p>
        </div>
      </section>
      <ApprovalHistory items={items} />
    </>
  );
}
