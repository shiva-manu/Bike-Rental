/**
 * Converts Google Drive sharing links to direct image links.
 * Handled formats:
 * - https://drive.google.com/file/d/ID/view
 * - https://drive.google.com/open?id=ID
 * - https://drive.google.com/uc?id=ID
 */
export function getDirectImageUrl(url: string): string {
    if (!url) return "";

    // Check if it's a Google Drive link
    if (url.includes('drive.google.com')) {
        // Robust regex to extract ID from various drive link formats
        // Matches /d/ID, id=ID, open?id=ID, file/d/ID, etc.
        const match = url.match(/(?:d\/|id=|open\?id=|file\/d\/)([a-zA-Z0-9_-]{25,})/);
        const fileId = match ? match[1] : null;

        if (fileId) {
            // Using the 'uc?export=view' endpoint is the standard way to display
            // images from Drive. It's often more reliable for 'Anyone with link'
            // files than the thumbnail service.
            return `https://drive.google.com/uc?id=${fileId}&export=view`;
        }
    }

    return url;
}
