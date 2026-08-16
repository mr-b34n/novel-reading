import { faStar, faUsers, faFire } from "@fortawesome/free-solid-svg-icons";

export const POST_TAG_CLASSES = [
    "bg-surface-hover text-text-muted hover:text-primary transition-colors",
];

export const POST_BADGE_MAP = {
    foryou: { icon: faStar, label: "Recommended", classes: "text-primary bg-primary/10 border border-primary/20" },
    following: { icon: faUsers, label: "Following", classes: "text-primary bg-primary/10 border border-primary/20" },
    hot: { icon: faFire, label: "Trending", classes: "text-orange-500 bg-orange-500/10 border border-orange-500/20" },
};
