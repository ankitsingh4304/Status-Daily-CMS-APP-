/**
 * Renders an inline script that runs synchronously during HTML parsing (server
 * render) but is inert on the client, avoiding React's dev warning about
 * `<script>` tags in components. Pattern from Next.js docs
 * (preventing-flash-before-hydration). Used for the no-flash theme script.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
