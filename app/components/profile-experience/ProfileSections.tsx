import Image from "next/image";
import type { EngagementSummary, FeedPost } from "@/types";
import ContentEngagement from "@/app/components/ContentEngagement";
import type { PublicProfilePageData } from "./ProfilePageData";
import SectionHeading from "./SectionHeading";
import styles from "./profile-experience.module.css";

export function PostsSection({ data }: { data: PublicProfilePageData }) {
    if (data.posts.length === 0) return null;

    return <section id="posts" className={styles.section}>
        <SectionHeading
            title="Recent posts"
            note={`${data.posts.length} ${data.posts.length === 1 ? "post" : "posts"} from this profile`}
        />
        <ol className={styles.postList}>
            {data.posts.map((post) => <PostItem
                key={post.id}
                post={post}
                engagement={data.engagement}
                currentUserId={data.currentUserId}
                isOwner={data.isOwner}
            />)}
        </ol>
    </section>;
}

function PostItem({ post, engagement, currentUserId, isOwner }: { post: FeedPost; engagement: Record<string, EngagementSummary>; currentUserId: string | null; isOwner: boolean }) {
    return <li className={styles.post}>
        <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</time>
        {post.title && <h3 className={styles.postTitle}>{post.title}</h3>}
        {post.content && <p className={styles.postContent}>{post.content}</p>}
        {post.image_url && <div className={styles.postImage}>
            <Image src={post.image_url} alt={`Image shared by ${post.author.name}`} fill sizes="(max-width: 700px) 100vw, 720px" />
        </div>}
        <ContentEngagement
            target={{ post_id: post.id }}
            initial={engagement[post.id] ?? { reactionCount: post.reaction_count, commentCount: post.comment_count, userReacted: post.user_reacted }}
            currentUserId={currentUserId}
            canModerate={isOwner}
            shareUrl={`/posts/${post.id}`}
        />
    </li>;
}
