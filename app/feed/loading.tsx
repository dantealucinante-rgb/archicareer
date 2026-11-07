import styles from "./feed.module.css";

function LoadingPost({ media = false }: { media?: boolean }) {
    return <article className={styles.feedSkeleton} aria-hidden="true">
        <div className={styles.skeletonAuthor}><div className={styles.skeletonAvatar} /><div className={styles.skeletonLines}><span className={styles.skeletonLine} /><span className={styles.skeletonLine} /></div></div>
        <div className={styles.skeletonCopy}><span className={styles.skeletonLine} /><span className={styles.skeletonLine} /></div>
        {media && <div className={styles.skeletonMedia} />}
    </article>;
}

export default function FeedLoading() {
    return <main className={styles.feedPage} aria-label="Loading feed">
        <div className={`${styles.feedShell} ${styles.feedShellWithRail}`}>
            <aside className={styles.leftRail}><div className={styles.skeletonNav} aria-hidden="true"><span /><span /><span /><span /></div></aside>
            <section className={styles.timeline}>
                <header className={styles.timelineHeader}><span className={styles.skeletonTitle} /><span className={styles.latestLabel}>Latest</span></header>
                <LoadingPost media /><LoadingPost /><LoadingPost />
            </section>
        </div>
    </main>;
}
