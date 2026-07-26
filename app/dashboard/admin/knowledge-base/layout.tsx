/**
 * Server layout for the knowledge-base segment. Exists for one reason: the
 * page itself is a client component, and route segment config must live in a
 * server file. maxDuration covers the Analyze server action invoked from this
 * route — a full-corpus analysis on a large model runs for minutes, far past
 * the default serverless limit.
 */
export const maxDuration = 300;

export default function KnowledgeBaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
