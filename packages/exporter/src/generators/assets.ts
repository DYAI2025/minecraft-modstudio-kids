export function dataUriToBuffer(dataUri: string): Buffer {
    // Expected format: data:image/png;base64,...
    const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
        // Fallback or empty 1x1 png if invalid
        // 1x1 transparent pixel
        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    }
    
    return Buffer.from(matches[2], 'base64');
}
