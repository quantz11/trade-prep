import { SavedTrade } from '../types';
import JSZip from 'jszip';

export interface WorkFolderState {
  isSupported: boolean;
  dirHandle: FileSystemDirectoryHandle | null;
  folderName: string | null;
  isVirtual: boolean;
  isWritable: boolean;
  error: string | null;
}

export function isAIStudioEnvironment(): boolean {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname;
  const inIframe = window.self !== window.top;
  return (
    inIframe ||
    hostname.includes('ais-') ||
    hostname.includes('ai.studio') ||
    hostname.includes('.run.app')
  );
}

export function isFileSystemAccessSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('showDirectoryPicker' in window)) return false;
  if (isAIStudioEnvironment()) return false;
  return true;
}

// Persist FileSystemDirectoryHandle in IndexedDB for localhost/native browsers
export async function getPersistedDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('trade_journal_fs_db', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('handles');
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('handles', 'readonly');
        const store = tx.objectStore('handles');
        const getReq = store.get('work_dir_handle');
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function persistDirHandle(handle: FileSystemDirectoryHandle | null): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('trade_journal_fs_db', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('handles');
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('handles', 'readwrite');
        const store = tx.objectStore('handles');
        if (handle) {
          store.put(handle, 'work_dir_handle');
        } else {
          store.delete('work_dir_handle');
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function normalizeCurrencyPair(pair: string): string {
  return pair.toUpperCase().replace('/', '').trim();
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const labelToProp: Record<string, { section: 'htf' | 'ltf'; key: string }> = {
  'HTF VC1': { section: 'htf', key: 'vc1Image' },
  'HTF VC2': { section: 'htf', key: 'vc2Image' },
  'HTF IDM1': { section: 'htf', key: 'idm1Image' },
  'HTF IDM2': { section: 'htf', key: 'idm2Image' },
  'HTF VC3': { section: 'htf', key: 'vc3Image' },
  'LTF Trigger 1': { section: 'ltf', key: 'trigger1Image' },
  'LTF Entry 1': { section: 'ltf', key: 'entry1Image' },
  'LTF VC': { section: 'ltf', key: 'vcImage' },
  'LTF VC Entry': { section: 'ltf', key: 'vcEntryImage' },
  'LTF Trigger 2': { section: 'ltf', key: 'trigger2Image' },
  'LTF Entry 2': { section: 'ltf', key: 'entry2Image' },
};

export async function saveTradeToWorkFolder(
  dirHandle: FileSystemDirectoryHandle | null,
  isVirtual: boolean,
  folderName: string | null,
  trade: SavedTrade
): Promise<{ success: boolean; imageCount: number; zipBlob?: Blob; updatedDirHandle?: FileSystemDirectoryHandle; error?: string }> {
  try {
    const pairFolder = normalizeCurrencyPair(trade.config.instrument || 'EURUSD');
    let imageCounter = 1;
    const imageMetadataList: Array<{ label: string; filename: string }> = [];

    const steps: Array<{ label: string; image?: string }> = [
      { label: 'HTF VC1', image: trade.htf.vc1Image },
      { label: 'HTF VC2', image: trade.htf.vc2Image },
      { label: 'HTF IDM1', image: trade.htf.idm1Image },
      { label: 'HTF IDM2', image: trade.htf.idm2Image },
      { label: 'HTF VC3', image: trade.htf.vc3Image },
      { label: 'LTF Trigger 1', image: trade.ltf.trigger1Image },
      { label: 'LTF Entry 1', image: trade.ltf.entry1Image },
      { label: 'LTF VC', image: trade.ltf.vcImage },
      { label: 'LTF VC Entry', image: trade.ltf.vcEntryImage },
      { label: 'LTF Trigger 2', image: trade.ltf.trigger2Image },
      { label: 'LTF Entry 2', image: trade.ltf.entry2Image },
    ];

    const updatedTrade = JSON.parse(JSON.stringify(trade));
    const zip = new JSZip();
    const tradeFolderZip = isAIStudioEnvironment() ? zip.folder(`${pairFolder}/${trade.id}`) : null;

    let activeHandle = dirHandle;
    if (!activeHandle && !isVirtual) {
      activeHandle = await getPersistedDirHandle();
    }

    // If outside AI Studio and no handle is set, try requesting directory picker directly on user action
    if (!activeHandle && !isAIStudioEnvironment() && isFileSystemAccessSupported()) {
      try {
        // @ts-ignore
        activeHandle = await window.showDirectoryPicker({
          id: 'TradeJournalWorkFolder',
          mode: 'readwrite',
        });
        if (activeHandle) {
          await persistDirHandle(activeHandle);
        }
      } catch (err) {
        console.warn('Directory picker prompt cancelled or restricted:', err);
      }
    }

    // Verify permission if directory handle exists
    if (activeHandle) {
      try {
        // @ts-ignore
        if (activeHandle.queryPermission) {
          // @ts-ignore
          let q = await activeHandle.queryPermission({ mode: 'readwrite' });
          if (q !== 'granted') {
            // @ts-ignore
            q = await activeHandle.requestPermission({ mode: 'readwrite' });
          }
        }
      } catch (permErr) {
        console.warn('Native FS permission query warning:', permErr);
      }
    }

    const imageBlobs: Array<{ filename: string; blob: Blob }> = [];

    for (const step of steps) {
      if (step.image && step.image.startsWith('data:image')) {
        const filename = `image-${String(imageCounter).padStart(3, '0')}.png`;
        imageMetadataList.push({ label: step.label, filename });

        const res = await fetch(step.image);
        const blob = await res.blob();
        imageBlobs.push({ filename, blob });

        if (tradeFolderZip) {
          tradeFolderZip.file(filename, blob);
        }

        if (step.label === 'HTF VC1') updatedTrade.htf.vc1Image = filename;
        if (step.label === 'HTF VC2') updatedTrade.htf.vc2Image = filename;
        if (step.label === 'HTF IDM1') updatedTrade.htf.idm1Image = filename;
        if (step.label === 'HTF IDM2') updatedTrade.htf.idm2Image = filename;
        if (step.label === 'HTF VC3') updatedTrade.htf.vc3Image = filename;
        if (step.label === 'LTF Trigger 1') updatedTrade.ltf.trigger1Image = filename;
        if (step.label === 'LTF Entry 1') updatedTrade.ltf.entry1Image = filename;
        if (step.label === 'LTF VC') updatedTrade.ltf.vcImage = filename;
        if (step.label === 'LTF VC Entry') updatedTrade.ltf.vcEntryImage = filename;
        if (step.label === 'LTF Trigger 2') updatedTrade.ltf.trigger2Image = filename;
        if (step.label === 'LTF Entry 2') updatedTrade.ltf.entry2Image = filename;

        imageCounter++;
      }
    }

    const reportData = {
      ...updatedTrade,
      sync: {
        local: true,
        firebase: true,
        lastSyncedAt: new Date().toISOString(),
      },
      imageManifest: imageMetadataList,
    };

    const reportJsonString = JSON.stringify(reportData, null, 2);
    if (tradeFolderZip) {
      tradeFolderZip.file('report.json', reportJsonString);
    }

    // Write directly to local work folder if directory handle is available
    if (activeHandle) {
      try {
        const pairHandle = await activeHandle.getDirectoryHandle(pairFolder, { create: true });
        const tradeHandle = await pairHandle.getDirectoryHandle(trade.id, { create: true });

        // Write screenshot files directly to the local trade folder
        for (const item of imageBlobs) {
          const fileHandle = await tradeHandle.getFileHandle(item.filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(item.blob);
          await writable.close();
        }

        // Write report.json directly to the local trade folder
        const reportFileHandle = await tradeHandle.getFileHandle('report.json', { create: true });
        const reportWritable = await reportFileHandle.createWritable();
        await reportWritable.write(reportJsonString);
        await reportWritable.close();
      } catch (fsErr) {
        console.error('Native FS write error:', fsErr);
        if (!isAIStudioEnvironment()) {
          const errMsg = fsErr instanceof Error ? fsErr.message : String(fsErr);
          return { success: false, imageCount: imageMetadataList.length, error: errMsg };
        }
      }
    }

    // Only produce a zipBlob when running in AI Studio environment
    let zipBlob: Blob | undefined;
    if (isAIStudioEnvironment() && (isVirtual || !activeHandle)) {
      zipBlob = await zip.generateAsync({ type: 'blob' });
    }

    return {
      success: true,
      imageCount: imageMetadataList.length,
      zipBlob,
      updatedDirHandle: activeHandle || undefined,
    };
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error('Failed to save trade to Work Folder:', errorMsg);
    return { success: false, imageCount: 0, error: errorMsg };
  }
}

// Find all directories containing a report.json or *.json trade reports
async function findTradeDirectories(
  dirHandle: FileSystemDirectoryHandle,
  depth = 0,
  maxDepth = 4
): Promise<Array<{ dir: FileSystemDirectoryHandle; name: string }>> {
  const tradeDirs: Array<{ dir: FileSystemDirectoryHandle; name: string }> = [];
  if (depth > maxDepth) return tradeDirs;

  try {
    // Check if this directory itself has a report.json
    let hasReport = false;
    try {
      await dirHandle.getFileHandle('report.json');
      hasReport = true;
    } catch {
      hasReport = false;
    }

    if (hasReport) {
      tradeDirs.push({ dir: dirHandle, name: dirHandle.name });
      return tradeDirs;
    }

    // Check subdirectories
    // @ts-ignore
    for await (const [name, entry] of dirHandle.entries()) {
      if (entry.kind === 'directory') {
        const subDirs = await findTradeDirectories(entry as FileSystemDirectoryHandle, depth + 1, maxDepth);
        tradeDirs.push(...subDirs);
      }
    }
  } catch (err) {
    console.warn('Error reading directory entries:', err);
  }
  return tradeDirs;
}

// Scan local work folder and import all trade records with restored screenshots
export async function scanAndImportWorkFolder(
  currentHandle: FileSystemDirectoryHandle | null,
  promptFolderPicker: boolean = false,
  isVirtual: boolean = false
): Promise<{
  success: boolean;
  trades: SavedTrade[];
  count: number;
  updatedDirHandle?: FileSystemDirectoryHandle;
  error?: string;
}> {
  let activeHandle = promptFolderPicker ? null : currentHandle;
  if (!activeHandle && !promptFolderPicker && !isVirtual) {
    activeHandle = await getPersistedDirHandle();
  }

  // If no handle is present or user requested to pick folder, prompt directory picker
  if (!activeHandle && isFileSystemAccessSupported()) {
    try {
      // @ts-ignore
      activeHandle = await window.showDirectoryPicker({
        id: 'TradeJournalWorkFolder',
        mode: 'readwrite',
      });
      if (activeHandle) {
        await persistDirHandle(activeHandle);
      }
    } catch (pickerErr) {
      return {
        success: false,
        trades: [],
        count: 0,
        error: 'Directory access was not granted or folder picker was cancelled.',
      };
    }
  }

  if (!activeHandle) {
    return {
      success: false,
      trades: [],
      count: 0,
      error: 'No local work folder selected or connected.',
    };
  }

  // Check / request readwrite permission
  try {
    // @ts-ignore
    if (activeHandle.queryPermission) {
      // @ts-ignore
      let q = await activeHandle.queryPermission({ mode: 'readwrite' });
      if (q !== 'granted') {
        // @ts-ignore
        q = await activeHandle.requestPermission({ mode: 'readwrite' });
      }
    }
  } catch (permErr) {
    console.warn('Permission query warning during scan:', permErr);
  }

  try {
    const tradeDirectories = await findTradeDirectories(activeHandle);
    const importedTrades: SavedTrade[] = [];

    // Also check if there are standalone JSON files in the selected root directory itself
    try {
      // @ts-ignore
      for await (const [fileName, entry] of activeHandle.entries()) {
        if (entry.kind === 'file' && fileName.endsWith('.json')) {
          try {
            const file = await (entry as FileSystemFileHandle).getFile();
            const text = await file.text();
            const tradeData: SavedTrade = JSON.parse(text);
            if (tradeData && tradeData.id && tradeData.config) {
              tradeData.sync = {
                local: true,
                firebase: true,
                status: 'SYNCED',
                lastSyncedAt: new Date().toISOString(),
              };
              importedTrades.push(tradeData);
            }
          } catch {
            // ignore non-trade json files
          }
        }
      }
    } catch (e) {
      console.warn('Root entries scan notice:', e);
    }

    for (const { dir } of tradeDirectories) {
      try {
        let reportText = '';
        try {
          const reportFileHandle = await dir.getFileHandle('report.json');
          const reportFile = await reportFileHandle.getFile();
          reportText = await reportFile.text();
        } catch {
          // Look for any .json file in the trade dir
          // @ts-ignore
          for await (const [fName, fEntry] of dir.entries()) {
            if (fEntry.kind === 'file' && fName.endsWith('.json')) {
              const f = await (fEntry as FileSystemFileHandle).getFile();
              reportText = await f.text();
              break;
            }
          }
        }

        if (!reportText) continue;
        const tradeData: SavedTrade = JSON.parse(reportText);

        if (!tradeData || !tradeData.id) continue;

        // Restore image data URLs from files in this trade folder
        const manifest = (tradeData as any).imageManifest as Array<{ label: string; filename: string }> | undefined;

        if (manifest && Array.isArray(manifest)) {
          for (const item of manifest) {
            try {
              const imgHandle = await dir.getFileHandle(item.filename);
              const imgFile = await imgHandle.getFile();
              const dataUrl = await blobToDataURL(imgFile);
              const target = labelToProp[item.label];
              if (target && tradeData[target.section]) {
                (tradeData[target.section] as any)[target.key] = dataUrl;
              }
            } catch (err) {
              console.warn(`Could not load image ${item.filename} for trade ${tradeData.id}`, err);
            }
          }
        } else {
          // Fallback: check standard image filenames or property values
          for (const [label, target] of Object.entries(labelToProp)) {
            const currentVal = (tradeData[target.section] as any)?.[target.key];
            if (typeof currentVal === 'string' && (currentVal.endsWith('.png') || currentVal.endsWith('.jpg') || currentVal.endsWith('.jpeg'))) {
              try {
                const imgHandle = await dir.getFileHandle(currentVal);
                const imgFile = await imgHandle.getFile();
                const dataUrl = await blobToDataURL(imgFile);
                (tradeData[target.section] as any)[target.key] = dataUrl;
              } catch {
                // Ignore missing file
              }
            }
          }
        }

        tradeData.sync = {
          local: true,
          firebase: true,
          status: 'SYNCED',
          lastSyncedAt: new Date().toISOString(),
        };

        // Avoid duplicate ID if already added from root
        if (!importedTrades.some((t) => t.id === tradeData.id)) {
          importedTrades.push(tradeData);
        }
      } catch (tradeErr) {
        console.warn('Error reading trade directory:', tradeErr);
      }
    }

    return {
      success: true,
      trades: importedTrades,
      count: importedTrades.length,
      updatedDirHandle: activeHandle,
    };
  } catch (scanErr: unknown) {
    const msg = scanErr instanceof Error ? scanErr.message : String(scanErr);
    console.error('Scan error:', msg);
    return {
      success: false,
      trades: [],
      count: 0,
      error: msg,
    };
  }
}

// Parse uploaded report.json files, directory tree uploads (webkitdirectory), or ZIP archives
export async function importTradesFromUploadedFiles(files: FileList | File[]): Promise<SavedTrade[]> {
  const importedList: SavedTrade[] = [];
  const fileArray = Array.from(files);

  // Group files by relative folder directory for webkitdirectory uploads
  const dirMap = new Map<string, { reportFiles: File[]; imageFiles: Map<string, File> }>();
  const zipFiles: File[] = [];
  const standaloneJsonFiles: File[] = [];

  for (const file of fileArray) {
    const relPath = file.webkitRelativePath || file.name;
    const isZip = file.name.toLowerCase().endsWith('.zip');
    const isJson = file.name.toLowerCase().endsWith('.json');
    const isImg = /\.(png|jpe?g|webp)$/i.test(file.name);

    if (isZip) {
      zipFiles.push(file);
      continue;
    }

    if (file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
      const lastSlash = relPath.lastIndexOf('/');
      const dirPath = relPath.substring(0, lastSlash);
      const fileName = relPath.substring(lastSlash + 1);

      if (!dirMap.has(dirPath)) {
        dirMap.set(dirPath, { reportFiles: [], imageFiles: new Map() });
      }
      const dirEntry = dirMap.get(dirPath)!;
      if (isJson) {
        dirEntry.reportFiles.push(file);
      } else if (isImg) {
        dirEntry.imageFiles.set(fileName.toLowerCase(), file);
      }
    } else if (isJson) {
      standaloneJsonFiles.push(file);
    }
  }

  // 1. Process directory trees from webkitdirectory
  for (const [dirPath, { reportFiles, imageFiles }] of dirMap.entries()) {
    for (const reportFile of reportFiles) {
      try {
        const text = await reportFile.text();
        const tradeData: SavedTrade = JSON.parse(text);
        if (!tradeData || !tradeData.id) continue;

        // Restore image data URLs from sibling image files in the directory
        const manifest = (tradeData as any).imageManifest as Array<{ label: string; filename: string }> | undefined;
        if (manifest && Array.isArray(manifest)) {
          for (const item of manifest) {
            const imgFile = imageFiles.get(item.filename.toLowerCase());
            if (imgFile) {
              const dataUrl = await blobToDataURL(imgFile);
              const target = labelToProp[item.label];
              if (target && tradeData[target.section]) {
                (tradeData[target.section] as any)[target.key] = dataUrl;
              }
            }
          }
        } else {
          for (const [label, target] of Object.entries(labelToProp)) {
            const currentVal = (tradeData[target.section] as any)?.[target.key];
            if (typeof currentVal === 'string' && /\.(png|jpe?g|webp)$/i.test(currentVal)) {
              const imgFile = imageFiles.get(currentVal.toLowerCase());
              if (imgFile) {
                const dataUrl = await blobToDataURL(imgFile);
                (tradeData[target.section] as any)[target.key] = dataUrl;
              }
            }
          }
        }

        tradeData.sync = {
          local: true,
          firebase: true,
          status: 'SYNCED',
          lastSyncedAt: new Date().toISOString(),
        };
        importedList.push(tradeData);
      } catch (err) {
        console.warn('Error reading directory report file:', reportFile.name, err);
      }
    }
  }

  // 2. Process standalone JSON files
  for (const file of standaloneJsonFiles) {
    try {
      const text = await file.text();
      const tradeData: SavedTrade = JSON.parse(text);
      if (tradeData && tradeData.id) {
        tradeData.sync = {
          local: true,
          firebase: true,
          status: 'SYNCED',
          lastSyncedAt: new Date().toISOString(),
        };
        if (!importedList.some((t) => t.id === tradeData.id)) {
          importedList.push(tradeData);
        }
      }
    } catch (e) {
      console.warn('Error reading json file:', file.name, e);
    }
  }

  // 3. Process ZIP archives
  for (const file of zipFiles) {
    try {
      const zip = await JSZip.loadAsync(file);
      const reportFiles = zip.file(/report\.json$/i);
      for (const rFile of reportFiles) {
        const text = await rFile.async('text');
        const tradeData: SavedTrade = JSON.parse(text);
        if (!tradeData || !tradeData.id) continue;

        const folderPath = rFile.name.substring(0, rFile.name.lastIndexOf('/'));
        const manifest = (tradeData as any).imageManifest as Array<{ label: string; filename: string }> | undefined;

        if (manifest && Array.isArray(manifest)) {
          for (const item of manifest) {
            const zipImgPath = folderPath ? `${folderPath}/${item.filename}` : item.filename;
            const imgEntry = zip.file(zipImgPath);
            if (imgEntry) {
              const imgBlob = await imgEntry.async('blob');
              const dataUrl = await blobToDataURL(imgBlob);
              const target = labelToProp[item.label];
              if (target && tradeData[target.section]) {
                (tradeData[target.section] as any)[target.key] = dataUrl;
              }
            }
          }
        }

        tradeData.sync = {
          local: true,
          firebase: true,
          status: 'SYNCED',
          lastSyncedAt: new Date().toISOString(),
        };
        if (!importedList.some((t) => t.id === tradeData.id)) {
          importedList.push(tradeData);
        }
      }
    } catch (e) {
      console.warn('Error reading ZIP file:', file.name, e);
    }
  }

  return importedList;
}
