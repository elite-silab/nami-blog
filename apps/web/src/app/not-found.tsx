import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative mx-auto min-h-[calc(100dvh-12rem)] max-w-2xl overflow-hidden px-4 py-20 text-center sm:py-28">
      <div className="site-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 opacity-70" />
      <p className="font-display text-8xl font-semibold leading-none text-[var(--color-primary)]/25 sm:text-9xl">
        404
      </p>
      <h1 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
        这条航线没有找到
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--color-text-secondary)] sm:text-base">
        页面可能已经移动、删除，或者链接里有一个小小的拼写错误。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]">
          回到首页
        </Link>
        <Link href="/blog" className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-5 text-sm font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
          去读一篇文章
        </Link>
      </div>
    </section>
  );
}
