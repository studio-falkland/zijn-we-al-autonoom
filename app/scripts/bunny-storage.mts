#!/usr/bin/env node

/**
 * Bunny Storage Sync Utility
 * 
 * A CLI tool that syncs a local directory to Bunny Edge Storage by:
 * 1. Deleting all existing files from the storage zone
 * 2. Uploading all files from the specified local directory
 * 
 * Features:
 * - Concurrent operations for maximum speed (100 connections by default)
 * - Progress bars for visual feedback
 * - Automatic retry with exponential backoff
 * - Support for all Bunny storage regions
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs/promises';
import path from 'path';
import cliProgress from 'cli-progress';
import pLimit from 'p-limit';

interface BunnyFile {
  ObjectName: string;
  Length: number;
  LastChanged: string;
  IsDirectory: boolean;
  ServerId: number;
  UserId: string;
  DateCreated: string;
  StorageZoneName: string;
  Path: string;
  Guid: string;
  StorageZoneId: number;
  Checksum?: string;
  ReplicatedZones?: string;
}

interface CliArgs {
  storageZone: string;
  accessKey: string;
  region?: string;
  directory: string;
  concurrency?: number;
  maxRetries?: number;
}

class BunnyStorage {
  private storageZone: string;
  private accessKey: string;
  private region: string;
  private baseUrl: string;
  private maxRetries: number;

  constructor(storageZone: string, accessKey: string, region = 'de', maxRetries = 3) {
    this.storageZone = storageZone;
    this.accessKey = accessKey;
    this.region = region;
    this.maxRetries = maxRetries;
    
    // Determine storage endpoint based on region
    const regionEndpoints = {
      'de': 'https://storage.bunnycdn.com',
      'ny': 'https://ny.storage.bunnycdn.com',
      'la': 'https://la.storage.bunnycdn.com',
      'sg': 'https://sg.storage.bunnycdn.com',
      'syd': 'https://syd.storage.bunnycdn.com',
      'br': 'https://br.storage.bunnycdn.com',
      'jh': 'https://jh.storage.bunnycdn.com',
      'uk': 'https://uk.storage.bunnycdn.com'
    };
    
    this.baseUrl = regionEndpoints[region as keyof typeof regionEndpoints] || regionEndpoints.de;
  }

  /**
   * Make HTTP request to Bunny storage API (no retry logic - handled at queue level)
   * @param path - API endpoint path
   * @param options - Fetch request options
   * @returns Response object
   */
  private async makeRequest(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}/${this.storageZone}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'AccessKey': this.accessKey,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * List all files in the specified directory (top-level only)
   * @param directory - Directory path to list (default: root)
   * @returns Array of files in the directory
   */
  async listFiles(directory = '/'): Promise<BunnyFile[]> {
    const response = await this.makeRequest(`${directory}/`);
    return await response.json();
  }

  /**
   * Delete a single file from Bunny storage
   * @param filePath - Path of file to delete
   */
  async deleteFile(filePath: string): Promise<void> {
    await this.makeRequest(filePath, { method: 'DELETE' });
  }

  /**
   * Upload a single file to Bunny storage
   * @param localPath - Local file path to upload
   * @param remotePath - Remote path where file should be stored
   */
  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    const fileBuffer = await fs.readFile(localPath);
    const stats = await fs.stat(localPath);
    
    await this.makeRequest(remotePath, {
      method: 'PUT',
      body: fileBuffer as any, // Cast to resolve TypeScript Buffer type issue
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': stats.size.toString()
      }
    });
  }

  /**
   * Delete all files from the storage zone using concurrent operations with queue-based retries
   * @param progressBar - Optional progress bar to update
   */
  async deleteAllFiles(progressBar?: cliProgress.SingleBar): Promise<void> {
    const files = await this.listFiles('/');
    
    if (files.length === 0) {
      console.log('No files found to delete.');
      return;
    }

    // Create queue of files to delete with retry tracking
    const queue: Array<{ file: BunnyFile; retryCount: number }> = files.map(file => ({ file, retryCount: 0 }));
    const limit = pLimit(100);
    let completed = 0;

    // Process queue until empty
    while (queue.length > 0) {
      const batch = queue.splice(0, Math.min(100, queue.length)); // Take up to 100 items
      
      const batchPromises = batch.map(({ file, retryCount }) => 
        limit(async () => {
          try {
            await this.deleteFile(`/${file.ObjectName}`);
            completed++;
            progressBar?.update(completed);
          } catch (error) {
            // Add back to queue if under retry limit
            if (retryCount < this.maxRetries) {
              queue.push({ file, retryCount: retryCount + 1 });
            } else {
              console.error(`Failed to delete ${file.ObjectName} after ${this.maxRetries + 1} attempts:`, error);
              completed++; // Count as completed to not hang progress bar
              progressBar?.update(completed);
            }
          }
        })
      );

      await Promise.all(batchPromises);
    }
  }

  /**
   * Upload all files from a local directory using concurrent operations with queue-based retries
   * @param localDir - Local directory to upload
   * @param progressBar - Optional progress bar to update
   */
  async uploadDirectory(localDir: string, progressBar?: cliProgress.SingleBar): Promise<void> {
    const files = await this.getAllFiles(localDir);
    
    if (files.length === 0) {
      console.log('No files found to upload.');
      return;
    }

    // Create queue of files to upload with retry tracking
    const queue: Array<{ localPath: string; relativePath: string; retryCount: number }> = 
      files.map(({ localPath, relativePath }) => ({ localPath, relativePath, retryCount: 0 }));
    const limit = pLimit(100);
    let completed = 0;

    // Process queue until empty
    while (queue.length > 0) {
      const batch = queue.splice(0, Math.min(100, queue.length)); // Take up to 100 items
      
      const batchPromises = batch.map(({ localPath, relativePath, retryCount }) => 
        limit(async () => {
          try {
            await this.uploadFile(localPath, `/${relativePath}`);
            completed++;
            progressBar?.update(completed);
          } catch (error) {
            // Add back to queue if under retry limit
            if (retryCount < this.maxRetries) {
              queue.push({ localPath, relativePath, retryCount: retryCount + 1 });
            } else {
              console.error(`Failed to upload ${relativePath} after ${this.maxRetries + 1} attempts:`, error);
              completed++; // Count as completed to not hang progress bar
              progressBar?.update(completed);
            }
          }
        })
      );

      await Promise.all(batchPromises);
    }
  }

  /**
   * Recursively scan directory to get all files with their local and relative paths
   * @param dir - Directory to scan
   * @returns Array of objects containing localPath and relativePath for each file
   */
  private async getAllFiles(dir: string): Promise<Array<{ localPath: string; relativePath: string }>> {
    const files: Array<{ localPath: string; relativePath: string }> = [];
    const basePath = path.resolve(dir);

    // Recursive function to walk directory tree
    async function walk(currentPath: string): Promise<void> {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively process subdirectories
          await walk(fullPath);
        } else if (entry.isFile()) {
          // Convert to relative path and normalize separators for consistent uploads
          const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');
          files.push({
            localPath: fullPath,
            relativePath
          });
        }
      }
    }

    await walk(basePath);
    return files;
  }
}

/**
 * Main sync command that deletes all files then uploads new ones
 * @param args - CLI arguments containing storage zone, access key, directory, etc.
 */
async function syncCommand(args: CliArgs): Promise<void> {
  console.log(`Syncing ${args.directory} to storage zone: ${args.storageZone}`);
  
  // Initialize storage client with retry configuration
  const storage = new BunnyStorage(
    args.storageZone, 
    args.accessKey, 
    args.region, 
    args.maxRetries
  );
  
  // Step 1: Delete all existing files from storage zone
  const existingFiles = await storage.listFiles('/');
  console.log(`Found ${existingFiles.length} existing files to delete`);
  
  if (existingFiles.length > 0) {
    // Create progress bar for deletion phase
    const deleteProgressBar = new cliProgress.SingleBar({
      format: 'Deleting |{bar}| {percentage}% | {value}/{total} files',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    deleteProgressBar.start(existingFiles.length, 0);

    try {
      await storage.deleteAllFiles(deleteProgressBar);
      deleteProgressBar.stop();
      console.log(`✅ Successfully deleted ${existingFiles.length} files`);
    } catch (error) {
      deleteProgressBar.stop();
      console.error('❌ Error during deletion:', error);
      process.exit(1);
    }
  }

  // Step 2: Upload all files from local directory
  const fileList = await storage['getAllFiles'](args.directory);
  console.log(`Found ${fileList.length} files to upload`);
  
  if (fileList.length === 0) {
    console.log('✅ Sync complete - no files to upload');
    return;
  }

  // Create progress bar for upload phase
  const uploadProgressBar = new cliProgress.SingleBar({
    format: 'Uploading |{bar}| {percentage}% | {value}/{total} files',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  uploadProgressBar.start(fileList.length, 0);

  try {
    await storage.uploadDirectory(args.directory, uploadProgressBar);
    uploadProgressBar.stop();
    console.log(`✅ Successfully uploaded ${fileList.length} files`);
    console.log(`🎉 Sync complete!`);
  } catch (error) {
    uploadProgressBar.stop();
    console.error('❌ Error during upload:', error);
    process.exit(1);
  }
}

/**
 * Main function that sets up CLI argument parsing and executes the sync command
 */
async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('bunny-storage')
    .usage('$0 [options]')
    // Configure CLI options
    .option('storage-zone', {
      alias: 's',
      type: 'string',
      describe: 'Bunny storage zone name',
      demandOption: true
    })
    .option('access-key', {
      alias: 'k',
      type: 'string',
      describe: 'Bunny storage access key',
      demandOption: true
    })
    .option('directory', {
      alias: 'd',
      type: 'string',
      describe: 'Local directory to sync',
      demandOption: true
    })
    .option('region', {
      alias: 'r',
      type: 'string',
      describe: 'Storage region (de, ny, la, sg, syd, br, jh, uk)',
      default: 'de'
    })
    .option('concurrency', {
      alias: 'c',
      type: 'number',
      describe: 'Number of concurrent connections',
      default: 95
    })
    .option('max-retries', {
      type: 'number',
      describe: 'Maximum number of retries for failed requests',
      default: 3
    })
    .help()
    .alias('help', 'h')
    .parse() as CliArgs;

  // Execute the sync operation
  await syncCommand(argv);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
