import { internalDestination } from "./navigation";
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";
type Route = { path: string; search: URLSearchParams };
const Ctx = createContext<{ route: Route; go: (to: string) => void }>({
  route: { path: "/", search: new URLSearchParams() },
  go: () => {},
});
const read = (): Route => ({
  path: location.pathname.replace(/\/+$/, "") || "/",
  search: new URLSearchParams(location.search),
});
export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const on = () => setRoute(read());
    addEventListener("popstate", on);
    return () => removeEventListener("popstate", on);
  }, []);
  const go = useCallback((to: string) => {
    const safe = internalDestination(to, location.origin);
    if (!safe) return;
    history.pushState(null, "", safe);
    setRoute(read());
    scrollTo({ top: 0, behavior: "auto" });
  }, []);
  return <Ctx.Provider value={{ route, go }}>{children}</Ctx.Provider>;
}
export const useRoute = () => useContext(Ctx);
export function Link({
  href,
  children,
  className,
  onClick,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const { go } = useRoute();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      rest.target === "_blank" ||
      !internalDestination(href, location.origin)
    )
      return;
    e.preventDefault();
    onClick && onClick();
    go(href);
  };
  return (
    <a href={href} className={className} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
