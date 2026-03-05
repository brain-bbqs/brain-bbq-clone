import { PageMeta } from "@/components/PageMeta";

export default function DandiAssistant() {
  return (
    <>
      <PageMeta
        title="EMBER Metadata Assistant | BBQS"
        description="Edit and manage dataset metadata using the EMBER Metadata Assistant."
      />
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
        <iframe
          src="https://medit.dandiarchive.org/?instance=https://api.dandi.emberarchive.org"
          title="EMBER Metadata Assistant"
          className="w-full flex-1 border-0"
          allow="clipboard-write"
        />
      </div>
    </>
  );
}
