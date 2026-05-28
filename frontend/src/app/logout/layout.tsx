import { StoreProvider } from "@/lib/store/providers";

export default function LogoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreProvider>{children}</StoreProvider>;
}
