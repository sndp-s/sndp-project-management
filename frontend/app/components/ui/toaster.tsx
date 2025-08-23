import { Toaster as Sonner, type ToasterProps } from "sonner";

export type AppToasterProps = ToasterProps & {
  zIndex?: number;
};

export function Toaster({
  theme = "system",
  position = "top-right",
  richColors = true,
  closeButton = true,
  expand = true,
  duration = 2500,
  zIndex = 60_000,
  className,
  ...props
}: AppToasterProps) {
  return (
    <Sonner
      theme={theme}
      position={position}
      richColors={richColors}
      closeButton={closeButton}
      expand={expand}
      duration={duration}
      className={["toaster group", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
