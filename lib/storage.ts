// 文件路径：lib/storage.ts

export interface TranscriptionItem {
  id: string;
  original: string;
  translation: string;
}

export interface TranscriptionRecord {
  id: string;
  title: string;
  folder: string;
  date: string;
  content: TranscriptionItem[];
}

const STORAGE_KEY = 'lecturely_records';

export const getRecords = (): TranscriptionRecord[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecord = (record: TranscriptionRecord) => {
  const records = getRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const deleteRecord = (id: string) => {
  const records = getRecords();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// 🚀 新增：重命名文件夹 (把所有属于该文件夹的记录移到新文件夹)
export const renameFolder = (oldName: string, newName: string) => {
  const records = getRecords();
  records.forEach(record => {
    if (record.folder === oldName) {
      record.folder = newName;
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

// 🚀 新增：删除整个文件夹及其内部所有记录
export const deleteFolder = (folderName: string) => {
  const records = getRecords();
  const filtered = records.filter(r => r.folder !== folderName);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};