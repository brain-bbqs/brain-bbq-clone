import { PageMeta } from "@/components/PageMeta";

export default function DandiAssistant() {
  return (
    <>
      <PageMeta
        title="DANDI Metadata Assistant | BBQS"
        description="Edit and manage Dandiset metadata using the DANDI Metadata Assistant."
      />
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
        <iframe
          src="https://medit.dandiarchive.org/"
          title="DANDI Metadata Assistant"
          className="w-full flex-1 border-0"
          allow="clipboard-write"
        />
      </div>
    </>
  );
}
