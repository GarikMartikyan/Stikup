import { StoreProvider } from "@/lib/store/providers";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreProvider>{children}</StoreProvider>;
}
