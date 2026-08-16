
export const useTheme = (title: string, icon?: string) => {

    document.title = title;

    const iconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (iconLink && icon) {
        iconLink.href = icon;
    }
}