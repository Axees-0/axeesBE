import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

export class ScreenshotManager {
  private screenshotDir: string;
  private screenshots: string[] = [];

  constructor(screenshotDir?: string) {
    this.screenshotDir = screenshotDir || path.join(process.cwd(), 'screenshots');
  }

  /**
   * Initialize screenshot directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create screenshot directory:', error);
    }
  }

  /**
   * Save a screenshot
   */
  async save(
    buffer: Buffer | string,
    name: string,
    options?: {
      format?: 'png' | 'jpeg';
      quality?: number;
      annotate?: {
        text?: string;
        highlights?: Array<{ x: number; y: number; width: number; height: number }>;
      };
    }
  ): Promise<string> {
    await this.initialize();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const format = options?.format || 'png';
    const filename = `${timestamp}_${name}.${format}`;
    const filepath = path.join(this.screenshotDir, filename);

    try {
      let image = sharp(buffer);

      // Add annotations if requested
      if (options?.annotate) {
        image = await this.annotateImage(image, options.annotate);
      }

      // Save with quality settings
      if (format === 'jpeg' && options?.quality) {
        await image.jpeg({ quality: options.quality }).toFile(filepath);
      } else {
        await image.toFile(filepath);
      }

      this.screenshots.push(filepath);
      return filepath;
    } catch (error) {
      console.error('Failed to save screenshot:', error);
      throw error;
    }
  }

  /**
   * Annotate an image with highlights and text
   */
  private async annotateImage(
    image: sharp.Sharp,
    annotations: {
      text?: string;
      highlights?: Array<{ x: number; y: number; width: number; height: number }>;
    }
  ): Promise<sharp.Sharp> {
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    const overlays: any[] = [];

    // Add highlight rectangles
    if (annotations.highlights && annotations.highlights.length > 0) {
      for (const highlight of annotations.highlights) {
        // Create a red rectangle with transparency
        const rect = Buffer.from(
          `<svg width="${highlight.width}" height="${highlight.height}">
            <rect x="0" y="0" width="${highlight.width}" height="${highlight.height}" 
                  fill="none" stroke="red" stroke-width="3" stroke-opacity="0.8"/>
          </svg>`
        );

        overlays.push({
          input: rect,
          top: highlight.y,
          left: highlight.x
        });
      }
    }

    // Add text overlay
    if (annotations.text) {
      const textSvg = Buffer.from(
        `<svg width="${width}" height="50">
          <rect x="0" y="0" width="${width}" height="50" fill="black" fill-opacity="0.7"/>
          <text x="10" y="30" font-family="Arial" font-size="20" fill="white">
            ${annotations.text}
          </text>
        </svg>`
      );

      overlays.push({
        input: textSvg,
        top: height - 50,
        left: 0
      });
    }

    if (overlays.length > 0) {
      return image.composite(overlays);
    }

    return image;
  }

  /**
   * Compare two screenshots
   */
  async compare(
    baseline: string | Buffer,
    current: string | Buffer,
    options?: {
      threshold?: number;
      outputPath?: string;
    }
  ): Promise<{
    similar: boolean;
    difference: number;
    diffImage?: string;
  }> {
    try {
      const baselineImage = sharp(baseline);
      const currentImage = sharp(current);

      // Get metadata to ensure same dimensions
      const [baselineMeta, currentMeta] = await Promise.all([
        baselineImage.metadata(),
        currentImage.metadata()
      ]);

      if (baselineMeta.width !== currentMeta.width || baselineMeta.height !== currentMeta.height) {
        return {
          similar: false,
          difference: 100,
          diffImage: undefined
        };
      }

      // Convert to raw pixel data for comparison
      const [baselineBuffer, currentBuffer] = await Promise.all([
        baselineImage.raw().toBuffer(),
        currentImage.raw().toBuffer()
      ]);

      // Calculate pixel difference
      let diffCount = 0;
      const totalPixels = baselineBuffer.length / 3; // RGB channels

      for (let i = 0; i < baselineBuffer.length; i++) {
        if (baselineBuffer[i] !== currentBuffer[i]) {
          diffCount++;
        }
      }

      const difference = (diffCount / totalPixels) * 100;
      const threshold = options?.threshold || 0.1;
      const similar = difference <= threshold;

      // Generate diff image if requested
      let diffImage: string | undefined;
      if (options?.outputPath) {
        // Create a diff visualization
        const width = baselineMeta.width!;
        const height = baselineMeta.height!;
        const diffBuffer = Buffer.alloc(width * height * 4); // RGBA

        for (let i = 0; i < baselineBuffer.length; i += 3) {
          const idx = (i / 3) * 4;
          const isDiff = baselineBuffer[i] !== currentBuffer[i] ||
                        baselineBuffer[i + 1] !== currentBuffer[i + 1] ||
                        baselineBuffer[i + 2] !== currentBuffer[i + 2];

          if (isDiff) {
            // Red for differences
            diffBuffer[idx] = 255;
            diffBuffer[idx + 1] = 0;
            diffBuffer[idx + 2] = 0;
            diffBuffer[idx + 3] = 255;
          } else {
            // Grayscale for similarities
            const gray = Math.floor((baselineBuffer[i] + baselineBuffer[i + 1] + baselineBuffer[i + 2]) / 3);
            diffBuffer[idx] = gray;
            diffBuffer[idx + 1] = gray;
            diffBuffer[idx + 2] = gray;
            diffBuffer[idx + 3] = 255;
          }
        }

        await sharp(diffBuffer, {
          raw: {
            width,
            height,
            channels: 4
          }
        }).toFile(options.outputPath);

        diffImage = options.outputPath;
      }

      return {
        similar,
        difference,
        diffImage
      };
    } catch (error) {
      console.error('Failed to compare screenshots:', error);
      throw error;
    }
  }

  /**
   * Get all captured screenshots
   */
  getScreenshots(): string[] {
    return [...this.screenshots];
  }

  /**
   * Clear screenshot list (doesn't delete files)
   */
  clear(): void {
    this.screenshots = [];
  }

  /**
   * Delete all screenshots
   */
  async cleanup(): Promise<void> {
    for (const screenshot of this.screenshots) {
      try {
        await fs.unlink(screenshot);
      } catch (error) {
        console.error(`Failed to delete screenshot ${screenshot}:`, error);
      }
    }
    this.screenshots = [];
  }
}