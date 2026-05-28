import { StoreProvider } from "@/lib/store/providers";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreProvider>{children}</StoreProvider>;
}
