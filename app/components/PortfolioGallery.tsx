"use client";

import { useState } from "react";
import NextImage from "next/image";
import { ArrowLeft, ArrowRight } from "./UiIcon";

type Image = { id: string; image_url: string };

export default function PortfolioGallery({ images, title }: { images: Image[]; title: string }) {
    const [active, setActive] = useState(0);
    if (images.length === 0) return null;

    const current = images[active];
    const move = (direction: -1 | 1) => setActive((index) => (index + direction + images.length) % images.length);

    return (
        <div className="mt-4">
            <div className="group relative aspect-video overflow-hidden border border-line">
                <NextImage src={current.image_url} alt={`${title}, image ${active + 1} of ${images.length}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-opacity duration-150" />
                {images.length > 1 && (
                    <>
                        <button type="button" aria-label="Previous project image" onClick={() => move(-1)} className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center border border-line bg-paper/90 text-ink opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"><ArrowLeft /></button>
                        <button type="button" aria-label="Next project image" onClick={() => move(1)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center border border-line bg-paper/90 text-ink opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"><ArrowRight /></button>
                    </>
                )}
            </div>
            {images.length > 1 && (
                <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-graphite">Image {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
                    <div className="flex gap-1.5" aria-label="Choose project image">
                        {images.map((image, index) => <button key={image.id} type="button" aria-label={`Show image ${index + 1}`} aria-current={index === active} onClick={() => setActive(index)} className={`h-1.5 w-5 border border-line transition-colors ${index === active ? "bg-ink" : "bg-paper hover:bg-line"}`} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
