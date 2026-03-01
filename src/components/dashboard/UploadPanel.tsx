import { useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  title: string;
  description: string;
  accept?: string;
  onUpload: (text: string, fileName?: string) => void;
  result?: { success: boolean; message: string } | null;
}

export function UploadPanel({ title, description, accept = ".csv", onUpload, result }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onUpload(text, file.name);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card className="p-5 border border-border bg-card">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
          <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => inputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" />
            Upload CSV
          </Button>
          {result && (
            <div className={`flex items-center gap-1.5 text-xs mt-2 ${result.success ? "text-health-green" : "text-health-red"}`}>
              {result.success ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {result.message}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
