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
                <header className={styles.timelineHeader}><p className={styles.feedKicker}><span aria-hidden="true" />The community feed</p><span className={styles.skeletonTitle} /></header>
                <div className={styles.feedFilterBar} aria-hidden="true"><span className={styles.filterPill}>All</span><span className={styles.filterPill}>Projects</span><span className={styles.filterPill}>Discussions</span></div>
                <LoadingPost media /><LoadingPost /><LoadingPost />
            </section>
        </div>
    </main>;
}
