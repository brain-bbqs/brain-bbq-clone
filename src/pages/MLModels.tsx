import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

const MLModels = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Machine Learning Models</h1>
        <p className="text-muted-foreground">
          A catalog of ML models used across BBQS projects.
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Model Name</TableHead>
              <TableHead>Architecture</TableHead>
              <TableHead>Species</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                No models added yet.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MLModels;
