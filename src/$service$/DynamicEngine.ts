// @ts-ignore
import {formatCss, formatHex, interpolate, oklch, parse } from "culori";
import { fixedClientZoom } from "../$core$/Zoom";

//
const electronAPI = "electronBridge";

//
export const pickBgColor = (x, y, holder: HTMLElement | null = null)=>{
    const source = Array.from(document.elementsFromPoint(x, y));
    const opaque = source.sort((na, nb)=>{
        const zIndexA = parseInt(getComputedStyle(na as HTMLElement, "").zIndex || "0") || 0;
        const zIndexB = parseInt(getComputedStyle(nb as HTMLElement, "").zIndex || "0") || 0;
        return Math.sign(zIndexB - zIndexA);
    }).filter((node)=>{
        if (!(node instanceof HTMLElement)) return false;
        const computed = getComputedStyle(node as HTMLElement, "");
        const value  = computed.backgroundColor || "transparent";
        const parsed = parse(value);
        return ((parsed.alpha == null || parsed.alpha > 0.1) && value != "transparent") && node != holder;
    });

    //
    if (opaque[0] && opaque[0] instanceof HTMLElement) {
        const color = getComputedStyle(opaque[0] as HTMLElement, "")?.backgroundColor || "transparent"; //|| baseColor;
        if (holder && holder.style.getPropertyValue("--tm-adapt") != color) {
            holder.style.setProperty("--tm-adapt", color, "");
        }
        return color;
    }

    //
    return "transparent";
};

//
export const makeContrast = (color)=>{
    const cl = oklch(color);
    cl.l = Math.sign(0.5 - cl.l);
    cl.c *= 0.1;
    return formatCss(cl);
}

//
export const pickFromCenter = (holder)=>{
    const box = holder?.getBoundingClientRect?.(); //* zoomOf()
    if (box) {
        const xy: [number, number] = [(box.left + box.right) / 2 * fixedClientZoom(), (box.top + box.bottom) / 2 * fixedClientZoom()];
        return pickBgColor(...xy, holder);
    }
}

//
export const switchTheme = (isDark = false, root = document.documentElement) => {
    const media = root?.querySelector?.('meta[data-theme-color]');
    if (media) {
        const color = pickBgColor(window.innerWidth - 64, 30);
        media.setAttribute("content", color);
    }

    //
    if (window?.[electronAPI] && root == document.documentElement) {
        const color = pickBgColor(window.innerWidth - 64, 30);
        window?.[electronAPI]?.setThemeColor?.(formatHex(color), formatHex(makeContrast(color)));
    }

    //
    root.querySelectorAll("[data-scheme=\"dynamic-transparent\"], [data-scheme=\"dynamic\"]").forEach((target)=>{
        if (target) {
            pickFromCenter(target);
        }
    });
};

//
export const dynamicTheme = (ROOT = document.documentElement)=>{
    //
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", ({matches}) => { switchTheme(matches, ROOT); });

    //
    ROOT.addEventListener("u2-appear", ()=>{
        switchTheme(window.matchMedia("(prefers-color-scheme: dark)").matches, ROOT);
    });

    //
    ROOT.addEventListener("u2-hidden", ()=>{
        switchTheme(window.matchMedia("(prefers-color-scheme: dark)").matches, ROOT);
    });

    //
    setInterval(()=>{
        switchTheme(window.matchMedia("(prefers-color-scheme: dark)").matches, ROOT);
    }, 2000);

    //
    ROOT.addEventListener("u2-theme-change", ()=>{
        switchTheme(window.matchMedia("(prefers-color-scheme: dark)").matches, ROOT);
    });
}

//
export default dynamicTheme;
