import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <EmptyState kind="error" title="Entity not found" body="No reputation subject matches that id. The four subjects are B Capital, Eduardo Saverin, Raj Ganguly and Karan Mohla." action={<Button asChild><Link href="/reputation">Back to Reputation &amp; Prestige</Link></Button>} />; }
