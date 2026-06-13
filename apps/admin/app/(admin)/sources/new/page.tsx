import { PageHeader } from "../../../../components/page-header";
import { SourceForm } from "../source-form";

export default function NewSourcePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="New Source"
        description="Configure a third-party catalog source"
      />
      <SourceForm />
    </div>
  );
}
