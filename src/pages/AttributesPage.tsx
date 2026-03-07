import AttributeRules from "../components/AttributeRules";

type Props = {
  attributes: any[];
  onUpsert: (payload: { master_attribute: string; allowed_values: string[]; rules?: string }) => Promise<void>;
};

export default function AttributesPage({ attributes, onUpsert }: Props) {
  return (
    <>
      <section className="page-header">
        <div>
          <h1>Master Attributes</h1>
          <p>Define allowed attributes and values.</p>
        </div>
      </section>
      <AttributeRules items={attributes} onUpsert={onUpsert} />
    </>
  );
}
