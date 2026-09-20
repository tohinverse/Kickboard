import Image from "next/image";

/*
  A framed app screenshot, or a labelled dashed block standing in for one that
  has not been captured yet.

  Whether to show the placeholder is an explicit prop the page sets, never a
  filesystem probe: a server side fs check behaves differently in the
  standalone build the Dockerfile produces, and it would quietly hide a missing
  asset rather than declaring it. Either way the frame reserves the same aspect
  ratio, so the page does not reflow once the real capture lands.
*/
export function ScreenshotFrame({
  src,
  alt,
  width,
  height,
  caption,
  placeholder = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  placeholder?: boolean;
}) {
  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {placeholder ? (
          <div
            style={{ aspectRatio: `${width} / ${height}` }}
            className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6"
          >
            <span className="text-center text-sm font-medium text-slate-500">{alt}</span>
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full rounded-lg"
          />
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-slate-500">{caption}</figcaption>
      )}
    </figure>
  );
}
