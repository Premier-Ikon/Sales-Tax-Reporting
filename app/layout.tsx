export const metadata = {
  title: "PI Sales Tax Report",
  description: "Backend-only Shopify OAuth app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
