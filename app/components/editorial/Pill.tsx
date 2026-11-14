import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./editorial.module.css";

type Variant = "default" | "blue" | "orange" | "ink" | "quiet";
type Size = "default" | "small";

const variantClass: Record<Variant, string> = {
    default: "",
    blue: styles.pillBlue,
    orange: styles.pillOrange,
    ink: styles.pillInk,
    quiet: styles.pillQuiet,
};

type BaseProps = {
    children: ReactNode;
    variant?: Variant;
    size?: Size;
    className?: string;
};

type LinkProps = BaseProps & {
    href: string;
    /** External links render a plain anchor with safe rel/target. */
    external?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;

type ButtonProps = BaseProps & {
    href?: undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

function omit(value: object, keys: string[]): Record<string, unknown> {
    const copy: Record<string, unknown> = { ...value };
    for (const key of keys) delete copy[key];
    return copy;
}

export default function Pill(props: LinkProps | ButtonProps) {
    const { children, variant = "default", size = "default", className } = props;
    const classes = [styles.pill, variantClass[variant], size === "small" ? styles.pillSmall : "", className ?? ""]
        .filter(Boolean)
        .join(" ");
    const rest = omit(props, ["children", "variant", "size", "className", "href", "external"]);

    if (props.href !== undefined) {
        if (props.external) {
            return <a className={classes} href={props.href} target="_blank" rel="noreferrer" {...rest}>{children}</a>;
        }
        return <Link className={classes} href={props.href} {...rest}>{children}</Link>;
    }

    return <button className={classes} type="button" {...rest}>{children}</button>;
}
