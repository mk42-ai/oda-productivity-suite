"use client";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <EmptyState kind="error" title="Something went wrong" body="This page could not be loaded. The cached snapshot may still be available on other pages." action={<span style={{display:"inline-flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}><Button onClick={reset}>Try again</Button><Button asChild variant="outline"><a href="/overview">Go to Overview</a></Button><Button asChild variant="outline"><a href="/companies">Go to Companies</a></Button></span>} />;
}
